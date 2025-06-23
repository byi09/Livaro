'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import { useAutoSave } from '@/src/hooks/useAutoSave';

export default function RentDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  
  const [rent, setRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [petDeposit, setPetDeposit] = useState('');
  const [applicationFee, setApplicationFee] = useState('');
  const [minLeaseTerm, setMinLeaseTerm] = useState('12');
  const [maxLeaseTerm, setMaxLeaseTerm] = useState('12');
  const [availableDate, setAvailableDate] = useState('');
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save hook for property data
  const { saveImmediately: savePropertyData } = useAutoSave({
    propertyId,
    formData: { bedrooms, bathrooms },
    tableName: 'properties',
    debounceMs: 1500,
  });

  // Auto-save hook for listing data
  const { saveImmediately: saveListingData } = useAutoSave({
    propertyId,
    formData: {
      monthly_rent: rent,
      security_deposit: securityDeposit,
      pet_deposit: petDeposit,
      application_fee: applicationFee,
      minimum_lease_term: minLeaseTerm,
      maximum_lease_term: maxLeaseTerm,
      available_date: availableDate,
      listing_title: listingTitle,
      listing_description: listingDescription,
    },
    tableName: 'property_listings',
    debounceMs: 1500,
  });

  // Enhanced navigation with auto-save
  const handleNavigation = async (path: string) => {
    try {
      // Save all data immediately before navigating
      await Promise.all([
        savePropertyData(),
        saveListingData()
      ]);
      router.push(path);
    } catch (error) {
      console.error('Error saving data before navigation:', error);
      // Navigate anyway to prevent user from being stuck
      router.push(path);
    }
  };

  // Reusable save helper for progress bar clicks
  const saveAllData = async () => {
    await Promise.all([savePropertyData(), saveListingData()]);
  };

  // Load existing property data if available
  useEffect(() => {
    if (!propertyId) {
      router.push('/sell/create');
      return;
    }

    const loadPropertyData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch existing property data
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('bedrooms, bathrooms')
          .eq('id', propertyId)
          .single();

        if (propertyError) {
          console.error('Error loading property data:', propertyError);
          return;
        }

        // Load existing values if they exist
        if (property) {
          if (property.bedrooms !== null) setBedrooms(property.bedrooms.toString());
          if (property.bathrooms !== null) setBathrooms(property.bathrooms.toString());
        }

        // Fetch existing listing data if available
        const { data: listing, error: listingError } = await supabase
          .from('property_listings')
          .select('*')
          .eq('property_id', propertyId)
          .maybeSingle();

        if (!listingError && listing) {
          // Load existing listing values
          if (listing.monthly_rent) setRent(listing.monthly_rent.toString());
          if (listing.security_deposit) setSecurityDeposit(listing.security_deposit.toString());
          if (listing.pet_deposit) setPetDeposit(listing.pet_deposit.toString());
          if (listing.application_fee) setApplicationFee(listing.application_fee.toString());
          if (listing.minimum_lease_term) setMinLeaseTerm(listing.minimum_lease_term.toString());
          if (listing.maximum_lease_term) setMaxLeaseTerm(listing.maximum_lease_term.toString());
          if (listing.available_date) setAvailableDate(listing.available_date);
          if (listing.listing_title) setListingTitle(listing.listing_title);
          if (listing.listing_description) setListingDescription(listing.listing_description);
        }
      } catch (error) {
        console.error('Unexpected error loading property data:', error);
      }
    };

    loadPropertyData();
  }, [propertyId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const supabase = createClient();
      
      // First, update the properties table with bedroom and bathroom info
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          bedrooms: parseInt(formData.get('bedrooms') as string),
          bathrooms: parseFloat(formData.get('bathrooms') as string),
        })
        .eq('id', propertyId);

      if (propertyError) {
        console.error('Error updating property details:', propertyError);
        alert('Error updating property details. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Extract form data for listing
      const listingData = {
        property_id: propertyId,
        monthly_rent: parseFloat(formData.get('monthly_rent') as string),
        security_deposit: formData.get('security_deposit') ? parseFloat(formData.get('security_deposit') as string) : null,
        pet_deposit: formData.get('pet_deposit') ? parseFloat(formData.get('pet_deposit') as string) : null,
        application_fee: formData.get('application_fee') ? parseFloat(formData.get('application_fee') as string) : null,
        minimum_lease_term: formData.get('minimum_lease_term') ? parseInt(formData.get('minimum_lease_term') as string) : null,
        maximum_lease_term: formData.get('maximum_lease_term') ? parseInt(formData.get('maximum_lease_term') as string) : null,
        available_date: formData.get('available_date') as string || null,
        listing_title: formData.get('listing_title') as string || null,
        listing_description: formData.get('listing_description') as string || null,
        listing_status: 'pending',
      };

      // Check if listing already exists
      const { data: existingListing, error: checkError } = await supabase
        .from('property_listings')
        .select('id')
        .eq('property_id', propertyId)
        .maybeSingle();

      let listingOperation;
      if (existingListing && !checkError) {
        // Update existing listing
        listingOperation = await supabase
          .from('property_listings')
          .update(listingData)
          .eq('property_id', propertyId)
          .select();
      } else {
        // Create new listing
        listingOperation = await supabase
          .from('property_listings')
          .insert([listingData])
          .select();
      }

      if (listingOperation.error) {
        console.error('Error saving property listing:', listingOperation.error);
        alert('Error saving property listing. Please try again.');
        setIsSubmitting(false);
        return;
      }

      console.log('Property listing saved successfully:', listingOperation.data);
      
      // Client-side redirect
      router.push(`/sell/create/media?property_id=${propertyId}`);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!propertyId) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Rent Details</h1>
          <button 
            onClick={() => router.push('/sell/dashboard')}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={1} propertyId={propertyId} beforeNavigate={saveAllData} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-semibold mb-8">Listing Details</h2>
            
            {/* Listing Title */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Listing Title*
              </label>
              <input
                type="text"
                name="listing_title"
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
                className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                placeholder="e.g., Beautiful 2BR Apartment in Downtown"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Listing Description */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Listing Description*
              </label>
              <textarea
                name="listing_description"
                value={listingDescription}
                onChange={(e) => setListingDescription(e.target.value)}
                rows={4}
                className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white resize-none"
                placeholder="Describe what makes this property special..."
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Number of Bedrooms *
                </label>
                <select
                  name="bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  required
                  disabled={isSubmitting}
                >
                  <option value="0">Studio (0 bedroom)</option>
                  <option value="1">1 bedroom</option>
                  <option value="2">2 bedrooms</option>
                  <option value="3">3 bedrooms</option>
                  <option value="4">4 bedrooms</option>
                  <option value="5">5 bedrooms</option>
                  <option value="6">6+ bedrooms</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Number of Bathrooms *
                </label>
                <select
                  name="bathrooms"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  required
                  disabled={isSubmitting}
                >
                  <option value="0.5">0.5 bathroom</option>
                  <option value="1">1 bathroom</option>
                  <option value="1.5">1.5 bathrooms</option>
                  <option value="2">2 bathrooms</option>
                  <option value="2.5">2.5 bathrooms</option>
                  <option value="3">3 bathrooms</option>
                  <option value="3.5">3.5 bathrooms</option>
                  <option value="4">4 bathrooms</option>
                  <option value="4.5">4.5 bathrooms</option>
                  <option value="5">5+ bathrooms</option>
                </select>
              </div>
            </div>
            
            {/* Monthly Rent */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Monthly Rent *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="monthly_rent"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  placeholder="Enter monthly rent"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Security Deposit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="security_deposit"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  placeholder="Enter security deposit amount"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Pet Deposit */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Pet Deposit (if pets allowed)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="pet_deposit"
                  value={petDeposit}
                  onChange={(e) => setPetDeposit(e.target.value)}
                  className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  placeholder="Enter pet deposit amount"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Application Fee */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Application Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="application_fee"
                  value={applicationFee}
                  onChange={(e) => setApplicationFee(e.target.value)}
                  className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  placeholder="Enter application fee"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Lease Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Minimum Lease Term (months)
                </label>
                <select
                  name="minimum_lease_term"
                  value={minLeaseTerm}
                  onChange={(e) => setMinLeaseTerm(e.target.value)}
                  className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  disabled={isSubmitting}
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Maximum Lease Term (months)
                </label>
                <select
                  name="maximum_lease_term"
                  value={maxLeaseTerm}
                  onChange={(e) => setMaxLeaseTerm(e.target.value)}
                  className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                  disabled={isSubmitting}
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                </select>
              </div>
            </div>

            {/* Available Date */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Available Date
              </label>
              <input
                type="date"
                name="available_date"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="block w-full px-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button 
              onClick={() => handleNavigation(`/sell/create?property_id=${propertyId}`)}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              type="button"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            >
              {isSubmitting ? 'Saving Listing...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
