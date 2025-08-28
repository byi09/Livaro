'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/messages',
  '/sell',
  '/settings',
  '/student-dashboard'
];

// Routes that should redirect unauthenticated users to sign-in
const isProtectedRoute = (path: string) => {
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only handle protected routes
    if (!isProtectedRoute(pathname)) return;

    const supabase = createClient();

    // Check if user can access this protected route
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/sign-in?returnTo=${encodeURIComponent(pathname)}`);
      }
    };

    checkAccess();

    // Listen for auth changes only for protected routes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/home');
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');
        if (returnTo) {
          router.push(returnTo);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return <>{children}</>;
}