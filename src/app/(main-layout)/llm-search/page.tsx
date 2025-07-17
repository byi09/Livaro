import Chatbox from "./chatbox";
import { getFilters, getPropertyListings } from "./actions";
import { PropertyFilters } from "./types";

export default async function LLMSearchPage() {
  async function handleQuery(formData: FormData) {
    "use server";

    const prompt = formData.get("prompt") as string;
    if (!prompt) return { error: "Prompt is required" };

    try {
      // gets filters from /api/query-to-filter
      const filtersResult = await getFilters(prompt);

      if (!filtersResult.response) {
        return { error: "Failed to parse filters from your query" };
      }

      let filters: PropertyFilters;
      try {
        filters = JSON.parse(filtersResult.response);
      } catch (parseError) {
        console.error("Error parsing filters:", parseError);
        return { error: "Invalid filters format received from AI" };
      }

      // gets listings based on filters
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
            onSubmit={handleQuery}
          />
        </div>
      </div>
    </div>
  );
}
