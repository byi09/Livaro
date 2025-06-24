'use client'

import { Marker } from "react-map-gl/mapbox";
import { useMapContext } from "../../contexts/MapContext"
import { formatLargeNumber } from "@/utils/formatters";

export default function MapMarkers() {
  const { catalog, selectedProperty, setSelectedProperty } = useMapContext();

  const handleMarkerClick = (property: any) => {
    setSelectedProperty(property);
  };

  return catalog.map(listing => {
    if (
      !listing.properties.latitude ||
      !listing.properties.longitude ||
      !listing.property_listings.monthlyRent
    )
      return null;

    const lng = parseFloat(listing.properties.longitude);
    const lat = parseFloat(listing.properties.latitude);
    const price = parseFloat(listing.property_listings.monthlyRent);
    const isSelected = selectedProperty?.properties.id === listing.properties.id;

    return (
      <Marker
        key={listing.properties.id}
        longitude={lng}
        latitude={lat}
      >
        <div 
          className={`px-2 text-white text-2xs rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
            isSelected 
              ? 'bg-blue-900 shadow-lg scale-110' 
              : 'bg-blue-800 hover:bg-blue-700'
          }`}
          onClick={() => handleMarkerClick(listing)}
        >
          {formatLargeNumber(price)}
        </div>
      </Marker>
    );
  })
}
