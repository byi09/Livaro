'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionOptimizedProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 8,
    scale: 0.98
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: "easeOut",
      staggerChildren: 0.05
    } 
  },
  exit: { 
    opacity: 0, 
    y: -8,
    scale: 0.98,
    transition: { 
      duration: 0.2, 
      ease: "easeIn" 
    } 
  }
};

const childVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

const PageTransitionOptimized: React.FC<PageTransitionOptimizedProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionOptimized;
export { childVariants };