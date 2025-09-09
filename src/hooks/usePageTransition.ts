'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

interface UsePageTransitionOptions {
  beforeNavigate?: () => Promise<void> | void;
  loadingDuration?: number;
  preserveScroll?: boolean;
}

export const usePageTransition = (options: UsePageTransitionOptions = {}) => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { beforeNavigate, loadingDuration = 300, preserveScroll = true } = options;

  // Save scroll position before navigation
  const saveScrollPosition = useCallback(() => {
    if (preserveScroll && typeof window !== 'undefined') {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      sessionStorage.setItem('pageTransition_scrollPosition', JSON.stringify({ scrollX, scrollY }));
    }
  }, [preserveScroll]);

  // Restore scroll position after navigation
  const restoreScrollPosition = useCallback(() => {
    if (preserveScroll && typeof window !== 'undefined') {
      const savedPosition = sessionStorage.getItem('pageTransition_scrollPosition');
      if (savedPosition) {
        try {
          const { scrollX, scrollY } = JSON.parse(savedPosition);
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            window.scrollTo(scrollX, scrollY);
          }, 50);
          // Clean up saved position
          sessionStorage.removeItem('pageTransition_scrollPosition');
        } catch (error) {
          console.warn('Failed to restore scroll position:', error);
        }
      }
    }
  }, [preserveScroll]);

  // Restore scroll position when component mounts
  useEffect(() => {
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  const navigateWithTransition = useCallback(async (path: string) => {
    try {
      setIsTransitioning(true);

      // Save current scroll position before navigation
      saveScrollPosition();

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
  }, [router, beforeNavigate, loadingDuration, saveScrollPosition]);

  const navigateBack = useCallback(async () => {
    try {
      setIsTransitioning(true);

      // Save current scroll position before navigation
      saveScrollPosition();

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
  }, [router, beforeNavigate, loadingDuration, saveScrollPosition]);

  return {
    navigateWithTransition,
    navigateBack,
    isTransitioning,
  };
}; 