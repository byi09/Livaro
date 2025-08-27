"use client";

import { MapContextProvider } from "@/src/contexts/MapContext";
import MapFilters from "@/src/components/map/MapFilters";
<<<<<<< HEAD
import MapPageClient from "@/src/components/map/MapPageClient";
=======
import MapMarkers from "@/src/components/map/MapMarkers";
import MapCatalogComingSoon from "@/src/components/map/MapCatalogComingSoon";
import { ENABLE_MAP } from "@/lib/config";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
>>>>>>> 253b0c215c074e68531d07b281211bb41e3aa908

export default function MapPage() {
  return (
    <MapContextProvider>
      <div className="flex flex-col h-screen">
        <MapFilters />
<<<<<<< HEAD
        <MapPageClient />
=======
        <div className="flex w-full flex-1 min-h-0">
                     <PanelGroup direction="horizontal" className="w-full h-full">
             <Panel defaultSize={150} minSize={30} className="relative">
               <div className="w-full h-full">
                 <DefaultMap>
                   <MapControls />
                   <MapMarkers />
                 </DefaultMap>
               </div>
             </Panel>
             <PanelResizeHandle className="w-2 bg-gray-300 hover:bg-gray-400 transition-colors cursor-col-resize" />
             <Panel defaultSize={60} minSize={15} maxSize={60} className="relative">
              <div className="w-full h-full">
                {/* TODO: get rid of the coming soon component */}
                {ENABLE_MAP ? <MapCatalog /> : <MapCatalogComingSoon />}
              </div>
            </Panel>
          </PanelGroup>
        </div>
>>>>>>> 253b0c215c074e68531d07b281211bb41e3aa908
      </div>
    </MapContextProvider>
  );
}