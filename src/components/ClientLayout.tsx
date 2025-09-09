"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import Header from "./ui/Header";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";


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
        // If you store username in user_metadata, append it; otherwise just use Supabase user object.
        const username = (user.user_metadata && user.user_metadata.username) || undefined;
        setUser({ ...user, username });
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
        const username = (session.user.user_metadata && session.user.user_metadata.username) || undefined;
        setUser({ ...session.user, username });
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
  
  // Don't add top padding for map, messages, sell, and student dashboard pages since they have their own layouts
  const isMapPage = pathname?.includes("/map");
  const isMessagesPage = pathname?.includes("/messages");
  const isSellPage = pathname?.includes("/sell");
  const isStudentDashboardPage = pathname?.includes("/student-dashboard");

  // No longer show spinner here - GlobalLoaderOverlay handles all loading states
  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showHeader && <Header user={user} />}

      {/*
        Only offset content when the header is the solid authenticated version (i.e., a user is logged in).
        For guests we want the hero/landing sections to sit beneath the transparent header.
      */}
      <main className={`${user && !isMapPage && !isMessagesPage && !isSellPage && !isStudentDashboardPage ? 'pt-16' : ''} flex-1`}>{children}</main>

      {/* Footer removed as per design update */}
    </div>
  );
}
