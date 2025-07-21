import Chatbox from "./chatbox";
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
      // Decide whether to search for properties or continue conversation
      const action = await decideChatOrFilter(chatHistory || [], prompt);

      if (action === "search") {
        // Get filters from the prompt and chat history
        const filtersResult = await getFilters(prompt, chatHistory);

        if (!filtersResult.response) {
          return { error: "Failed to parse filters from your query" };
        }

        let filters: PropertyFilters;
        try {
          filters = JSON.parse(filtersResult.response);
        } catch (parseError) {
          console.error("Error parsing filters:", parseError);
          return {
            error:
              "Your query appears to be invalid, please only ask housing related queries.",
          };
        }

        // Get listings based on filters
        const propertyListings = await getPropertyListings(filters);

        if (propertyListings.length === 0) {
          return {
            response: `I couldn't find any properties matching your criteria. Try adjusting your search parameters.`,
            propertyListings: [],
          };
        }

        return {
          response: `Found ${propertyListings.length} properties matching your criteria.`,
          propertyListings: propertyListings,
        };
      } else {
        // Continue conversation
        const chatResponse = await getChatResponse(chatHistory || [], prompt);

        if (!chatResponse.response) {
          return { error: "Failed to get chat response" };
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
