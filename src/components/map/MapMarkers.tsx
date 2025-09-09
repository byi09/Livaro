'use client'

import { Marker } from "react-map-gl/mapbox";
import { useMapContext } from "../../contexts/MapContext"
import { formatLargeNumber } from "@/utils/formatters";

export default function MapMarkers() {
  const { catalog, selectedProperty, setSelectedProperty } = useMapContext();

  const handleMarkerClick = (property: any) => {
    console.log('🎯 Marker clicked for property:', property.properties.id);
    console.log('📍 Property details:', {
      address: property.properties.addressLine1,
      price: property.property_listings.monthlyRent,
      bedrooms: property.properties.bedrooms
    });
    setSelectedProperty(property);
    console.log('✅ Selected property set, modal should open');
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
        <button
          type="button"
          className={`px-3 py-1 text-white text-sm font-semibold rounded-full cursor-pointer transition-all duration-200 hover:scale-110 shadow-lg border-2 ${
            isSelected 
              ? 'bg-blue-900 border-white shadow-xl scale-110 animate-pulse' 
              : 'bg-blue-800 border-blue-600 hover:bg-blue-700 hover:border-white hover:shadow-xl'
          } relative z-10 touch-manipulation select-none active:scale-95`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Price tag clicked!', listing.properties.id);
            handleMarkerClick(listing);
          }}
          title={`Click to view property details - $${formatLargeNumber(price)}/month`}
          aria-label={`View property details for $${formatLargeNumber(price)} per month`}
        >
          ${formatLargeNumber(price)}
        </button>
      </Marker>
    );
  })
}