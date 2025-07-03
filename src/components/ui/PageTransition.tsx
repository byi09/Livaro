'use client';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-8 px-8 animate-pulse">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="mb-12 relative">
        <div className="h-1 bg-gray-200 rounded-full mb-8"></div>
        <div className="flex justify-between">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-6 h-6 bg-gray-200 rounded-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
        
        {/* Form Fields Skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
          </div>
        ))}

        {/* Button Skeleton */}
        <div className="flex justify-between mt-12">
          <div className="h-12 bg-gray-200 rounded-lg w-24"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  isLoading = false, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowContent(false);
      setIsVisible(false);
    } else {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowContent(true);
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${className}`}
    >
      {showContent ? children : <SkeletonLoader />}
    </div>
  );
};

export default PageTransition; 