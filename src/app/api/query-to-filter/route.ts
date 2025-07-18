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
    const { prompt }: AIChatRequest = await request.json();

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

    const modelResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${prompt}`,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        systemInstruction:
          "You are a helpful AI assistant. Your task is to assist the user in finding a suitable place to rent by converting their query into a json object with one or more of the following filters. The possible filters are as follows: 'city', 'state', 'property_type'(apartment, condo, house, townhouse, studio, room, duplex), square_footage, bedrooms, bathrooms, price_min, price_max, parking_spaces(number of parking spaces), pet_friendly(boolean), furnished(boolean), available_from(date in YYYY-MM-DD format). If the user asks for a specific location, you should include the 'city' and 'state' filters. If they ask for a specific property type, include the 'property_type' filter. If they mention a budget, include 'price_min' and/or 'price_max'. If they mention a specific number of bedrooms or bathrooms, include those filters as well. If they mention parking spaces, include 'parking_spaces'. If they mention pets, include 'pet_friendly' as true. Do not reply with anything other than the json object with the filters. Do not include any additional text or explanations. Don't format the output as markdown, just send the json object starting with '{' and ending with '}'. If the query is not related to houseing, return 'bad_query'",
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
