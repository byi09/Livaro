'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Home, MapPin, DollarSign, Bed, Bath, Car, Zap, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from '@/components/ui/card';
import type { ChatMessage, ChatConversation, PropertyListing, FilterOptions } from '@/lib/types';

interface PropertyAssistantChatProps {
  onPropertySelect?: (property: PropertyListing) => void;
  onFiltersChange?: (filters: FilterOptions) => void;
  className?: string;
}

export default function PropertyAssistantChat({
  onPropertySelect,
  onFiltersChange,
  className = ''
}: PropertyAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your property assistant. I can help you find rental properties based on your needs. What kind of place are you looking for?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation>({
    id: 'default',
    userId: 'user',
    messages: [],
    context: {},
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/property-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages,
          context: conversation.context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        properties: data.properties,
        filterOptions: data.filterOptions,
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation context
      setConversation(prev => ({
        ...prev,
        context: {
          ...prev.context,
          recentFilters: data.filterOptions,
          viewedProperties: data.properties?.map((p: PropertyListing) => p.properties.id) || [],
        },
        updatedAt: new Date(),
      }));

      // Notify parent components of changes
      if (data.filterOptions && onFiltersChange) {
        onFiltersChange(data.filterOptions);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatAddress = (property: PropertyListing) => {
    return `${property.properties.addressLine1}, ${property.properties.city}, ${property.properties.state}`;
  };

  const PropertyCard = ({ property }: { property: PropertyListing }) => {
    const listing = property.property_listings;
    const features = property.features_subquery?.features || [];
    
    return (
      <Card className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPropertySelect?.(property)}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                {listing?.listingTitle || `${property.properties.propertyType} for Rent`}
              </h4>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {formatAddress(property)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                {formatPrice(Number(listing?.monthlyRent || 0))}/mo
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.properties.bedrooms} bed
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.properties.bathrooms} bath
            </div>
            {property.properties.squareFootage && (
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-1" />
                {property.properties.squareFootage} sqft
              </div>
            )}
          </div>

          {features && Array.isArray(features) && features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {features.slice(0, 3).map((feature: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
                  {feature}
                </span>
              ))}
              {features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
                  +{features.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-4xl`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500 ml-2' : 'bg-gray-100 mr-2'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-gray-600" />
            )}
          </div>
          
          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            
            {message.properties && message.properties.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600 font-medium">Found {message.properties.length} properties:</p>
                {message.properties.map((property) => (
                  <PropertyCard key={property.properties.id} property={property} />
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Property Assistant</h3>
            <p className="text-xs text-gray-600">AI-powered property search</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about properties, filters, or features..."
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 