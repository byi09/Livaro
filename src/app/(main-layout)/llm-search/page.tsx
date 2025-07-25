import Chatbox from "./chatbox";
import {
  getOrCreateAISearchConversation,
  logUserQuery,
  logAIResponse,
} from "./chatlog-utils";
import {
  getFilters,
  getPropertyListings,
  decideChatOrFilter,
  getChatResponse,
} from "./actions";
import { PropertyFilters, ChatMessage } from "./types";

interface LLMSearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LLMSearchPage({
  searchParams,
}: LLMSearchPageProps) {
  // Extract query from URL search parameters
  const resolvedSearchParams = await searchParams;
  const urlQuery = resolvedSearchParams.q;
  const initialQuery = Array.isArray(urlQuery) ? urlQuery[0] : urlQuery;

  async function handleQuery(formData: FormData, chatHistory?: ChatMessage[]) {
    "use server";

    const prompt = formData.get("prompt") as string;
    if (!prompt) return { error: "Prompt is required" };

    try {
      // Get or create AI search conversation
      const conversationId = await getOrCreateAISearchConversation();

      // Log the user query
      if (conversationId) {
        await logUserQuery(conversationId, prompt);
      }

      // Decide whether to search for properties or continue conversation
      const action = await decideChatOrFilter(chatHistory || [], prompt);

      if (action === "search") {
        // Get filters from the prompt and chat history
        const filtersResult = await getFilters(prompt, chatHistory);

        if (!filtersResult.response) {
          const errorResponse = {
            error: "Failed to parse filters from your query",
          };

          // Log AI error response
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

          // Log AI error response
          if (conversationId) {
            await logAIResponse(
              conversationId,
              "Your query appears to be invalid. Please only ask housing related queries.",
            );
          }

          return errorResponse;
        }

        // Get listings based on filters
        const propertyListings = await getPropertyListings(filters);

        if (propertyListings.length === 0) {
          const response = `I couldn't find any properties matching your criteria. Try adjusting your search parameters.`;

          // Log AI response with no results
          if (conversationId) {
            await logAIResponse(conversationId, response, [], filters);
          }

          return {
            response,
            propertyListings: [],
          };
        }

        const response = `Found ${propertyListings.length} properties matching your criteria.`;

        // Log AI response with property results
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
        // Continue conversation
        const chatResponse = await getChatResponse(chatHistory || [], prompt);

        if (!chatResponse.response) {
          const errorResponse = { error: "Failed to get chat response" };

          // Log AI error response
          if (conversationId) {
            await logAIResponse(
              conversationId,
              "I'm having trouble responding right now. Please try again.",
            );
          }

          return errorResponse;
        }

        // Log AI chat response
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Find your place.
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Discover amazing properties in your ideal
            <br />
            location with our comprehensive search tools
          </p>
        </div>

        {/* Search Container */}
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <Chatbox
            initialMessage="Need help deciding? Try asking..."
            initialQuery={initialQuery}
            onSubmit={handleQuery}
          />
        </div>
      </div>
    </div>
  );
}
