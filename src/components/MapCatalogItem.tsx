'use client';

import { useEffect, useState } from "react";
import { PropertyListing } from "@/lib/types";
import {
  capitalizeFirstLetter,
  formatPrice,
  trimZeros
} from "@/utils/formatters";
import Image from "next/image";
import { useMapContext } from "@/src/contexts/MapContext";
import { useToast } from "@/src/components/ui/Toast";

const useSafeMapContext = () => {
  try {
    return useMapContext();
  } catch {
    return null;
  }
};

export default function MapCatalogItem({
  item,
  initialLiked = false,
  onUnlike,
}: {
  item: PropertyListing;
  initialLiked?: boolean;
  onUnlike?: (propertyId: string) => void;
}) {
  const mapContext = useSafeMapContext();
  const { success, error } = useToast();
  const [isLiked, setIsLiked] = useState(initialLiked);

  useEffect(() => {
    setIsLiked(initialLiked);

    // 🔁 Fetch liked status from backend on first mount (only if not already liked)
    if (!initialLiked) {
      fetch('/api/properties/like')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.properties)) {
            const likedIds = data.properties.map((p: any) => p.properties?.id);
            if (likedIds.includes(item.properties.id)) {
              setIsLiked(true);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to check liked status:', err);
        });
    }
  }, [initialLiked, item.properties.id]);

  const handleClick = () => {
    if (mapContext) {
      mapContext.setSelectedProperty(item);
    }
  };

  const toggleLike = async (propertyId: string) => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';

      const res = await fetch('/api/properties/like', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to toggle like');
      }

      if (method === 'POST') {
        success('Property liked!');
        setIsLiked(true);
      } else {
        success('Removed from liked properties.');
        setIsLiked(false);
        onUnlike?.(propertyId); // Optional parent update
      }

    } catch (err: any) {
      error('Failed to update like status', err.message);
      console.error(err);
    }
  };

  const isSelected =
    mapContext?.selectedProperty?.properties.id === item.properties.id;

  return (
    <div
      className={`rounded-md shadow-md w-full overflow-hidden cursor-pointer hover:shadow-xl border transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-gray-200'
      }`}
      onClick={handleClick}
    >
      <Image
        src="/hero-bg.jpg"
        alt={item.property_listings.listingTitle || "Property Image"}
        className="w-full h-40 object-cover"
        width={400}
        height={200}
      />
      <div className="p-2">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold">
            {formatPrice(parseFloat(item.property_listings.monthlyRent))}/mo
          </h1>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(item.properties.id);
            }}
            className={`text-2xl transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
            title={isLiked ? "Unlike Property" : "Like Property"}
          >
            {isLiked ? "❤️" : "♡"}
          </button>
        </div>
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
