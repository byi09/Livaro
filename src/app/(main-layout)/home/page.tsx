import React from "react";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Dashboard from '@/src/components/Dashboard';
import OnboardingFlow from '@/src/components/onboarding/OnboardingFlow';
import OnboardingChecker from '@/src/components/OnboardingChecker';

export default async function HomePage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not logged in, show the same dashboard but with restricted access
  if (!user) {
    // Show the same dashboard interface for consistency
    return <Dashboard isUnauthenticated={true} />;
  }

  // User is logged in, check onboarding status
  const cookieStore = await cookies();
  const onboardingCookie = cookieStore.get('onboarding-status');
  
  if (onboardingCookie) {
    // Use cached value from cookie
    const isOnboarded = onboardingCookie.value === 'true';
    
    if (!isOnboarded) {
      // Show onboarding flow with clean background
      return (
        <main className="relative min-h-screen overflow-hidden bg-gray-50">
          {/* Onboarding modal overlay */}
          <OnboardingFlow />
        </main>
      );
    }
    
    // User is onboarded, show dashboard normally
    return <Dashboard isUnauthenticated={false} />;
  } else {
    // No cookie exists, need to check database and set cookie
    // Show clean loading state while checking
    return (
      <main className="relative min-h-screen overflow-hidden bg-gray-50">
        <OnboardingChecker />
      </main>
    );
  }
}