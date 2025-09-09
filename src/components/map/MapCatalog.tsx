"use client";

import { SortOption } from "@/lib/types";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import { useMapContext } from "../../contexts/MapContext";
import PropertyCard from "../MapCatalogItem";
import { listToMap } from "@/utils/converters";
import { useMemo, useCallback } from "react";
import { FixedSizeList as List } from 'react-window';



const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priceAsc", label: "Price: Low to High" },
  { value: "priceDesc", label: "Price: High to Low" },
  { value: "bedrooms", label: "Bedrooms" },
  { value: "bathrooms", label: "Bathrooms" }
];

const sortLabelMap = listToMap(sortOptions, "value");

export default function MapCatalog() {
  const { catalog, sortOption, setSortOption, fetchingListings, mapBoundsReady, initialLoadComplete } = useMapContext();

  // Memoize sorted catalog for performance
  const sortedCatalog = useMemo(() => {
    return [...catalog]; // Catalog is already sorted from the server
  }, [catalog]);

  // Memoize property card renderer for virtualization
  const PropertyCardRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = sortedCatalog[index];
    if (!item) return null;

    return (
      <div style={style} className="px-2">
        <PropertyCard key={item.properties.id} item={item} />
      </div>
    );
  }, [sortedCatalog]);

  // Show loading state while map bounds are being determined
  if (!mapBoundsReady) {
    return (
      <div className="flex flex-col px-6 py-4 gap-4 shadow-xl z-10 w-[400px] xl:w-[760px] h-full min-h-0 overflow-y-auto relative bg-white">
        <header>
          <h1 className="text-2xl font-bold text-blue-900">Rental Listings</h1>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-500">Loading map area...</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Initializing map view</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 py-4 gap-4 shadow-xl z-10 h-full min-h-0 overflow-y-auto relative bg-white">
      <header>
        <h1 className="text-2xl font-bold text-blue-900">Rental Listings</h1>
        <div className="flex justify-between items-center">
          <strong className="font-semibold">
            {fetchingListings || !initialLoadComplete ? (
              <span className="text-gray-500 animate-pulse">Searching properties...</span>
            ) : (
              `${catalog.length} rental${catalog.length > 1 ? "s" : ""} available`
            )}
          </strong>

          {/* sort dropdown */}
          <Dropdown
            trigger={sortLabelMap[sortOption].label}
            triggerClassName="border-0 text-blue-800"
            align="end"
          >
            {sortOptions.map((option) => (
              <DropdownItem
                key={option.value}
                onClick={() => setSortOption(option.value as SortOption)}
              >
                {option.label}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </header>

      {/* listings with optimized rendering */}
      <div className="flex-1 relative">

        
        {/* When there are no listings and we're done fetching, show a friendly message */}
        {!fetchingListings && initialLoadComplete && sortedCatalog.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 gap-2">
            <p className="text-lg font-semibold text-gray-700">No rentals found in this area</p>
            <p className="text-sm max-w-xs">Try adjusting the map view or changing your filters to search a wider area.</p>
          </div>
        )}

        {sortedCatalog.length > 20 ? (
          // Use virtualization for large lists
          <List
            height={600} // Adjust based on container height
            width="100%"
            itemCount={sortedCatalog.length}
            itemSize={280} // Approximate height of each property card
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {PropertyCardRenderer}
          </List>
        ) : (
          // Use regular grid for small lists with stable rendering
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sortedCatalog.map((item) => (
              <PropertyCard key={item.properties.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
