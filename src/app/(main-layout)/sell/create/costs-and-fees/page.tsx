'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';

export default function CostsAndFeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const [administrativeFee, setAdministrativeFee] = useState('');
  const [parkingFee, setParkingFee] = useState('');
  const [utilitiesFee, setUtilitiesFee] = useState('');
  const [otherFee, setOtherFee] = useState('');
  const FEATURE_CATEGORY = 'utilities' as const;

  // Enhanced navigation with auto-save
  const handleNavigation = async (path: string) => {
    try {
      // Save current form data before navigating
      await saveCurrentFormData();
      router.push(path);
    } catch (error) {
      console.error('Error saving data before navigation:', error);
      // Navigate anyway to prevent user from being stuck
      router.push(path);
    }
  };

  // Function to save current form data
  const saveCurrentFormData = async () => {
    if (!propertyId) return;

    try {
      const supabase = createClient();
      
      // Save fees as property features
      const features = [];
      
      if (administrativeFee && administrativeFee.trim() !== '') {
        features.push({
          property_id: propertyId,
          feature_name: 'Administrative Fee',
          feature_category: FEATURE_CATEGORY,
          feature_value: administrativeFee
        });
      }
      
      if (parkingFee && parkingFee.trim() !== '') {
        features.push({
          property_id: propertyId,
          feature_name: 'Parking Fee',
          feature_category: FEATURE_CATEGORY,
          feature_value: parkingFee
        });
      }
      
      if (utilitiesFee && utilitiesFee.trim() !== '') {
        features.push({
          property_id: propertyId,
          feature_name: 'Utilities Fee',
          feature_category: FEATURE_CATEGORY,
          feature_value: utilitiesFee
        });
      }
      
      if (otherFee && otherFee.trim() !== '') {
        features.push({
          property_id: propertyId,
          feature_name: 'Other Fee',
          feature_category: FEATURE_CATEGORY,
          feature_value: otherFee
        });
      }

      // Delete existing fee features by their names (allows for legacy category values)
      const feeNames = ['Administrative Fee', 'Parking Fee', 'Utilities Fee', 'Other Fee'];
      await supabase
        .from('property_features')
        .delete()
        .eq('property_id', propertyId)
        .in('feature_name', feeNames);

      // Insert new fee features if any exist
      if (features.length > 0) {
        const { error } = await supabase
          .from('property_features')
          .insert(features);

        if (error) {
          console.error('Error saving fees data:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in saveCurrentFormData:', error);
      throw error;
    }
  };

  // Load existing fees data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!propertyId) return;

      try {
        const supabase = createClient();
        const { data: features, error } = await supabase
          .from('property_features')
          .select('*')
          .eq('property_id', propertyId)
          .in('feature_name', ['Administrative Fee', 'Parking Fee', 'Utilities Fee', 'Other Fee']);

        if (error) {
          console.error('Error loading existing fees data:', error);
          return;
        }

        if (features) {
          features.forEach(feature => {
            switch (feature.feature_name) {
              case 'Administrative Fee':
                setAdministrativeFee(feature.feature_value);
                break;
              case 'Parking Fee':
                setParkingFee(feature.feature_value);
                break;
              case 'Utilities Fee':
                setUtilitiesFee(feature.feature_value);
                break;
              case 'Other Fee':
                setOtherFee(feature.feature_value);
                break;
            }
          });
        }
      } catch (error) {
        console.error('Error loading existing fees data:', error);
      }
    };

    loadExistingData();
  }, [propertyId]);

  const exitToDashboard = async () => {
    try {
      await saveCurrentFormData();
    } catch (err) {
      console.error('Error saving before exit:', err);
    } finally {
      router.push('/sell/dashboard');
    }
  };

  // Save on browser back/unload
  useEffect(() => {
    if (!propertyId) return;
    const handleBeforeUnload = () => { saveCurrentFormData(); };
    const handlePopState = () => { saveCurrentFormData(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); window.removeEventListener('popstate', handlePopState); };
  }, [propertyId, saveCurrentFormData]);

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Costs and Fees</h1>
          <button 
            onClick={exitToDashboard}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={5} propertyId={propertyId} beforeNavigate={saveCurrentFormData} />

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 text-center">Additional Fees</h2>

          {/* Administrative Fee */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">
              Administrative
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={administrativeFee}
                onChange={(e) => setAdministrativeFee(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-blue-50"
                placeholder="Enter administrative fee"
              />
            </div>
          </div>

          {/* Parking Fee */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">
              Parking
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={parkingFee}
                onChange={(e) => setParkingFee(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-blue-50"
                placeholder="Enter parking fee"
              />
            </div>
          </div>

          {/* Utilities Fee */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">
              Utilities
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={utilitiesFee}
                onChange={(e) => setUtilitiesFee(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-blue-50"
                placeholder="Enter utilities fee"
              />
            </div>
          </div>

          {/* Other Fee */}
          <div className="mb-12">
            <label className="block text-lg font-semibold mb-3">
              Other
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={otherFee}
                onChange={(e) => setOtherFee(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-blue-50"
                placeholder="Enter other fees"
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button 
              onClick={() => handleNavigation(`/sell/create/screening?property_id=${propertyId}`)}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              type="button"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              onClick={() => handleNavigation(`/sell/create/final-details?property_id=${propertyId}`)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
