export type ParsedQuery = {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  propertyType?: string;
  petFriendly?: boolean;
  parking?: boolean;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  leaseLength?: string;
  moveInDate?: string;
  distanceToCampus?: number;
};

export function getFiltersFromQuery(query: Record<string, string>): ParsedQuery {
  const filters: ParsedQuery = {};

  if (query.location) filters.location = query.location;
  if (query.propertyType) filters.propertyType = query.propertyType;
  if (query.beds) filters.beds = parseInt(query.beds);
  if (query.minPrice) filters.minPrice = parseInt(query.minPrice);
  if (query.maxPrice) filters.maxPrice = parseInt(query.maxPrice);
  if (query.petFriendly === "true") filters.petFriendly = true;
  if (query.parking === "true") filters.parking = true;
  if (query.furnished === "true") filters.furnished = true;
  if (query.utilitiesIncluded === "true") filters.utilitiesIncluded = true;
  if (query.leaseLength) filters.leaseLength = query.leaseLength;
  if (query.moveInDate) filters.moveInDate = query.moveInDate;
  if (query.distanceToCampus) filters.distanceToCampus = parseFloat(query.distanceToCampus);

  return filters;
}
