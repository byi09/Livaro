import { PropertyListing } from "@/lib/types";
import {
  capitalizeFirstLetter,
  formatPrice,
  trimZeros
} from "@/utils/formatters";
import Image from "next/image";
import { useMapContext } from "@/src/contexts/MapContext";

// Create a safe hook that won't throw error if context is not available
const useSafeMapContext = () => {
  try {
    return useMapContext();
  } catch {
    return null;
  }
};

export default function PropertyCard({ item }: { item: PropertyListing }) {
  const mapContext = useSafeMapContext();
  
  const handleClick = () => {
    // Only use map context features if available
    if (mapContext) {
      mapContext.setSelectedProperty(item);
    }
  };

  const isSelected = mapContext?.selectedProperty?.properties.id === item.properties.id;

  return (
    <div 
      className={`rounded-md shadow-md w-full overflow-hidden cursor-pointer hover:shadow-xl border transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
          : 'border-gray-200'
      }`}
      onClick={handleClick}
    >
      {/* TODO: replace image with DB-pulled property image */}
      <Image
        src="/hero-bg.jpg"
        alt={item.property_listings.listingTitle || "Property Image"}
        className="w-full h-40 object-cover"
        width={400}
        height={200}
      />
      <div className="p-2">
        <h1 className="text-xl font-bold">
          {formatPrice(parseFloat(item.property_listings.monthlyRent))}/mo
        </h1>
        <p className="line-clamp-1 text-sm">
          <b>
            {item.properties.bedrooms > 0
              ? `${item.properties.bedrooms}bd`
              : "Studio"}
          </b>{" "}
          | <b>{trimZeros(item.properties.bathrooms)}</b>ba |{" "}
          <b>{item.properties.squareFootage}</b>sqft -{" "}
          {capitalizeFirstLetter(item.properties.propertyType)} for rent
        </p>
        <p className="line-clamp-1 text-sm">
          {item.property_listings.listingTitle &&
            `${item.property_listings.listingTitle} | `}
          {item.properties.addressLine1}, {item.properties.city},{" "}
          {item.properties.state} {item.properties.zipCode}
        </p>
      </div>
    </div>
  );
}