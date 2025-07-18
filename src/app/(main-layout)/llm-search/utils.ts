/**
 * Utility functions for handling LLM search URLs and parameters
 */

/**
 * Generates a search URL with the given query parameter
 * @param query - The search query string
 * @param baseUrl - The base URL (defaults to '/llm-search')
 * @returns The complete URL with encoded search parameters
 */
export function generateSearchUrl(
  query: string,
  baseUrl = "/llm-search",
): string {
  const params = new URLSearchParams();
  params.set("q", query);
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extracts search query from URL search parameters
 * Supports only parameter: q
 * @param searchParams - Next.js searchParams object
 * @returns The search query string or undefined if not found
 */
export function extractSearchQuery(searchParams: {
  [key: string]: string | string[] | undefined;
}): string | undefined {
  const urlQuery = searchParams.q;
  return Array.isArray(urlQuery) ? urlQuery[0] : urlQuery;
}

/**
 * Common search query examples for testing and documentation
 */
export const EXAMPLE_QUERIES = {
  BASIC: "2-bedroom apartment in San Francisco under $4000",
  STUDIO: "studio apartment in New York",
  HOUSE: "house with parking in Seattle",
  LUXURY: "3-bedroom luxury condo with amenities in Miami",
  BUDGET: "affordable 1-bedroom apartment near public transport",
  FAMILY: "4-bedroom house with garden in Austin",
  PET_FRIENDLY: "pet-friendly 2-bedroom apartment with balcony",
} as const;

/**
 * Generates example URLs for testing
 */
export function generateExampleUrls(baseUrl = "/llm-search") {
  return Object.entries(EXAMPLE_QUERIES).map(([key, query]) => ({
    key,
    query,
    url: generateSearchUrl(query, baseUrl),
  }));
}
