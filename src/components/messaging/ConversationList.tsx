import React from 'react';
import { Tag } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  tags?: string[];
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Property {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
}

interface Conversation {
  id: string;
  conversationType: 'direct' | 'group' | 'support';
  title?: string;
  property?: Property;
  participants: Array<{
    user: User;
    role: 'landlord' | 'renter' | 'agent';
    businessName?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  needsResponse?: boolean;
  priority?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  searchQuery: string;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
  onCreateConversation,
  searchQuery
}: ConversationListProps) {
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    return otherParticipant 
      ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
      : 'Unknown';
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    const role = otherParticipant?.role;
    const businessName = otherParticipant?.businessName;
    
    let subtitle = '';
    switch (role) {
      case 'landlord':
        subtitle = businessName || 'Landlord';
        break;
      case 'agent':
        subtitle = 'Leasing Agent';
        break;
      case 'renter':
        subtitle = 'Renter';
        break;
      default:
        subtitle = 'User';
    }

    if (conversation.property) {
      subtitle += ` • ${conversation.property.addressLine1}`;
    }

    return subtitle;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (content: string, maxLength: number = 60) => {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    const title = getConversationTitle(conversation).toLowerCase();
    const subtitle = getConversationSubtitle(conversation).toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return title.includes(query) || subtitle.includes(query) || 
           (conversation.lastMessage?.content.toLowerCase().includes(query));
  });

  // Get conversation tags (from the last message)
  const getConversationTags = (conversation: Conversation) => {
    return conversation.lastMessage?.tags || [];
  };

  // Get status indicator
  const getStatusIndicator = (conversation: Conversation) => {
    if (conversation.needsResponse) {
      return { color: 'bg-amber-500', label: 'Needs Response' };
    }
    if (conversation.priority && conversation.priority > 8) {
      return { color: 'bg-red-500', label: 'High Priority' };
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredConversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No conversations found</p>
          <button
            onClick={onCreateConversation}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Start a new conversation
          </button>
        </div>
      ) : (
        filteredConversations.map((conversation) => {
          const title = getConversationTitle(conversation);
          const subtitle = getConversationSubtitle(conversation);
          const isSelected = conversation.id === selectedConversationId;
          const statusIndicator = getStatusIndicator(conversation);
          const tags = getConversationTags(conversation);
          
          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {getInitials(title)}
                  </div>
                  {statusIndicator && (
                    <div className={`absolute -top-1 -right-1 w-4 h-4 ${statusIndicator.color} rounded-full border-2 border-white`} title={statusIndicator.label}></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{title}</h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-blue-600 truncate mt-0.5">{subtitle}</p>
                  
                  {conversation.lastMessage && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {truncateMessage(conversation.lastMessage.content)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                          {conversation.unreadCount} new
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Tags - temporarily disabled until DB migration is applied */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          <Tag className="w-2 h-2 mr-1" />
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                      {tags.length > 2 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{tags.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}