'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import { createClient } from '@/utils/supabase/client';
import ImageLightbox from '@/src/components/ui/ImageLightbox';

interface PropertyFeature {
  id: string;
  feature_name: string;
  feature_category: string;
  feature_value: string;
}

interface PropertyImage {
  id: string;
  s3_key: string;
  image_order: number;
  alt_text?: string;
  is_primary: boolean;
  image_type?: string;
  room_type?: string;
}

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
  property_type: string;
  year_built?: number;
  description?: string;
  available_date?: string;
  property_listings?: {
    id: string;
    monthly_rent: number;
    listing_title?: string;
    listing_description?: string;
    available_date?: string;
    listing_status: string;
  }[];
  property_features?: PropertyFeature[];
  property_images?: PropertyImage[];
  landlords?: {
    id: string;
    business_name?: string;
    business_phone?: string;
    business_email?: string;
    identity_verified?: boolean;
    customers?: {
      first_name: string;
      last_name: string;
      phone_number?: string;
      profile_image_s3_key?: string;
    };
  };
}

export default function PublishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) {
        router.push('/sell/create');
        return;
      }

      try {
        const supabase = createClient();
        
        // Fetch comprehensive property data
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            property_listings (
              id,
              monthly_rent,
              listing_title,
              listing_description,
              available_date,
              listing_status
            ),
            property_features (
              id,
              feature_name,
              feature_category,
              feature_value
            ),
            property_images (
              id,
              s3_key,
              image_order,
              alt_text,
              is_primary,
              image_type,
              room_type
            ),
            landlords (
              id,
              business_name,
              business_phone,
              business_email,
              identity_verified,
              customers (
                first_name,
                last_name,
                phone_number,
                profile_image_s3_key
              )
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

  // Check if description needs "See more" button
  useEffect(() => {
    const currentListing = propertyData?.property_listings?.[0];
    if (descriptionRef.current && currentListing?.listing_description) {
      const element = descriptionRef.current;
      // Check if content is being truncated by comparing scroll height with client height
      const isOverflowing = element.scrollHeight > element.clientHeight;
      setShowSeeMore(isOverflowing);
    }
  }, [propertyData]);

  const handlePublishListing = async () => {
    if (!propertyData?.property_listings?.[0]) {
      alert('No listing found to publish. Please complete the listing setup first.');
      return;
    }

    const listing = propertyData.property_listings[0];
    
    // Check if listing is already active
    if (listing.listing_status === 'active') {
      alert('This listing is already published and active!');
      return;
    }

    setIsPublishing(true);

    try {
      const supabase = createClient();

      // Update the listing status to 'active'
      const { error } = await supabase
        .from('property_listings')
        .update({ 
          listing_status: 'active',
          list_date: new Date().toISOString().split('T')[0] // Set today as list date
        })
        .eq('id', listing.id);

      if (error) {
        console.error('Error publishing listing:', error);
        alert('Error publishing listing. Please try again.');
        setIsPublishing(false);
        return;
      }

      // Success! Redirect to dashboard
      alert('🎉 Listing published successfully!');
      router.push('/sell/dashboard');
      
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsPublishing(false);
    }
  };

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

  // Format data for display
  const fullAddress = `${propertyData.address_line_1}${propertyData.address_line_2 ? `, ${propertyData.address_line_2}` : ''}`;
  const cityStateZip = `${propertyData.city}, ${propertyData.state} ${propertyData.zip_code}`;
  const listing = propertyData.property_listings?.[0];
  const landlord = propertyData.landlords;
  
  // Group features by category
  const groupedFeatures = propertyData.property_features?.reduce((acc, feature) => {
    const category = feature.feature_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, PropertyFeature[]>) || {};

  // Format category names for display
  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format feature for user-friendly display
  const formatFeatureDisplay = (feature: PropertyFeature) => {
    const name = feature.feature_name.toLowerCase();
    const value = feature.feature_value?.toLowerCase();

    // Handle boolean values
    if (value === 'true' || value === 'false') {
      return value === 'true' ? formatFeatureName(feature.feature_name) : null;
    }

    // Handle specific feature mappings for natural language
    const featureMap: Record<string, Record<string, string | null>> = {
      // Pet policies
      'pets': {
        'allowed': 'Pet-Friendly',
        'cats_only': 'Cats Welcome',
        'dogs_only': 'Dog-Friendly', 
        'not_allowed': null, // Hide negative pet policy
        'no_pets': null,
        'small_pets': 'Small Pets Welcome'
      },
      
      // Laundry
      'laundry': {
        'in_unit': 'In-Unit Laundry',
        'in_building': 'Laundry Facilities',
        'none': null // Hide if no laundry
      },
      
      // Parking
      'parking': {
        'garage': 'Garage Parking',
        'covered': 'Covered Parking',
        'street': 'Street Parking',
        'assigned': 'Assigned Parking',
        'available': 'Parking Available',
        'none': null
      },
      
      // Heating
      'heating': {
        'central': 'Central Heating',
        'gas': 'Gas Heat',
        'electric': 'Electric Heat',
        'forced_air': 'Forced Air Heating',
        'baseboard': 'Baseboard Heating',
        'heat_pump': 'Heat Pump',
        'wall': 'Wall Heater',
        'radiator': 'Radiator Heat',
        'none': null
      },
      
      // Cooling/AC
      'cooling': {
        'central': 'Central Air Conditioning',
        'wall': 'Wall AC Units',
        'window': 'Window AC Units',
        'none': null
      },
      
      // Flooring
      'flooring': {
        'hardwood': 'Hardwood Floors',
        'carpet': 'Carpeted Floors',
        'tile': 'Tile Flooring',
        'laminate': 'Laminate Flooring',
        'vinyl': 'Vinyl Flooring'
      }
    };

    // Specific feature name mappings for better display
    const specificFeatureNames: Record<string, string> = {
      // Building Amenities
      'gym': 'Fitness Center',
      'pool': 'Swimming Pool',
      'elevator': 'Elevator Access',
      'parking': 'Parking Available',
      
      // Appliances
      'dishwasher': 'Dishwasher',
      'freezer': 'Freezer',
      'microwave': 'Microwave',
      'oven': 'Oven',
      'refrigerator': 'Refrigerator',
      
      // Interior Features
      'furnished': 'Fully Furnished',
      
      // Exterior Features
      'balcony': 'Private Balcony',
      'patio': 'Private Patio',
      'yard': 'Private Yard',
      'garden': 'Garden Access'
    };

    // Check if this feature has a specific mapping
    for (const [featureType, mappings] of Object.entries(featureMap)) {
      if (name.includes(featureType) && value && mappings[value] !== undefined) {
        return mappings[value]; // Returns null for hidden features
      }
    }

    // Check for specific feature name mappings
    const featureKey = name.split('_').pop() || name; // Get the last part of the feature name
    if (specificFeatureNames[featureKey]) {
      return specificFeatureNames[featureKey];
    }

    // Handle generic features with values
    if (value && value !== 'available' && value !== 'true' && value !== 'false') {
      return `${formatFeatureName(feature.feature_name)}: ${formatValue(value)}`;
    }

    // Default: just show the formatted feature name
    return formatFeatureName(feature.feature_name);
  };

  // Helper function to format feature names
  const formatFeatureName = (name: string) => {
    return name
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to format values
  const formatValue = (value: string) => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get landlord display name and contact
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

  // Prepare images for lightbox
  const galleryImages = (propertyData.property_images || [])
    .sort((a, b) => a.image_order - b.image_order)
    .map((image) => {
      const supabase = createClient();
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(image.s3_key);
      return { src: publicUrl, alt: image.alt_text };
    });

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Publish Listing</h1>
            {listing && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  listing.listing_status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : listing.listing_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {listing.listing_status.charAt(0).toUpperCase() + listing.listing_status.slice(1)}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => router.push('/sell/dashboard')}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={8} propertyId={propertyId} />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* What's Unique Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">What&apos;s Unique</h2>
            <p className="text-lg mb-2">
              {listing?.listing_title || `${propertyData.property_type.charAt(0).toUpperCase() + propertyData.property_type.slice(1)} for Rent`}
            </p>
            <p className="text-gray-600 mb-2">{fullAddress}</p>
            <p className="text-gray-600 mb-2">
              {propertyData.bedrooms} BR/{propertyData.bathrooms} BA: ${listing?.monthly_rent?.toLocaleString() || '--'}/month
            </p>
            {listing?.available_date && (
              <p className="text-gray-600 mb-4">
                Available from {new Date(listing.available_date).toLocaleDateString()}
              </p>
            )}
            {listing?.listing_description && (
              <div className="mb-4">
                <p 
                  ref={descriptionRef}
                  className={`text-gray-700 ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}
                >
                  {listing.listing_description}
                </p>
                {showSeeMore && (
                  <button 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-blue-600 font-medium mt-2 hover:text-blue-800 transition-colors"
                  >
                    {isDescriptionExpanded ? 'See less' : 'See more'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Property Images Gallery */}
          {propertyData.property_images && propertyData.property_images.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">Property Photos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propertyData.property_images
                  .sort((a, b) => a.image_order - b.image_order)
                  .map((image, index) => {
                    const supabase = createClient();
                    const { data: { publicUrl } } = supabase.storage
                      .from('property-images')
                      .getPublicUrl(image.s3_key);
                    
                    return (
                      <div key={image.id} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}>
                        <Image
                          src={publicUrl}
                          alt={image.alt_text || `Property photo ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                        {/* View Hint Icon */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 md:hover:bg-black/20 transition bg-opacity-0">
                          <Eye className="w-6 h-6 text-white opacity-0 hover:opacity-100 md:group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Listed by Property Owner */}
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
                {landlord?.business_name && customer && (
                  <p className="text-sm text-gray-500 mt-1">
                    Owner: {customer.first_name} {customer.last_name}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Facts, Features, and Properties */}
          {Object.keys(groupedFeatures).length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-blue-700 mb-6">Facts, Features, and Properties</h2>
              
              {/* Building Amenities */}
              {groupedFeatures.building_amenities && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 bg-gray-50 p-3">Building Amenities</h3>
                  <ul className="list-disc pl-8">
                    {[...new Set(groupedFeatures.building_amenities
                      .map((feature) => formatFeatureDisplay(feature))
                      .filter(Boolean))] // Remove duplicates and null values
                      .map((displayText, index) => (
                        <li key={index} className="text-gray-700 mb-1">
                          {displayText}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Other Feature Categories */}
              {Object.entries(groupedFeatures)
                .filter(([category]) => category !== 'building_amenities')
                .map(([category, features]) => {
                  const displayFeatures = [...new Set(features
                    .map((feature) => formatFeatureDisplay(feature))
                    .filter(Boolean))]; // Remove duplicates and null values
                  
                  // Only show category if it has features to display
                  if (displayFeatures.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 bg-gray-50 p-3">
                        {formatCategoryName(category)}
                      </h3>
                      <ul className="list-disc pl-8">
                        {displayFeatures.map((displayText, index) => (
                          <li key={index} className="text-gray-700 mb-1">
                            {displayText}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
                .filter(Boolean) // Remove null categories
              }
            </section>
          )}

          {/* Property Details Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Property Details</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Property Type:</span>
                  <p className="text-gray-600 capitalize">{propertyData.property_type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Square Footage:</span>
                  <p className="text-gray-600">{propertyData.square_footage?.toLocaleString() || 'Not specified'} sqft</p>
                </div>
                {propertyData.year_built && (
                  <div>
                    <span className="font-medium text-gray-700">Year Built:</span>
                    <p className="text-gray-600">{propertyData.year_built}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p className="text-gray-600">{cityStateZip}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Buttons */}
          <div className="flex justify-end items-center gap-4 mt-12">
            <button 
              onClick={() => router.push(`/sell/create/review?property_id=${propertyId}`)}
              className="px-8 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={handlePublishListing}
              disabled={isPublishing || listing?.listing_status === 'active'}
              className={`px-8 py-3 text-white rounded-lg transition-colors ${
                isPublishing || listing?.listing_status === 'active'
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPublishing 
                ? 'Publishing...' 
                : listing?.listing_status === 'active' 
                ? 'Already Published' 
                : 'Publish Listing'
              }
            </button>
          </div>
        </div>
      </div>
      {lightboxOpen && (
        <ImageLightbox
          images={galleryImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </main>
  );
}
