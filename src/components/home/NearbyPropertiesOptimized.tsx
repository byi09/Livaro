'use client';

import { PropertyListing } from "@/lib/types";
import { useGeolocationContext } from "@/src/contexts/GeolocationContext";
import { getNearbyProperties } from "@/src/db/queries";
import { useEffect, useState } from "react";
import PropertyCard from "../MapCatalogItem";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

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

  useEffect(() => {
    if (!coords || hasSearched) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    const loadProperties = async () => {
      try {
        const nearbyProperties = await getNearbyProperties(
          coords.lat,
          coords.lng,
          10000
        );
        
        // Small delay to show smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        setProperties(nearbyProperties);
      } catch (error) {
        console.error('Error loading properties:', error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [coords, hasSearched]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isLoading ? "Finding Properties Near You" : "Properties Near You"}
        </h2>
        <p className="text-gray-600">
          {isLoading 
            ? "Searching for the best rental options in your area..."
            : `Discover ${properties.length} amazing properties nearby`
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
                No Properties Found
              </h3>
              <p className="text-gray-600">
                We couldn't find any nearby properties at the moment. Please try again later or check back soon.
              </p>
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
                <PropertyCard item={property} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}