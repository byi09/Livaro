"use server";

import { NextResponse, NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AIChatRequest } from "../../(main-layout)/llm-search/types";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API Key missing");
}

export async function POST(request: NextRequest) {
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });
    const { prompt, chatHistory }: AIChatRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Prompt is required.",
        },
        {
          status: 400,
        },
      );
    }

    // Build conversation context from chat history
    let conversationContext = "";
    let hasFoundProperties = false;

    if (chatHistory && chatHistory.length > 0) {
      // Check if properties were found in previous messages
      const propertyMessages = chatHistory.filter(
        (msg) => msg.propertyListings && msg.propertyListings.length > 0,
      );
      hasFoundProperties = propertyMessages.length > 0;

      conversationContext = chatHistory
        .filter((msg) => msg.type === "user" || msg.type === "ai")
        .map(
          (msg) => `${msg.type === "user" ? "User" : "Assistant"}: ${msg.text}`,
        )
        .join("\n");
      conversationContext += "\n\n";
    }

    const fullPrompt = `${conversationContext}User: ${prompt}`;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        systemInstruction: `You are a rental property assistant decision maker. Analyze the user's message and conversation history to decide whether to search for properties or continue the conversation.

Respond with exactly ONE word: either "search" or "chat"

${
  hasFoundProperties
    ? `CONTEXT: Properties have already been found in this conversation. 
  
  Use "search" when:
  - User wants to refine their search with new/different criteria
  - User asks to "find more", "search again", "show me different" properties
  - User provides significantly different requirements (new location, budget, etc.)
  
  Use "chat" when:
  - User asks questions about the found properties
  - User wants help choosing between options
  - User asks about neighborhoods, amenities, or general advice
  - User wants clarification about the search results`
    : `CONTEXT: This is an initial or early conversation about finding properties.
  
  Use "search" when:
  - User provides specific location (city/state)
  - User mentions specific budget or price range  
  - User has clear preferences for bedrooms, property type, etc.
  - User asks to "find", "search", "show me" properties
  - The conversation has gathered enough details to perform a meaningful search
  
  Use "chat" when:
  - User's query is vague or general ("I need help finding a place")
  - User asks questions about neighborhoods, amenities, or general housing advice
  - More information is needed to perform a good search
  - User wants to refine their criteria further
  - User is just starting the conversation and hasn't provided specific details yet`
}

Consider the entire conversation context when making this decision. Respond with only "search" or "chat".`,
      },
    });

    const modelOutput = modelResponse.text?.trim().toLowerCase();

    // Parse the response to determine action
    const action = modelOutput === "search" ? "search" : "chat";

    return NextResponse.json(
      {
        action: action,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in decide action route:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
        action: "chat", // Default to chat on error
      },
      {
        status: 500,
      },
    );
  }
}
