import { MapContextProvider } from "@/src/contexts/MapContext";
import MapFilters from "@/src/components/map/MapFilters";
import MapPageClient from "@/src/components/map/MapPageClient";

export default function MapPage() {
  return (
    <MapContextProvider>
      <div className="flex flex-col h-screen">
        <MapFilters />
        <MapPageClient />
      </div>
    </MapContextProvider>
  );
}