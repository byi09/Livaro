import React from "react";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Dashboard from '@/src/components/Dashboard';
import OnboardingFlow from '@/src/components/onboarding/OnboardingFlow';
import OnboardingChecker from '@/src/components/OnboardingChecker';
import Link from 'next/link';
import ContactForm from '@/src/components/ContactForm';

// Calendar Component
const LaunchCalendar = () => {
  const daysInJuly = 31;
  const startDay = 1; // July 1st is a Monday (adjust based on actual 2024 calendar)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = [];

  // Add empty cells for days before July 1st
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  // Add all days of July
  for (let day = 1; day <= daysInJuly; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 max-w-lg mx-auto border border-gray-100">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">July 2024</h3>
        <p className="text-blue-600 font-semibold text-xl">Launch: July 16th</p>
      </div>
      
      <div className="grid grid-cols-7 gap-3 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-base font-semibold text-gray-500 py-3">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-3">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square flex items-center justify-center text-base rounded-xl transition-all duration-300 font-medium
              ${day === null ? '' : 
                day === 16 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-xl transform scale-125 ring-4 ring-blue-200 z-10 relative' 
                  : 'hover:bg-gray-100 text-gray-700 hover:scale-105'
              }
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-flex items-center px-6 py-3 bg-blue-50 rounded-full border border-blue-200 text-sm">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
          <span className="text-blue-700 font-semibold">Launch Day</span>
        </div>
      </div>
    </div>
  );
};

export default async function Home() {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, check onboarding status
  if (user) {
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
      return <Dashboard />;
    } else {
      // No cookie exists, need to check database and set cookie
      // Show clean loading state while checking
      return (
        <main className="relative min-h-screen overflow-hidden bg-gray-50">
          {/* Onboarding checker overlay */}
          <OnboardingChecker />
        </main>
      );
    }
  }

  // Otherwise, show improved landing page
  return (
    <main className="min-h-screen font-sans antialiased">
      {/* Hero Section */}
      <section
        id="hero-landing"
        className="relative pt-32 pb-12 flex flex-col items-start justify-center h-[66vh]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1980&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10 max-w-4xl px-8 sm:px-12 lg:px-16 w-full flex flex-col items-start">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-snug tracking-tight text-white text-left">
            We&apos;re excited to
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white">
              share our pre-launch with you
            </span>
          </h1>
          <p className="max-w-3xl text-base sm:text-lg text-white/90 leading-relaxed font-normal tracking-wide text-left mb-6">
            Livaro helps landlords quickly find the best tenants through smart referrals and high-quality applications.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex px-10 py-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-lg text-xl font-bold transform hover:scale-105"
          >
            Sign up 🥳
          </Link>
        </div>
      </section>

      {/* Pre-launch Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Left side - Calendar (takes up 3 columns, positioned more to the left) */}
            <div className="lg:col-span-3 flex justify-start">
              <LaunchCalendar />
            </div>

            {/* Right side - Content, right-aligned (takes up 2 columns) */}
            <div className="lg:col-span-2 text-right space-y-8 flex flex-col items-end">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug tracking-tight">
                Launching July 16th
              </h2>
              <p className="text-lg sm:text-xl text-blue-700 font-semibold leading-relaxed">
                Upload properties at <span className="underline decoration-4 decoration-blue-500">no cost</span> during pre-launch
              </p>
              <p className="text-base text-gray-600 leading-relaxed font-light max-w-xl">
                Be among the first to experience our platform with enhanced features for both landlords and tenants.
              </p>

              <div className="space-y-8 pt-8 w-full max-w-xl">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight text-center mb-4">What&apos;s Coming</h3>
                <div className="space-y-8">
                  <div className="flex items-center space-x-6 justify-start">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Interactive Map Search</h4>
                      <p className="text-base text-gray-600 leading-relaxed font-light">Browse properties with detailed listings and neighborhood insights.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 justify-start">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Smart Tenant Matching</h4>
                      <p className="text-base text-gray-600 leading-relaxed font-light">Connect with verified tenants through intelligent referrals.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 justify-start">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Property Analytics</h4>
                      <p className="text-base text-gray-600 leading-relaxed font-light">Access comprehensive data and market insights.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-8 w-full max-w-xl">
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-snug tracking-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Success</span>
            </h2>
            <p className="text-base text-gray-600 max-w-3xl leading-relaxed mx-auto text-center">
              Whether you&apos;re a property owner or student renter, Livaro streamlines the rental process for everyone.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="group">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full border border-blue-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-gray-900">Property Owners</h3>
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                    Reduce vacancy time and find quality tenants with our comprehensive screening and management tools.
                  </p>
                  <Link href="/owners" className="text-blue-600 underline mt-2 block">Learn more →</Link>

                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Faster tenant placement</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Verified tenant profiles</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Automated management</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full border border-green-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Student Renters</h3>
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                    Stand out from other applicants and get priority access to the best rental properties.
                  </p>
                  <Link href="/student" className="text-blue-600 underline mt-2 block">Learn more →</Link>

                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority application status</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Early access to listings</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Streamlined applications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-snug tracking-tight">
                Get in Touch
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed font-light">
                Have questions about Livaro? We&apos;d love to hear from you and help you get started.
              </p>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}  