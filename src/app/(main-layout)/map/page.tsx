import { MapContextProvider } from "@/src/contexts/MapContext";
import MapFilters from "@/src/components/map/MapFilters";
import MapPageClient from "@/src/components/map/MapPageClient";

export default function MapPage() {
  return (
    <MapContextProvider>
      <div className="flex flex-col min-h-screen h-screen pt-20">
        <MapFilters />
        <MapPageClient />
      </div>
    </MapContextProvider>
  );
}
