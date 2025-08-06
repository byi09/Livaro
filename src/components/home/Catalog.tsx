"use client";


import CatalogComingSoon from "./CatalogComingSoon";
import { FaCogs } from "react-icons/fa";
import { ENABLE_CATALOG } from "@/lib/config";
import NearbyPropertiesOptimized from "./NearbyPropertiesOptimized";

export default function Catalog() {
  

  return (
    <>
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading removed as per design update */}

          {ENABLE_CATALOG ? (
            <NearbyPropertiesOptimized />
          ) : (
            <CatalogComingSoon icon={<FaCogs className="text-3xl" />}>
              <p className="text-center">
                We&apos;re crunching the numbers to provide you with the best
                rental listings in your area. Check back soon to discover the
                best rental options in your area!
              </p>
            </CatalogComingSoon>
          )}
        </div>
      </section>

      {/* neighborhood section */}
      {/* <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Neighborhoods
            </h2>
            <p className="text-xl text-gray-600">
              Explore trending areas with the best rental opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <NeighborhoodCard
              neighborhood={{
                name: "West Hollywood",
                avgRent: "$3,600",
                rentChange: "+4.7%",
                propertiesCount: 156
              }}
            />
            <NeighborhoodCard
              neighborhood={{
                name: "Culver City",
                avgRent: "$2,900",
                rentChange: "+6.3%",
                propertiesCount: 134
              }}
            />
            <NeighborhoodCard
              neighborhood={{
                name: "Manhattan Beach",
                avgRent: "$4,200",
                rentChange: "+1.9%",
                propertiesCount: 78
              }}
            />
          </div>

          <div className="text-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Explore All Neighborhoods
            </button>
          </div>
        </div>
      </section> */}
    </>
  );
}
