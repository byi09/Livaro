"use client";

import { SortOption } from "@/lib/types";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import { useMapContext } from "../../contexts/MapContext";
import PropertyCard from "../MapCatalogItem";
import { listToMap } from "@/utils/converters";
import clsx from "clsx";
import Spinner from "../ui/Spinner";

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
  const { catalog, sortOption, setSortOption, fetchingListings } =
    useMapContext();

  return (
    <div className="flex flex-col px-6 py-4 gap-4 shadow-xl z-10 w-[400px] xl:w-[760px] h-full min-h-0 overflow-y-auto relative bg-white">
      <header>
        <h1 className="text-2xl font-bold text-blue-900">Rental Listings</h1>
        <div className="flex justify-between items-center">
          <strong className="font-semibold">
            {fetchingListings ? (
              <div className="flex items-center gap-2">
                <Spinner size={16} variant="primary" />
                <span>Loading properties...</span>
              </div>
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
      <div className={clsx(
        "grid grid-cols-1 xl:grid-cols-2 gap-4 transition-opacity duration-200",
        fetchingListings && "opacity-50"
      )}>
        {catalog.map((item) => (
          <PropertyCard key={item.properties.id} item={item} />
        ))}
      </div>

      {/* Loading overlay */}
      {fetchingListings && catalog.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner size={40} variant="primary" />
            <p className="mt-4 text-gray-600">Searching for properties...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!fetchingListings && catalog.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4M7 21h4m-4 0H3m4 0V5a2 2 0 012-2h6m0 0a2 2 0 012 2v4M7 21v-4a2 2 0 012-2h2m0 0V7a2 2 0 012-2h2m0 0v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600">Try adjusting your search filters to see more results.</p>
          </div>
        </div>
      )}
    </div>
  );
}
