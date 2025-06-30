import { MapContextProvider } from "@/src/contexts/MapContext";
import DefaultMap from "@/src/components/map/DefaultMap";
import MapCatalog from "@/src/components/map/MapCatalog";
import MapControls from "@/src/components/map/MapControls";
import MapFilters from "@/src/components/map/MapFilters";
import MapMarkers from "@/src/components/map/MapMarkers";
import MapCatalogComingSoon from "@/src/components/map/MapCatalogComingSoon";
import { ENABLE_MAP } from "@/lib/config";

export default function MapPage() {
  return (
    <MapContextProvider>
      <div className="flex flex-col min-h-screen h-screen pt-20">
        <MapFilters />
        <div className="flex w-full flex-1 min-h-0">
          <div className="flex-1">
            <DefaultMap>
              <MapControls />
              <MapMarkers />
            </DefaultMap>
          </div>
          {/* TODO: get rid of the coming soon component */}
          {ENABLE_MAP ? <MapCatalog /> : <MapCatalogComingSoon />}
        </div>
      </div>
    </MapContextProvider>
  );
}