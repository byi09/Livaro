"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import Header from "./ui/Header";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import Spinner from "./ui/Spinner";

interface ClientLayoutProps {
  children: React.ReactNode;
}

interface UserWithUsername extends User {
  username?: string;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [user, setUser] = useState<UserWithUsername | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    // Get initial user with username
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch username from profile API
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const profile = await response.json();
            setUser({ ...user, username: profile.username });
          } else {
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching username:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch username for new session
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const profile = await response.json();
            setUser({ ...session.user, username: profile.username });
          } else {
            setUser(session.user);
          }
        } catch (error) {
          console.error('Error fetching username:', error);
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show header on auth pages unless user is authenticated
  const isAuthPage =
    pathname?.includes("/sign-") || pathname?.includes("/auth");
  const showHeader = !isAuthPage || user;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <Spinner size={48} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showHeader && <Header user={user} />}

      {/*
        Apply consistent top padding when header is shown to prevent content overlap.
        For authenticated users: always apply padding (solid white header)
        For guests: no padding needed (transparent header overlays content)
      */}
      <main className={`${showHeader && user ? 'pt-16' : ''} flex-1`}>{children}</main>

      {/* Footer removed as per design update */}
    </div>
  );
}
