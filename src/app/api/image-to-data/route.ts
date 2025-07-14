import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, createUserContent } from '@google/genai'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!API_KEY) {
  throw new Error('Gemini API Key missing')
}

export async function POST(request: NextRequest) {
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    })

    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert image to base64
    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = image.type

    // Call Gemini Vision API using the correct format
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: createUserContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64,
          },
        },
        `Analyze this image and extract property information. Return a JSON object with the following fields (only include fields you can confidently extract, leave others empty):
        
        BASIC PROPERTY INFO:
        {
          "address_line_1": "street address",
          "address_line_2": "apt/unit number", 
          "city": "city name",
          "state": "state",
          "zip_code": "zip code",
          "property_type": "apartment/house/condo/townhouse/studio/room/duplex",
          "bedrooms": "number of bedrooms",
          "bathrooms": "number of bathrooms",
          "square_footage": "square footage",
          "year_built": "year built",
          "parking_spaces": "number of parking spaces",
          "description": "property description",
          
          LISTING INFO (if visible):
          "monthly_rent": "monthly rent amount",
          "security_deposit": "security deposit amount", 
          "pet_deposit": "pet deposit amount",
          "application_fee": "application fee amount",
          "minimum_lease_term": "minimum lease term in months",
          "maximum_lease_term": "maximum lease term in months",
          "available_date": "available date in YYYY-MM-DD format",
          "listing_title": "property listing title",
          "listing_description": "detailed listing description",
          
          AMENITIES/FEATURES (if visible):
          "has_basement": "true/false",
          "has_attic": "true/false", 
          "garage_spaces": "number of garage spaces",
          "lot_size": "lot size",
          "half_bathrooms": "number of half bathrooms"
        }
        
        Only extract information you can see clearly in the image. For numbers, return them as strings. For booleans, return "true" or "false" as strings. Be conservative - if you're not sure, leave the field empty. Return only valid JSON, no additional text or explanations.`,
      ]),
      config: {
        systemInstruction:
          'You are a helpful AI assistant that extracts property information from images. Only return a valid JSON object with the requested fields. Do not include any additional text, explanations, or markdown formatting.',
      },
    })

    const extractedText = response.text

    if (!extractedText) {
      throw new Error('No response from Gemini')
    }

    // Parse the JSON response
    let extractedData
    try {
      // Remove any markdown formatting and extract JSON
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        extractedData = JSON.parse(extractedText)
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.error('Raw response:', extractedText)
      throw new Error('Failed to parse extracted data')
    }

    // Clean and validate the data
    const cleanedData = Object.entries(extractedData).reduce(
      (acc, [key, value]) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
          acc[key] = value.trim()
        }
        return acc
      },
      {} as Record<string, string>
    )

    return NextResponse.json(cleanedData)
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
