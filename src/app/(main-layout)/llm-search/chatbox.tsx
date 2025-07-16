"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChatMessage, PropertyListing } from "./types";
import PropertyCard from "./PropertyCard";

interface ChatboxProps {
  initialMessage: string;
  onSubmit: (
    formData: FormData,
  ) => Promise<{
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
    <div className="flex flex-col h-full w-full items-center border-2 m-4 justify-between p-4">
      <div className="self-start w-full flex-1 overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            {message.type === "user" ? (
              <div className="text-lg mb-2 text-blue-600 font-medium">
                You: {message.text}
              </div>
            ) : message.type === "ai" ? (
              <div className="text-lg mb-2">
                <span className="text-green-600 font-medium">AI:</span>
                <div className="mt-2 text-gray-800 whitespace-pre-line">
                  {message.text}
                </div>
                {message.propertyListings &&
                  message.propertyListings.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {message.propertyListings.map((listing, listingIndex) => (
                        <PropertyCard
                          key={listing.id}
                          listing={listing}
                          index={listingIndex}
                        />
                      ))}
                    </div>
                  )}
              </div>
            ) : message.type === "error" ? (
              <div className="text-lg mb-2 text-red-600 font-medium">
                Error: {message.text}
              </div>
            ) : (
              <div className="text-lg mb-2 text-gray-600">{message.text}</div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="text-lg text-gray-500 animate-pulse">
            AI is searching for properties...
          </div>
        )}
      </div>
      <form action={handleSubmit} className="w-full flex gap-2">
        <Input
          name="prompt"
          placeholder="e.g., 2-bedroom apartment in San Francisco under $4000"
          required
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>
    </div>
  );
}
