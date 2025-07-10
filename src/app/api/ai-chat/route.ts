'use server'

import { NextResponse, NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { AIChatRequest } from '../../(main-layout)/llm-search/types'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!API_KEY) {
  throw new Error('Gemini API Key missing')
}

export async function POST(request: NextRequest) {
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    })
    const { prompt }: AIChatRequest = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      )
    }

    const modelResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${prompt}`,
    })

    const modelOutput = modelResponse.text

    if (!modelOutput) {
      return NextResponse.json(
        { error: 'No response from the AI model.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response: modelOutput }, { status: 200 })
  } catch (error) {
    console.error('Error in AI chat route:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    )
  }
}
