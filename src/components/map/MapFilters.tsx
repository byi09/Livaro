"use client";

import {
  formatBedroomsAndBathrooms,
  formatPriceRange
} from "@/utils/formatters";
import Dropdown from "../ui/Dropdown";
import {
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  SearchInput,
  ToggleGroup
} from "../ui/Form";
import { useMapContext } from "../../contexts/MapContext";
import Select from "react-select";
import { useEffect, useMemo, useState } from "react";
import { listToMap } from "@/utils/converters";
import { useSearchParams } from "next/navigation";

// config for lease types
const leaseTypeOptions = [
  { label: "For Rent", value: "rent" },
  { label: "For Sublease", value: "sublease" }
];

const leaseTypeMap = listToMap(leaseTypeOptions, "value");

// config for price range

const priceOptions = [
  { label: "Any price", value: 0 },
  { label: "$200", value: 200 },
  { label: "$400", value: 400 },
  { label: "$600", value: 600 },
  { label: "$800", value: 800 },
  { label: "$1000", value: 1000 },
  { label: "$1200", value: 1200 },
  { label: "$1400", value: 1400 },
  { label: "$1600", value: 1600 },
  { label: "$1800", value: 1800 },
  { label: "$2000", value: 2000 },
  { label: "$2200", value: 2200 },
  { label: "$2400", value: 2400 },
  { label: "$2600", value: 2600 },
  { label: "$2800", value: 2800 },
  { label: "$3000", value: 3000 },
  { label: "$3500", value: 3500 },
  { label: "$4000", value: 4000 },
  { label: "$4500", value: 4500 },
  { label: "$5000", value: 5000 },
  { label: "$5500", value: 5500 },
  { label: "$6000", value: 6000 },
  { label: "$7000", value: 7000 },
  { label: "$8000", value: 8000 },
  { label: "$9000", value: 9000 },
  { label: "$10000", value: 10000 }
];

const priceOptionsMap = listToMap(priceOptions, "value");

// config for bedrooms and bathrooms
const bedroomOptions = [
  { label: "Any", value: "0" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
  { label: "5+", value: "5" }
];

const bathroomOptions = [
  { label: "Any", value: "0" },
  { label: "1+", value: "1" },
  { label: "1.5+", value: "1.5" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" }
];

// config for property types
const propertyTypeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "Condo", value: "condo" },
  { label: "House", value: "house" },
  { label: "Townhouse", value: "townhouse" }
];

// ----------------------------------------------------------------------------------------

export default function MapFilters() {
  const { filterOptions, setFilterOptions } = useMapContext();
  const searchParams = useSearchParams();
  const [defaultLocation, setDefaultLocation] = useState<string | null>(null);

  // load default location search from search params
  // if it exists, otherwise use empty string
  useEffect(() => {
    setDefaultLocation((prev) => {
      if (prev) return prev;
      return searchParams.get("location") || "";
    });
  }, [searchParams]);

  // filter valid minimum price options
  // based on the current maximum price in the filter options
  const validMinOptions = useMemo(
    () =>
      priceOptions.filter(
        (option) =>
          option.value === 0 ||
          !filterOptions.priceRange.max ||
          option.value < filterOptions.priceRange.max
      ),
    [filterOptions.priceRange.max]
  );

  // filter valid maximum price options
  // based on the current minimum price in the filter options
  const validMaxOptions = useMemo(
    () =>
      priceOptions.filter(
        (option) =>
          option.value === 0 ||
          !filterOptions.priceRange.min ||
          option.value > filterOptions.priceRange.min
      ),
    [filterOptions.priceRange.min]
  );

  // count the number of active property type filters
  // by checking which property types are set to true in the filter options
  const activePropertyTypeFilters = useMemo(() => {
    const activeTypes = Object.entries(filterOptions.propertyTypes)
      .filter(([, isActive]) => isActive)
      .map(([type]) => type);
    return activeTypes.length;
  }, [filterOptions.propertyTypes]);

  return (
    <div className="flex gap-1 py-3 px-4 shadow-md z-20 bg-white border-b border-gray-100">
      {defaultLocation !== null ? (
        <SearchInput
          placeholder="Address, neighborhood, city, zip code"
          defaultValue={defaultLocation}
        />
      ) : (
        <SearchInput
          placeholder="Address, neighborhood, city, zip code"
          disabled
        />
      )}

      {/* for rent | for sublease */}
      <Dropdown trigger={leaseTypeMap[filterOptions.leaseType ?? "rent"].label}>
        <RadioGroup
          options={leaseTypeOptions}
          name="leaseType"
          defaultValue={filterOptions.leaseType}
          onChange={(e) =>
            setFilterOptions((prev) => ({ ...prev, leaseType: e.target.value }))
          }
        />
      </Dropdown>

      {/* price */}
      <Dropdown
        trigger={formatPriceRange(
          filterOptions.priceRange.min,
          filterOptions.priceRange.max
        )}
      >
        <div className="flex gap-2 items-center">
          <div>
            <h3 className="font-semibold">Minimum</h3>
            <Select
              className="w-40"
              options={validMinOptions}
              defaultValue={priceOptionsMap[filterOptions.priceRange.min ?? 0]}
              onChange={(option) => {
                const newMin = option?.value ?? 0;
                setFilterOptions((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, min: newMin }
                }));
              }}
            />
          </div>
          <div className="h-full pt-6">-</div>
          <div>
            <h3 className="font-semibold">Maximum</h3>
            <Select
              className="w-40"
              options={validMaxOptions}
              defaultValue={priceOptionsMap[filterOptions.priceRange.max ?? 0]}
              onChange={(option) => {
                const newMax = option?.value ?? 0;
                setFilterOptions((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, max: newMax }
                }));
              }}
            />
          </div>
        </div>
      </Dropdown>

      {/* bed & bath */}
      <Dropdown
        trigger={formatBedroomsAndBathrooms(
          filterOptions.bedrooms,
          filterOptions.bathrooms
        )}
      >
        <div className="flex flex-col gap-2">
          <h3>Bedrooms</h3>
          <ToggleGroup
            options={bedroomOptions}
            onChange={(value) => {
              setFilterOptions((prev) => ({
                ...prev,
                bedrooms: parseInt(value, 10) || 0
              }));
            }}
            defaultValue={filterOptions.bedrooms.toString() || undefined}
          />
          <h3>Bathrooms</h3>
          <ToggleGroup
            options={bathroomOptions}
            onChange={(value) => {
              setFilterOptions((prev) => ({
                ...prev,
                bathrooms: parseFloat(value) || 0
              }));
            }}
            defaultValue={filterOptions.bathrooms.toString() || undefined}
          />
        </div>
      </Dropdown>

      {/* property type */}
      <Dropdown
        trigger={
          activePropertyTypeFilters > 0
            ? `House Type (${activePropertyTypeFilters})`
            : "House Type"
        }
      >
        <CheckboxGroup
          options={propertyTypeOptions}
          defaultValue={filterOptions.propertyTypes}
          onChange={(e) => {
            const value = e.target.value;
            setFilterOptions((prev) => {
              const newTypes = {
                ...prev.propertyTypes,
                [value]: e.target.checked
              };
              return { ...prev, propertyTypes: newTypes };
            });
          }}
        />
      </Dropdown>

      {/* features */}
      <Dropdown trigger="More">
        <Checkbox
          field="Allows pets"
          onChange={(e) => {
            const value = e.target.checked;
            setFilterOptions((prev) => ({ ...prev, petsAllowed: value }));
          }}
          defaultChecked={filterOptions.petsAllowed}
        />
        <Checkbox
          field="Furnished"
          onChange={(e) => {
            const value = e.target.checked;
            setFilterOptions((prev) => ({ ...prev, furnished: value }));
          }}
          defaultChecked={filterOptions.furnished}
        />
        <Checkbox
          field="Utilities included"
          onChange={(e) => {
            const value = e.target.checked;
            setFilterOptions((prev) => ({ ...prev, utilitiesIncluded: value }));
          }}
          defaultChecked={filterOptions.utilitiesIncluded}
        />
        <Checkbox
          field="On-site parking"
          onChange={(e) => {
            const value = e.target.checked;
            setFilterOptions((prev) => ({ ...prev, parking: value }));
          }}
          defaultChecked={filterOptions.parking}
        />
        <Checkbox
          field="Must have AC"
          onChange={(e) => {
            const value = e.target.checked;
            setFilterOptions((prev) => ({ ...prev, ac: value }));
          }}
          defaultChecked={filterOptions.ac}
        />
        <Checkbox
          field="In-unit laundry"
          onChange={(e) => {
            const value = e.target.checked;
            setFilterOptions((prev) => ({ ...prev, inUnitLaundry: value }));
          }}
          defaultChecked={filterOptions.inUnitLaundry}
        />
      </Dropdown>
    </div>
  );
}
