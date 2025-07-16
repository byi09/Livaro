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
    <div className="flex flex-col h-full w-full items-center justify-center">
      <h1 className="text-2xl font-bold">LLM Search</h1>
      <Chatbox
        initialMessage="Hello! I can help you find rental properties. Tell me what you're looking for - location, budget, number of bedrooms, or any other preferences."
        onSubmit={handleQuery}
      />
    </div>
  );
}
