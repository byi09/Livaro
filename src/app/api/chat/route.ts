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
    let previousSearchInfo = "";

    if (chatHistory && chatHistory.length > 0) {
      // Check if properties were found in previous messages
      const propertyMessages = chatHistory.filter(
        (msg) => msg.propertyListings && msg.propertyListings.length > 0,
      );
      hasFoundProperties = propertyMessages.length > 0;

      // Extract information about what the user was already looking for
      const userMessages = chatHistory.filter((msg) => msg.type === "user");
      if (userMessages.length > 0) {
        previousSearchInfo = userMessages.map((msg) => msg.text).join(" ");
      }

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
        systemInstruction: `You are a helpful AI assistant specializing in helping users find rental properties. Your role is to have natural conversations with users to gather more information about their housing needs, preferences, and requirements.

IMPORTANT FORMATTING RULES:
- NEVER use markdown formatting (no **, __, ##, -, *, etc.)
- Use plain text only
- Emojis are allowed and encouraged 😊
- Use line breaks for readability but no special formatting

${
  hasFoundProperties
    ? `The user has already found some properties in their search. Focus on helping them refine their selection by asking about:
  - Specific features they liked/disliked about the found properties
  - Additional preferences to narrow down choices
  - Questions about neighborhoods, commute, amenities
  - Budget adjustments or other criteria refinements
  
  Be helpful in guiding them to make the best choice from their results.`
    : `Your goal is to gather information for an initial property search. Ask clarifying questions about:
  - Location preferences (be specific about cities/neighborhoods)
  - Budget ranges 
  - Property types and size requirements
  - Important amenities and lifestyle needs
  
  AVOID asking for information already provided: ${previousSearchInfo ? `The user has already mentioned: ${previousSearchInfo}` : ""}`
}

Be conversational, friendly, and helpful. Keep responses concise but warm and engaging. Do not use any markdown formatting.`,
      },
    });

    const modelOutput = modelResponse.text;

    if (!modelOutput) {
      return NextResponse.json(
        {
          error: "No response from the AI model.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        response: modelOutput,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in AI chat route:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
      },
      {
        status: 500,
      },
    );
  }
}
