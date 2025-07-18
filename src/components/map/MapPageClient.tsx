'use client';

import { useMapContext } from "@/src/contexts/MapContext";
import DefaultMap from "@/src/components/map/DefaultMap";
import MapCatalog from "@/src/components/map/MapCatalog";
import MapControls from "@/src/components/map/MapControls";
import MapMarkers from "@/src/components/map/MapMarkers";
import MapCatalogComingSoon from "@/src/components/map/MapCatalogComingSoon";
import PropertyModalHandler from "@/src/components/PropertyModalHandler";
import { ENABLE_MAP } from "@/lib/config";
import type { PropertyListing, FilterOptions } from "@/lib/types";

export default function MapPageClient() {
  const { setFilterOptions, selectedProperty, setSelectedProperty } = useMapContext();

  const handleFiltersChange = (filters: FilterOptions) => {
    setFilterOptions(filters);
  };

  const handlePropertySelect = (property: PropertyListing) => {
    setSelectedProperty(property);
  };

  return (
    <div className="flex w-full flex-1 min-h-0 relative">
      <div className="flex-1">
        <DefaultMap>
          <MapControls />
          <MapMarkers />
        </DefaultMap>
      </div>
      {/* TODO: get rid of the coming soon component */}
      {ENABLE_MAP ? <MapCatalog /> : <MapCatalogComingSoon />}

      {/* Property Modal Handler */}
      <PropertyModalHandler />
    </div>
  );
} 