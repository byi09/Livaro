'use client';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

// Simplified PageTransition - GlobalLoaderOverlay handles all loading states now
const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default PageTransition;