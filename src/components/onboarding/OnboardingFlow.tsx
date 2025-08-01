"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PersonalInfoStep from './PersonalInfoStep';
import WelcomeStep from './WelcomeStep';
import { OnboardingData } from '@/src/types/onboarding';
import LocationInfoStep from './LocationInfoStep';
import UserTypeStep from './UserTypeStep';
import NotificationPreferencesStep from './NotificationPreferencesStep';
import Spinner from '@/src/components/ui/Spinner';
import { createRoot } from 'react-dom/client';

// New Step order (ContactInfoStep removed)
const steps = [
  { component: WelcomeStep, label: "Welcome" },
  { component: PersonalInfoStep, label: "Personal Information" },
  { component: UserTypeStep, label: "Account Type" },
  { component: NotificationPreferencesStep, label: "Notification Preferences" },
  { component: LocationInfoStep, label: "Location Preferences" },
];

const OnboardingFlow: React.FC = () => {
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const dataRef = useRef<Partial<OnboardingData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const container = document.createElement('div');
      container.id = 'signout-overlay';
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
          <Spinner size={32} label="Signing out…" />
        </div>
      );

      setSigningOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });

      const supabase = createClient();
      await supabase.auth.signOut();

      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleUpdate = (partial: Partial<OnboardingData>) => {
    console.log('🔄 Updating data:', partial);
    setData((prev) => {
      const newData = { ...prev, ...partial };
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
    console.log('🚀 Finishing with data:', payload);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        console.error('Onboarding failed');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (signingOut) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-400 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-40 w-20 h-20 bg-indigo-400 rounded-full blur-lg animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-blue-300 rounded-full blur-xl animate-pulse delay-500"></div>
          <div className="absolute top-1/3 left-1/6 w-40 h-40 bg-indigo-300 rounded-full blur-2xl animate-pulse delay-3000 opacity-30"></div>
          <div className="absolute bottom-1/3 right-1/6 w-36 h-36 bg-purple-300 rounded-full blur-2xl animate-pulse delay-1500 opacity-30"></div>
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg rotate-45 opacity-20"></div>
          <div className="absolute top-3/4 right-1/4 w-12 h-12 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/12 w-8 h-8 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-15"></div>
          <div className="absolute top-1/6 right-1/3 w-14 h-14 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-lg rotate-12 opacity-15"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.08) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="absolute inset-0 bg-white/15 backdrop-blur-sm"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 lg:py-6 xl:py-8 bg-white/90 min-h-[240px] lg:min-h-[320px] flex items-center">
          <div className="w-full max-w-2xl mx-auto">
            <CurrentStepComponent
              data={data}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </div>
        </div>

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
