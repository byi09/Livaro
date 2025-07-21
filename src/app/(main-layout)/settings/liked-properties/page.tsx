'use client';

import { useEffect, useState } from 'react';
import { PropertyListing } from '@/lib/types';
import PropertyCard from '@/src/components/MapCatalogItem';
import Spinner from '@/src/components/ui/Spinner';
import PropertyDetailModal from '@/src/components/map/PropertyDetailModal';

const LikedPropertiesPage = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        const res = await fetch('/api/properties/like');
        const data = await res.json();

        if (res.ok && Array.isArray(data.properties)) {
          setProperties(data.properties);
        }
      } catch (err) {
        console.error('Failed to load liked properties', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiked();
  }, []);

  const handleUnlike = (propertyId: string) => {
    setProperties((prev) => prev.filter((p) => p.properties.id !== propertyId));
  };

  const handleContact = (property: PropertyListing, method: 'phone' | 'email' | 'message') => {
    console.log(`User wants to contact via ${method}`, property);
    // You can trigger a modal or redirect, etc.
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Liked Properties</h1>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner />
        </div>
      ) : properties.length === 0 ? (
        <p className="text-gray-600">You haven’t liked any properties yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((item) => {
            if (!item?.property_listings) return null;

            return (
              <div
                key={item.property_listings.id}
                onClick={() => setSelectedProperty(item)}
              >
                <PropertyCard
                  item={item}
                  initialLiked={true}
                  onUnlike={handleUnlike}
                />
              </div>
            );
          })}
        </div>
      )}

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onContact={handleContact}
        />
      )}
    </div>
  );
};

export default LikedPropertiesPage;
