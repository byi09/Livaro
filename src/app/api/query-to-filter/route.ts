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
        systemInstruction: `You are an expert rental property search assistant. Convert user queries into search filters with maximum flexibility and intelligence.

PROPERTY TYPE MAPPING:
- "apartment", "apt", "flat", "unit" → "apartment"
- "house", "home", "single family", "detached" → "house"
- "condo", "condominium", "coop" → "condo"
- "townhouse", "townhome", "row house" → "townhouse"
- "studio", "efficiency", "bachelor" → "studio"
- "room", "shared", "roommate" → "room"
- "duplex", "multi-family" → "duplex"

LOCATION HANDLING:
- Extract city and state from any format ("San Francisco, CA", "Boston", "NYC", "Bay Area")
- Handle common abbreviations and nicknames
- For vague locations like "downtown", "near campus", "city center" - use as city name

BUDGET HANDLING:
- "$2000" → price_max: 2000
- "under $1500" → price_max: 1500
- "$1000-2000" → price_min: 1000, price_max: 2000
- "around $1800" → price_min: 1600, price_max: 2000 (add 10% buffer)
- "cheap", "affordable" → price_max: 1200
- "expensive", "luxury" → price_min: 3000

BEDROOM HANDLING:
- "studio", "0 bedroom" → bedrooms: 0
- "1 bed", "one bedroom" → bedrooms: 1
- "2+", "at least 2" → bedrooms: 2
- "3+ bed" → bedrooms: 3

AMENITY HANDLING:
- "pet friendly", "allows pets", "dogs ok" → pet_friendly: true
- "furnished", "comes with furniture" → furnished: true
- "parking", "garage", "car space" → parking_spaces: 1

BE GENEROUS WITH INTERPRETATIONS:
- If user mentions any location, extract it
- If user mentions any price range, include it
- If user mentions any preferences, include them
- Default to reasonable values when exact numbers aren't given

OUTPUT FORMAT:
Return ONLY a valid JSON object with the filters. No markdown, no explanations.
If the query is completely unrelated to housing, return exactly: {"error": "bad_query"}

Example inputs and outputs:
"2 bedroom apartment in San Francisco under $3000" → {"city": "San Francisco", "state": "CA", "property_type": "apartment", "bedrooms": 2, "price_max": 3000}
"cheap studio near campus" → {"property_type": "studio", "city": "near campus", "price_max": 1200}
"pet friendly house in Boston" → {"city": "Boston", "state": "MA", "property_type": "house", "pet_friendly": true}
"apartment in Bay Area" → {"city": "Bay Area", "state": "CA", "property_type": "apartment"}
"properties in the bay area under $2500" → {"city": "Bay Area", "state": "CA", "price_max": 2500}`,
      },
    });

    const modelOutput = modelResponse.text;
    console.log("Query-to-filter AI response:", modelOutput, "for prompt:", prompt);

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
