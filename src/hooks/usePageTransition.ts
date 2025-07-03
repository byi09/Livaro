'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

interface UsePageTransitionOptions {
  beforeNavigate?: () => Promise<void> | void;
  loadingDuration?: number;
}

export const usePageTransition = (options: UsePageTransitionOptions = {}) => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { beforeNavigate, loadingDuration = 300 } = options;

  const navigateWithTransition = useCallback(async (path: string) => {
    try {
      setIsTransitioning(true);
      
      // Execute beforeNavigate callback if provided
      if (beforeNavigate) {
        await beforeNavigate();
      }

      // Show loading state for smooth transition
      await new Promise(resolve => setTimeout(resolve, loadingDuration));
      
      // Navigate to new page
      router.push(path);
      
    } catch (error) {
      console.error('Navigation error:', error);
      // Still navigate to prevent user from being stuck
      router.push(path);
    } finally {
      // Reset loading state after navigation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }
  }, [router, beforeNavigate, loadingDuration]);

  const navigateBack = useCallback(async () => {
    try {
      setIsTransitioning(true);
      
      if (beforeNavigate) {
        await beforeNavigate();
      }

      await new Promise(resolve => setTimeout(resolve, loadingDuration));
      router.back();
      
    } catch (error) {
      console.error('Back navigation error:', error);
      router.back();
    } finally {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }
  }, [router, beforeNavigate, loadingDuration]);

  return {
    navigateWithTransition,
    navigateBack,
    isTransitioning,
  };
}; 