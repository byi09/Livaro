'use client';

import HeroSection from "./home/HeroSection";
import Catalog from "./home/Catalog";
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
    <main className="min-h-screen bg-white">
      <HeroSection />
      
      {/* Catalog Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Catalog />
        </div>
      </section>
    </main>
  );
}

export default React.memo(Dashboard);
