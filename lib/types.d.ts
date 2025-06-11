import { searchPropertiesWithFilter } from "@/src/db/queries";

interface GeoCoordinates {
  lng: number;
  lat: number;
}

interface FilterOptions {
  swBounds?: GeoCoordinates;
  neBounds?: GeoCoordinates;
  leaseType?: string;
  propertyTypes: {
    apartment?: boolean;
    house?: boolean;
    condo?: boolean;
    townhouse?: boolean;
  };
  priceRange: {
    min: number;
    max: number;
  };
  bedrooms: number;
  bathrooms: number;
  petsAllowed?: boolean;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  parking?: boolean;
  ac?: boolean;
  inUnitLaundry?: boolean;
}

type SortOption =
  | "priceAsc"
  | "priceDesc"
  | "newest"
  | "oldest"
  | "bedrooms"
  | "bathrooms";

type PropertyListing = Awaited<
  ReturnType<typeof searchPropertiesWithFilter>
>[0];

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface ClientLocation {
  street_number: AddressComponent | null;
  street: AddressComponent | null;
  city: AddressComponent | null;
  state: AddressComponent | null;
  country: AddressComponent | null;
  postal_code: AddressComponent | null;
  county: AddressComponent | null;
}

interface Geometry {
  bounds: {
    northeast: GeoCoordinates;
    southwest: GeoCoordinates;
  };
  location: GeoCoordinates;
  viewport: {
    northeast: GeoCoordinates;
    southwest: GeoCoordinates;
  };
  location_type: string;
}
