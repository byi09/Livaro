"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, PropertyListing } from "./types";
import PropertyCard from "./PropertyCard";

interface ChatboxProps {
  initialMessage: string;
  initialQuery?: string;
  onSubmit: (
    formData: FormData,
    chatHistory?: ChatMessage[],
  ) => Promise<{
    response?: string;
    error?: string;
    propertyListings?: PropertyListing[];
  }>;
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-3">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
    </div>
    <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
  </div>
);

// Message component with animations
const MessageBubble = ({
  message,
  index,
}: {
  message: ChatMessage;
  index: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 20);
    return () => clearTimeout(timer);
  }, [index]);

  const baseClasses = `message-animate ${
    isVisible ? "opacity-100" : "opacity-0"
  }`;

  if (message.type === "user") {
    return (
      <div className={`${baseClasses} flex justify-end mb-2`}>
        <div className="max-w-[80%] lg:max-w-[60%]">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md shadow-sm">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          {message.timestamp && (
            <div className="text-xs text-gray-400 mt-0.5 text-right">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.type === "ai") {
    return (
      <div className={`${baseClasses} flex justify-start mb-2`}>
        <div className="max-w-[80%] lg:max-w-[60%]">
          <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2.5 rounded-2xl rounded-tl-md shadow-sm">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          {message.timestamp && (
            <div className="text-xs text-gray-400 mt-0.5">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
          {message.propertyListings && message.propertyListings.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.propertyListings.map((listing, listingIndex) => (
                <div
                  key={listing.id}
                  className="message-animate"
                  style={{
                    animationDelay: `${(listingIndex + 1) * 50}ms`,
                  }}
                >
                  <PropertyCard listing={listing} index={listingIndex} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.type === "error") {
    return (
      <div className={`${baseClasses} flex justify-start mb-2`}>
        <div className="max-w-[80%] lg:max-w-[60%]">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-2xl rounded-tl-md">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          {message.timestamp && (
            <div className="text-xs text-gray-400 mt-0.5">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} text-center text-gray-500 text-sm mb-2`}>
      {message.text}
    </div>
  );
};

export default function Chatbox({
  initialMessage,
  initialQuery,
  onSubmit,
}: ChatboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: initialMessage, type: "system", timestamp: new Date() },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const initialQueryExecuted = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Smooth auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, scrollToBottom]);

  // Handle initial query from URL parameters
  useEffect(() => {
    if (initialQuery && !hasAutoSearched && !initialQueryExecuted.current) {
      initialQueryExecuted.current = true;
      setHasAutoSearched(true);

      // Add user message immediately
      const userMessage: ChatMessage = {
        text: initialQuery,
        type: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const formData = new FormData();
      formData.append("prompt", initialQuery);

      // Execute the search
      onSubmit(formData, [])
        .then((result) => {
          setIsLoading(false);

          if (result.response) {
            const aiMessage: ChatMessage = {
              text: result.response,
              type: "ai",
              propertyListings: result.propertyListings,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
          } else if (result.error) {
            const errorMessage: ChatMessage = {
              text: result.error,
              type: "error",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        })
        .catch((error) => {
          setIsLoading(false);
          const errorMessage: ChatMessage = {
            text: `Error: ${error}`,
            type: "error",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        });
    }
  }, [initialQuery, hasAutoSearched, onSubmit]);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      const prompt = formData.get("prompt") as string;
      if (!prompt.trim()) return;

      // Add user message immediately (optimistic update)
      const userMessage: ChatMessage = {
        text: prompt.trim(),
        type: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setInputValue(""); // Clear input immediately

      try {
        // Get current chat history (excluding system message)
        const currentHistory = messages.filter((msg) => msg.type !== "system");
        const result = await onSubmit(formData, currentHistory);

        setIsLoading(false);

        if (result.response) {
          const aiMessage: ChatMessage = {
            text: result.response,
            type: "ai",
            propertyListings: result.propertyListings,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else if (result.error) {
          const errorMessage: ChatMessage = {
            text: result.error,
            type: "error",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch (error) {
        setIsLoading(false);
        const errorMessage: ChatMessage = {
          text: `Error: ${error}`,
          type: "error",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      // Focus back to input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [messages, onSubmit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading) {
        e.preventDefault();
        const form = e.currentTarget.closest("form");
        if (form) {
          const formData = new FormData(form);
          handleSubmit(formData);
        }
      }
    },
    [isLoading, handleSubmit],
  );

  // Show initial state
  if (messages.length === 1) {
    return (
      <div className="flex flex-col w-full">
        <div className="text-center">
          <form action={handleSubmit} className="relative">
            <Input
              ref={inputRef}
              name="prompt"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Need help deciding? Try asking..."
              required
              disabled={isLoading}
              className="w-full text-lg py-6 px-8 pr-16 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-all duration-200"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Show chat interface
  return (
    <div className="flex flex-col w-full h-full">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-4 px-2 py-2 space-y-1 max-h-[70vh] scroll-smooth chat-scroll"
      >
        {messages.slice(1).map((message, index) => (
          <MessageBubble key={index} message={message} index={index} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 pt-4">
        <form action={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              name="prompt"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about rentals..."
              required
              disabled={isLoading}
              className="w-full py-3 px-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white resize-none"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 transition-all duration-200 flex items-center justify-center min-w-[80px]"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
