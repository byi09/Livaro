"use server";

import {
  ChatMessage,
  PropertyFilters,
  PropertyListing,
} from "@/src/app/(main-layout)/llm-search/types";

// Basic keyword-based filter extraction as fallback
function extractBasicFilters(prompt: string): PropertyFilters {
  const filters: PropertyFilters = {};
  const promptLower = prompt.toLowerCase();
  
  // Extract city/location
  const locationPatterns = [
    /(?:in|near|around)\s+([a-zA-Z\s]+?)(?:\s|$|,)/,
    /berkeley|oakland|san francisco|sf|bay area|san jose|palo alto/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      if (pattern.source.includes('berkeley|oakland')) {
        // Extract from the matched city names
        const cityMatch = promptLower.match(/berkeley|oakland|san francisco|sf|bay area|san jose|palo alto/);
        if (cityMatch) {
          filters.city = cityMatch[0] === 'sf' ? 'san francisco' : cityMatch[0];
          if (cityMatch[0].includes('san francisco') || cityMatch[0] === 'sf' || cityMatch[0] === 'bay area') {
            filters.state = 'CA';
          }
        }
      } else {
        filters.city = match[1]?.trim();
      }
      break;
    }
  }
  
  // Extract bedrooms
  const bedroomMatch = promptLower.match(/(\d+)\s*bed/);
  if (bedroomMatch) {
    filters.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Extract property type
  if (promptLower.includes('apartment')) filters.property_type = 'apartment';
  else if (promptLower.includes('house')) filters.property_type = 'house';
  else if (promptLower.includes('studio')) filters.property_type = 'studio';
  else if (promptLower.includes('condo')) filters.property_type = 'condo';
  
  // Extract price
  const priceMatch = promptLower.match(/\$(\d+)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    if (promptLower.includes('under') || promptLower.includes('below')) {
      filters.price_max = price;
    } else if (promptLower.includes('over') || promptLower.includes('above')) {
      filters.price_min = price;
    } else {
      // Default to max price
      filters.price_max = price;
    }
  }
  
  return filters;
}
import {
  getOrCreateAISearchConversation,
  logUserQuery,
  logAIResponse,
} from "@/src/app/(main-layout)/llm-search/chatlog-utils";
import {
  getFilters,
  getPropertyListings,
  decideChatOrFilter,
  getChatResponse,
} from "@/src/app/(main-layout)/llm-search/actions";

// File processing utility
async function processUploadedFiles(files: File[]): Promise<string> {
  const fileDescriptions: string[] = [];

  for (const file of files) {
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(2); // KB

    let content = "";

    // Handle text files
    if (fileType.includes("text") || fileName.endsWith(".txt")) {
      try {
        content = await file.text();
      } catch {
        content = "Could not read text content";
      }
    }

    // Handle image files (describe what type of image it is)
    else if (fileType.includes("image")) {
      content = `Image file (${fileType}) - likely contains property photos, floor plans, or documents`;
    }

    // Handle document files
    else if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileName.includes(".doc")
    ) {
      content =
        "Document file - likely contains property listings, rental agreements, or property information";
    }

    // Handle spreadsheet files
    else if (
      fileType.includes("spreadsheet") ||
      fileName.includes(".csv") ||
      fileName.includes(".xls")
    ) {
      content =
        "Spreadsheet file - likely contains property data, pricing information, or rental listings";
    }

    fileDescriptions.push(
      `File: ${fileName} (${fileSize}KB, ${fileType || "unknown type"}) - ${content}`,
    );
  }

  return fileDescriptions.join("\n");
}

export async function handleAISearchQuery(
  formData: FormData,
  chatHistory?: ChatMessage[],
): Promise<{
  response?: string;
  error?: string;
  propertyListings?: PropertyListing[];
}> {
  const prompt = formData.get("prompt") as string;
  if (!prompt) return { error: "Prompt is required" };

  try {
    // Process uploaded files if any
    const files: File[] = [];
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (key.startsWith("file_") && value instanceof File) {
        files.push(value);
      }
    }

    let enhancedPrompt = prompt;

    // If files are uploaded, enhance the prompt with file context
    if (files.length > 0) {
      const fileInfo = await processUploadedFiles(files);
      enhancedPrompt = `${prompt}\n\n[File Context]: ${fileInfo}`;
    }

    const conversationId = await getOrCreateAISearchConversation();

    if (conversationId) {
      await logUserQuery(conversationId, enhancedPrompt);
    }

    const action = await decideChatOrFilter(chatHistory || [], enhancedPrompt);
    console.log("Action decided:", action, "for prompt:", enhancedPrompt);

    if (action === "search") {
      const filtersResult = await getFilters(enhancedPrompt, chatHistory);

      if (!filtersResult.response) {
        // Try basic keyword extraction as fallback
        const fallbackFilters = extractBasicFilters(enhancedPrompt);
        if (Object.keys(fallbackFilters).length > 0) {
          console.log("Using fallback filter extraction:", fallbackFilters);
          const propertyListings = await getPropertyListings(fallbackFilters);
          
          if (propertyListings.length > 0) {
            const response = `Found ${propertyListings.length} properties based on your search.`;
            
            if (conversationId) {
              await logAIResponse(conversationId, response, propertyListings, fallbackFilters);
            }

            return {
              response,
              propertyListings: propertyListings,
            };
          }
        }
        
        const errorResponse = {
          error: "Failed to parse filters from your query",
        };

        if (conversationId) {
          await logAIResponse(
            conversationId,
            "I couldn't understand your search criteria. Please try rephrasing your query with more specific details about location, budget, property type, or other requirements.",
          );
        }

        return errorResponse;
      }

      let filters: PropertyFilters;
      try {
        const parsedResponse = JSON.parse(filtersResult.response);
        
        // Handle "bad_query" response
        if (parsedResponse.error === "bad_query") {
          const errorResponse = {
            error: "Your query appears to be invalid, please only ask housing related queries.",
          };

          if (conversationId) {
            await logAIResponse(
              conversationId,
              "Your query appears to be invalid. Please ask questions related to rental properties, such as location, price range, amenities, or property features.",
            );
          }

          return errorResponse;
        }
        
        filters = parsedResponse;
        
        // Clean up empty or undefined filters
        Object.keys(filters).forEach(key => {
          const value = filters[key as keyof PropertyFilters];
          if (value === null || value === undefined || value === '') {
            delete filters[key as keyof PropertyFilters];
          }
        });
      } catch (parseError) {
        console.error("Error parsing filters:", parseError, "Raw response:", filtersResult.response);
        const errorResponse = {
          error: "I had trouble understanding your search criteria. Please try rephrasing.",
        };

        if (conversationId) {
          await logAIResponse(
            conversationId,
            "I had trouble understanding your search criteria. Could you try rephrasing with more specific details about what you're looking for?",
          );
        }

        return errorResponse;
      }

      console.log("Searching with filters:", JSON.stringify(filters, null, 2));
      let propertyListings = await getPropertyListings(filters);
      console.log(`Found ${propertyListings.length} properties with original search`);

      // If no results found, try progressively broader searches
      if (propertyListings.length === 0) {
        console.log("No results with original filters, trying fallback searches");
        
        // Try removing less important filters first
        const fallbackStrategies = [
          // Remove square footage requirement
          () => {
            const { square_footage, ...broadFilters } = filters;
            return broadFilters;
          },
          // Remove parking requirement
          () => {
            const { parking_spaces, square_footage, ...broadFilters } = filters;
            return broadFilters;
          },
          // Remove bathroom requirement 
          () => {
            const { bathrooms, parking_spaces, square_footage, ...broadFilters } = filters;
            return broadFilters;
          },
          // Keep only location and basic criteria
          () => {
            const { city, state, property_type, bedrooms, price_min, price_max } = filters;
            return { city, state, property_type, bedrooms, price_min, price_max };
          },
          // Keep only location
          () => {
            const { city, state } = filters;
            return { city, state };
          }
        ];

        for (const strategy of fallbackStrategies) {
          const fallbackFilters = strategy();
          // Only try fallback if it's actually different
          if (JSON.stringify(fallbackFilters) !== JSON.stringify(filters)) {
            const fallbackListings = await getPropertyListings(fallbackFilters);
            if (fallbackListings.length > 0) {
              propertyListings = fallbackListings.slice(0, 10); // Limit to 10 for broader searches
              console.log(`Found ${propertyListings.length} properties with fallback strategy`);
              break;
            }
          }
        }
      }

      if (propertyListings.length === 0) {
        const response = `I couldn't find any properties matching your criteria. Please try adjusting your search parameters such as location, budget, or property type.`;

        if (conversationId) {
          await logAIResponse(conversationId, response, [], filters);
        }

        return {
          response,
          propertyListings: [],
        };
      }

      const response = `Found ${propertyListings.length} properties matching your search criteria.`;

      if (conversationId) {
        await logAIResponse(
          conversationId,
          response,
          propertyListings,
          filters,
        );
      }

      return {
        response,
        propertyListings: propertyListings,
      };
    } else {
      const chatResponse = await getChatResponse(
        chatHistory || [],
        enhancedPrompt,
      );

      if (!chatResponse.response) {
        const errorResponse = { error: "Failed to get chat response" };

        if (conversationId) {
          await logAIResponse(
            conversationId,
            "I'm having trouble responding right now. Please try again.",
          );
        }

        return errorResponse;
      }

      if (conversationId) {
        await logAIResponse(conversationId, chatResponse.response);
      }

      return {
        response: chatResponse.response,
        propertyListings: [],
      };
    }
  } catch (error) {
    console.error("Error processing query:", error);
    return { error: "Failed to process your query" };
  }
}
