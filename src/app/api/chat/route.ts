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
    if (chatHistory && chatHistory.length > 0) {
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
        systemInstruction:
          "You are a helpful AI assistant specializing in helping users find rental properties. Your role is to have natural conversations with users to gather more information about their housing needs, preferences, and requirements. You should ask clarifying questions about location preferences, budget ranges, property types, amenities, lifestyle needs, and any other relevant details that would help narrow down their search. Be conversational, friendly, and helpful. Don't try to search for properties - just focus on understanding what the user is looking for and ask follow-up questions to get more specific details. If they provide very specific and complete search criteria, acknowledge that you understand their needs and suggest they can search for properties. Keep responses concise but warm and engaging.",
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
