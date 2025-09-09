"use client";

import { LocationSearchInput, Checkbox, SearchSelect } from "./ui/Form";
import { FieldErrors, Resolver, useForm } from "react-hook-form";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useGeolocationContext } from "../contexts/GeolocationContext";
import { useRouter } from "next/navigation";
import { geocode } from "@/utils/geocoding";
import { Button } from "./ui/button";

import { Search, SlidersHorizontal } from "lucide-react";
import React, { useRef } from "react";

import { handleAISearchQuery } from "@/src/lib/ai-search-actions";

// select options for property type and beds
const propertyTypeOptions = [
  { value: "null", label: "Property Type" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
];

const bedOptions = [
  { value: "null", label: "Beds" },
  { value: "-1", label: "Studio" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3+", label: "3+ Beds" },
];

// form values
interface SearchFormValues {
  location: string;
  propertyType?: string;
  beds?: string;
  petFriendly?: boolean;
  parking?: boolean;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
}

// error resolver for the form
const resolver: Resolver<SearchFormValues> = async (values) => {
  const errors: FieldErrors<SearchFormValues> = {};

  if (!values.location) {
    errors.location = {
      type: "required",
      message: "Location is required",
    };
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    values: hasErrors ? {} : values,
    errors: hasErrors ? errors : {},
  };
};

// form component
function PropertySearch() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SearchFormValues>({ resolver });
  // Cache location field registration to reuse handlers consistently
  const locationField = register("location", { required: true });
  const { location } = useGeolocationContext();

  // Compute default location derived from geolocation
  const defaultLocation = useMemo(() => {
    return location?.city && location?.state
      ? `${location.city.long_name}, ${location.state.short_name}`
      : "";
  }, [location?.city, location?.state]);

  // Initialize with placeholder, update smoothly when geolocation arrives
  const [locationInput, setLocationInput] = useState("Mountain View, CA");

  // Smooth transition when geolocation data arrives
  useEffect(() => {
    if (defaultLocation && defaultLocation !== locationInput) {
      // Smooth update with transition
      setLocationInput(defaultLocation);
      setValue("location", defaultLocation);
    }
  }, [defaultLocation, locationInput, setValue]);
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [useAISearch, setUseAISearch] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
    properties?: any[];
  }>>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Welcome message is shown directly in the UI when chatMessages.length === 0

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages]);

  // Function to stop current AI response (interruption)
  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsTyping(false);
  }, [abortController]);

  // Function to handle chatbot conversation with interruption support
  const handleChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Expand chat interface on first message
    setIsChatExpanded(true);

    // Stop any ongoing generation
    stopGeneration();

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: message.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentInput("");
    setIsTyping(true);

    // Create new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
      // Call AI search function with abort signal
      const formData = new FormData();
      formData.append("prompt", message.trim());
      
      const result = await handleAISearchQuery(formData);
      console.log("AI Search Result:", result);
      
      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        return;
      }
      
      // Add bot response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        message: result.response || result.error || "I couldn't process that request. Could you try rephrasing with more specific details about your property needs?",
        timestamp: new Date(),
        properties: result.propertyListings || [],
      };

      setChatMessages(prev => [...prev, botMessage]);
      
      // If properties were found, add a follow-up message after a brief delay
      if (result.propertyListings && result.propertyListings.length > 0 && !newAbortController.signal.aborted) {
        setTimeout(() => {
          if (!newAbortController.signal.aborted) {
            const followUpMessage = {
              id: (Date.now() + 2).toString(),
              type: 'bot' as const,
              message: `I found ${result.propertyListings.length} properties that match your criteria. Would you like me to show you more details about any of these, or would you like to refine your search?`,
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, followUpMessage]);
          }
        }, 800);
      }
      
    } catch (error) {
      // Don't show error if request was aborted (user interrupted)
      if (newAbortController.signal.aborted) {
        return;
      }
      
      console.error("Chat error:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        message: "I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      if (!newAbortController.signal.aborted) {
        setIsTyping(false);
        setAbortController(null);
      }
    }
  }, [stopGeneration]);

  const onSubmit = useCallback(
    async (data: SearchFormValues) => {
      setIsSearching(true);

      try {
        // If AI search is enabled, handle through chatbot
        if (useAISearch) {
          const query = data.location || "";
          if (query) {
            await handleChatMessage(query);
          }
          setIsSearching(false);
          return;
        }

        // Normal search behavior - build search parameters for map filters
        const searchParams = new URLSearchParams();

        // if location is provided, geocode it to get center coordinates
        // for the map's initial view
        if (data.location) {
          searchParams.set("location", data.location);
          const geometry = await geocode(data.location);
          if (geometry?.location) {
            searchParams.set("lng", geometry.location.lng.toString());
            searchParams.set("lat", geometry.location.lat.toString());
          }
        }

        if (data.propertyType && data.propertyType !== "null")
          searchParams.set("propertyType", data.propertyType);

        if (data.beds && data.beds !== "null")
          searchParams.set("beds", data.beds);
        if (data.petFriendly) searchParams.set("petFriendly", "true");
        if (data.parking) searchParams.set("parking", "true");
        if (data.furnished) searchParams.set("furnished", "true");
        if (data.utilitiesIncluded)
          searchParams.set("utilitiesIncluded", "true");

        router.push(`/map?${searchParams.toString()}`);
      } catch (error) {
        console.error("Search error:", error);
        setIsSearching(false);
      }
    },
    [router, useAISearch, handleChatMessage],
  );

  // No automatic initialization - welcome message shows immediately in the UI




  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Search Form - Always visible, with AI chat integrated when active */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* AI Chat Interface - Always in DOM but with smooth transitions */}
        <div className={`transition-all duration-700 ease-out border-b border-gray-200 ${useAISearch && isChatExpanded ? 'max-h-[800px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 overflow-hidden'}`}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Property Assistant</h3>
                    <p className="text-gray-500 text-xs">Find your perfect rental</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatExpanded(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                  title="Minimize chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0l-7 7m7-7v18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
          <div ref={chatMessagesRef} className="h-80 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth bg-gradient-to-b from-blue-50/30 to-purple-50/30">
              {chatMessages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-500 ease-out ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-xl px-4 py-3 transition-all duration-300 ease-out hover:shadow-md ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto hover:bg-blue-600' 
                        : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </div>
                    
                    {/* Show properties if found */}
                    {message.properties && message.properties.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                          <span>Found {message.properties.length} properties</span>
                          <button
                            type="button"
                            onClick={() => {
                              const searchParams = new URLSearchParams();
                              searchParams.set('ai_search', 'true');
                              router.push(`/map?${searchParams.toString()}`);
                            }}
                            className="text-blue-500 hover:text-blue-600 text-xs font-medium"
                          >
                            View on Map →
                          </button>
                        </div>
                        <div className="space-y-2">
                          {message.properties.slice(0, 2).map((property: any, index: number) => (
                            <div key={property.id || index} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                                 onClick={() => {
                                   router.push(`/map?property=${property.id || index}`);
                                 }}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-xs mb-1">
                                    {property.title || property.address || 'Property Listing'}
                                  </h5>
                                  <p className="text-gray-600 text-xs">
                                    {property.description || 'No description available'}
                                  </p>
                                  {property.price && (
                                    <p className="text-blue-600 font-semibold text-xs mt-1">
                                      ${property.price}/month
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3 max-w-[75%] border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show welcome message if no chat started */}
              {chatMessages.length === 0 && !isTyping && (
                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-left-4 duration-700 ease-out">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 max-w-[75%] border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <p className="text-sm leading-relaxed text-gray-800">Hi! I'm your AI property assistant. I can help you find the perfect rental based on your preferences. What kind of place are you looking for?</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions - Only show when no conversation */}
            {chatMessages.length === 0 && !isTyping && (
              <div className="px-4 py-4 bg-gradient-to-b from-blue-50/30 to-purple-50/30 border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-3 text-center font-medium">Quick suggestions:</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Find me a 2-bedroom apartment under $2500",
                    "Show properties near UC Berkeley",
                    "I need a pet-friendly place with parking",
                    "What's available in downtown area?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleChatMessage(suggestion)}
                      className="text-xs px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-lg text-gray-600 hover:text-gray-800 transition-all duration-300 ease-out text-left hover:shadow-md transform hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.99]"
                      disabled={isTyping}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Form Content */}
        <form
          className="p-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            // Only handle form submission for normal search, not AI search
            if (!useAISearch) {
              handleSubmit(onSubmit)(e);
            }
          }}
        >
        {/* Main Search Input - Always present, content switches smoothly */}
        <div className="relative min-h-[60px]">
          {/* Simple AI Chatbot Interface - Before expansion */}
          <div className={`absolute inset-0 transition-all duration-500 ease-out ${useAISearch && !isChatExpanded ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[0.98] z-0 pointer-events-none'}`}>
            <div className="flex items-center">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatMessage(currentInput);
                  }
                }}
                className="flex-1 px-6 py-4 pr-14 text-lg text-gray-900 bg-white rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none placeholder-gray-400 transition-all duration-300 ease-out hover:border-gray-400 hover:shadow-md"
                placeholder="Need help deciding? Try asking..."
                disabled={isTyping}
              />
              <button
                type="button"
                onClick={() => handleChatMessage(currentInput)}
                disabled={isTyping || !currentInput.trim()}
                className="absolute right-3 p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Full AI Chat Input - After expansion */}
          <div className={`absolute inset-0 transition-all duration-500 ease-out ${useAISearch && isChatExpanded ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[0.98] z-0 pointer-events-none'}`}>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatMessage(currentInput);
                  }
                }}
                className="flex-1 px-6 py-4 text-lg text-gray-900 bg-white rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 ease-out hover:border-gray-300 hover:shadow-sm"
                placeholder="Ask me about properties, neighborhoods, or preferences..."
                disabled={isTyping}
              />
              <Button
                type="button"
                onClick={() => handleChatMessage(currentInput)}
                disabled={isTyping || !currentInput.trim()}
                size="lg"
                variant="gradient"
                className="px-6 py-4 rounded-xl flex-shrink-0 transition-all duration-300 ease-out disabled:opacity-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </div>
          
          {/* Normal Search Input */}
          <div className={`absolute inset-0 transition-all duration-500 ease-out ${!useAISearch ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[0.98] z-0 pointer-events-none'}`}>
              <LocationSearchInput
                {...locationField}
                value={locationInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocationInput(value);
                  locationField.onChange(e);
                }}
                className="w-full px-6 py-4 text-lg text-gray-900 bg-white rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none placeholder-gray-400 transition-all duration-300 ease-out hover:border-gray-300 hover:shadow-sm"
                placeholder="Enter location or search query..."
              >
                {errors.location && (
                  <p className="text-red-500 text-sm mt-2 absolute">
                    {errors.location.message}
                  </p>
                )}
              </LocationSearchInput>
              
              {/* Search Button */}
              <Button
                type="submit"
                loading={isSearching}
                loadingText="Searching..."
                size="lg"
                variant="gradient"
                disabled={useAISearch || isSearching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-8 py-3 rounded-xl transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
          </div>
        </div>

        {/* Additional filters for normal search - Smooth transition */}
        <div className={`transition-all duration-700 ease-out overflow-hidden ${!useAISearch ? 'max-h-96 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'}`}>
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Property Type */}
              <SearchSelect
                {...register("propertyType")}
                options={propertyTypeOptions}
              />
              {/* Beds */}
              <SearchSelect {...register("beds")} options={bedOptions} />
            </div>
            
            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <Checkbox
                {...register("petFriendly")}
                id="pet-friendly"
                field="Pet Friendly"
              />
              <Checkbox
                {...register("parking")}
                id="parking"
                field="Parking Available"
              />
              <Checkbox
                {...register("furnished")}
                id="furnished"
                field="Furnished"
              />
              <Checkbox
                {...register("utilitiesIncluded")}
                id="utilities-included"
                field="Utilities Included"
              />
            </div>
          </div>
        </div>

        {/* AI Assistant Toggle - At the bottom */}
        <div className="pt-4">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                const newAISearchState = !useAISearch;
                setUseAISearch(newAISearchState);
                
                // Reset states when switching modes
                if (newAISearchState) {
                  setCurrentInput("");
                  setChatMessages([]);
                  setIsChatExpanded(false);
                } else {
                  setChatMessages([]);
                  setCurrentInput("");
                  setIsTyping(false);
                  setIsChatExpanded(false);
                }
              }}
              className={`group flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ease-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                useAISearch 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg focus:ring-blue-500' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 focus:ring-gray-400'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                useAISearch 
                  ? 'border-white bg-white' 
                  : 'border-gray-400 group-hover:border-gray-600'
              }`}>
                {useAISearch && (
                  <svg className="w-full h-full text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 008.367 8.367z"/>
                  </svg>
                )}
              </div>
              <span className="font-medium">
                {useAISearch ? 'AI Search Active' : 'Try AI Assistant'}
              </span>
              {!useAISearch && (
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>
          </div>
          </div>
        </form>
      </div>

    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PropertySearch);
