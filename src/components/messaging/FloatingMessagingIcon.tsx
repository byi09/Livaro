'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

interface FloatingMessagingIconProps {
  onOpenMessaging: () => void;
  unreadCount?: number;
}

export default function FloatingMessagingIcon({ onOpenMessaging, unreadCount = 0 }: FloatingMessagingIconProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsVisible(!!user); // Only show if user is authenticated
    };
    
    checkAuth();
  }, []);

  // Hide the floating icon on the messages page and test-messaging page
  if (!isVisible || !currentUser || pathname === '/messages' || pathname === '/test-messaging') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Message Icon */}
      <button
        onClick={onOpenMessaging}
        className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        title="Open Messages"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Pulse animation for new messages */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></span>
        )}
      </button>
    </div>
  );
} 