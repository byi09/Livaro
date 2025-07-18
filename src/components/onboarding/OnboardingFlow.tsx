"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PersonalInfoStep from './PersonalInfoStep';
import { OnboardingData } from '@/src/types/onboarding';
import ContactInfoStep from './ContactInfoStep';
import LocationInfoStep from './LocationInfoStep';
import UserTypeStep from './UserTypeStep';
import NotificationPreferencesStep from './NotificationPreferencesStep';
import Spinner from '@/src/components/ui/Spinner';
import { createRoot } from 'react-dom/client';

// Step order: 1) Personal, 2) Account type, 3) Contact, 4) Notifications, 5) Location
const steps = [
  { component: PersonalInfoStep, label: "Personal Information" },
  { component: UserTypeStep, label: "Account Type" },
  { component: ContactInfoStep, label: "Contact Details" },
  { component: NotificationPreferencesStep, label: "Notification Preferences" },
  { component: LocationInfoStep, label: "Location Preferences" },
];

const OnboardingFlow: React.FC = () => {
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const dataRef = useRef<Partial<OnboardingData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);


  // Prevent body scrolling when modal is active
  useEffect(() => {
    // Store original overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore scrolling
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // Immediately show full-page loading overlay with React rendering for consistency
      const container = document.createElement('div');
      container.id = 'signout-overlay';
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
          <Spinner size={32} label="Signing out…" />
        </div>
      );

      // Disable rendering of onboarding UI while we sign out
      setSigningOut(true);

      // Then call our logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // After server session/cookies cleared, sign out on client
      const supabase = createClient();
      await supabase.auth.signOut();

      // Always redirect to home (or sign-in) afterward
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force reload to home page
      window.location.href = '/';
    }
  };

  const handleUpdate = (partial: Partial<OnboardingData>) => {
    console.log('🔄 OnboardingFlow updating data with:', JSON.stringify(partial, null, 2));
    setData((prev: Partial<OnboardingData>) => {
      const newData = { ...prev, ...partial };
      console.log('🔄 OnboardingFlow total data now:', JSON.stringify(newData, null, 2));
      dataRef.current = newData;
      return newData;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finish = async () => {
    setSubmitting(true);
    const payload = dataRef.current;
    console.log('🚀 OnboardingFlow finishing with data:', JSON.stringify(payload, null, 2));
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Use window.location.href for a clean page reload instead of router.push
        // This prevents glitching and ensures the server renders the dashboard properly
        window.location.href = '/';
      } else {
        console.error('Onboarding failed');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
    // Don't set submitting to false on success - let the page reload handle it
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const stepNumber = currentStep + 1;

  // If signing out, render nothing – overlay covers the screen
  if (signingOut) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Beautiful natural background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          {/* Floating circles */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-400 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-40 w-20 h-20 bg-indigo-400 rounded-full blur-lg animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-blue-300 rounded-full blur-xl animate-pulse delay-500"></div>
          
          {/* Additional decorative elements for larger screen */}
          <div className="absolute top-1/3 left-1/6 w-40 h-40 bg-indigo-300 rounded-full blur-2xl animate-pulse delay-3000 opacity-30"></div>
          <div className="absolute bottom-1/3 right-1/6 w-36 h-36 bg-purple-300 rounded-full blur-2xl animate-pulse delay-1500 opacity-30"></div>
          
          {/* Geometric shapes */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg rotate-45 opacity-20"></div>
          <div className="absolute top-3/4 right-1/4 w-12 h-12 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/12 w-8 h-8 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-15"></div>
          <div className="absolute top-1/6 right-1/3 w-14 h-14 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-lg rotate-12 opacity-15"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.08) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-white/15 backdrop-blur-sm"></div>
      </div>
      
      {/* Modal content - responsive height */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Header - Enhanced */}
        <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-5 pb-3 sm:pb-4 lg:pb-5 text-center border-b border-gray-100 relative bg-white/90 backdrop-blur-sm">
          {/* Sign-out link */}
          <button
            onClick={handleSignOut}
            className="absolute right-4 sm:right-6 lg:right-8 top-4 sm:top-6 lg:top-8 text-sm text-gray-500 hover:text-red-600 focus:outline-none transition-colors font-medium"
          >
            Sign out
          </button>

          {/* Welcome message - Enhanced */}
          <div className="mb-3 sm:mb-4 lg:mb-5">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-gray-800 leading-tight">
              Welcome to Livaro!
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
              Let&apos;s set up your profile to find the perfect rental or tenant for you
            </p>
          </div>

          {/* Step info - Enhanced */}
          <div className="flex justify-between items-center text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 text-gray-600 font-medium max-w-sm mx-auto">
            <span>{`Step ${stepNumber} of ${steps.length}`}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>

          {/* Progress bar - Enhanced */}
          <div className="w-full max-w-sm mx-auto bg-gray-200 rounded-full h-1.5 sm:h-2 lg:h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-1.5 sm:h-2 lg:h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>

          {/* Section label - Enhanced */}
          <div className="mt-3 sm:mt-4 lg:mt-5">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-1 sm:mb-2">
              {steps[currentStep].label}
            </h2>
            <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Step content - responsive spacing */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 lg:py-6 xl:py-8 bg-white/90 backdrop-blur-sm min-h-[240px] lg:min-h-[320px] flex items-center">
          <div className="w-full max-w-2xl mx-auto">
            <CurrentStepComponent
              data={data}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </div>
        </div>

        {/* Enhanced loading state */}
        {submitting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center">
            <div className="text-center p-8">
              <div className="mb-6">
                <Spinner size={32} className="mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Almost there!</h3>
              <p className="text-lg text-gray-600">Saving your profile and setting up your account...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow; 