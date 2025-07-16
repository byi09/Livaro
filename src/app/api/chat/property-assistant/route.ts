import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { searchPropertiesWithFilter } from '@/src/db/queries';
import { extractFiltersFromText, convertToFilterOptions, analyzeIntent } from '@/src/lib/propertyFiltering';
import { 
  getOrCreateDefaultConversation, 
  updateConversationFilters, 
  addViewedProperty,
  getContextualRecommendations,
  updateConversationContext
} from '@/src/lib/conversationContext';
import OpenAI from 'openai';
import type { FilterOptions, SortOption, PropertySearchIntent, LLMResponse } from '@/lib/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory = [], context = {}, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create conversation context
    const conversation = getOrCreateDefaultConversation(user.id);
    
    // First, try to extract filters using our rule-based system
    const extractedFilters = extractFiltersFromText(message);
    const intent = analyzeIntent(message);

    console.log('Extracted filters:', extractedFilters);
    console.log('Analyzed intent:', intent);

    // Get contextual recommendations
    const recommendations = getContextualRecommendations(conversation.id);

    // Create enhanced system prompt with conversation context
    const systemPrompt = `You are a helpful property rental assistant for a real estate platform. Your role is to help users find rental properties based on their requirements and answer questions about properties.

CORE CAPABILITIES:
1. Parse user messages to extract property search criteria
2. Filter properties based on natural language requirements
3. Provide property recommendations
4. Answer questions about specific properties
5. Help users refine their search criteria

AVAILABLE FILTERS:
- Location: City, neighborhood, zip code, or geographic bounds
- Property Type: apartment, house, condo, townhouse
- Price Range: min/max monthly rent
- Bedrooms: number of bedrooms (0+ for studio)
- Bathrooms: number of bathrooms
- Pet-friendly: whether pets are allowed
- Parking: parking availability
- Furnished: furnished/unfurnished
- Utilities Included: whether utilities are included
- In-unit Laundry: washer/dryer in unit
- Air Conditioning: AC availability

CONVERSATION CONTEXT:
Recent filters: ${JSON.stringify(conversation.context.recentFilters || {})}
User preferences: ${JSON.stringify(conversation.context.userPreferences || {})}
Viewed properties: ${conversation.context.viewedProperties?.length || 0} properties
Favorited properties: ${conversation.context.favoriteProperties?.length || 0} properties

EXTRACTED INFORMATION:
From the user's message, I have pre-extracted the following information:
${JSON.stringify(extractedFilters, null, 2)}

Intent Analysis: ${intent.type} (confidence: ${intent.confidence})

CONTEXTUAL RECOMMENDATIONS:
${recommendations.suggestedQuestions ? `Suggested questions: ${recommendations.suggestedQuestions.join(', ')}` : ''}
${recommendations.contextualTips ? `Tips: ${recommendations.contextualTips.join(', ')}` : ''}

INSTRUCTIONS:
- Be conversational and helpful
- Use the pre-extracted information to understand the user's requirements
- Leverage the conversation context to provide personalized recommendations
- If the extracted information seems incorrect or incomplete, ask for clarification
- Provide specific property recommendations when possible
- Help users refine their search criteria based on their history
- Be aware of their previous searches and preferences
- If no specific criteria are mentioned, ask what they're looking for
- Always provide a natural, conversational response

RESPONSE FORMAT:
Respond naturally as a helpful assistant. Do not use JSON format in your response - just provide a conversational message that addresses the user's needs.`;

    // Prepare conversation history for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000
    });

    const processingTime = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Get LLM response
    const llmMessage = completion.choices[0].message.content || '';
    
    // Convert extracted filters to FilterOptions format
    let filterOptions: FilterOptions | null = null;
    let properties: any[] = [];
    
    if (Object.keys(extractedFilters).length > 0) {
      filterOptions = convertToFilterOptions(extractedFilters);
      
      // Update conversation context with new filters
      updateConversationFilters(conversation.id, filterOptions);
      
      // Search for properties if we have meaningful filter criteria
      if (intent.type === 'search' || intent.type === 'filter' || 
          extractedFilters.priceRange || extractedFilters.bedrooms !== undefined || 
          extractedFilters.propertyType || extractedFilters.location) {
        
        try {
          const sortOption: SortOption = 'priceAsc'; // Default sort
          const searchResults = await searchPropertiesWithFilter(filterOptions, sortOption);
          properties = searchResults.slice(0, 5); // Limit to 5 results
          
          // Mark properties as viewed
          properties.forEach(property => {
            addViewedProperty(conversation.id, property.properties.id);
          });
          
          console.log(`Found ${properties.length} properties with filters:`, filterOptions);
        } catch (error) {
          console.error('Error searching properties:', error);
        }
      }
    }

    // Update conversation context with the new message
    updateConversationContext(conversation.id, {
      messages: [...conversation.messages, {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      }]
    });

    // Create property search intent object
    const propertySearchIntent: PropertySearchIntent = {
      type: intent.type,
      confidence: intent.confidence,
      extractedFilters: extractedFilters,
      searchQuery: message,
    };

    // Enhanced conversation context with recommendations
    const conversationContext = {
      needsMoreInfo: intent.confidence < 0.7,
      followUpQuestions: properties.length === 0 && intent.type === 'search' ? 
        recommendations.suggestedQuestions || ['What\'s your preferred location?', 'What\'s your budget range?', 'How many bedrooms do you need?'] : [],
      topicShift: false,
      contextualTips: recommendations.contextualTips || [],
      conversationSummary: {
        totalMessages: conversation.messages.length + 1,
        propertiesViewed: conversation.context.viewedProperties?.length || 0,
        propertiesFavorited: conversation.context.favoriteProperties?.length || 0
      }
    };

    // Prepare response
    const response = {
      message: llmMessage,
      intent: propertySearchIntent,
      properties,
      filterOptions,
      conversationContext,
      metadata: {
        tokensUsed,
        processingTime,
        propertyCount: properties.length,
        searchType: intent.type,
        extractedFilters: extractedFilters,
        conversationId: conversation.id
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in property assistant chat:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please add your OpenAI API key to the environment variables.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 