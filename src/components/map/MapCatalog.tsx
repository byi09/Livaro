"use client";

import { SortOption } from "@/lib/types";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import { useMapContext } from "../../contexts/MapContext";
import PropertyCard from "../MapCatalogItem";
import { listToMap } from "@/utils/converters";
import clsx from "clsx";

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
    <div
      className={clsx(
        "flex flex-col px-6 py-4 gap-4 shadow-xl z-10 h-full min-h-0 overflow-y-auto relative",
        fetchingListings && "pointer-events-none opacity-50"
      )}
    >
      <header>
        <h1 className="text-2xl font-bold text-blue-900">Rental Listings</h1>
        <div className="flex justify-between items-center">
          <strong className="font-semibold">
            {catalog.length} rental{catalog.length > 1 ? "s" : ""} available
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {catalog.map((item) => (
          <PropertyCard key={item.properties.id} item={item} />
        ))}
      </div>
    </div>
  );
}
