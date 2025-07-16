export interface AIChatRequest {
  prompt: string;
}

export interface PropertyFilters {
  city?: string;
  state?: string;
  property_type?:
    | "apartment"
    | "house"
    | "condo"
    | "townhouse"
    | "studio"
    | "room"
    | "duplex";
  square_footage?: number;
  bedrooms?: number;
  bathrooms?: number;
  price_min?: number;
  price_max?: number;
  parking_spaces?: number;
  pet_friendly?: boolean;
  furnished?: boolean;
  available_from?: string;
}

export interface PropertyListing {
  id: string;
  monthlyRent: string;
  securityDeposit?: string;
  availableDate?: string;
  listingTitle?: string;
  listingDescription?: string;
  virtualTourUrl?: string;
  property: {
    id: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: string;
    squareFootage?: number;
    parkingSpaces: number;
  };
}

export interface ChatMessage {
  text: string;
  type: "user" | "ai" | "error" | "system";
  propertyListings?: PropertyListing[];
}

export interface DatabasePropertyListingResponse {
  id: string;
  monthly_rent: string | number;
  security_deposit?: string | number;
  available_date?: string;
  listing_title?: string;
  listing_description?: string;
  virtual_tour_url?: string;
  properties: {
    id: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    zip_code: string;
    property_type: string;
    bedrooms: number;
    bathrooms: string | number;
    square_footage?: number;
    parking_spaces: number;
  } | null;
}
