"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { HiUser, HiChevronDown, HiCog } from "react-icons/hi";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import Spinner from "@/src/components/ui/Spinner";
import { createRoot } from "react-dom/client";
import Dropdown, { DropdownItem } from "@/src/components/ui/Dropdown";

interface UserWithUsername extends User {
    username?: string;
}

interface HeaderProps {
    toggleSidebar?: () => void;
    user?: UserWithUsername | null;
}

const NotificationBell = dynamic(
    () => import("@/src/components/ui/NotificationBell"),
    { ssr: false }
);

const Header = ({ toggleSidebar, user }: HeaderProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [bgOpacity, setBgOpacity] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            // Toggle simple boolean for other styling pieces
            setScrolled(y > 50);

            // Gradually increase the background opacity up to ~0.9 as we scroll down 0-300px
            const opacity = Math.min(y / 300, 0.9);
            setBgOpacity(opacity);
        };

        window.addEventListener("scroll", handleScroll);

        // Run once on mount to set initial opacity correctly (important on page refresh deep down)
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSignOut = async () => {
        try {
            // Immediately show full-page loading overlay
            const container = document.createElement("div");
            container.id = "signout-overlay";
            document.body.appendChild(container);
            const root = createRoot(container);
            root.render(
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
                    <Spinner size={32} label="Signing out…" />
                </div>
            );

            // Set signing out state to prevent header re-renders
            setIsSigningOut(true);
            setIsDropdownOpen(false);

            // Call our logout API to clear cookies first
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (response.ok) {
                // Then call client-side signOut
                const supabase = createClient();
                const { error } = await supabase.auth.signOut();

                if (error) {
                    console.error("Supabase signout error:", error);
                    // Fallback: try client signout anyway
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                } else {
                    // Successful signout
                    window.location.href = "/";
                }
            } else {
                console.error("Logout API failed");
                // Fallback: try client signout anyway
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback: force reload to home page
            window.location.href = "/";
        }
    };

    // If signing out, don't render anything (overlay handles the UI)
    if (isSigningOut) {
        return null;
    }

    // Get display name - prioritize username from user, then fallback to user metadata
    const getDisplayName = () => {
        if (user?.username) {
            return user.username;
        }
        return (
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "User"
        );
    };

    // Different header styles based on user authentication
    if (!user) {
        // Header for non-logged in users (translucent, transforms to dark on scroll)
        return (
            <header
                className={`fixed top-0 z-50 w-full transition-all duration-300 text-white ${
                    scrolled
                        ? "backdrop-blur-md shadow-lg border-b border-gray-800"
                        : ""
                }`}
                style={{ backgroundColor: `rgba(17, 24, 39, ${bgOpacity})` }}
            >
                <div className="relative w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center group">
                                <img
                                    src="/logo.png"
                                    alt="Livaro Logo"
                                    className="w-9 h-9 object-contain transition-transform duration-200 group-hover:scale-110"
                                />
                                <span className="hidden sm:inline text-xl font-bold ml-2">
                                    Livaro
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <Link
                                href="/sign-in"
                                className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium border
                  ${
                      scrolled
                          ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  }
                `}
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    // Header for logged in users – always white
    return (
        <header className="fixed top-0 z-50 w-full bg-white text-gray-900 shadow-sm border-b border-gray-200">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/logo.png"
                                alt="Livaro Logo"
                                className="w-9 h-9 mr-3 object-contain transition-transform duration-200 group-hover:scale-110"
                            />
                            <span className="text-2xl font-bold">Livaro</span>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-10">
                        <Link
                            href="/map"
                            className="font-medium transition-colors text-base text-gray-700 hover:text-gray-900"
                        >
                            Rent
                        </Link>

                        {/* Property Management Dropdown */}
                        <Dropdown
                            trigger="Upload Property"
                            triggerClassName="font-medium transition-colors text-base text-gray-700 hover:text-gray-900 border-none bg-transparent shadow-none hover:bg-gray-50 px-3 py-1"
                        >
                            <DropdownItem>
                                <Link href="/sell/create" className="w-full block">
                                    Add a New Property
                                </Link>
                            </DropdownItem>
                            <DropdownItem>
                                <Link href="/sell/dashboard" className="w-full block">
                                    View Properties
                                </Link>
                            </DropdownItem>
                        </Dropdown>
                    </nav>

                    {/* Right side actions */}
                    <div className="flex items-center space-x-5">
                        {/* Saved properties */}

                        {/* Notifications */}
                        <NotificationBell />

                        {/* User profile dropdown */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setIsDropdownOpen(!isDropdownOpen)
                                }
                                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors focus:outline-none"
                            >
                                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                                    <HiUser className="w-5 h-5 text-white" />
                                </div>
                                <span className="hidden sm:inline font-medium text-gray-900 text-base">
                                    {getDisplayName()}
                                </span>
                                <HiChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                        isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />

                                    {/* Dropdown Content */}
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                        {/* Messages */}

                                        {/* Settings */}
                                        <Link
                                            href="/settings"
                                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() =>
                                                setIsDropdownOpen(false)
                                            }
                                        >
                                            <HiCog className="w-5 h-5 mr-3 text-gray-500" />
                                            <span className="font-medium">
                                                Settings
                                            </span>
                                        </Link>

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 my-2" />

                                        {/* Sign Out */}
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <HiArrowRightOnRectangle className="w-5 h-5 mr-3" />
                                            <span className="font-medium">
                                                Sign Out
                                            </span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        {toggleSidebar && (
                            <button
                                className="md:hidden text-gray-700 p-1 focus:outline-none"
                                onClick={toggleSidebar}
                                aria-label="Toggle menu"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
