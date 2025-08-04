'use client';

import PropertySearch from "./PropertySearch";
import Catalog from "./home/Catalog";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PropertyListing, FilterOptions } from "@/lib/types";

function Dashboard() {
  const router = useRouter();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Only show loading on the very first mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Minimal delay just to prevent flash
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsInitialLoad(false);
    }
  }, []);

  const handleFiltersChange = (filters: FilterOptions) => {
    const searchParams = new URLSearchParams();
    
    if (filters.priceRange?.min) searchParams.set('minPrice', filters.priceRange.min.toString());
    if (filters.priceRange?.max) searchParams.set('maxPrice', filters.priceRange.max.toString());
    if (filters.bedrooms) searchParams.set('beds', filters.bedrooms.toString());
    if (filters.bathrooms) searchParams.set('baths', filters.bathrooms.toString());
    if (filters.leaseType) searchParams.set('leaseType', filters.leaseType);
    if (filters.petsAllowed) searchParams.set('petFriendly', 'true');
    if (filters.furnished) searchParams.set('furnished', 'true');
    if (filters.utilitiesIncluded) searchParams.set('utilitiesIncluded', 'true');
    if (filters.parking) searchParams.set('parking', 'true');
    
    // Safe property types handling
    if (filters.propertyTypes && typeof filters.propertyTypes === 'object') {
      const activePropertyTypes = Object.entries(filters.propertyTypes)
        .filter(([, isActive]) => isActive)
        .map(([type]) => type);
      
      if (activePropertyTypes.length > 0) {
        searchParams.set('propertyType', activePropertyTypes[0]);
      }
    }

    router.push(`/map?${searchParams.toString()}`);
  };

  const handlePropertySelect = (property: PropertyListing) => {
    // Safe property access
    const propertyId = property?.properties?.id || property?.id;
    if (propertyId) {
      router.push(`/map?propertyId=${propertyId}`);
    }
  };

  // Simple fade-in without complex loading states
  return (
    <main 
      className={`min-h-screen bg-white transition-opacity duration-300 ${
        isInitialLoad ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Find Your Perfect Rental
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Discover amazing properties in your ideal location with our
              comprehensive search tools
            </p>
          </div>

          {/* Search Form - only pass props if PropertySearch expects them */}
          <div>
            <PropertySearch 
              key="dashboard-search"
              {...(typeof PropertySearch === 'function' && PropertySearch.length > 0 ? { onFiltersChange: handleFiltersChange } : {})}
            />
          </div>
        </div>
      </section>

      {/* Catalog - only pass props if Catalog expects them */}
      <Catalog 
        {...(typeof Catalog === 'function' && Catalog.length > 0 ? { onPropertySelect: handlePropertySelect } : {})}
      />
    </main>
  );
}

export default React.memo(Dashboard);