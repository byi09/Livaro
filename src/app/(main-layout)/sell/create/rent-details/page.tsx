'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import { useAutoSave } from '@/src/hooks/useAutoSave';
import { useUploadedMedia } from '@/src/hooks/useUploadedMedia';

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
  const [customMinLeaseTerm, setCustomMinLeaseTerm] = useState('');
  const [customMaxLeaseTerm, setCustomMaxLeaseTerm] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Uploaded media management hook - auto-fill from previously uploaded files
  const { getAllExtractedData, uploadedFiles } = useUploadedMedia({
    propertyId,
    autoProcess: false, // Don't auto-process, just retrieve existing data
  });

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
      minimum_lease_term: minLeaseTerm === 'other' ? customMinLeaseTerm : minLeaseTerm,
      maximum_lease_term: maxLeaseTerm === 'other' ? customMaxLeaseTerm : maxLeaseTerm,
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

  // Auto-fill from uploaded media data
  useEffect(() => {
    const extractedData = getAllExtractedData();
    
    // Only auto-fill if fields are empty and we have extracted data
    if (extractedData.monthly_rent && !rent) {
      setRent(extractedData.monthly_rent);
    }
    if (extractedData.security_deposit && !securityDeposit) {
      setSecurityDeposit(extractedData.security_deposit);
    }
    if (extractedData.pet_deposit && !petDeposit) {
      setPetDeposit(extractedData.pet_deposit);
    }
    if (extractedData.application_fee && !applicationFee) {
      setApplicationFee(extractedData.application_fee);
    }
    if (extractedData.available_date && !availableDate) {
      setAvailableDate(extractedData.available_date);
    }
  }, [getAllExtractedData, rent, securityDeposit, petDeposit, applicationFee, availableDate]);

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
          if (listing.minimum_lease_term) {
            const minTerm = listing.minimum_lease_term.toString();
            // Check if it's a standard option, otherwise set as custom
            if (['1', '3', '6', '9', '12', '24'].includes(minTerm)) {
              setMinLeaseTerm(minTerm);
            } else {
              setMinLeaseTerm('other');
              setCustomMinLeaseTerm(minTerm);
            }
          }
          if (listing.maximum_lease_term) {
            const maxTerm = listing.maximum_lease_term.toString();
            // Check if it's a standard option, otherwise set as custom
            if (['1', '3', '6', '9', '12', '24', '36'].includes(maxTerm)) {
              setMaxLeaseTerm(maxTerm);
            } else {
              setMaxLeaseTerm('other');
              setCustomMaxLeaseTerm(maxTerm);
            }
          }
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
        minimum_lease_term: (() => {
          const minTerm = formData.get('minimum_lease_term') as string;
          if (minTerm === 'other') {
            const customMin = formData.get('custom_minimum_lease_term') as string;
            return customMin ? parseInt(customMin) : null;
          }
          return minTerm ? parseInt(minTerm) : null;
        })(),
        maximum_lease_term: (() => {
          const maxTerm = formData.get('maximum_lease_term') as string;
          if (maxTerm === 'other') {
            const customMax = formData.get('custom_maximum_lease_term') as string;
            return customMax ? parseInt(customMax) : null;
          }
          return maxTerm ? parseInt(maxTerm) : null;
        })(),
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
    <main className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Step 2: Rent Details</h1>
          <button 
            onClick={() => router.push('/sell/dashboard')}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Save & Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={2} propertyId={propertyId} beforeNavigate={saveAllData} />

        {/* Auto-fill Notice */}
        {uploadedFiles.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  📄 Using Data from Uploaded Files
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Found {uploadedFiles.length} uploaded file{uploadedFiles.length !== 1 ? 's' : ''} with property data. 
                    Fields will be auto-filled where possible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Rent Details</h2>
            </div>

            {/* Form */}
            <form id="rent-details-form" onSubmit={handleSubmit} className="space-y-8">{/* Form content will continue below */}
              {/* Monthly Rent */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Monthly Rent *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    name="monthly_rent"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    className="block w-full pl-8 pr-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50 placeholder-gray-400"
                    placeholder="Enter monthly rent"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Security Deposit */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Security Deposit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    name="security_deposit"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="block w-full pl-8 pr-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50 placeholder-gray-400"
                    placeholder="Enter security deposit amount"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Pet Deposit */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Pet Deposit (if pets allowed)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    name="pet_deposit"
                    value={petDeposit}
                    onChange={(e) => setPetDeposit(e.target.value)}
                    className="block w-full pl-8 pr-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50 placeholder-gray-400"
                    placeholder="Enter pet deposit amount"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Application Fee */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Application Fee
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    name="application_fee"
                    value={applicationFee}
                    onChange={(e) => setApplicationFee(e.target.value)}
                    className="block w-full pl-8 pr-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50 placeholder-gray-400"
                    placeholder="Enter application fee"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Lease Terms Row */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-900">
                    Minimum Lease Term
                  </label>
                  <select
                    name="minimum_lease_term"
                    value={minLeaseTerm}
                    onChange={(e) => setMinLeaseTerm(e.target.value)}
                    className="block w-full px-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50"
                    disabled={isSubmitting}
                  >
                    <option value="1">1 week</option>
                    <option value="4">1 month</option>
                    <option value="12">3 months</option>
                    <option value="24">6 months</option>
                    <option value="36">9 months</option>
                    <option value="48">12 months</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-900">
                    Maximum Lease Term
                  </label>
                  <select
                    name="maximum_lease_term"
                    value={maxLeaseTerm}
                    onChange={(e) => setMaxLeaseTerm(e.target.value)}
                    className="block w-full px-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50"
                    disabled={isSubmitting}
                  >
                    <option value="4">1 month</option>
                    <option value="12">3 months</option>
                    <option value="24">6 months</option>
                    <option value="36">9 months</option>
                    <option value="48">12 months</option>
                    <option value="60">15 months</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Available Date */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Available Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="available_date"
                    value={availableDate}
                    onChange={(e) => setAvailableDate(e.target.value)}
                    className="block w-full px-4 py-3.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50 placeholder-gray-400"
                    placeholder="yyyy/mm/dd"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

            </form>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 px-8 py-6 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={() => handleNavigation(`/sell/create?property_id=${propertyId}`)}
                className="px-6 py-3 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center shadow-sm"
                type="button"
              >
                <span className="mr-2">←</span>
                Back
              </button>
              <button 
                type="submit"
                form="rent-details-form"
                disabled={isSubmitting}
                className="px-8 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
