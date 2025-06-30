'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import { createClient } from '@/utils/supabase/client';

interface PropertyData {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  property_listings?: {
    monthly_rent: number;
  }[];
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) {
        router.push('/sell/create');
        return;
      }

      try {
        const supabase = createClient();
        
        // Fetch property data with associated listing
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            property_listings (
              monthly_rent
            )
          `)
          .eq('id', propertyId)
          .single();

        if (error) {
          console.error('Error fetching property data:', error);
          return;
        }

        setPropertyData(data);
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [propertyId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading property details...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!propertyData) {
    return (
      <main className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">Property not found</div>
          </div>
        </div>
      </main>
    );
  }

  // Format address
  const fullAddress = `${propertyData.address_line_1}${propertyData.address_line_2 ? `, ${propertyData.address_line_2}` : ''}`;
  const cityStateZip = `${propertyData.zip_code} ${propertyData.city}, ${propertyData.state}`;
  
  // Get rent from property listings (if available)
  const monthlyRent = propertyData.property_listings?.[0]?.monthly_rent;
  const rentDisplay = monthlyRent ? `$${monthlyRent.toLocaleString()}` : '$--';

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Review Listing</h1>
          <button 
            onClick={() => router.push('/sell/dashboard')}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={7} propertyId={propertyId} />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Property Summary */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{fullAddress}</h2>
            <p className="text-gray-600 mb-1">{cityStateZip}</p>
            <p className="text-gray-600">
              {rentDisplay} /mo | {propertyData.bedrooms} Bd | {propertyData.bathrooms} Ba | {propertyData.square_footage?.toLocaleString() || '--'} sqft
            </p>
          </div>

          {/* Section Navigation */}
          <div>
            <h3 className="text-2xl font-bold mb-8">Return to any previous sections</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link 
                href={`/sell/create?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Property Info
              </Link>
              <Link 
                href={`/sell/create/rent-details?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Rent Details
              </Link>
              <Link 
                href={`/sell/create/media?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Media
              </Link>
              <Link 
                href={`/sell/create/amenities?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Amenities
              </Link>
              <Link 
                href={`/sell/create/screening?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Screening
              </Link>
              <Link 
                href={`/sell/create/costs-and-fees?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Costs and Fees
              </Link>
              <Link 
                href={`/sell/create/final-details?property_id=${propertyId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Final Details
              </Link>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button 
              onClick={() => router.push(`/sell/create/final-details?property_id=${propertyId}`)}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              onClick={() => router.push(`/sell/create/publish?property_id=${propertyId}`)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
