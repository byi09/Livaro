import {
  AIChatRequest,
  ChatMessage,
  PropertyFilters,
  PropertyListing,
} from "./types";
import { createClient } from "../../../../utils/supabase/server";

export async function getFilters(prompt: string, chatHistory?: ChatMessage[]) {
  // sample prompt:
  // "Hello, could you please help me find a place to rent in San Francisco? I'm looking for a 1-bedroom apartment with a budget of $3000 per month. Ideally, it should be pet-friendly and close to public transport. Thanks!",
  const payload: AIChatRequest = {
    prompt: prompt,
    chatHistory: chatHistory,
  };

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${baseURL}/api/query-to-filter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const data = await res.json();
  return data;
}

export async function getPropertyListings(
  filters: PropertyFilters,
): Promise<PropertyListing[]> {
  const supabase = await createClient();

  // Start building the query with proper join
  let query = supabase
    .from("property_listings")
    .select(
      `
      id,
      monthly_rent,
      security_deposit,
      available_date,
      listing_title,
      listing_description,
      virtual_tour_url,
      listing_status,
      properties!inner (
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        zip_code,
        property_type,
        bedrooms,
        bathrooms,
        square_footage,
        parking_spaces
      )
    `,
    )
    .eq("listing_status", "active");

  // Intelligent location filtering
  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    
    // Special handling for Bay Area - search multiple cities
    if (cityLower.includes('bay area')) {
      // Search for properties in major Bay Area cities
      query = query.or(`properties.city.ilike.%san francisco%,properties.city.ilike.%oakland%,properties.city.ilike.%san jose%,properties.city.ilike.%berkeley%,properties.city.ilike.%palo alto%,properties.city.ilike.%mountain view%,properties.city.ilike.%sunnyvale%,properties.city.ilike.%fremont%,properties.city.ilike.%hayward%,properties.city.ilike.%redwood city%`);
    } else {
      // Handle other city variations and abbreviations
      const cityVariations = [];
      
      if (cityLower.includes('san francisco') || cityLower === 'sf' || cityLower.includes('san fran')) {
        cityVariations.push('san francisco', 'sf', 'san fran');
      } else if (cityLower.includes('new york') || cityLower === 'nyc' || cityLower.includes('manhattan')) {
        cityVariations.push('new york', 'nyc', 'manhattan');
      } else if (cityLower.includes('los angeles') || cityLower === 'la') {
        cityVariations.push('los angeles', 'la');
      } else {
        // Default: just use the city as provided
        query = query.ilike("properties.city", `%${filters.city}%`);
      }
      
      // If we have variations, use OR query
      if (cityVariations.length > 0) {
        const orConditions = cityVariations.map(city => `properties.city.ilike.%${city}%`).join(',');
        query = query.or(orConditions);
      }
    }
  }

  if (filters.state) {
    // Handle state abbreviations and full names
    const stateMap: { [key: string]: string[] } = {
      'ca': ['CA', 'California'],
      'california': ['CA', 'California'],
      'ny': ['NY', 'New York'],
      'new york': ['NY', 'New York'],
      'tx': ['TX', 'Texas'],
      'texas': ['TX', 'Texas'],
      'fl': ['FL', 'Florida'],
      'florida': ['FL', 'Florida'],
    };
    
    const normalizedState = filters.state.toLowerCase();
    const stateVariations = stateMap[normalizedState] || [filters.state];
    
    if (stateVariations.length > 1) {
      const orConditions = stateVariations.map(state => `properties.state.ilike.%${state}%`).join(',');
      query = query.or(orConditions);
    } else {
      query = query.ilike("properties.state", `%${filters.state}%`);
    }
  }

  if (filters.property_type) {
    // Normalize property types and handle variations
    const normalizePropertyType = (type: string) => {
      const normalized = type.toLowerCase().trim();
      const typeMap: { [key: string]: string[] } = {
        'apartment': ['apartment', 'apt', 'flat', 'unit'],
        'house': ['house', 'home', 'single family', 'detached', 'single-family'],
        'condo': ['condo', 'condominium', 'coop', 'co-op'],
        'townhouse': ['townhouse', 'townhome', 'row house', 'rowhouse'],
        'studio': ['studio', 'efficiency', 'bachelor'],
        'room': ['room', 'shared', 'roommate'],
        'duplex': ['duplex', 'multi-family', 'multifamily']
      };
      
      for (const [standard, variations] of Object.entries(typeMap)) {
        if (variations.some(variation => normalized.includes(variation))) {
          return standard;
        }
      }
      return type; // Return original if no match found
    };

    // Handle multiple property types separated by commas
    if (filters.property_type.includes(",")) {
      const propertyTypes = filters.property_type
        .split(",")
        .map((type) => normalizePropertyType(type.trim()));
      query = query.in("properties.property_type", propertyTypes);
    } else {
      const normalizedType = normalizePropertyType(filters.property_type);
      query = query.eq("properties.property_type", normalizedType);
    }
  }

  if (filters.bedrooms !== undefined) {
    query = query.eq("properties.bedrooms", filters.bedrooms);
  }

  if (filters.bathrooms !== undefined) {
    query = query.gte("properties.bathrooms", filters.bathrooms);
  }

  // if users gives a price range, use price_min and price_max. These columns ARENT present in the DB
  if (filters.price_min !== undefined) {
    query = query.gte("monthly_rent", filters.price_min);
  }

  if (filters.price_max !== undefined) {
    query = query.lte("monthly_rent", filters.price_max);
  }

  if (filters.square_footage !== undefined) {
    query = query.gte("properties.square_footage", filters.square_footage);
  }

  if (filters.parking_spaces !== undefined) {
    query = query.gte("properties.parking_spaces", filters.parking_spaces);
  }

  if (filters.available_from) {
    query = query.gte("available_date", filters.available_from);
  }

  console.log("Executing property search query with filters:", JSON.stringify(filters, null, 2));
  const { data, error } = await query.limit(20);

  if (error) {
    console.error("Error fetching property listings:", error);
    console.error("Query filters were:", JSON.stringify(filters, null, 2));
    throw new Error("Failed to fetch property listings");
  }

  console.log(`Query returned ${data?.length || 0} results`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedData: PropertyListing[] = (data || []).map((listing: any) => {
    const property = listing.properties;
    return {
      id: listing.id,
      monthlyRent: listing.monthly_rent?.toString() || "0",
      securityDeposit: listing.security_deposit?.toString(),
      availableDate: listing.available_date,
      listingTitle: listing.listing_title,
      listingDescription: listing.listing_description,
      virtualTourUrl: listing.virtual_tour_url,
      property: {
        id: property?.id || "",
        addressLine1: property?.address_line_1 || "",
        addressLine2: property?.address_line_2,
        city: property?.city || "",
        state: property?.state || "",
        zipCode: property?.zip_code || "",
        propertyType: property?.property_type || "",
        bedrooms: property?.bedrooms || 0,
        bathrooms: property?.bathrooms?.toString() || "0",
        squareFootage: property?.square_footage,
        parkingSpaces: property?.parking_spaces || 0,
      },
    };
  });

  return mappedData;
}

export async function decideChatOrFilter(
  chatHistory: ChatMessage[],
  prompt: string,
): Promise<"search" | "chat"> {
  // Fallback logic: if prompt contains location/property terms, default to search
  const searchKeywords = [
    'bedroom', 'bed', 'apartment', 'house', 'property', 'properties', 'rental', 'rent',
    'berkeley', 'san francisco', 'sf', 'bay area', 'oakland', 'san jose',
    'near', 'in', 'location', 'find', 'show', 'search', 'looking for',
    'studio', 'condo', 'townhouse', 'duplex', 'room',
    'cheap', 'expensive', 'budget', 'price', '$', 'under', 'around'
  ];
  
  const promptLower = prompt.toLowerCase();
  const hasSearchTerms = searchKeywords.some(keyword => promptLower.includes(keyword));
  
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const payload: AIChatRequest = {
    prompt: prompt,
    chatHistory: chatHistory,
  };

  try {
    const res = await fetch(`${baseURL}/api/decide-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to decide action, using fallback logic");
      return hasSearchTerms ? "search" : "chat";
    }

    const data = await res.json();
    const aiDecision = data.action === "search" ? "search" : "chat";
    
    // If AI says chat but we have clear search terms, override to search
    if (aiDecision === "chat" && hasSearchTerms) {
      console.log("AI said chat but prompt has search terms, overriding to search");
      return "search";
    }
    
    return aiDecision;
  } catch (error) {
    console.error("Error deciding action:", error);
    return hasSearchTerms ? "search" : "chat"; // Use fallback logic on error
  }
}

export async function getChatResponse(
  chatHistory: ChatMessage[],
  prompt: string,
) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const payload: AIChatRequest = {
    prompt: prompt,
    chatHistory: chatHistory,
  };

  const res = await fetch(`${baseURL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to get chat response");
  }

  const data = await res.json();
  return data;
}
