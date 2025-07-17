import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Paperclip, Smile, Tag, Plus, X } from 'lucide-react';
import Spinner from '../ui/Spinner';

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

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
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
}

interface ConversationViewProps {
  conversation?: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export default function ConversationView({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false
}: ConversationViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const [messageTags, setMessageTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [openMessageOptions, setOpenMessageOptions] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMessageOptions) {
        setOpenMessageOptions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMessageOptions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Predefined message tags
  const PREDEFINED_TAGS = [
    'urgent',
    'follow_up_needed', 
    'documents_required',
    'payment_related',
    'viewing_scheduled',
    'application_status',
    'maintenance_request'
  ];

  const handleSend = () => {
    if (messageInput.trim()) {
      // For now, just send the message without tags 
      // (tags would be implemented in the API)
      onSendMessage(messageInput.trim());
      setMessageInput('');
      setMessageTags([]);
      setShowTagInput(false);
    }
  };

  const addTag = (tag: string) => {
    if (!messageTags.includes(tag)) {
      setMessageTags([...messageTags, tag]);
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setMessageTags(messageTags.filter(tag => tag !== tagToRemove));
  };

  const handleCustomTag = () => {
    if (newTag.trim() && !messageTags.includes(newTag.trim())) {
      addTag(newTag.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    console.log('🗑️ Frontend: Attempting to delete message:', messageId);
    setDeletingMessage(messageId);
    
    try {
      const response = await fetch('/api/messaging/message', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });

      console.log('📡 Frontend: Delete response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Frontend: Message deleted successfully:', result);
        // Message will be removed via real-time event
      } else {
        const errorData = await response.json();
        console.error('❌ Frontend: Failed to delete message:', errorData);
        alert(`Failed to delete message: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Frontend: Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeletingMessage(null);
      setOpenMessageOptions(null);
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return '';
    if (conversation.title) return conversation.title;
    
    const otherParticipant = conversation.participants?.find(p => p.user.id !== currentUserId);
    return otherParticipant 
      ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
      : 'Unknown';
  };

  const getConversationSubtitle = () => {
    if (!conversation) return '';
    const otherParticipant = conversation.participants?.find(p => p.user.id !== currentUserId);
    const role = otherParticipant?.role;
    const businessName = otherParticipant?.businessName;
    
    let subtitle = '';
    switch (role) {
      case 'landlord':
        subtitle = businessName || 'Property Manager';
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

    return subtitle;
  };

  const getPropertyAddress = () => {
    if (!conversation?.property) return '';
    
    return conversation.property.addressLine2 
      ? `${conversation.property.addressLine1}, ${conversation.property.addressLine2}`
      : conversation.property.addressLine1;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const title = getConversationTitle();
  const subtitle = getConversationSubtitle();
  const propertyAddress = getPropertyAddress();

  return (
    <div className="flex flex-col flex-1 bg-white relative overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <Spinner size={40} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 z-10">
        <div className="relative flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full mr-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {getInitials(title)}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-blue-600">{subtitle}</p>
          {propertyAddress && (
            <p className="text-sm text-gray-500">{propertyAddress}</p>
          )}
        </div>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg ml-auto">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="text-center py-4">
            <Spinner size={24} />
          </div>
        )}
        
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const sender = conversation?.participants?.find(p => p.user.id === message.senderId);

          const prevMessage = messages[index - 1];
          const nextMessage = messages[index + 1];

          // Check for exact timestamp matches or close time grouping
          const hasSameTimestamp = prevMessage && prevMessage.createdAt === message.createdAt;
          const isTimeGrouped = 
            prevMessage &&
            prevMessage.senderId === message.senderId &&
            new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000;
          
          const isGrouped = hasSameTimestamp || isTimeGrouped;
          
          const showTimestamp = 
            !nextMessage || 
            nextMessage.senderId !== message.senderId ||
            (nextMessage.createdAt !== message.createdAt && new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 5 * 60 * 1000);

          return (
            <div
              key={message.id}
              className={`flex items-end ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                isGrouped ? (hasSameTimestamp ? 'mt-0.5' : 'mt-2') : 'mt-4'
              }`}
            >
              {!isOwnMessage && (
                <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0">
                  {!isGrouped && sender && (
                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                       {sender ? getInitials(`${sender.user.firstName} ${sender.user.lastName}`) : '?'}
                    </div>
                  )}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-1' : 'order-2'} relative group`}>
                {!isOwnMessage && !isGrouped && (
                  <span className="text-xs text-gray-500 mb-1 ml-2">
                    {sender ? `${sender.user.firstName} ${sender.user.lastName}` : 'Unknown'}
                  </span>
                )}
                
                <div
                  className={`px-4 py-2 rounded-2xl relative ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-lg'
                      : 'bg-gray-100 text-gray-900 rounded-bl-lg'
                  } ${isGrouped ? (isOwnMessage ? 'rounded-tr-lg' : 'rounded-tl-lg') : ''}`}
                >
                  {/* Options menu for own messages */}
                  {isOwnMessage && (
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={() => setOpenMessageOptions(openMessageOptions === message.id ? null : message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-700 rounded"
                        disabled={deletingMessage === message.id}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                      
                      {openMessageOptions === message.id && (
                        <div className="absolute top-6 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-24">
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deletingMessage === message.id}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center"
                          >
                            {deletingMessage === message.id ? (
                              <>
                                <Spinner size={12} />
                                <span className="ml-2">Deleting...</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3 mr-2" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Message Tags */}
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isOwnMessage
                              ? 'bg-blue-700 text-blue-100'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {message.isEdited && (
                    <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} italic`}>
                      (edited)
                    </span>
                  )}
                </div>
                
                {showTimestamp && (
                  <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {/* Message Tags */}
        {messageTags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {messageTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.replace('_', ' ')}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tag Input Dropdown */}
        {showTagInput && (
          <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Add tags to categorize this message:
              </label>
            </div>
            
            {/* Predefined Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PREDEFINED_TAGS.filter(tag => !messageTags.includes(tag)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {tag.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomTag()}
                placeholder="Custom tag..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleCustomTag}
                disabled={!newTag.trim()}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Add
              </button>
              <button
                onClick={() => setShowTagInput(false)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <button 
            onClick={() => setShowTagInput(!showTagInput)}
            className={`p-2 hover:bg-gray-50 rounded-lg ${
              showTagInput || messageTags.length > 0 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Tag className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
              rows={1}
              style={{
                minHeight: '44px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!messageInput.trim()}
            className="btn-gradient flex items-center justify-center rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 