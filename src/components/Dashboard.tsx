'use client';

import HeroSection from "./home/HeroSection";
import Catalog from "./home/Catalog";
import React from "react";
// Removed unused imports

interface DashboardProps {
  isUnauthenticated?: boolean;
}

function Dashboard({ isUnauthenticated = false }: DashboardProps) {
  // Removed unused handlers - functionality moved to individual components

  return (
    <main className="min-h-screen bg-white">
      <HeroSection isUnauthenticated={isUnauthenticated} />
      
      {/* Catalog Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Catalog isUnauthenticated={isUnauthenticated} />
        </div>
      </section>
    </main>
  );
}

export default React.memo(Dashboard);
