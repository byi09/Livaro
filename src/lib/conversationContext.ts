import type { ChatConversation, FilterOptions, PropertyListing } from '@/lib/types';

// In-memory store for conversation contexts (in production, this would be in a database)
const conversationStore = new Map<string, ChatConversation>();

/**
 * Create a new conversation context
 */
export function createConversationContext(userId: string): ChatConversation {
  const conversationId = `${userId}-${Date.now()}`;
  
  const conversation: ChatConversation = {
    id: conversationId,
    userId,
    messages: [],
    context: {
      recentFilters: undefined,
      userPreferences: {
        priceRange: undefined,
        location: undefined,
        propertyTypes: [],
        mustHaveFeatures: [],
        dealBreakers: []
      },
      viewedProperties: [],
      favoriteProperties: []
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  conversationStore.set(conversationId, conversation);
  return conversation;
}

/**
 * Get conversation context by ID
 */
export function getConversationContext(conversationId: string): ChatConversation | null {
  return conversationStore.get(conversationId) || null;
}

/**
 * Update conversation context
 */
export function updateConversationContext(conversationId: string, updates: Partial<ChatConversation>): ChatConversation | null {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return null;

  const updatedConversation = {
    ...conversation,
    ...updates,
    updatedAt: new Date()
  };

  conversationStore.set(conversationId, updatedConversation);
  return updatedConversation;
}

/**
 * Update conversation context with new filters
 */
export function updateConversationFilters(conversationId: string, filters: FilterOptions): ChatConversation | null {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return null;

  const updatedContext = {
    ...conversation.context,
    recentFilters: filters,
    userPreferences: {
      ...conversation.context.userPreferences,
      // Update preferences based on new filters
      priceRange: filters.priceRange.min > 0 || filters.priceRange.max > 0 ? 
        filters.priceRange : conversation.context.userPreferences?.priceRange,
      propertyTypes: Object.entries(filters.propertyTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type)
    }
  };

  return updateConversationContext(conversationId, { context: updatedContext });
}

/**
 * Add viewed property to conversation context
 */
export function addViewedProperty(conversationId: string, propertyId: string): ChatConversation | null {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return null;

  const viewedProperties = [...(conversation.context.viewedProperties || [])];
  if (!viewedProperties.includes(propertyId)) {
    viewedProperties.push(propertyId);
    // Keep only the last 20 viewed properties
    if (viewedProperties.length > 20) {
      viewedProperties.shift();
    }
  }

  const updatedContext = {
    ...conversation.context,
    viewedProperties
  };

  return updateConversationContext(conversationId, { context: updatedContext });
}

/**
 * Add favorite property to conversation context
 */
export function addFavoriteProperty(conversationId: string, propertyId: string): ChatConversation | null {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return null;

  const favoriteProperties = [...(conversation.context.favoriteProperties || [])];
  if (!favoriteProperties.includes(propertyId)) {
    favoriteProperties.push(propertyId);
  }

  const updatedContext = {
    ...conversation.context,
    favoriteProperties
  };

  return updateConversationContext(conversationId, { context: updatedContext });
}

/**
 * Update user preferences based on conversation history
 */
export function updateUserPreferences(conversationId: string, preferences: Partial<ChatConversation['context']['userPreferences']>): ChatConversation | null {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return null;

  const updatedPreferences = {
    ...conversation.context.userPreferences,
    ...preferences
  };

  const updatedContext = {
    ...conversation.context,
    userPreferences: updatedPreferences
  };

  return updateConversationContext(conversationId, { context: updatedContext });
}

/**
 * Analyze conversation patterns to extract user preferences
 */
export function analyzeConversationPatterns(conversationId: string): {
  preferredPriceRange?: { min: number; max: number };
  preferredLocation?: string;
  preferredPropertyTypes?: string[];
  mustHaveFeatures?: string[];
  dealBreakers?: string[];
} {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return {};

  const analysis: any = {};
  
  // Analyze recent filters to extract preferences
  if (conversation.context.recentFilters) {
    const filters = conversation.context.recentFilters;
    
    // Extract preferred price range
    if (filters.priceRange.min > 0 || filters.priceRange.max > 0) {
      analysis.preferredPriceRange = filters.priceRange;
    }
    
    // Extract preferred property types
    const enabledTypes = Object.entries(filters.propertyTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);
    
    if (enabledTypes.length > 0 && enabledTypes.length < 4) {
      analysis.preferredPropertyTypes = enabledTypes;
    }
    
    // Extract must-have features
    const mustHaveFeatures = [];
    if (filters.petsAllowed) mustHaveFeatures.push('Pet Friendly');
    if (filters.parking) mustHaveFeatures.push('Parking');
    if (filters.furnished) mustHaveFeatures.push('Furnished');
    if (filters.utilitiesIncluded) mustHaveFeatures.push('Utilities Included');
    if (filters.ac) mustHaveFeatures.push('Air Conditioning');
    if (filters.inUnitLaundry) mustHaveFeatures.push('In-Unit Laundry');
    
    if (mustHaveFeatures.length > 0) {
      analysis.mustHaveFeatures = mustHaveFeatures;
    }
  }
  
  return analysis;
}

/**
 * Get conversation summary for context
 */
export function getConversationSummary(conversationId: string): {
  totalMessages: number;
  propertiesViewed: number;
  propertiesFavorited: number;
  lastActivity: Date;
  preferences: any;
} {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) {
    return {
      totalMessages: 0,
      propertiesViewed: 0,
      propertiesFavorited: 0,
      lastActivity: new Date(),
      preferences: {}
    };
  }

  return {
    totalMessages: conversation.messages.length,
    propertiesViewed: conversation.context.viewedProperties?.length || 0,
    propertiesFavorited: conversation.context.favoriteProperties?.length || 0,
    lastActivity: conversation.updatedAt,
    preferences: conversation.context.userPreferences || {}
  };
}

/**
 * Clean up old conversations (call periodically)
 */
export function cleanupOldConversations(maxAgeHours: number = 24): void {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  
  for (const [id, conversation] of conversationStore.entries()) {
    if (conversation.updatedAt < cutoffTime) {
      conversationStore.delete(id);
    }
  }
}

/**
 * Get recommendations based on conversation context
 */
export function getContextualRecommendations(conversationId: string): {
  suggestedFilters?: FilterOptions;
  suggestedQuestions?: string[];
  contextualTips?: string[];
} {
  const conversation = conversationStore.get(conversationId);
  if (!conversation) return {};

  const recommendations: any = {};
  const context = conversation.context;
  
  // Suggest filters based on preferences
  if (context.userPreferences) {
    const prefs = context.userPreferences;
    
    if (prefs.priceRange && (!context.recentFilters || 
        (context.recentFilters.priceRange.min === 0 && context.recentFilters.priceRange.max === 0))) {
      recommendations.suggestedFilters = {
        ...context.recentFilters,
        priceRange: prefs.priceRange
      };
    }
  }
  
  // Suggest questions based on missing information
  const suggestedQuestions = [];
  if (!context.recentFilters?.priceRange || 
      (context.recentFilters.priceRange.min === 0 && context.recentFilters.priceRange.max === 0)) {
    suggestedQuestions.push("What's your budget range?");
  }
  
  if (!context.userPreferences?.location) {
    suggestedQuestions.push("Which area are you looking in?");
  }
  
  if (context.recentFilters?.bedrooms === 0 && !context.userPreferences?.propertyTypes?.includes('studio')) {
    suggestedQuestions.push("How many bedrooms do you need?");
  }
  
  if (suggestedQuestions.length > 0) {
    recommendations.suggestedQuestions = suggestedQuestions;
  }
  
  // Contextual tips
  const contextualTips = [];
  if (context.viewedProperties && context.viewedProperties.length > 5) {
    contextualTips.push("You've viewed several properties. Would you like me to help narrow down your search?");
  }
  
  if (context.favoriteProperties && context.favoriteProperties.length > 0) {
    contextualTips.push("Based on your favorite properties, I can suggest similar ones.");
  }
  
  if (contextualTips.length > 0) {
    recommendations.contextualTips = contextualTips;
  }
  
  return recommendations;
}

/**
 * Create a default conversation for a user (used when no conversation ID is provided)
 */
export function getOrCreateDefaultConversation(userId: string): ChatConversation {
  const defaultId = `${userId}-default`;
  let conversation = conversationStore.get(defaultId);
  
  if (!conversation) {
    conversation = {
      id: defaultId,
      userId,
      messages: [],
      context: {
        recentFilters: undefined,
        userPreferences: {
          priceRange: undefined,
          location: undefined,
          propertyTypes: [],
          mustHaveFeatures: [],
          dealBreakers: []
        },
        viewedProperties: [],
        favoriteProperties: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    conversationStore.set(defaultId, conversation);
  }
  
  return conversation;
} 