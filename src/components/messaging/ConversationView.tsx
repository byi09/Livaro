import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Paperclip, Smile, Tag, Plus, X, MessageSquare, Info, CheckCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { pusherClient } from '@/src/lib/pusher';

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
  onSendMessage: (content: string, tags?: string[]) => Promise<boolean>;
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
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messagesState, setMessagesState] = useState(messages);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Keep messagesState in sync with messages prop
  useEffect(() => {
    setMessagesState(messages);
  }, [messages]);

  // Subscribe to message-deleted Pusher event
  useEffect(() => {
    if (!conversation || !conversation.id) return;
    const channel = pusherClient.subscribe(`private-conversation-${conversation.id}`);
    const handleMessageDeleted = (data: any) => {
      setMessagesState(prev => prev.filter(msg => msg.id !== data.messageId));
    };
    channel.bind('message-deleted', handleMessageDeleted);
    return () => {
      channel.unbind('message-deleted', handleMessageDeleted);
      pusherClient.unsubscribe(`private-conversation-${conversation.id}`);
    };
  }, [conversation?.id]);

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
    { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
    { id: 'follow_up_needed', label: 'Follow-up Needed', color: 'bg-amber-100 text-amber-700' },
    { id: 'documents_required', label: 'Documents Required', color: 'bg-blue-100 text-blue-700' },
    { id: 'payment_related', label: 'Payment Related', color: 'bg-green-100 text-green-700' },
    { id: 'viewing_scheduled', label: 'Viewing Scheduled', color: 'bg-purple-100 text-purple-700' },
    { id: 'application_status', label: 'Application Status', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'maintenance_request', label: 'Maintenance Request', color: 'bg-pink-100 text-pink-700' }
  ];

  // Filter messages by tag
  const filteredMessages = activeTagFilter
    ? messagesState.filter(message => message.tags?.includes(activeTagFilter))
    : messagesState;

  const handleSend = () => {
    if (messageInput.trim()) {
      // Set sending state
      setSendingMessage(true);
      setMessageSent(false);
      
      // Include tags with the message
      onSendMessage(messageInput.trim(), messageTags)
        .then((success: boolean) => {
          setSendingMessage(false);
          if (success) {
            setMessageSent(true);
            
            // Hide success after 3 seconds
            setTimeout(() => {
              setMessageSent(false);
            }, 3000);
          }
        })
        .catch(() => {
          setSendingMessage(false);
        });
      
      // Clear input and tags after sending
      setMessageInput('');
      setMessageTags([]);
      setShowTagInput(false);
      
      // Focus the input field for the next message
      inputRef.current?.focus();
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
      <div className="flex items-center p-4 border-b border-gray-100 bg-white z-10 shadow-sm">
        <div className="relative flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3 shadow">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-base">
            {getInitials(title)}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
          <p className="text-xs text-blue-600 font-medium">{subtitle}</p>
          {propertyAddress && (
            <p className="text-xs text-gray-400">{propertyAddress}</p>
          )}
        </div>
        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg ml-auto transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Tag Filter Bar */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center overflow-x-auto gap-2">
        <span className="text-xs font-semibold text-gray-500 mr-2">Filter by tag:</span>
        <button
          onClick={() => setActiveTagFilter(null)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors border border-blue-200 shadow-sm ${!activeTagFilter ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
        >
          All
        </button>
        {PREDEFINED_TAGS.map(tag => (
          <button
            key={tag.id}
            onClick={() => setActiveTagFilter(activeTagFilter === tag.id ? null : tag.id)}
            className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors shadow-sm ${activeTagFilter === tag.id ? tag.color + ' border-blue-400' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white via-gray-50 to-white">
        {isLoading && (
          <div className="text-center py-4">
            <Spinner size={24} />
          </div>
        )}
        
        {filteredMessages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-300 mb-2">
              <MessageSquare className="w-12 h-12 mx-auto" />
            </div>
            {activeTagFilter ? (
              <p className="text-gray-400">No messages with this tag</p>
            ) : (
              <p className="text-gray-400">No messages yet. Start the conversation!</p>
            )}
          </div>
        )}
        
        {filteredMessages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const sender = conversation?.participants?.find(p => p.user.id === message.senderId);
          const prevMessage = messagesState[index - 1];
          const nextMessage = messagesState[index + 1];
          const hasSameTimestamp = prevMessage && prevMessage.createdAt === message.createdAt;
          const isTimeGrouped = prevMessage && prevMessage.senderId === message.senderId && new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000;
          const isGrouped = hasSameTimestamp || isTimeGrouped;
          const showTimestamp = !nextMessage || nextMessage.senderId !== message.senderId || (nextMessage.createdAt !== message.createdAt && new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 5 * 60 * 1000);

          // --- SYSTEM/BOT MESSAGE ---
          if (message.messageType === 'system') {
            return (
              <div key={message.id} className="flex justify-center my-4 relative group">
                <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-xl shadow-sm text-xs italic font-medium max-w-lg mx-auto">
                  <Info className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  <span>{message.content}</span>
                </div>
                {/* Show delete button for own system messages */}
                {isOwnMessage && (
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    disabled={deletingMessage === message.id}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:text-red-700 bg-white rounded-full shadow transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ marginRight: '-2.5rem' }}
                    title="Delete message"
                  >
                    {deletingMessage === message.id ? <Spinner size={12} /> : <X className="w-3 h-3" />}
                  </button>
                )}
              </div>
            );
          }

          // --- USER MESSAGE ---
          return (
            <div
              key={message.id}
              className={`flex items-end ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGrouped ? (hasSameTimestamp ? 'mt-0.5' : 'mt-2') : 'mt-4'}`}
            >
              {!isOwnMessage && (
                <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0 bg-blue-100 flex items-center justify-center shadow">
                  {!isGrouped && sender && (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {sender ? getInitials(`${sender.user.firstName} ${sender.user.lastName}`) : '?'}
                    </div>
                  )}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-1' : 'order-2'} relative group`}>
                {!isOwnMessage && !isGrouped && (
                  <span className="text-xs text-gray-500 mb-1 ml-2 font-medium">
                    {sender ? `${sender.user.firstName} ${sender.user.lastName}` : 'Unknown'}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl relative shadow-md ${isOwnMessage ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-lg' : 'bg-white text-gray-900 rounded-bl-lg border border-gray-100'} ${isGrouped ? (isOwnMessage ? 'rounded-tr-lg' : 'rounded-tl-lg') : ''}`}
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
                  <p className="text-sm whitespace-pre-wrap font-medium tracking-tight">{message.content}</p>
                  {/* Message Tags */}
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isOwnMessage ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-700'}`}
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
                  <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'} font-medium`}>
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
        {messageTags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {messageTags.map((tagId, index) => {
                const tagObj = PREDEFINED_TAGS.find(t => t.id === tagId);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tagObj ? tagObj.label : tagId.replace('_', ' ')}
                    <button
                      onClick={() => removeTag(tagId)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tag Input Dropdown */}
        {showTagInput && (
          <div className="mb-3 p-3 border border-gray-100 rounded-lg bg-gray-50 shadow-sm">
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Add tags to categorize this message:
              </label>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {PREDEFINED_TAGS.filter(tag => !messageTags.includes(tag.id)).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag.id)}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomTag()}
                placeholder="Custom tag..."
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <button
                onClick={handleCustomTag}
                disabled={!newTag.trim()}
                className="px-2 py-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 shadow"
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
            className={`p-2 rounded-lg transition-colors ${showTagInput || messageTags.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            <Tag className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 max-h-32 bg-gray-50 shadow-sm text-sm"
              rows={1}
              style={{ minHeight: '44px', height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sendingMessage}
            className="btn-gradient flex items-center justify-center rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg px-4 py-2 min-w-[40px] relative"
          >
            {sendingMessage ? (
              <Spinner size={20} />
            ) : messageSent ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Message status indicator */}
        {messageSent && (
          <div className="flex items-center justify-center mt-3 text-sm text-green-600 font-medium bg-green-50 py-2 px-3 rounded-lg shadow-sm border border-green-100 w-full max-w-[200px] mx-auto animate-bounce">
            <CheckCircle className="w-4 h-4 mr-2" /> Message sent
          </div>
        )}
      </div>
    </div>
  );
}