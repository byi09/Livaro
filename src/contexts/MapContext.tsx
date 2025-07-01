"use client";

import { ENABLE_MAP } from "@/lib/config";
import type { FilterOptions, PropertyListing, SortOption } from "@/lib/types";
import { searchPropertiesWithFilter } from "@/src/db/queries";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, useMemo } from "react";

// Global Property Modal Context
interface PropertyModalContextProps {
  selectedProperty: PropertyListing | null;
  setSelectedProperty: React.Dispatch<React.SetStateAction<PropertyListing | null>>;
}

const PropertyModalContext = createContext<PropertyModalContextProps | null>(null);

export const usePropertyModal = () => {
  const context = useContext(PropertyModalContext);
  if (!context) {
    // Return a fallback context for components that need to work without the provider
    return {
      selectedProperty: null,
      setSelectedProperty: () => {},
    };
  }
  return context;
};

export const PropertyModalProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  return (
    <PropertyModalContext.Provider
      value={{
        selectedProperty,
        setSelectedProperty
      }}
    >
      {children}
    </PropertyModalContext.Provider>
  );
};

interface MapContextProps {
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  catalog: PropertyListing[];
  fetchingListings: boolean;
  setReady: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProperty: PropertyListing | null;
  setSelectedProperty: React.Dispatch<React.SetStateAction<PropertyListing | null>>;
}

const MapContext = createContext<MapContextProps | null>(null);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapContextProvider");
  }
  return context;
};

export const MapContextProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [fetchingListings, setFetchingListings] = useState(false);
  const [ready, setReady] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    propertyTypes: {},
    priceRange: {
      min: 0,
      max: 0
    },
    bedrooms: 0,
    bathrooms: 0,
    petsAllowed: false,
    furnished: false,
    utilitiesIncluded: false,
    parking: false,
    leaseType: "rent"
  });
  const [sortOption, setSortOption] = useState<SortOption>("priceAsc");
  const [catalog, setCatalog] = useState<PropertyListing[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const searchParams = useSearchParams();

  // update catalog based on filter options
  useEffect(() => {
    // TODO: get rid of this check when we don't need coming soon component
    if (!ENABLE_MAP) return;
    // check that map is ready and loaded
    if (!ready) return;
    
    const timeoutId = setTimeout(() => {
      setFetchingListings(true);
      (async () => {
        try {
          // JSON stringify + parse to avoid mutating the original filterOptions object
          // and pass deep objects to server-side function
          const optionsBundle = JSON.parse(JSON.stringify(filterOptions));
          const properties = await searchPropertiesWithFilter(
            optionsBundle,
            sortOption
          );
          setCatalog(properties);
        } catch (error) {
          console.error('Error fetching properties:', error);
        } finally {
          setFetchingListings(false);
        }
      })();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filterOptions, ready, sortOption]);

  useEffect(() => {
    // prevent running this effect multiple times from
    // search parameter changes as user interacts with filters and maps
    if (paramsLoaded) return;

    const params = Object.fromEntries(searchParams.entries());

    const beds = parseInt(params.beds || "0", 10);
    const baths = parseInt(params.baths || "0", 10);

    const newFilterOptions: FilterOptions = {
      propertyTypes: {
        apartment: params.propertyType === "apartment",
        house: params.propertyType === "house",
        condo: beds === -1 || params.propertyType === "condo",
        townhouse: params.propertyType === "townhouse"
      },
      priceRange: {
        min: parseInt(params.minPrice || "0", 10),
        max: parseInt(params.maxPrice || "0", 10)
      },
      bedrooms: beds > 0 ? beds : 0,
      bathrooms: baths > 0 ? baths : 0,
      petsAllowed: params.petFriendly === "true",
      furnished: params.furnished === "true",
      utilitiesIncluded: params.utilitiesIncluded === "true",
      parking: params.parking === "true",
      leaseType: params.leaseType || "rent"
    };

    setFilterOptions(newFilterOptions);
    setParamsLoaded(true);
  }, [searchParams, paramsLoaded]);

  const contextValue = useMemo(() => ({
    filterOptions,
    setFilterOptions,
    fetchingListings,
    setReady,
    catalog,
    sortOption,
    setSortOption,
    selectedProperty,
    setSelectedProperty
  }), [filterOptions, fetchingListings, catalog, sortOption, selectedProperty]);

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};