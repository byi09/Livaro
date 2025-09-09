"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from './onboarding/OnboardingFlow';


const OnboardingChecker: React.FC = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const hasChecked = useRef(false);
  const refreshingRef = useRef(false);

  // Prevent body scrolling when modal/loading is active
  useEffect(() => {
    // Store original overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Prevent scrolling when loading or showing onboarding
    if (loading || isOnboarded === false || refreshing) {
      document.body.style.overflow = 'hidden';
    }
    
    // Cleanup function to restore scrolling
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [loading, isOnboarded, refreshing]);

  useEffect(() => {
    // Prevent multiple API calls
    if (hasChecked.current) return;
    
    const checkOnboardingStatus = async () => {
      hasChecked.current = true;
      
      try {
        const response = await fetch('/api/onboarding/check-status');
        if (response.ok) {
          const data = await response.json();
          setIsOnboarded(data.onboarded);
          
          // If user is onboarded, redirect to dashboard with clean page reload
          if (data.onboarded) {
            refreshingRef.current = true;
            setRefreshing(true);
            // Use window.location.href for clean reload without glitching
            window.location.href = '/';
            return; // Don't set loading to false, let the reload handle it
          }
        } else {
          // If API fails, assume not onboarded and show onboarding flow
          setIsOnboarded(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If API fails, assume not onboarded and show onboarding flow
        setIsOnboarded(false);
      } finally {
        // Only set loading to false if we're not refreshing
        if (!refreshingRef.current) {
          setLoading(false);
        }
      }
    };

    checkOnboardingStatus();
  }, [router]);

  if (loading || refreshing) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {refreshing ? 'Loading your dashboard...' : 'Setting up your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (isOnboarded === false) {
    return <OnboardingFlow />;
  }

  // If we reach here, something went wrong - show simple loading
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default OnboardingChecker; 