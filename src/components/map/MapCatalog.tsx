"use client";

import { SortOption } from "@/lib/types";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import { useMapContext } from "../../contexts/MapContext";
import PropertyCard from "../MapCatalogItem";
import { listToMap } from "@/utils/converters";



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
  const { catalog, sortOption, setSortOption, fetchingListings, mapBoundsReady } = useMapContext();

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
    <div className="flex flex-col px-6 py-4 gap-4 shadow-xl z-10 w-[400px] xl:w-[760px] h-full min-h-0 overflow-y-auto relative bg-white">
      <header>
        <h1 className="text-2xl font-bold text-blue-900">Rental Listings</h1>
        <div className="flex justify-between items-center">
          <strong className="font-semibold">
            {fetchingListings ? (
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

      {/* listings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 transition-opacity duration-200" style={{ opacity: fetchingListings ? 0.7 : 1 }}>
        {catalog.map((item) => (
          <PropertyCard key={item.properties.id} item={item} />
        ))}
      </div>
    </div>
  );
}
