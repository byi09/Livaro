"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Minimal loading indicator for very slow pages only
export default function GlobalLoaderOverlay() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;
    
    // on pathname change → start delayed loader
    setShow(false);
    
    const timeout = setTimeout(() => {
      setShow(true);
      // Auto-hide after 800ms to prevent stuck loaders
      hideTimeout = setTimeout(() => {
        setShow(false);
      }, 800);
    }, 800); // Show after 800ms - only for very slow pages

    return () => {
      if (timeout) clearTimeout(timeout);
      if (hideTimeout) clearTimeout(hideTimeout);
      setShow(false);
    };
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl px-4 py-2 shadow-md">
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
        <span className="text-gray-700 text-xs font-medium">Loading</span>
      </div>
    </div>
  );
}
