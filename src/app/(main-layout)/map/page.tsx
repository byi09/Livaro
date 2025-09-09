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
      <div className="flex flex-col h-screen">
        <MapFilters />
        <div className="flex w-full flex-1 min-h-0">
          <PanelGroup direction="horizontal" className="w-full h-full">
            <Panel defaultSize={65} minSize={55} maxSize={70} className="relative">
              <div className="w-full h-full">
                <DefaultMap>
                  <MapControls />
                  <MapMarkers />
                </DefaultMap>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-gray-400 transition-colors cursor-col-resize" />
            <Panel defaultSize={35} minSize={30} maxSize={45} className="relative">
              <div className="w-full h-full">
                {ENABLE_MAP ? <MapCatalog /> : <MapCatalogComingSoon />}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </MapContextProvider>
  );
}