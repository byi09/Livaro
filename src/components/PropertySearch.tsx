"use client";

import { LocationSearchInput, Checkbox, SearchSelect } from "./ui/Form";
import { FieldErrors, Resolver, useForm } from "react-hook-form";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useGeolocationContext } from "../contexts/GeolocationContext";
import { useRouter } from "next/navigation";
import { geocode } from "@/utils/geocoding";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/LoadingSkeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import React from "react";
import Spinner from "./ui/Spinner";

// select options for property type and beds
const propertyTypeOptions = [
  { value: "null", label: "Property Type" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" }
];

const bedOptions = [
  { value: "null", label: "Beds" },
  { value: "-1", label: "Studio" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3+", label: "3+ Beds" }
];

// form values
interface SearchFormValues {
  location: string;
  propertyType?: string;
  beds?: string;
  petFriendly?: boolean;
  parking?: boolean;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
}

// error resolver for the form
const resolver: Resolver<SearchFormValues> = async (values) => {
  const errors: FieldErrors<SearchFormValues> = {};

  if (!values.location) {
    errors.location = {
      type: "required",
      message: "Location is required"
    };
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    values: hasErrors ? {} : values,
    errors: hasErrors ? errors : {}
  };
};

// form component
function PropertySearch() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<SearchFormValues>({ resolver });
  const { location, isLoading } = useGeolocationContext();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Memoize default location to prevent unnecessary re-renders
  const defaultLocation = useMemo(() => {
    if (isLoading) return "";
    return location?.city && location?.state
      ? `${location.city.long_name}, ${location.state.short_name}`
      : "";
  }, [isLoading, location?.city, location?.state]);

  useEffect(() => {
    if (defaultLocation) {
      setValue("location", defaultLocation);
    }
  }, [defaultLocation, setValue]);

  const onSubmit = useCallback(
    async (data: SearchFormValues) => {
      setIsSearching(true);
      
      try {
        // build search parameters for map filters
        const searchParams = new URLSearchParams();

        // if location is provided, geocode it to get center coordinates
        // for the map's initial view
        if (data.location) {
          searchParams.set("location", data.location);
          const geometry = await geocode(data.location);
          if (geometry?.location) {
            searchParams.set("lng", geometry.location.lng.toString());
            searchParams.set("lat", geometry.location.lat.toString());
          }
        }

        if (data.propertyType && data.propertyType !== "null")
          searchParams.set("propertyType", data.propertyType);

        if (data.beds && data.beds !== "null")
          searchParams.set("beds", data.beds);
        if (data.petFriendly) searchParams.set("petFriendly", "true");
        if (data.parking) searchParams.set("parking", "true");
        if (data.furnished) searchParams.set("furnished", "true");
        if (data.utilitiesIncluded) searchParams.set("utilitiesIncluded", "true");

        router.push(`/map?${searchParams.toString()}`);
      } catch (error) {
        console.error('Search error:', error);
        setIsSearching(false);
      }
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded" />
            ))}
            <Skeleton className="h-6 w-20 rounded" />
          </div>
          <Skeleton className="h-12 w-24 rounded-lg" />
        </div>
        <div className="flex justify-center py-8">
          <Spinner size={48} variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <form
      className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-consistent"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Location Input */}
        <div className="md:col-span-2">
          <LocationSearchInput
            {...register("location", { required: true })}
            key={`location-${defaultLocation}`} // Add key to prevent animation issues
            defaultValue={defaultLocation}
          >
            {errors.location && (
              <p className="text-red-500 text-sm mt-1 absolute">
                {errors.location.message}
              </p>
            )}
          </LocationSearchInput>
        </div>

        {/* Property Type */}
        <SearchSelect
          {...register("propertyType")}
          options={propertyTypeOptions}
        />

        {/* Beds */}
        <SearchSelect {...register("beds")} options={bedOptions} />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Checkbox
            {...register("petFriendly")}
            id="pet-friendly"
            field="Pet Friendly"
          />
          <Checkbox
            {...register("parking")}
            id="parking"
            field="Parking Available"
          />
          <Checkbox
            {...register("furnished")}
            id="furnished"
            field="Furnished"
          />
          <Checkbox
            {...register("utilitiesIncluded")}
            id="utilities-included"
            field="Utilities Included"
          />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="text-blue-600 hover:text-blue-800"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            More Filters
          </Button>
        </div>
        
        <Button
          type="submit"
          loading={isSearching}
          loadingText="Searching..."
          size="lg"
          variant="gradient"
          className="px-8"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Additional filters section */}
      {showMoreFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="input-primary text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="input-primary text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Move-in Date
              </label>
              <input
                type="date"
                className="input-primary text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Lease Length
              </label>
              <select className="input-primary text-sm">
                <option value="">Any</option>
                <option value="month-to-month">Month-to-Month</option>
                <option value="6-months">6 Months</option>
                <option value="12-months">12 Months</option>
                <option value="24-months">24+ Months</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Distance to Campus
              </label>
              <select className="input-primary text-sm">
                <option value="">Any</option>
                <option value="0.5">Within 0.5 miles</option>
                <option value="1">Within 1 mile</option>
                <option value="2">Within 2 miles</option>
                <option value="5">Within 5 miles</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PropertySearch);
