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
    const conversationId = await getOrCreateAISearchConversation();

    if (conversationId) {
      await logUserQuery(conversationId, prompt);
    }

    const action = await decideChatOrFilter(chatHistory || [], prompt);

    if (action === "search") {
      const filtersResult = await getFilters(prompt, chatHistory);

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
        const response = `I couldn't find any properties matching your criteria. Try adjusting your search parameters.`;

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
      const chatResponse = await getChatResponse(chatHistory || [], prompt);

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
