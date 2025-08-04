'use client';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  showSkeleton?: boolean;
}

const MinimalSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white animate-pulse">
    <div className="h-20 bg-gray-200"></div>
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '',
  showSkeleton = false
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show skeleton only if explicitly requested and not mounted
  if (showSkeleton && !isMounted) {
    return <MinimalSkeleton />;
  }

  // Simple opacity transition
  return (
    <div 
      className={`transition-opacity duration-200 ease-out ${
        isMounted ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default PageTransition;