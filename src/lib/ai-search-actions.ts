"use server";

import {
  ChatMessage,
  PropertyFilters,
  PropertyListing,
} from "@/src/app/(main-layout)/llm-search/types";
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

    if (action === "search") {
      const filtersResult = await getFilters(enhancedPrompt, chatHistory);

      if (!filtersResult.response) {
        const errorResponse = {
          error: "Failed to parse filters from your query",
        };

        if (conversationId) {
          await logAIResponse(
            conversationId,
            "I couldn't understand your search criteria. Please try rephrasing your query with more specific details about what you're looking for.",
          );
        }

        return errorResponse;
      }

      let filters: PropertyFilters;
      try {
        filters = JSON.parse(filtersResult.response);
      } catch (parseError) {
        console.error("Error parsing filters:", parseError);
        const errorResponse = {
          error:
            "Your query appears to be invalid, please only ask housing related queries.",
        };

        if (conversationId) {
          await logAIResponse(
            conversationId,
            "Your query appears to be invalid. Please only ask housing related queries.",
          );
        }

        return errorResponse;
      }

      const propertyListings = await getPropertyListings(filters);

      if (propertyListings.length === 0) {
        const response = `I couldn't find any properties matching your criteria. Please add more details.`;

        if (conversationId) {
          await logAIResponse(conversationId, response, [], filters);
        }

        return {
          response,
          propertyListings: [],
        };
      }

      const response = `Found ${propertyListings.length} properties matching your criteria.`;

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
