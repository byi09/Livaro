"use client";

import { MapContextProvider } from "@/src/contexts/MapContext";
import MapFilters from "@/src/components/map/MapFilters";
import MapMarkers from "@/src/components/map/MapMarkers";
import MapCatalogComingSoon from "@/src/components/map/MapCatalogComingSoon";
import MapCatalog from "@/src/components/map/MapCatalog";
import DefaultMap from "@/src/components/map/DefaultMap";
import MapControls from "@/src/components/map/MapControls";
import { ENABLE_MAP } from "@/lib/config";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function MapPage() {
  return (
    <MapContextProvider>
      <div className="absolute inset-0 top-16 flex flex-col w-full z-10">
        <MapFilters />
        <div className="flex w-full flex-1 min-h-0">
          {/* Fixed size map on left, properties on right */}
          <div className="w-2/3 h-full relative">
            <DefaultMap>
              <MapControls />
              <MapMarkers />
            </DefaultMap>
          </div>
          <div className="w-1/3 h-full relative overflow-hidden border-l border-gray-300">
            {ENABLE_MAP ? <MapCatalog /> : <MapCatalogComingSoon />}
          </div>
        </div>
      </div>
    </MapContextProvider>
  );
}