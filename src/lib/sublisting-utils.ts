// Utility functions for handling sublisting data and submission

export interface SublistingData {
  // Property Information (same structure as properties table)
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  // Property Details (same as properties table)
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: number;
  halfBathrooms?: number;
  parkingSpaces?: number;
  garageSpaces?: number;
  hasBasement?: boolean;
  hasAttic?: boolean;
  propertyStatus?: string;
  description?: string;

  // Listing Details (same as property_listings table)
  monthlyRent: number;
  securityDeposit?: number;
  petDeposit?: number;
  applicationFee?: number;
  minimumLeaseTerm?: number;
  maximumLeaseTerm?: number;
  availableDate?: string;
  listingTitle?: string;
  listingDescription?: string;
  listingStatus?: string;

  // Sublease specific fields
  subleaseFileName?: string;
  subleaseFileUrl?: string;
}

/**
 * Collects all subletting data from localStorage
 */
export function collectSublistingData(): SublistingData | null {
  if (typeof window === 'undefined') return null;

  try {
    // Collect data from different localStorage keys
    const propertyInfoData = localStorage.getItem('sell-create-form-data');
    const rentDetailsData = localStorage.getItem('sublet-rent-details');
    const feesData = localStorage.getItem('sublet-additional-fees');
    const amenitiesData = localStorage.getItem('sublet-amenities');
    const extractedData = localStorage.getItem('extracted-data-new');
    const subleaseFileName = sessionStorage.getItem('subleaseFileName');

    let propertyInfo = {};
    let rentDetails = {};
    let fees: any[] = [];
    let amenities: any[] = [];
    let extracted = {};

    // Parse each data source
    if (propertyInfoData) {
      propertyInfo = JSON.parse(propertyInfoData);
    }

    if (rentDetailsData) {
      rentDetails = JSON.parse(rentDetailsData);
    }

    if (feesData) {
      const parsedFees = JSON.parse(feesData);
      fees = Object.entries(parsedFees)
        .filter(([_, amount]) => amount && parseFloat(amount as string) > 0)
        .map(([type, amount]) => ({
          type: type.replace('Fee', '').toLowerCase(),
          amount: parseFloat(amount as string),
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} fee`
        }));
    }

    if (amenitiesData) {
      amenities = JSON.parse(amenitiesData);
    }

    if (extractedData) {
      extracted = JSON.parse(extractedData);
    }

    // Merge all data with priority: manual input > extracted data > defaults
    const mergedData: SublistingData = {
      // Property Information (same structure as properties table)
      addressLine1: (extracted as any).address_line_1 || (propertyInfo as any).addressLine1 || '',
      addressLine2: (extracted as any).address_line_2 || (propertyInfo as any).addressLine2 || '',
      city: (extracted as any).city || (propertyInfo as any).city || '',
      state: (extracted as any).state || (propertyInfo as any).state || '',
      zipCode: (extracted as any).zip_code || (propertyInfo as any).zipCode || '',
      country: 'United States',
      
      // Property Details (same as properties table)
      bedrooms: parseInt((extracted as any).bedrooms || (propertyInfo as any).beds || '1'),
      bathrooms: parseFloat((extracted as any).bathrooms || (propertyInfo as any).baths || '1'),
      propertyType: (extracted as any).property_type || (propertyInfo as any).propertyType || 'apartment',
      yearBuilt: (extracted as any).year_built || (propertyInfo as any).yearBuilt ? parseInt((extracted as any).year_built || (propertyInfo as any).yearBuilt) : undefined,
      squareFootage: (extracted as any).square_footage || (propertyInfo as any).squareFootage ? parseInt((extracted as any).square_footage || (propertyInfo as any).squareFootage) : undefined,
      halfBathrooms: 0,
      parkingSpaces: 0,
      garageSpaces: 0,
      hasBasement: false,
      hasAttic: false,
      propertyStatus: 'available',
      description: (extracted as any).description || (propertyInfo as any).description || '',

      // Listing Details (same as property_listings table)
      monthlyRent: parseFloat((rentDetails as any).monthly_rent || '0'),
      securityDeposit: (rentDetails as any).security_deposit ? parseFloat((rentDetails as any).security_deposit) : undefined,
      petDeposit: (rentDetails as any).pet_deposit ? parseFloat((rentDetails as any).pet_deposit) : undefined,
      applicationFee: (rentDetails as any).application_fee ? parseFloat((rentDetails as any).application_fee) : undefined,
      minimumLeaseTerm: (rentDetails as any).minimum_lease_term ? parseInt((rentDetails as any).minimum_lease_term) : 12,
      maximumLeaseTerm: (rentDetails as any).maximum_lease_term ? parseInt((rentDetails as any).maximum_lease_term) : 12,
      availableDate: (rentDetails as any).available_date,
      listingTitle: (rentDetails as any).listing_title,
      listingDescription: (rentDetails as any).listing_description,
      listingStatus: 'draft',

      // Sublease specific
      subleaseFileName: subleaseFileName || undefined,
    };

    // Validate required fields
    if (!mergedData.addressLine1 || !mergedData.city || !mergedData.state || !mergedData.zipCode || !mergedData.monthlyRent) {
      console.warn('Missing required fields for sublisting:', mergedData);
      return null;
    }

    return mergedData;
  } catch (error) {
    console.error('Error collecting sublisting data:', error);
    return null;
  }
}

/**
 * Submits sublisting data to the API
 */
export async function submitSublisting(data: SublistingData): Promise<{ success: boolean; sublistingId?: string; error?: string }> {
  try {
    const response = await fetch('/api/sublistings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to create sublisting' };
    }

    return { success: true, sublistingId: result.sublisting.id };
  } catch (error) {
    console.error('Error submitting sublisting:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

/**
 * Clears all sublisting data from localStorage
 */
export function clearSublistingData(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove = [
    'sell-create-form-data',
    'sublet-rent-details',
    'sublet-additional-fees',
    'extracted-data-new',
    'extracted-data-start-page',
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Also clear session storage
  sessionStorage.removeItem('subleaseFileName');
  
  console.log('Sublisting data cleared from localStorage');
}
