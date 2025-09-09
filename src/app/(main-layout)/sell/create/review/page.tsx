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
  property_images?: {
    id: string;
    file_url?: string;
    s3_key?: string;
    image_order?: number;
    display_order?: number;
    is_primary?: boolean;
    room_type?: string;
    alt_text?: string;
  }[];
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const mode = searchParams.get('mode'); // Check for sublet mode

  // Check both URL parameter and session storage for sublet mode
  const isSubletMode = mode === 'sublet' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('subletting_mode') === 'true');

  const sublistingId = searchParams.get('sublisting_id');
  const entityId = isSubletMode ? sublistingId : propertyId;

  // Auto-redirect to add mode parameter if missing but sublet mode detected
  useEffect(() => {
    if (isSubletMode && !mode && entityId) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('mode', 'sublet');
      router.replace(currentUrl.pathname + currentUrl.search);
    }
  }, [isSubletMode, mode, entityId, router]);
  
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!entityId) {
        const redirectPath = isSubletMode ? '/sell/create?mode=sublet' : '/sell/create';
        router.push(redirectPath);
        return;
      }

      try {
        const supabase = createClient();

        if (isSubletMode) {
          // Fetch sublisting data with associated listing and images
          const { data, error } = await supabase
            .from('sublistings')
            .select(`
              *,
              sublisting_listings (
                monthly_rent,
                listing_title,
                listing_description
              ),
              sublisting_media (
                id,
                file_url,
                display_order,
                file_type,
                file_size,
                file_name
              )
            `)
            .eq('id', entityId)
            .single();

          if (error) {
            console.error('Error fetching sublisting data:', error);
            return;
          }

          // Transform sublisting data to match PropertyData interface
          const transformedData = {
            id: data.id,
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            square_footage: data.square_footage,
            property_listings: data.sublisting_listings ? [{
              monthly_rent: data.sublisting_listings[0]?.monthly_rent || 0
            }] : [],
            property_images: data.sublisting_media || []
          };

          // Fetch landlord data separately if landlord_id exists
          let landlordData = null;
          if (data.landlord_id) {
            try {
              // Try to get user data from auth instead of landlords table
              const { data: { user }, error: userError } = await supabase.auth.getUser();

              if (!userError && user) {
                // Use user data for sublease owner
                landlordData = {
                  id: data.landlord_id,
                  business_name: `Sublease Owner (${user.email?.split('@')[0] || 'User'})`,
                  business_phone: '',
                  business_email: user.email || '',
                  identity_verified: false,
                  customers: {
                    first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
                    last_name: user.user_metadata?.last_name || '',
                    phone_number: user.phone || '',
                    profile_image_s3_key: user.user_metadata?.avatar_url || null
                  }
                };
              } else {
                console.warn('Could not fetch user data:', userError);
                // Create a placeholder landlord data structure
                landlordData = {
                  id: data.landlord_id,
                  business_name: 'Sublease Owner',
                  business_phone: '',
                  business_email: '',
                  identity_verified: false,
                  customers: null
                };
              }
            } catch (error) {
              console.warn('Error fetching landlord data:', error);
              landlordData = {
                id: data.landlord_id,
                business_name: 'Sublease Owner',
                business_phone: '',
                business_email: '',
                identity_verified: false,
                customers: null
              };
            }
          }

          // Add landlord data to transformed data
          transformedData.landlords = landlordData;

          setPropertyData(transformedData);
        } else {
          // Fetch property data with associated listing and images
          const { data, error } = await supabase
            .from('properties')
            .select(`
              *,
              property_listings (
                monthly_rent
              ),
              property_images (
                id,
                s3_key,
                image_order,
                is_primary,
                image_type,
                room_type,
                alt_text
              )
            `)
            .eq('id', entityId)
            .single();

          if (error) {
            console.error('Error fetching property data:', error);
            return;
          }

          setPropertyData(data);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [entityId, router, isSubletMode]);

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

  // Get landlord information for subletting
  const landlord = isSubletMode ? propertyData.landlords : null;
  const customer = landlord?.customers;
  const landlordDisplayName = landlord?.business_name ||
    (customer ? `${customer.first_name} ${customer.last_name}` : 'Property Owner');

  const landlordContact = landlord?.business_phone ||
    landlord?.business_email ||
    customer?.phone_number ||
    'Contact via platform';

  const landlordInitial = landlordDisplayName.charAt(0).toUpperCase();

  // Check if landlord is verified
  const isVerified = landlord?.identity_verified || false;

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Review Listing</h1>
          <button 
            onClick={() => router.push(isSubletMode ? '/sublist/dashboard' : '/sell/dashboard')}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={7} propertyId={entityId} mode={mode} />

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

          {/* Property Images */}
          {propertyData.property_images && propertyData.property_images.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">Property Photos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propertyData.property_images
                    .sort((a, b) => (a.image_order || a.display_order || 0) - (b.image_order || b.display_order || 0))
                    .map((image) => {
                      let src;

                      if (image.file_url && image.file_url.startsWith('https://')) {
                        // For subletting images, file_url is already a complete URL
                        src = image.file_url;
                      } else if (image.s3_key) {
                        // For regular property images, s3_key needs to be converted to public URL
                        const supabase = createClient();
                        const { data: { publicUrl } } = supabase.storage
                          .from('property-images')
                          .getPublicUrl(image.s3_key);
                        src = publicUrl;
                      } else {
                        // Fallback
                        src = '';
                      }

                      return (
                        <div key={image.id} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={src}
                            alt={image.alt_text || `Property photo`}
                            className="w-full h-full object-cover"
                          />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                            Primary
                          </div>
                        )}
                        {image.room_type && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {image.room_type.charAt(0).toUpperCase() + image.room_type.slice(1).replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Listed by Property Owner (for subletting) */}
          {isSubletMode && landlord && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">Listed by Property Owner</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">{landlordInitial}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{landlordDisplayName}</h3>
                    {isVerified && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600">{landlordContact}</p>
                  {landlord.business_name && customer && (
                    <p className="text-sm text-gray-500 mt-1">
                      Owner: {customer.first_name} {customer.last_name}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Section Navigation */}
          <div>
            <h3 className="text-2xl font-bold mb-8">Return to any previous sections</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href={isSubletMode ? `/sell/create?sublisting_id=${entityId}&mode=sublet` : `/sell/create?property_id=${entityId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Property Info
              </Link>
              <Link
                href={isSubletMode ? `/sell/create/rent-details?sublisting_id=${entityId}&mode=sublet` : `/sell/create/rent-details?property_id=${entityId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Rent Details
              </Link>
              <Link
                href={isSubletMode ? `/sell/create/media?sublisting_id=${entityId}&mode=sublet` : `/sell/create/media?property_id=${entityId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Media
              </Link>
              <Link
                href={isSubletMode ? `/sell/create/amenities?sublisting_id=${entityId}&mode=sublet` : `/sell/create/amenities?property_id=${entityId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Amenities
              </Link>
              <Link
                href={isSubletMode ? `/sell/create/costs-and-fees?sublisting_id=${entityId}&mode=sublet` : `/sell/create/costs-and-fees?property_id=${entityId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Costs and Fees
              </Link>
              <Link
                href={isSubletMode ? `/sell/create/final-details?sublisting_id=${entityId}&mode=sublet` : `/sell/create/final-details?property_id=${entityId}`}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center font-semibold"
              >
                Final Details
              </Link>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={() => {
                const paramName = isSubletMode ? 'sublisting_id' : 'property_id';
                const backPath = entityId
                  ? `/sell/create/final-details?${paramName}=${entityId}${isSubletMode ? '&mode=sublet' : ''}`
                  : `/sell/create/final-details${isSubletMode ? '?mode=sublet' : ''}`;
                router.push(backPath);
              }}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button
              onClick={() => {
                const paramName = isSubletMode ? 'sublisting_id' : 'property_id';
                const nextPath = entityId
                  ? `/sell/create/publish?${paramName}=${entityId}${isSubletMode ? '&mode=sublet' : ''}`
                  : `/sell/create/publish${isSubletMode ? '?mode=sublet' : ''}`;
                router.push(nextPath);
              }}
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
