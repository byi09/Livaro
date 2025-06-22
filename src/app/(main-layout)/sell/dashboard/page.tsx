'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Spinner, { LoadingOverlay } from '@/src/components/ui/Spinner';

interface PropertyListing {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  listing_title?: string;
  monthly_rent?: number;
  listing_status?: string;
  listing_created?: string;
  square_footage?: number;
}

export default function PropertyDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickingPropertyId, setClickingPropertyId] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const supabase = createClient();
      
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Please sign in to view your properties');
        setIsLoading(false);
        return;
      }

      // Retrieve landlord id (join first, fallback to separate queries)
      let landlordId: string | null = null;

      const { data: landlordData } = await supabase
        .from('users')
        .select(`
          customers!inner(
            landlords!inner(id)
          )
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (landlordData?.customers?.length && landlordData.customers[0].landlords?.length) {
        landlordId = landlordData.customers[0].landlords[0].id;
      }

      if (!landlordId) {
        // Fallback path
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (customer?.id) {
          const { data: landlordRow } = await supabase
            .from('landlords')
            .select('id')
            .eq('customer_id', customer.id)
            .maybeSingle();
          landlordId = landlordRow?.id ?? null;
        }
      }

      if (!landlordId) {
        // No landlord profile – return early but keep UI (empty table)
        setProperties([]);
        setIsLoading(false);
        return;
      }

      const {error } = await supabase
        .from('properties')
        .select(`
          id,
          address_line_1,
          address_line_2,
          city,
          state,
          property_type,
          bedrooms,
          bathrooms,
          square_footage,
          property_listings!inner(
            listing_title,
            monthly_rent,
            listing_status,
            created_at
          )
        `)
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to fetch properties');
        console.error('Error fetching properties:', error);
        return;
      }

      // Also fetch properties without listings
      const { data: allProperties, error: allError } = await supabase
        .from('properties')
        .select(`
          id,
          address_line_1,
          address_line_2,
          city,
          state,
          property_type,
          bedrooms,
          bathrooms,
          square_footage,
          created_at,
          property_listings(
            listing_title,
            monthly_rent,
            listing_status,
            created_at
          )
        `)
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false });

      if (allError) {
        setError('Failed to fetch properties');
        console.error('Error fetching all properties:', allError);
        return;
      }

      // Transform data to flat structure
      const formattedProperties = allProperties?.map(property => ({
        id: property.id,
        address_line_1: property.address_line_1,
        address_line_2: property.address_line_2,
        city: property.city,
        state: property.state,
        property_type: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_footage: property.square_footage,
        listing_title: property.property_listings?.[0]?.listing_title,
        monthly_rent: property.property_listings?.[0]?.monthly_rent,
        listing_status: property.property_listings?.[0]?.listing_status,
        listing_created: property.property_listings?.[0]?.created_at,
      })) || [];

      setProperties(formattedProperties);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (property: PropertyListing) => {
    return `${property.address_line_1}${property.address_line_2 ? `, ${property.address_line_2}` : ''}, ${property.city}, ${property.state}`;
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const determineNextStep = async (property: PropertyListing) => {
    try {
      // Always check basic property information first
      // If any core property data is missing, go to the first page
      if (!property.address_line_1 || !property.city || !property.state || 
          !property.property_type || !property.bedrooms || !property.bathrooms) {
        return `/sell/create?property_id=${property.id}`;
      }
      
      // If basic property info is complete, check for listing data
      if (!property.listing_status) {
        return `/sell/create/rent-details?property_id=${property.id}`;
      }

      // For properties with listings, do minimal checks to avoid API errors
      // If listing is active, go to publish page to view/manage
      if (property.listing_status === 'active') {
        return `/sell/create/publish?property_id=${property.id}`;
      }

      // If listing is pending/draft, go to review page
      if (property.listing_status === 'pending') {
        return `/sell/create/review?property_id=${property.id}`;
      }

      // Default to rent details for any other case
      return `/sell/create/rent-details?property_id=${property.id}`;
      
    } catch (error) {
      console.error('Error determining next step:', error);
      // Always default to the first page on error
      return `/sell/create?property_id=${property.id}`;
    }
  };

  const handlePropertyClick = async (property: PropertyListing) => {
    try {
      setClickingPropertyId(property.id);
      const nextStep = await determineNextStep(property);
      console.log('Dashboard - navigating to:', nextStep);
      console.log('Dashboard - property data:', property);
      router.push(nextStep);
    } catch (error) {
      console.error('Error navigating to property:', error);
      // Fallback navigation
      const fallbackUrl = `/sell/create?property_id=${property.id}`;
      console.log('Dashboard - fallback navigation to:', fallbackUrl);
      router.push(fallbackUrl);
    } finally {
      setClickingPropertyId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          In Progress
        </span>
      );
    }

    const statusConfig = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rented: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      active: 'Published',
      inactive: 'Inactive',
      pending: 'Ready to Publish',
      rented: 'Rented',
      expired: 'Expired',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getActionText = (property: PropertyListing): string => {
    // If no bedrooms/bathrooms set, need to continue setup
    if (!property.bedrooms || !property.bathrooms) {
      return "Click to continue setup";
    }

    // If no listing created yet
    if (!property.listing_status) {
      return "Click to continue setup";
    }

    // Based on listing status
    switch (property.listing_status) {
      case 'active':
        return "Click to manage listing";
      case 'pending':
        return "Click to review & publish";
      case 'rented':
        return "Click to view details";
      case 'expired':
        return "Click to renew listing";
      case 'inactive':
        return "Click to reactivate";
      default:
        return "Click to edit";
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    setDeletingPropertyId(propertyId);
    
    try {
      const supabase = createClient();
      
      // First delete the property listing (if exists)
      const { error: listingError } = await supabase
        .from('property_listings')
        .delete()
        .eq('property_id', propertyId);
      
      if (listingError) {
        console.error('Error deleting property listing:', listingError);
      }
      
      // Then delete the property itself
      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      if (propertyError) {
        console.error('Error deleting property:', propertyError);
        alert('Failed to delete property. Please try again.');
        return;
      }
      
      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      setShowDeleteConfirm(null);
      
    } catch (error) {
      console.error('Unexpected error deleting property:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setDeletingPropertyId(null);
    }
  };

  if (isLoading) {
    return (
      <LoadingOverlay
        show={true}
        message="Loading your properties..."
        subtitle="Please wait while we fetch your listings"
        size={48}
        opacity="heavy"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchProperties}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Property Listings</h1>
          <p className="mt-2 text-gray-600">Manage your rental properties and listings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{properties.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Properties</dt>
                    <dd className="text-lg font-medium text-gray-900">{properties.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {properties.filter(p => p.listing_status === 'active').length}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Listings</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {properties.filter(p => p.listing_status === 'active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {properties.filter(p => !p.listing_status || p.listing_status !== 'active').length}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {properties.filter(p => !p.listing_status || p.listing_status !== 'active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Properties</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Click on any property to edit details, continue setup, or manage your listing
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-16-4c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No properties yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first property listing.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {properties.map((property) => (
                <li 
                  key={property.id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    clickingPropertyId === property.id ? 'bg-blue-50' : ''
                  }`} 
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {property.bedrooms}BR
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {property.listing_title || formatAddress(property)}
                            </p>
                            <div className="ml-2">
                              {getStatusBadge(property.listing_status)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatAddress(property)} • {property.bedrooms} bed, {property.bathrooms} bath
                            {property.square_footage && ` • ${property.square_footage} sq ft`}
                          </p>
                          <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                            {clickingPropertyId === property.id && (
                              <Spinner size={12} variant="primary" />
                            )}
                            {clickingPropertyId === property.id ? 'Loading...' : getActionText(property)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(property.monthly_rent)}/month
                          </p>
                          {property.listing_created && (
                            <p className="text-sm text-gray-500">
                              Listed {new Date(property.listing_created).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(property.id);
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete property"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {/* Edit Property Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/sell/create?property_id=${property.id}`);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit property details"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create New Listing Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/sell/create')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Property Listing
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowDeleteConfirm(null)}
              />
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Property
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this property? This action cannot be undone and will permanently remove the property and its listing.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => handleDeleteProperty(showDeleteConfirm)}
                    disabled={deletingPropertyId === showDeleteConfirm}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingPropertyId === showDeleteConfirm ? (
                      <>
                        <Spinner size={16} variant="white" className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deletingPropertyId === showDeleteConfirm}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 