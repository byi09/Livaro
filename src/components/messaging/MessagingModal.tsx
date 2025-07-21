'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { pusherClient } from '@/src/lib/pusher';
import { Search, Filter, Plus, MessageSquare, Archive, Users, Building, X, Minimize2, Maximize2 } from 'lucide-react';

// Import our existing messaging components
import ConversationList from '@/src/components/messaging/ConversationList';
import ConversationView from '@/src/components/messaging/ConversationView';
import CreateConversationModal from '@/src/components/messaging/CreateConversationModal';
import Spinner from '@/src/components/ui/Spinner';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'landlord' | 'renter' | 'agent';
  businessName?: string;
}

interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isEdited?: boolean;
  replyToId?: string;
  tags?: string[];
}

interface Conversation {
  id: string;
  conversationType: 'direct' | 'group' | 'support';
  title?: string;
  category?: string;
  property?: Property;
  participants: Array<{
    user: User;
    role: 'landlord' | 'renter' | 'agent';
    businessName?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  isArchived?: boolean;
  needsResponse?: boolean;
  priority?: number;
}

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function MessagingModal({ isOpen, onClose, onUnreadCountChange }: MessagingModalProps) {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const params = new URLSearchParams({
        sortBy,
        archived: showArchived.toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });

      const response = await fetch(`/api/messaging/conversation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // Calculate total unread count
        const totalUnread = data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
        onUnreadCountChange?.(totalUnread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedCategory, sortBy, showArchived, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [loadConversations, isOpen]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/messaging/message?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse()); // Reverse to show oldest first
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    console.log('Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    loadMessages(conversationId);
  };

  // Send message
  const handleSendMessage = async (content: string, tags?: string[]): Promise<boolean> => {
    console.log('Attempting to send message:', { content, selectedConversationId, currentUser: currentUser?.id });
    
    if (!selectedConversationId || !currentUser) {
      console.error('Cannot send message - missing selectedConversationId or currentUser');
      return false;
    }

    // Generate a unique clientId for this specific message
    const clientId = `${currentUser.id}-${Date.now()}`;

    try {
      const body: any = {
        conversationId: selectedConversationId,
        content,
        clientId
      };
      if (tags && tags.length > 0) {
        body.tags = tags;
      }
      const response = await fetch('/api/messaging/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log('Message sent successfully');
        // Message will be added via Pusher real-time event
        loadConversations(); // Refresh conversation list to update last message
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to send message:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Create new conversation
  const handleCreateConversation = async (data: {
    participantIds: string[];
    propertyId?: string;
    conversationType: 'direct' | 'group';
    title?: string;
  }) => {
    try {
      console.log('Creating conversation with data:', data);
      const response = await fetch('/api/messaging/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_type: data.conversationType,
          participant_ids: data.participantIds,
          property_id: data.propertyId,
          title: data.title,
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Conversation created:', result);
        
        // Reload conversations and wait for them to load
        await loadConversations();
        
        // Set the selected conversation after a short delay to ensure conversations are loaded
        setTimeout(() => {
          setSelectedConversationId(result.conversation.id);
          console.log('Selected conversation set to:', result.conversation.id);
        }, 500);
        
        setIsCreateModalOpen(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to create conversation:', errorData);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Search users for new conversation
  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
    return [];
  };

  // Search properties for new conversation
  const searchProperties = async (query: string): Promise<Property[]> => {
    try {
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error searching properties:', error);
    }
    return [];
  };

  // Real-time Pusher setup
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    // Subscribe to user channel for conversation updates
    const userChannel = pusherClient.subscribe(`private-user-${currentUser.id}`);
    
    userChannel.bind('conversation-update', (data: any) => {
      loadConversations(); // Refresh conversation list
    });

    userChannel.bind('message-deleted', (data: any) => {
      console.log('📡 Frontend: Received message-deleted event:', data);
      if (data.conversationId === selectedConversationId) {
        console.log('✅ Frontend: Removing message from UI:', data.messageId);
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      } else {
        console.log('⚠️ Frontend: Message deleted in different conversation:', data.conversationId, 'vs', selectedConversationId);
      }
    });

    // Clean up user channel subscription when component unmounts or user changes
    return () => {
      pusherClient.unsubscribe(`private-user-${currentUser.id}`);
    };
  }, [currentUser, loadConversations, isOpen, selectedConversationId]);

  // Separate effect for conversation channel to avoid unnecessary resubscriptions
  useEffect(() => {
    if (!currentUser || !selectedConversationId || !isOpen) return;

    console.log(`Subscribing to conversation channel: private-conversation-${selectedConversationId}`);
    
    // Subscribe to conversation channel
    const conversationChannel = pusherClient.subscribe(`private-conversation-${selectedConversationId}`);
    
    conversationChannel.bind('new-message', (data: any) => {
      console.log('Received new message via Pusher:', data);
      
      // Add the new message to the messages state
      setMessages(prev => {
        // Check if we already have this message (avoid duplicates)
        const messageExists = prev.some(msg => msg.id === data.id);
        if (messageExists) {
          return prev;
        }
        return [...prev, data];
      });
    });

    // Clean up conversation channel subscription when component unmounts or conversation changes
    return () => {
      console.log(`Unsubscribing from conversation channel: private-conversation-${selectedConversationId}`);
      pusherClient.unsubscribe(`private-conversation-${selectedConversationId}`);
    };
  }, [currentUser, selectedConversationId, isOpen]);

  // Get selected conversation object
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const title = conversation.title?.toLowerCase() || '';
    const lastMessage = conversation.lastMessage?.content?.toLowerCase() || '';
    const participantName = conversation.participants
      ?.find(p => p.user.id !== currentUser?.id)
      ?.user?.firstName?.toLowerCase() || '';
    
    return title.includes(query) || lastMessage.includes(query) || participantName.includes(query);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-lg shadow-2xl transition-all duration-300 ${
          isMinimized 
            ? 'w-80 h-14' 
            : 'w-full max-w-5xl h-full max-h-[80vh]'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 flex overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size={40} />
              </div>
            ) : (
              <>
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
                  {/* Sidebar Controls */}
                  <div className="p-4 space-y-4">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full btn-gradient flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Conversation
                    </button>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="landlord_inquiry">Landlord Inquiries</option>
                        <option value="tenant_inquiry">Tenant Inquiries</option>
                        <option value="general">General</option>
                      </select>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="unresponded">Needs Response</option>
                      </select>
                    </div>
                  </div>

                  {/* Conversation List */}
                  <div className="flex-1 overflow-hidden">
                    <ConversationList
                      conversations={filteredConversations}
                      selectedConversationId={selectedConversationId || undefined}
                      currentUserId={currentUser?.id || ''}
                      onSelectConversation={handleSelectConversation}
                      onCreateConversation={() => setIsCreateModalOpen(true)}
                      searchQuery={searchQuery}
                    />
                  </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <ConversationView
                      conversation={selectedConversation}
                      messages={messages}
                      currentUserId={currentUser?.id || ''}
                      onSendMessage={handleSendMessage}
                      isLoading={messagesLoading}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                        <p className="text-gray-500 mb-4">Choose a conversation from the sidebar or start a new one</p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="btn-gradient flex items-center mx-auto"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          New Conversation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Create Conversation Modal */}
        <CreateConversationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateConversation={handleCreateConversation}
          onSearchUsers={searchUsers}
          onSearchProperties={searchProperties}
          currentUserId={currentUser?.id || ''}
        />
      </div>
    </div>
  );
} 