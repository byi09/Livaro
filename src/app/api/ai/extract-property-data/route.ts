import { type NextRequest } from 'next/server'

interface ExtractedPropertyData {
  propertyType?: string
  bedrooms?: string
  bathrooms?: string
  squareFootage?: string
  monthlyRent?: string
  address?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zipCode?: string
  description?: string
  listingTitle?: string
  availableDate?: string
  amenities?: string[]
  yearBuilt?: string
  securityDeposit?: string
  petDeposit?: string
  applicationFee?: string
  confidence?: number
}

// Helper functions for text extraction using regex patterns
function extractPropertyType(text: string): string | undefined {
  const typePatterns = [
    /(?:property\s*type|type)[\s:]*([^\n\r]+)/i,
    /\b(apartment|apt)\b/i,
    /\b(house|home)\b/i,
    /\b(condo|condominium)\b/i,
    /\b(townhouse|townhome)\b/i,
    /\b(studio)\b/i,
    /\b(room)\b/i,
    /\b(duplex)\b/i
  ]
  
  for (const pattern of typePatterns) {
    const match = text.match(pattern)
    if (match) {
      const type = match[1].toLowerCase().trim()
      if (type === 'apt') return 'apartment'
      if (type === 'home') return 'house'
      if (type === 'condominium') return 'condo'
      if (type === 'townhome') return 'townhouse'
      return type
    }
  }
  return undefined
}

function extractBedrooms(text: string): string | undefined {
  const patterns = [
    /(?:bedrooms?|beds?)[\s:]*(\d+)/i,
    /(\d+)\s*(?:bed|bedroom|br)\b/i,
    /\b(\d+)\s*bd\b/i,
    /(\d+)BR/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return undefined
}

function extractBathrooms(text: string): string | undefined {
  const patterns = [
    /(?:bathrooms?|baths?)[\s:]*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)\b/i,
    /\b(\d+(?:\.\d+)?)\s*ba\b/i,
    /(\d+(?:\.\d+)?)BA/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return undefined
}

function extractSquareFootage(text: string): string | undefined {
  const patterns = [
    /(?:square\s*footage|sqft|sq\.?\s*ft)[\s:]*(\d{1,4}(?:,\d{3})*)/i,
    /(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft|sqft|square\s*feet?)/i,
    /(\d{1,4}(?:,\d{3})*)\s*ft²/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].replace(/,/g, '')
  }
  return undefined
}

function extractRent(text: string): string | undefined {
  const patterns = [
    /(?:monthly\s*rent|rent)[\s:]*\$?(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/?\s*mo|per\s*month|monthly)/i,
    /rent[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$(\d{3,4}(?:,\d{3})*)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].replace(/,/g, '')
  }
  return undefined
}

function extractAddress(text: string): string | undefined {
  const patterns = [
    /(?:address|street\s*address)[\s:]*([^\n\r]+)/i,
    /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)\b/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1] ? match[1].trim() : match[0].trim()
  }
  return undefined
}

function extractAddressLine1(text: string): string | undefined {
  const patterns = [
    /address\s*line\s*1[\s:]*([^\n\r]+)/i,
    /address\s*1[\s:]*([^\n\r]+)/i,
    /•?\s*address\s*line\s*1[\s:]*([^\n\r]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

function extractAddressLine2(text: string): string | undefined {
  const patterns = [
    /address\s*line\s*2[\s:]*([^\n\r]+)/i,
    /address\s*2[\s:]*([^\n\r]+)/i,
    /•?\s*address\s*line\s*2[\s:]*([^\n\r]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

function extractCity(text: string): string | undefined {
  const patterns = [
    /(?:^|\n|\r).*?city[\s:]*([^\n\r,]+)/i,
    /•?\s*city[\s:]*([^\n\r,]+)/i,
    /([A-Za-z\s]+),\s*([A-Z]{2})/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const city = match[1].trim()
      // Remove any trailing punctuation or extra characters
      return city.replace(/[.,;:]$/, '').trim()
    }
  }
  return undefined
}

function extractState(text: string): string | undefined {
  const patterns = [
    /(?:^|\n|\r).*?state[\s:]*([^\n\r,]+)/i,
    /•?\s*state[\s:]*([^\n\r,]+)/i,
    /[A-Za-z\s]+,\s*([A-Z]{2})\b/i,
    /\b([A-Z]{2})\s*\d{5}/i // State before ZIP
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const state = match[1].trim()
      return state.length === 2 ? state.toUpperCase() : state
    }
  }
  return undefined
}

function extractZipCode(text: string): string | undefined {
  const patterns = [
    /(?:zip\s*code|postal\s*code|zip)[\s:]*(\d{5}(?:-\d{4})?)/i,
    /•?\s*zip\s*code[\s:]*(\d{5}(?:-\d{4})?)/i,
    /\b(\d{5}(?:-\d{4})?)\b/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return undefined
}

function extractYearBuilt(text: string): string | undefined {
  const patterns = [
    /built[\s:]*(\d{4})/i,
    /year[\s:]*(\d{4})/i,
    /(\d{4})\s*built/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const year = parseInt(match[1])
      if (year >= 1800 && year <= new Date().getFullYear()) {
        return match[1]
      }
    }
  }
  return undefined
}

function extractSecurityDeposit(text: string): string | undefined {
  const patterns = [
    /security\s*deposit[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i,
    /deposit[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].replace(/,/g, '')
  }
  return undefined
}

function extractPetDeposit(text: string): string | undefined {
  const patterns = [
    /pet\s*deposit[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i,
    /pet\s*fee[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].replace(/,/g, '')
  }
  return undefined
}

function extractApplicationFee(text: string): string | undefined {
  const patterns = [
    /application\s*fee[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i,
    /app\s*fee[\s:]*\$(\d{1,2}(?:,\d{3})*(?:\.\d{2})?)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].replace(/,/g, '')
  }
  return undefined
}

function extractAmenities(text: string): string[] {
  const amenityKeywords = [
    'parking', 'garage', 'pool', 'gym', 'fitness', 'laundry', 'washer', 'dryer',
    'dishwasher', 'air conditioning', 'ac', 'heating', 'balcony', 'patio',
    'elevator', 'doorman', 'concierge', 'rooftop', 'garden', 'yard', 'deck'
  ]
  
  const foundAmenities: string[] = []
  const lowerText = text.toLowerCase()
  
  for (const amenity of amenityKeywords) {
    if (lowerText.includes(amenity)) {
      foundAmenities.push(amenity)
    }
  }
  
  return foundAmenities
}

function extractTitle(text: string): string | undefined {
  // Look for explicit listing title
  const titlePatterns = [
    /(?:listing\s*title|title)[\s:]*([^\n\r]+)/i,
    /•?\s*listing\s*title[\s:]*([^\n\r]+)/i
  ]
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  
  // If no explicit title, generate one from property info
  const propertyType = extractPropertyType(text)
  const bedrooms = extractBedrooms(text)
  const city = extractCity(text)
  
  if (propertyType || bedrooms || city) {
    let title = ''
    
    if (bedrooms && bedrooms !== '0') {
      title += `${bedrooms}BR `
    } else if (bedrooms === '0') {
      title += 'Studio '
    }
    
    if (propertyType) {
      title += propertyType.charAt(0).toUpperCase() + propertyType.slice(1) + ' '
    }
    
    if (city) {
      title += `in ${city}`
    }
    
    return title.trim() || undefined
  }
  
  return undefined
}

function extractDescription(text: string): string | undefined {
  // Look for explicit description
  const descPatterns = [
    /(?:description|details)[\s:]*([^\n\r]+(?:\n[^\n\r]+)*)/i,
    /•?\s*description[\s:]*([^\n\r]+)/i
  ]
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  
  // Look for descriptive text that might be a property description
  const lines = text.split('\n')
  const longLines = lines.filter(line => {
    const trimmed = line.trim()
    return trimmed.length > 50 && 
           !trimmed.match(/^(address|city|state|zip|bedrooms|bathrooms|rent|deposit)/i) &&
           !trimmed.match(/^•?\s*(address|city|state|zip|bedrooms|bathrooms|rent|deposit)/i)
  })
  
  if (longLines.length > 0) {
    return longLines[0].trim()
  }
  return undefined
}

function extractAvailableDate(text: string): string | undefined {
  const patterns = [
    /(?:available\s*date|availability)[\s:]*([^\n\r]+)/i,
    /•?\s*available\s*date[\s:]*([^\n\r]+)/i,
    /available[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /available[\s:]*(\d{4}-\d{2}-\d{2})/i,
    /move[\s-]?in[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const { extractedTexts, context } = await request.json()

    if (!extractedTexts || !Array.isArray(extractedTexts)) {
      return Response.json(
        { error: 'Invalid extracted texts provided' },
        { status: 400 }
      )
    }

    // Combine all extracted texts from OCR
    const combinedText = extractedTexts.join('\n\n--- NEW IMAGE ---\n\n')
    
    console.log('Combined OCR text:', combinedText)

    // Simple text parsing using regex patterns - no AI needed
    const extractedData: ExtractedPropertyData = {
      propertyType: extractPropertyType(combinedText),
      bedrooms: extractBedrooms(combinedText),
      bathrooms: extractBathrooms(combinedText),
      squareFootage: extractSquareFootage(combinedText),
      monthlyRent: extractRent(combinedText),
      address: extractAddress(combinedText),
      addressLine1: extractAddressLine1(combinedText),
      addressLine2: extractAddressLine2(combinedText),
      city: extractCity(combinedText),
      state: extractState(combinedText),
      zipCode: extractZipCode(combinedText),
      description: extractDescription(combinedText),
      listingTitle: extractTitle(combinedText),
      availableDate: extractAvailableDate(combinedText),
      amenities: extractAmenities(combinedText),
      yearBuilt: extractYearBuilt(combinedText),
      securityDeposit: extractSecurityDeposit(combinedText),
      petDeposit: extractPetDeposit(combinedText),
      applicationFee: extractApplicationFee(combinedText),
      confidence: 0.8 // Will be recalculated below
    }
    
    console.log('Initial extracted data:', extractedData)

    // Calculate confidence based on structured data indicators and field weights
    let confidence = 0
    let totalWeight = 0
    
    // Define field weights (essential fields have higher weights)
    const fieldWeights = {
      addressLine1: 15,
      city: 15,
      state: 12,
      zipCode: 12,
      addressLine2: 8,
      address: 8,
      bedrooms: 8,
      bathrooms: 6,
      propertyType: 6,
      monthlyRent: 8,
      squareFootage: 4,
      listingTitle: 6,
      description: 3,
      yearBuilt: 2,
      availableDate: 3,
      securityDeposit: 2,
      petDeposit: 2,
      applicationFee: 2,
      amenities: 2
    }
    
    // Check if we have structured format indicators
    const hasStructuredFormat = /address\s*line\s*[12]|city[\s:]+|state[\s:]+|zip\s*code[\s:]+/i.test(combinedText)
    console.log('Has structured format indicators:', hasStructuredFormat)
    
    // Calculate weighted confidence
    for (const [field, weight] of Object.entries(fieldWeights)) {
      totalWeight += weight
      const value = extractedData[field as keyof ExtractedPropertyData]
      
      if (value !== undefined && value !== null && 
          (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0)) {
        confidence += weight
        console.log(`Field ${field}: "${value}" (weight: ${weight})`)
      }
    }
    
    // Base confidence from weighted fields
    let finalConfidence = confidence / totalWeight
    
    // Bonus for structured format
    if (hasStructuredFormat) {
      finalConfidence += 0.15
      console.log('Structured format bonus applied')
    }
    
    // Bonus for having complete address
    if (extractedData.addressLine1 && extractedData.city && extractedData.state && extractedData.zipCode) {
      finalConfidence += 0.1
      console.log('Complete address bonus applied')
    }
    
    // Bonus for having property basics
    if (extractedData.bedrooms && extractedData.bathrooms && extractedData.propertyType) {
      finalConfidence += 0.05
      console.log('Property basics bonus applied')
    }
    
    // Cap confidence at 95%
    extractedData.confidence = Math.min(0.95, Math.max(0.1, finalConfidence))
    
    console.log(`Final confidence: ${Math.round(extractedData.confidence * 100)}%`)
    console.log('Final extracted data:', extractedData)

    return Response.json(extractedData)

  } catch (error) {
    console.error('Text extraction error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 