"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChatMessage, PropertyListing } from "./types";
import PropertyCard from "./PropertyCard";

interface ChatboxProps {
  initialMessage: string;
  onSubmit: (formData: FormData) => Promise<{
    response?: string;
    error?: string;
    propertyListings?: PropertyListing[];
  }>;
}

export default function Chatbox({ initialMessage, onSubmit }: ChatboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: initialMessage, type: "system" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const prompt = formData.get("prompt") as string;
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, { text: prompt, type: "user" }]);
    setIsLoading(true);

    try {
      const result = await onSubmit(formData);

      if (result.response) {
        // Check if the response contains property listings data
        if (result.propertyListings && result.propertyListings.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              text: `Found ${result.propertyListings?.length || 0} properties matching your criteria:`,
              type: "ai",
              propertyListings: result.propertyListings,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { text: result.response || "", type: "ai" },
          ]);
        }
      } else if (result.error) {
        setMessages((prev) => [
          ...prev,
          { text: result.error || "An error occurred", type: "error" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: `Error: ${error}`, type: "error" },
      ]);
    } finally {
      setIsLoading(false);
    }

    const form = document.querySelector("form") as HTMLFormElement;
    form?.reset();
  }

  return (
    <div className="flex flex-col w-full">
      {/* Initial State - Search Input */}
      {messages.length === 1 && (
        <div className="text-center">
          <form action={handleSubmit} className="relative">
            <Input
              name="prompt"
              placeholder="Need help deciding? Try asking..."
              required
              disabled={isLoading}
              className="w-full text-lg py-6 px-8 pr-16 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
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
      )}

      {/* Chat Messages */}
      {messages.length > 1 && (
        <div className="w-full">
          <div className="max-h-96 overflow-y-auto mb-6 space-y-4">
            {messages.slice(1).map((message, index) => (
              <div key={index} className="space-y-3">
                {message.type === "user" ? (
                  <div className="text-right">
                    <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-xs lg:max-w-md">
                      {message.text}
                    </div>
                  </div>
                ) : message.type === "ai" ? (
                  <div className="text-left">
                    <div className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-tl-sm max-w-xs lg:max-w-md">
                      {message.text}
                    </div>
                    {message.propertyListings &&
                      message.propertyListings.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {message.propertyListings.map(
                            (listing, listingIndex) => (
                              <PropertyCard
                                key={listing.id}
                                listing={listing}
                                index={listingIndex}
                              />
                            ),
                          )}
                        </div>
                      )}
                  </div>
                ) : message.type === "error" ? (
                  <div className="text-left">
                    <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-2xl rounded-tl-sm max-w-xs lg:max-w-md">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    {message.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center text-gray-500 mb-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>AI is searching for properties...</span>
              </div>
            </div>
          )}

          {/* New Message Input */}
          <form action={handleSubmit} className="flex gap-2">
            <Input
              name="prompt"
              placeholder="Ask me anything about rentals..."
              required
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
