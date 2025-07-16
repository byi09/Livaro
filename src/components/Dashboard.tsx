'use client';

import PropertySearch from "./PropertySearch";
import Catalog from "./home/Catalog";
import PropertyAssistantChat from "./PropertyAssistantChat";
import React from "react";
import { useRouter } from "next/navigation";
import type { PropertyListing, FilterOptions } from "@/lib/types";

function Dashboard() {
  const router = useRouter();

  const handleFiltersChange = (filters: FilterOptions) => {
    // Navigate to map page with filters applied
    const searchParams = new URLSearchParams();
    
    if (filters.priceRange.min) searchParams.set('minPrice', filters.priceRange.min.toString());
    if (filters.priceRange.max) searchParams.set('maxPrice', filters.priceRange.max.toString());
    if (filters.bedrooms) searchParams.set('beds', filters.bedrooms.toString());
    if (filters.bathrooms) searchParams.set('baths', filters.bathrooms.toString());
    if (filters.leaseType) searchParams.set('leaseType', filters.leaseType);
    if (filters.petsAllowed) searchParams.set('petFriendly', 'true');
    if (filters.furnished) searchParams.set('furnished', 'true');
    if (filters.utilitiesIncluded) searchParams.set('utilitiesIncluded', 'true');
    if (filters.parking) searchParams.set('parking', 'true');
    
    // Set property type (use first active property type)
    const activePropertyTypes = Object.entries(filters.propertyTypes)
      .filter(([, isActive]) => isActive)
      .map(([type]) => type);
    
    if (activePropertyTypes.length > 0) {
      searchParams.set('propertyType', activePropertyTypes[0]);
    }

    router.push(`/map?${searchParams.toString()}`);
  };

  const handlePropertySelect = (property: PropertyListing) => {
    // Navigate to map page and show property details
    router.push(`/map?propertyId=${property.properties.id}`);
  };

  return (
    <main className="min-h-screen bg-white relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Find Your Perfect Rental
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Discover amazing properties in your ideal location with our
              comprehensive search tools
            </p>
          </div>

          {/* Search Form - Add stable key to prevent re-renders */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <PropertySearch key="dashboard-search" />
          </div>
        </div>
      </section>

      <Catalog />

      {/* Property Assistant Chat */}
      <div className="fixed bottom-4 right-4 z-50">
        <PropertyAssistantChat
          onFiltersChange={handleFiltersChange}
          onPropertySelect={handlePropertySelect}
        />
      </div>
    </main>
  );
}

export default React.memo(Dashboard);
