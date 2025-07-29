"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send } from "lucide-react";
import {
  ChatMessage,
  PropertyListing,
} from "@/src/app/(main-layout)/llm-search/types";
import PropertyCard from "@/src/app/(main-layout)/llm-search/PropertyCard";

interface AISearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
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

// moving dots
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

const MessageBubble = ({
  message,
  index,
}: {
  message: ChatMessage;
  index: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  const baseClasses = `message-animate ${
    isVisible ? "opacity-100" : "opacity-0"
  } transform transition-all duration-300 ease-out ${
    isVisible ? "translate-y-0" : "translate-y-2"
  }`;

  if (message.type === "user") {
    return (
      <div className={`${baseClasses} flex justify-end mb-4`}>
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[70%] shadow-sm">
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  if (message.type === "error") {
    return (
      <div className={`${baseClasses} flex justify-start mb-4`}>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-bl-md px-4 py-3 max-w-[70%] shadow-sm">
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} flex justify-start mb-4`}>
      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-[70%] shadow-sm">
        <div className="flex items-start space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AISearchOverlay({
  isOpen,
  onClose,
  initialQuery,
  onSubmit,
}: AISearchOverlayProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [propertyListings, setPropertyListings] = useState<PropertyListing[]>(
    [],
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialQuery && chatHistory.length === 0) {
      setInputValue(initialQuery);
    }
  }, [isOpen, initialQuery, chatHistory.length]);

  useEffect(() => {
    if (!isOpen) {
      setChatHistory([]);
      setPropertyListings([]);
      setInputValue("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      text: inputValue.trim(),
      type: "user",
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInputValue("");

    try {
      const formData = new FormData();
      formData.append("prompt", userMessage.text);

      const result = await onSubmit(formData, chatHistory);

      if (result.error) {
        const errorMessage: ChatMessage = {
          text: result.error,
          type: "error",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      } else if (result.response) {
        const aiMessage: ChatMessage = {
          text: result.response,
          type: "ai",
          propertyListings: result.propertyListings,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);

        if (result.propertyListings) {
          setPropertyListings(result.propertyListings);
        }
      }
    } catch (error) {
      console.error("Error submitting chat:", error);
      const errorMessage: ChatMessage = {
        text: "Sorry, I encountered an error. Please try again.",
        type: "error",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Property Search
              </h2>
              <p className="text-sm text-gray-500">
                Ask me about properties and I&apos;ll help you find what you
                need
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm">
                Ask me about properties, neighborhoods, or specific requirements
              </p>
            </div>
          )}

          {chatHistory.map((message, index) => (
            <MessageBubble key={index} message={message} index={index} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Property Results */}
        {propertyListings.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              Properties Found ({propertyListings.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {propertyListings.map((listing, index) => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about properties, neighborhoods, or specific requirements..."
              disabled={isLoading}
              className="flex-1 text-base text-black"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
