'use client'

import { Marker } from "react-map-gl/mapbox";
import { useMapContext } from "../../contexts/MapContext"
import { formatLargeNumber } from "@/utils/formatters";
import { useRouter } from "next/navigation";

export default function MapMarkers() {
  const { catalog } = useMapContext();
  const router = useRouter();

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

    return (
      <Marker
        key={listing.properties.id}
        longitude={lng}
        latitude={lat}
      >
        <div
          className="px-2 text-white bg-blue-800 text-2xs rounded-full cursor-pointer"
          onClick={() => router.push(`/property/${listing.properties.id}`)}
        >
          {formatLargeNumber(price)}
        </div>
      </Marker>
    );
  })
}
