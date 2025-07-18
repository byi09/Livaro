'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { pusherClient } from '@/src/lib/pusher';
import { Search, Filter, Plus, MessageSquare, Archive, Users, Building, Tag, X } from 'lucide-react';

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

export default function MessagesPage() {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Enhanced UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  
  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Load conversations with enhanced filtering
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const params = new URLSearchParams({
        sortBy,
        archived: showArchived.toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') })
      });

      const response = await fetch(`/api/messaging/conversation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedCategory, sortBy, showArchived, selectedTags]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
    setSelectedConversationId(conversationId);
    loadMessages(conversationId);
  };

  // Send message
  const handleSendMessage = async (content: string, tags?: string[]): Promise<boolean> => {
    if (!selectedConversationId || !currentUser) return false;

    try {
      const response = await fetch('/api/messaging/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content,
          clientId: `${currentUser.id}-${Date.now()}` // For deduplication
        })
      });

      if (response.ok) {
        // Message will be added via Pusher real-time event
        loadConversations(); // Refresh conversation list to update last message
        return true;
      }
      return false;
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
        loadConversations();
        setSelectedConversationId(result.conversation.id);
        setIsCreateModalOpen(false);
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
    if (!currentUser) return;

    // Subscribe to user channel for conversation updates
    const userChannel = pusherClient.subscribe(`private-user-${currentUser.id}`);
    
    userChannel.bind('conversation-update', (data: any) => {
      loadConversations(); // Refresh conversation list
    });

    userChannel.bind('message-deleted', (data: any) => {
      if (data.conversationId === selectedConversationId) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    });

    // Clean up user channel subscription when component unmounts or user changes
    return () => {
      pusherClient.unsubscribe(`private-user-${currentUser.id}`);
    };
  }, [currentUser, loadConversations, selectedConversationId]);

  // Separate effect for conversation channel to avoid unnecessary resubscriptions
  useEffect(() => {
    if (!currentUser || !selectedConversationId) return;

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
  }, [currentUser, selectedConversationId]);

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  // Available message tags for filtering
  const AVAILABLE_TAGS = [
    { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
    { id: 'follow_up_needed', label: 'Follow-up Needed', color: 'bg-amber-100 text-amber-700' },
    { id: 'documents_required', label: 'Documents Required', color: 'bg-blue-100 text-blue-700' },
    { id: 'payment_related', label: 'Payment Related', color: 'bg-green-100 text-green-700' },
    { id: 'viewing_scheduled', label: 'Viewing Scheduled', color: 'bg-purple-100 text-purple-700' },
    { id: 'application_status', label: 'Application Status', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'maintenance_request', label: 'Maintenance Request', color: 'bg-pink-100 text-pink-700' }
  ];

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Messages
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="New conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="flex items-center justify-between w-full px-3 py-2 mb-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <span className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters & Sorting
            </span>
            <span className={`transform transition-transform ${filterPanelOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Enhanced Filters Panel */}
          <div className={`space-y-3 overflow-hidden transition-all duration-300 ${filterPanelOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            {/* Categories */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="landlord_inquiry">Landlord Inquiries</option>
                <option value="tenant_inquiry">Tenant Inquiries</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="unresponded">Needs Response</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="activity">Recent Activity</option>
              </select>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Tags</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2 py-1 text-xs rounded-full flex items-center transition-colors ${selectedTags.includes(tag.id) ? tag.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Archived Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-archived"
                checked={showArchived}
                onChange={() => setShowArchived(!showArchived)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-archived" className="ml-2 text-sm text-gray-700">
                Show Archived
              </label>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={loadConversations}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>

          {/* Active Filters Display */}
          {(selectedTags.length > 0 || selectedCategory !== 'all' || showArchived) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTags.map(tagId => {
                const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                return (
                  <span key={tagId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {tag?.label}
                    <button
                      onClick={() => toggleTag(tagId)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Category: {selectedCategory.replace('_', ' ')}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {showArchived && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Archived
                  <button
                    onClick={() => setShowArchived(false)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedCategory('all');
                  setShowArchived(false);
                  setSortBy('newest');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId || undefined}
          currentUserId={currentUser?.id || ''}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={() => setIsCreateModalOpen(true)}
          searchQuery={searchQuery}
        />
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

      {/* Sidebar Toggle (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white border border-gray-200 rounded-lg shadow-md"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

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
  );
}