'use client';

import React, { useState } from 'react';
import FloatingMessagingIcon from './FloatingMessagingIcon';
import MessagingModal from './MessagingModal';

export default function MessagingHandler() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleOpenMessaging = () => {
    setIsModalOpen(true);
  };

  const handleCloseMessaging = () => {
    setIsModalOpen(false);
  };

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  return (
    <>
      <FloatingMessagingIcon 
        onOpenMessaging={handleOpenMessaging}
        unreadCount={unreadCount}
      />
      
      <MessagingModal
        isOpen={isModalOpen}
        onClose={handleCloseMessaging}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
} 