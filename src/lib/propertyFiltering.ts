import type { FilterOptions } from '@/lib/types';

export interface ExtractedFilters {
  location?: string;
  priceRange?: { min?: number; max?: number };
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  features?: string[];
  moveInDate?: string;
  petFriendly?: boolean;
  parking?: boolean;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
}

// Common patterns for property type identification
const PROPERTY_TYPE_PATTERNS = {
  apartment: ['apartment', 'apt', 'flat', 'unit'],
  house: ['house', 'home', 'single family', 'detached'],
  condo: ['condo', 'condominium', 'townhome'],
  townhouse: ['townhouse', 'townhome', 'row house']
};

// Price extraction patterns
const PRICE_PATTERNS = {
  under: /under|below|less than|max|maximum/i,
  over: /over|above|more than|min|minimum/i,
  between: /between|from|range/i,
  around: /around|approximately|about|roughly/i
};

// Feature mapping for natural language
const FEATURE_MAPPINGS = {
  'pet friendly': 'Pet Friendly',
  'pets allowed': 'Pet Friendly',
  'pet-friendly': 'Pet Friendly',
  'allows pets': 'Pet Friendly',
  'dog friendly': 'Pet Friendly',
  'cat friendly': 'Pet Friendly',
  'parking': 'Parking Available',
  'garage': 'Garage Parking',
  'laundry': 'In-Unit Laundry',
  'washer dryer': 'In-Unit Laundry',
  'washer/dryer': 'In-Unit Laundry',
  'in-unit laundry': 'In-Unit Laundry',
  'air conditioning': 'Central AC/Heat',
  'ac': 'Central AC/Heat',
  'central air': 'Central AC/Heat',
  'heating': 'Central AC/Heat',
  'hardwood': 'Hardwood Floors',
  'hardwood floors': 'Hardwood Floors',
  'fireplace': 'Fireplace',
  'balcony': 'Balcony',
  'patio': 'Patio',
  'yard': 'Yard',
  'garden': 'Garden',
  'pool': 'Pool',
  'gym': 'Fitness Center',
  'fitness center': 'Fitness Center',
  'dishwasher': 'Dishwasher',
  'furnished': 'Furnished',
  'unfurnished': 'Unfurnished'
};

// Location detection patterns
const LOCATION_PATTERNS = {
  city: /in\s+([A-Za-z\s]+)(?:,|\s+(?:CA|California|NY|New York|TX|Texas|FL|Florida))/i,
  neighborhood: /(?:near|in|around)\s+([A-Za-z\s]+)/i,
  zip: /\b\d{5}\b/g
};

/**
 * Extract price information from natural language text
 */
export function extractPriceRange(text: string): { min?: number; max?: number } | null {
  const priceRange: { min?: number; max?: number } = {};
  
  // Extract all numbers that could be prices (with optional $ and common formats)
  const priceMatches = text.match(/\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\s*k|\s*thousand)?/gi);
  if (!priceMatches) return null;
  
  // Convert matches to numbers
  const prices = priceMatches.map(match => {
    let num = match.replace(/[$,]/g, '');
    if (num.toLowerCase().includes('k') || num.toLowerCase().includes('thousand')) {
      num = num.replace(/k|thousand/i, '');
      return parseFloat(num) * 1000;
    }
    return parseFloat(num);
  }).filter(price => price > 100 && price < 50000); // Reasonable rent range

  if (prices.length === 0) return null;

  // Check for range patterns
  if (PRICE_PATTERNS.between.test(text) && prices.length >= 2) {
    priceRange.min = Math.min(...prices);
    priceRange.max = Math.max(...prices);
  } else if (PRICE_PATTERNS.under.test(text)) {
    priceRange.max = Math.max(...prices);
  } else if (PRICE_PATTERNS.over.test(text)) {
    priceRange.min = Math.min(...prices);
  } else if (PRICE_PATTERNS.around.test(text)) {
    const price = prices[0];
    priceRange.min = Math.floor(price * 0.9);
    priceRange.max = Math.ceil(price * 1.1);
  } else if (prices.length === 1) {
    // Single price mentioned - assume it's a max
    priceRange.max = prices[0];
  }

  return Object.keys(priceRange).length > 0 ? priceRange : null;
}

/**
 * Extract bedroom and bathroom counts from text
 */
export function extractRoomCounts(text: string): { bedrooms?: number; bathrooms?: number } {
  const roomCounts: { bedrooms?: number; bathrooms?: number } = {};
  
  // Bedroom patterns
  const bedroomMatches = text.match(/(\d+)\s*(?:bed|bedroom|br)/gi);
  if (bedroomMatches) {
    const bedroomCount = parseInt(bedroomMatches[0].match(/\d+/)?.[0] || '0');
    if (bedroomCount >= 0 && bedroomCount <= 10) {
      roomCounts.bedrooms = bedroomCount;
    }
  }
  
  // Studio pattern
  if (/studio/i.test(text)) {
    roomCounts.bedrooms = 0;
  }
  
  // Bathroom patterns
  const bathroomMatches = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)/gi);
  if (bathroomMatches) {
    const bathroomCount = parseFloat(bathroomMatches[0].match(/\d+(?:\.\d+)?/)?.[0] || '0');
    if (bathroomCount >= 0 && bathroomCount <= 10) {
      roomCounts.bathrooms = bathroomCount;
    }
  }
  
  return roomCounts;
}

/**
 * Extract property type from text
 */
export function extractPropertyType(text: string): string | null {
  const lowercaseText = text.toLowerCase();
  
  for (const [type, patterns] of Object.entries(PROPERTY_TYPE_PATTERNS)) {
    if (patterns.some(pattern => lowercaseText.includes(pattern))) {
      return type;
    }
  }
  
  return null;
}

/**
 * Extract features from text
 */
export function extractFeatures(text: string): string[] {
  const features: string[] = [];
  const lowercaseText = text.toLowerCase();
  
  for (const [pattern, feature] of Object.entries(FEATURE_MAPPINGS)) {
    if (lowercaseText.includes(pattern)) {
      features.push(feature);
    }
  }
  
  return [...new Set(features)]; // Remove duplicates
}

/**
 * Extract location information from text
 */
export function extractLocation(text: string): string | null {
  // Try to find city patterns
  const cityMatch = text.match(LOCATION_PATTERNS.city);
  if (cityMatch) {
    return cityMatch[1].trim();
  }
  
  // Try to find neighborhood patterns
  const neighborhoodMatch = text.match(LOCATION_PATTERNS.neighborhood);
  if (neighborhoodMatch) {
    return neighborhoodMatch[1].trim();
  }
  
  // Try to find zip code
  const zipMatch = text.match(LOCATION_PATTERNS.zip);
  if (zipMatch) {
    return zipMatch[0];
  }
  
  return null;
}

/**
 * Extract move-in date from text
 */
export function extractMoveInDate(text: string): string | null {
  // Look for date patterns
  const datePatterns = [
    /(?:move in|available|start|beginning)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2})/i,
    /(?:move in|available|start|beginning)\s+(?:on\s+)?(\d{1,2}\/\d{1,2})/i,
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
    /\d{1,2}\/\d{1,2}\/?\d{0,4}/g
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

/**
 * Main function to extract all filters from natural language text
 */
export function extractFiltersFromText(text: string): ExtractedFilters {
  const extracted: ExtractedFilters = {};
  
  // Extract price range
  const priceRange = extractPriceRange(text);
  if (priceRange) {
    extracted.priceRange = priceRange;
  }
  
  // Extract room counts
  const roomCounts = extractRoomCounts(text);
  if (roomCounts.bedrooms !== undefined) {
    extracted.bedrooms = roomCounts.bedrooms;
  }
  if (roomCounts.bathrooms !== undefined) {
    extracted.bathrooms = roomCounts.bathrooms;
  }
  
  // Extract property type
  const propertyType = extractPropertyType(text);
  if (propertyType) {
    extracted.propertyType = propertyType;
  }
  
  // Extract features
  const features = extractFeatures(text);
  if (features.length > 0) {
    extracted.features = features;
  }
  
  // Extract location
  const location = extractLocation(text);
  if (location) {
    extracted.location = location;
  }
  
  // Extract move-in date
  const moveInDate = extractMoveInDate(text);
  if (moveInDate) {
    extracted.moveInDate = moveInDate;
  }
  
  // Extract boolean features
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('pet') || lowercaseText.includes('dog') || lowercaseText.includes('cat')) {
    extracted.petFriendly = true;
  }
  
  if (lowercaseText.includes('parking') || lowercaseText.includes('garage')) {
    extracted.parking = true;
  }
  
  if (lowercaseText.includes('furnished')) {
    extracted.furnished = !lowercaseText.includes('unfurnished');
  }
  
  if (lowercaseText.includes('utilities included') || lowercaseText.includes('utilities paid')) {
    extracted.utilitiesIncluded = true;
  }
  
  return extracted;
}

/**
 * Convert extracted filters to FilterOptions format
 */
export function convertToFilterOptions(extracted: ExtractedFilters): FilterOptions {
  const filterOptions: FilterOptions = {
    propertyTypes: {
      apartment: !extracted.propertyType || extracted.propertyType === 'apartment',
      house: !extracted.propertyType || extracted.propertyType === 'house',
      condo: !extracted.propertyType || extracted.propertyType === 'condo',
      townhouse: !extracted.propertyType || extracted.propertyType === 'townhouse',
    },
    priceRange: {
      min: extracted.priceRange?.min || 0,
      max: extracted.priceRange?.max || 0,
    },
    bedrooms: extracted.bedrooms || 0,
    bathrooms: extracted.bathrooms || 0,
    petsAllowed: extracted.petFriendly || false,
    furnished: extracted.furnished || false,
    utilitiesIncluded: extracted.utilitiesIncluded || false,
    parking: extracted.parking || false,
    ac: extracted.features?.includes('Central AC/Heat') || false,
    inUnitLaundry: extracted.features?.includes('In-Unit Laundry') || false,
    leaseType: 'rent'
  };

  // If specific property type is mentioned, set others to false
  if (extracted.propertyType) {
    filterOptions.propertyTypes = {
      apartment: extracted.propertyType === 'apartment',
      house: extracted.propertyType === 'house',
      condo: extracted.propertyType === 'condo',
      townhouse: extracted.propertyType === 'townhouse',
    };
  }

  return filterOptions;
}

/**
 * Determine the intent of the user's message
 */
export function analyzeIntent(text: string): {
  type: 'search' | 'filter' | 'question' | 'recommendation';
  confidence: number;
} {
  const lowercaseText = text.toLowerCase();
  
  // Search intent patterns
  const searchPatterns = [
    /(?:find|search|look|looking for|show me|need)/i,
    /(?:apartment|house|condo|townhouse|property|place|rental)/i,
    /(?:bedroom|bathroom|bed|bath|studio)/i,
    /\$\d+|\d+\s*k/i  // Price mentions
  ];
  
  // Question intent patterns
  const questionPatterns = [
    /(?:what|how|when|where|why|can you|is there|do you|does)/i,
    /(?:\?)/
  ];
  
  // Recommendation intent patterns
  const recommendationPatterns = [
    /(?:recommend|suggest|best|good|advice|help)/i,
    /(?:what do you think|what would you)/i
  ];
  
  let searchScore = 0;
  let questionScore = 0;
  let recommendationScore = 0;
  
  // Calculate scores
  searchPatterns.forEach(pattern => {
    if (pattern.test(text)) searchScore += 1;
  });
  
  questionPatterns.forEach(pattern => {
    if (pattern.test(text)) questionScore += 1;
  });
  
  recommendationPatterns.forEach(pattern => {
    if (pattern.test(text)) recommendationScore += 1;
  });
  
  // Determine intent based on highest score
  const maxScore = Math.max(searchScore, questionScore, recommendationScore);
  
  if (maxScore === 0) {
    return { type: 'question', confidence: 0.5 };
  }
  
  if (searchScore === maxScore) {
    return { type: 'search', confidence: Math.min(searchScore / 3, 1) };
  } else if (recommendationScore === maxScore) {
    return { type: 'recommendation', confidence: Math.min(recommendationScore / 2, 1) };
  } else {
    return { type: 'question', confidence: Math.min(questionScore / 2, 1) };
  }
} 