'use client';

import { PropertyListing } from "@/lib/types";
import { useGeolocationContext } from "@/src/contexts/GeolocationContext";
import { getNearbyProperties } from "@/src/db/queries";
import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

// Lazy load PropertyCard for better initial performance
const PropertyCard = lazy(() => import("../MapCatalogItem"));

// Cache for property data to avoid refetching
const propertyCache = new Map<string, { data: PropertyListing[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const skeletonVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Optimized skeleton card
const PropertySkeleton = ({ index }: { index: number }) => (
  <motion.div
    variants={skeletonVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse bg-[length:200%_100%]" 
         style={{ animation: 'shimmer 1.5s infinite' }} />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
      </div>
    </div>
  </motion.div>
);

export default function NearbyPropertiesOptimized() {
  const { coords } = useGeolocationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key based on coordinates (rounded to reduce cache misses)
  const cacheKey = useMemo(() => {
    if (!coords) return null;
    const roundedLat = Math.round(coords.lat * 1000) / 1000;
    const roundedLng = Math.round(coords.lng * 1000) / 1000;
    return `${roundedLat},${roundedLng}`;
  }, [coords]);

  // Optimized property loading with caching
  const loadProperties = useCallback(async () => {
    if (!coords || !cacheKey) return;

    // Check cache first
    const cached = propertyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProperties(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use Promise.race to timeout long requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const propertiesPromise = getNearbyProperties(coords.lat, coords.lng, 0, 6); // Find closest properties regardless of distance
      
      const nearbyProperties = await Promise.race([propertiesPromise, timeoutPromise]);
      
      // Cache the results
      propertyCache.set(cacheKey, {
        data: nearbyProperties,
        timestamp: Date.now()
      });
      
      setProperties(nearbyProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError(error instanceof Error ? error.message : 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [coords, cacheKey]);

  // Helper function to load properties with specific coordinates
  const loadPropertiesWithCoords = useCallback(async (coordinates: { lat: number; lng: number }) => {
    const cacheKey = `${Math.round(coordinates.lat * 1000) / 1000},${Math.round(coordinates.lng * 1000) / 1000}`;
    const cached = propertyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProperties(cached.data);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      const propertiesPromise = getNearbyProperties(coordinates.lat, coordinates.lng, 0, 6);
      const nearbyProperties = await Promise.race([propertiesPromise, timeoutPromise]);
      propertyCache.set(cacheKey, { data: nearbyProperties, timestamp: Date.now() });
      setProperties(nearbyProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError(error instanceof Error ? error.message : 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (hasSearched) return;
    
    setHasSearched(true);
    
    // If no coordinates available, use a default location (San Francisco) to still show closest properties
    if (!coords) {
      const defaultCoords = { lat: 37.7749, lng: -122.4194 }; // San Francisco
      loadPropertiesWithCoords(defaultCoords);
    } else {
      loadProperties();
    }
  }, [coords, hasSearched, loadProperties, loadPropertiesWithCoords]);

  /* duplicate function (will be removed) */
  const _loadPropertiesWithCoordsDuplicate = useCallback(async (coordinates: { lat: number; lng: number }) => {
    const cacheKey = `${Math.round(coordinates.lat * 1000) / 1000},${Math.round(coordinates.lng * 1000) / 1000}`;
    
    // Check cache first
    const cached = propertyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProperties(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const propertiesPromise = getNearbyProperties(coordinates.lat, coordinates.lng, 0, 6);
      const nearbyProperties = await Promise.race([propertiesPromise, timeoutPromise]);
      
      // Cache the results
      propertyCache.set(cacheKey, {
        data: nearbyProperties,
        timestamp: Date.now()
      });
      
      setProperties(nearbyProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError(error instanceof Error ? error.message : 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isLoading ? "Finding Closest Properties" : coords ? "Closest Properties to You" : "Available Properties"}
        </h2>
        <p className="text-gray-600">
          {isLoading 
            ? "Searching for the closest rental options available..."
            : coords 
              ? `Showing ${properties.length} closest available properties`
              : `Showing ${properties.length} available properties`
          }
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[0, 1, 2].map((index) => (
              <PropertySkeleton key={index} index={index} />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <div className="bg-white rounded-xl shadow-sm border border-red-200 text-center p-8 max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Properties
              </h3>
              <p className="text-gray-600 mb-4">
                {error === 'Request timeout' 
                  ? 'The request took too long. Please try again.' 
                  : 'There was an error loading properties. Please try again.'}
              </p>
              <button
                onClick={() => {
                  setHasSearched(false);
                  setError(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : properties.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center p-8 max-w-md">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Properties Available
              </h3>
              <p className="text-gray-600 mb-4">
                No active property listings are currently available. Check back soon as new properties are added regularly.
              </p>
              <button
                onClick={() => {
                  setHasSearched(false);
                  setError(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="properties"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {properties.map((property) => (
              <motion.div key={property.properties.id} variants={cardVariants}>
                <Suspense fallback={
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-gray-200 rounded w-20" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                  </div>
                }>
                  <PropertyCard item={property} />
                </Suspense>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}