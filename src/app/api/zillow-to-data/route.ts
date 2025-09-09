import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { zillowUrl } = await request.json();

    if (!zillowUrl) {
      return NextResponse.json({ error: 'Zillow URL is required' }, { status: 400 });
    }

    // Validate Zillow URL and extract property ID (ZPID)
    const isValidZillowUrl = zillowUrl.includes('zillow.com') && zillowUrl.includes('/homedetails/');
    if (!isValidZillowUrl) {
      return NextResponse.json({ 
        error: 'Please provide a valid Zillow property URL (e.g., https://www.zillow.com/homedetails/...)' 
      }, { status: 400 });
    }

    // Extract ZPID (Zillow Property ID) from URL
    const zpidMatch = zillowUrl.match(/\/(\d+)_zpid\//);
    if (!zpidMatch) {
      return NextResponse.json({
        error: 'Unable to extract property ID from Zillow URL. Please make sure the URL contains a property ID (_zpid).',
      }, { status: 400 });
    }

    const zpid = zpidMatch[1];
    console.log('Extracted ZPID:', zpid);

    // Check if we have Zillow API credentials
    const zillowApiKey = process.env.ZILLOW_API_KEY;
    if (!zillowApiKey) {
      return NextResponse.json({
        error: 'Zillow API integration not configured',
        suggestion: 'Administrator needs to set up Zillow API credentials. Meanwhile, try taking a screenshot of the Zillow page and using the image upload feature.',
        fallbackInstructions: {
          title: '📋 Alternative Import Method',
          steps: [
            'Open the Zillow property page in a new tab',
            'Take a screenshot (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)', 
            'Upload the screenshot using the "Media Upload" section',
            'Our AI will automatically extract all property details!'
          ]
        }
      }, { status: 501 });
    }

    // Use Zillow's GetSearchResults API (example - you'll need to adapt based on actual API)
    // Note: Zillow has different API endpoints for different purposes
    const zillowApiUrl = `https://www.zillowwebservice.com/GetZestimate.htm?zws-id=${zillowApiKey}&zpid=${zpid}`;
    
    try {
      const response = await fetch(zillowApiUrl);
      
      if (!response.ok) {
        throw new Error(`Zillow API request failed: ${response.status}`);
      }

      const xmlData = await response.text();
      
      // Parse XML response from Zillow API
      const extractedData = parseZillowXML(xmlData, zpid);
      
      if (Object.keys(extractedData).length < 2) {
        return NextResponse.json({
          error: 'Limited data available from Zillow API for this property',
          suggestion: 'Try using the screenshot method for more complete data extraction',
          partialData: extractedData
        }, { status: 422 });
      }

      console.log('Extracted Zillow API data:', extractedData);
      return NextResponse.json(extractedData);

    } catch (apiError) {
      console.error('Zillow API error:', apiError);
      
      // Fallback to screenshot method recommendation
      return NextResponse.json({
        error: 'Unable to access Zillow API for this property',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error',
        suggestion: 'Please use the screenshot method instead',
        fallbackInstructions: {
          title: '📸 Recommended Alternative',
          description: 'Screenshot method works more reliably and extracts more complete data',
          steps: [
            'Take a screenshot of the full Zillow property page',
            'Upload it using the Media Upload section below',
            'Our AI will extract all visible property details automatically'
          ]
        }
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error processing Zillow request:', error);
    return NextResponse.json({
      error: 'Failed to process Zillow request',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Try the screenshot upload method instead - it\'s more reliable!'
    }, { status: 500 });
  }
}

function parseZillowXML(xmlData: string, zpid: string): Record<string, string> {
  const data: Record<string, string> = {};

  try {
    // Basic XML parsing for Zillow API response
    // Note: You might want to use a proper XML parser library like 'fast-xml-parser'
    
    // Extract address information
    const addressMatch = xmlData.match(/<address>[\s\S]*?<street>([^<]+)<\/street>[\s\S]*?<city>([^<]+)<\/city>[\s\S]*?<state>([^<]+)<\/state>[\s\S]*?<zipcode>([^<]+)<\/zipcode>[\s\S]*?<\/address>/);
    if (addressMatch) {
      data.address_line_1 = addressMatch[1];
      data.city = addressMatch[2];
      data.state = addressMatch[3];
      data.zip_code = addressMatch[4];
    }

    // Extract Zestimate (estimated value)
    const zestimateMatch = xmlData.match(/<zestimate>[\s\S]*?<amount[^>]*>(\d+)<\/amount>[\s\S]*?<\/zestimate>/);
    if (zestimateMatch) {
      // Convert Zestimate to rough monthly rent estimate (very rough calculation)
      const zestimate = parseInt(zestimateMatch[1]);
      const estimatedRent = Math.round(zestimate * 0.001); // Very rough 0.1% rule
      data.estimated_monthly_rent = estimatedRent.toString();
    }

    // Extract property details if available
    const bedroomsMatch = xmlData.match(/<bedrooms>(\d+)<\/bedrooms>/);
    if (bedroomsMatch) {
      data.bedrooms = bedroomsMatch[1];
    }

    const bathroomsMatch = xmlData.match(/<bathrooms>(\d+(?:\.\d+)?)<\/bathrooms>/);
    if (bathroomsMatch) {
      data.bathrooms = bathroomsMatch[1];
    }

    const sqftMatch = xmlData.match(/<finishedSqFt>(\d+)<\/finishedSqFt>/);
    if (sqftMatch) {
      data.square_footage = sqftMatch[1];
    }

    const yearBuiltMatch = xmlData.match(/<yearBuilt>(\d{4})<\/yearBuilt>/);
    if (yearBuiltMatch) {
      data.year_built = yearBuiltMatch[1];
    }

    // Add property type based on Zillow data
    const useCodeMatch = xmlData.match(/<useCode>([^<]+)<\/useCode>/);
    if (useCodeMatch) {
      data.property_type = mapZillowUseCode(useCodeMatch[1]);
    }

  } catch (parseError) {
    console.error('Error parsing Zillow XML:', parseError);
  }

  return data;
}

function mapZillowUseCode(useCode: string): string {
  const mapping: Record<string, string> = {
    'SingleFamily': 'house',
    'Condominium': 'condo',
    'Cooperative': 'condo',
    'Townhouse': 'townhouse',
    'MultiFamily2To4': 'duplex',
    'Apartment': 'apartment',
  };
  
  return mapping[useCode] || 'apartment';
}