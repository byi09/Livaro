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

GENERAL PRINCIPLE: Be more permissive with searches. It's better to search and find some results than to over-chat. Users want to see properties quickly.

${
  hasFoundProperties
    ? `CONTEXT: Properties have already been found in this conversation. 
  
  Use "search" when:
  - User wants to refine their search with new/different criteria
  - User asks to "find more", "search again", "show me different" properties
  - User provides significantly different requirements (new location, budget, etc.)
  - User asks for specific filters or changes to previous search
  - User seems dissatisfied with current results and wants alternatives
  
  Use "chat" when:
  - User asks questions about the found properties
  - User wants help choosing between specific options
  - User asks about neighborhoods, amenities, or general advice
  - User wants clarification about the search results`
    : `CONTEXT: This is an initial or early conversation about finding properties.
  
  Use "search" when:
  - User mentions ANY location (even vague like "downtown", "near campus", "Bay Area")
  - User mentions ANY budget or price range (even rough estimates)
  - User has ANY preferences for bedrooms, property type, amenities
  - User asks to "find", "search", "show me" properties
  - User provides any specific housing criteria (even just one)
  - User seems ready to see actual properties
  - The conversation has gathered at least ONE useful search criteria
  
  Use "chat" when:
  - User's first message is purely greeting or introduction
  - User asks completely general questions without any specific criteria
  - User asks questions about the rental process, neighborhoods, or general advice without specifics
  - User is clearly not ready for a search yet (asking "how does this work?")
  - User query is completely unrelated to housing`
}

IMPORTANT: Default to "search" when in doubt. Users prefer seeing properties over extended conversations. Respond with only "search" or "chat".`,
      },
    });

    const modelOutput = modelResponse.text?.trim().toLowerCase();
    console.log("Decide-action AI response:", modelOutput, "for prompt:", prompt);

    // Parse the response to determine action
    const action = modelOutput === "search" ? "search" : "chat";
    console.log("Final action decided:", action);

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
