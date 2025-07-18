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

  // filtering individual attributes
  if (filters.city) {
    query = query.ilike("properties.city", `%${filters.city}%`);
  }

  if (filters.state) {
    query = query.ilike("properties.state", `%${filters.state}%`);
  }

  if (filters.property_type) {
    query = query.eq("properties.property_type", filters.property_type);
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

  const { data, error } = await query.limit(20);

  if (error) {
    console.error("Error fetching property listings:", error);
    throw new Error("Failed to fetch property listings");
  }

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
  // takes in chat history and prompt makes an API call to gemini to decide
  // if the next response should be a chat response or if it should make an api call to /api/query-to-filter
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
      console.error("Failed to decide action, defaulting to chat");
      return "chat";
    }

    const data = await res.json();
    return data.action === "search" ? "search" : "chat";
  } catch (error) {
    console.error("Error deciding action:", error);
    return "chat"; // Default to chat on error
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
