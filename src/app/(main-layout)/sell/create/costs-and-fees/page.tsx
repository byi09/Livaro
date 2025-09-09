'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import { usePageTransition } from '@/src/hooks/usePageTransition';

export default function CostsAndFeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const mode = searchParams.get('mode'); // Check for sublet mode

  // Check both URL parameter and session storage for sublet mode
  // Also check if sublisting_id exists, which indicates sublet mode
  const isSubletMode = mode === 'sublet' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('subletting_mode') === 'true') ||
    !!searchParams.get('sublisting_id');

  const sublistingId = searchParams.get('sublisting_id');
  const entityId = (isSubletMode || sublistingId) ? sublistingId : propertyId;

  // Page transition hook with scroll preservation
  const { navigateWithTransition } = usePageTransition({ preserveScroll: true });

  // Auto-redirect to add mode parameter if missing but sublet mode detected
  useEffect(() => {
    if (isSubletMode && !mode) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('mode', 'sublet');
      router.replace(currentUrl.pathname + currentUrl.search);
    }
  }, [isSubletMode, mode, entityId, router]);
  
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

      // Preserve mode parameter if in sublet mode
      const finalPath = isSubletMode && !path.includes('mode=')
        ? `${path}${path.includes('?') ? '&' : '?'}mode=sublet`
        : path;

      navigateWithTransition(finalPath);
    } catch (error) {
      console.error('Error saving data before navigation:', error);
      // Navigate anyway to prevent user from being stuck
      const finalPath = isSubletMode && !path.includes('mode=')
        ? `${path}${path.includes('?') ? '&' : '?'}mode=sublet`
        : path;
      navigateWithTransition(finalPath);
    }
  };

  // Function to save current form data
  const saveCurrentFormData = async () => {
    if (!entityId) return;

    try {
      const supabase = createClient();

      if (isSubletMode || sublistingId) {
        // For sublistings, store fee data in the existing description field as JSON
        const feeData = {
          administrativeFee: administrativeFee || null,
          parkingFee: parkingFee || null,
          utilitiesFee: utilitiesFee || null,
          otherFee: otherFee || null,
          updatedAt: new Date().toISOString()
        };

        // Get current description to preserve it
        const { data: currentSublisting } = await supabase
          .from('sublistings')
          .select('description')
          .eq('id', entityId)
          .single();

        let updatedDescription = currentSublisting?.description || '';

        // Store fee data as JSON in a comment at the end of description
        const feeJson = JSON.stringify(feeData);
        const feeMarker = '<!--FEES:';
        const feeEndMarker = '-->';

        // Remove existing fee data if present
        const existingFeeStart = updatedDescription.indexOf(feeMarker);
        if (existingFeeStart !== -1) {
          const existingFeeEnd = updatedDescription.indexOf(feeEndMarker, existingFeeStart);
          if (existingFeeEnd !== -1) {
            updatedDescription = updatedDescription.substring(0, existingFeeStart) +
                                updatedDescription.substring(existingFeeEnd + feeEndMarker.length);
          }
        }

        // Add new fee data
        updatedDescription = updatedDescription.trim() +
                           (updatedDescription ? '\n\n' : '') +
                           feeMarker + feeJson + feeEndMarker;

        const { error } = await supabase
          .from('sublistings')
          .update({
            description: updatedDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', entityId);

        if (error) {
          console.error('Error saving sublisting fee data:', error);
          throw error;
        }
      } else {
        // For regular properties, save to property_features table
        const features = [];

        if (administrativeFee && administrativeFee.trim() !== '') {
          features.push({
            property_id: entityId,
            feature_name: 'Administrative Fee',
            feature_category: FEATURE_CATEGORY,
            feature_value: administrativeFee
          });
        }

        if (parkingFee && parkingFee.trim() !== '') {
          features.push({
            property_id: entityId,
            feature_name: 'Parking Fee',
            feature_category: FEATURE_CATEGORY,
            feature_value: parkingFee
          });
        }

        if (utilitiesFee && utilitiesFee.trim() !== '') {
          features.push({
            property_id: entityId,
            feature_name: 'Utilities Fee',
            feature_category: FEATURE_CATEGORY,
            feature_value: utilitiesFee
          });
        }

        if (otherFee && otherFee.trim() !== '') {
          features.push({
            property_id: entityId,
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
          .eq('property_id', entityId)
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
      }
    } catch (error) {
      console.error('Error in saveCurrentFormData:', error);
      throw error;
    }
  };

  // Load existing fees data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!entityId) return;

      try {
        const supabase = createClient();

        if (isSubletMode || sublistingId) {
          // For sublistings, load fee data from the description field
          const { data: sublisting, error } = await supabase
            .from('sublistings')
            .select('description')
            .eq('id', entityId)
            .single();

          if (error) {
            console.error('Error loading sublisting data:', error);
            return;
          }

          if (sublisting?.description) {
            const feeMarker = '<!--FEES:';
            const feeEndMarker = '-->';
            const feeStart = sublisting.description.indexOf(feeMarker);

            if (feeStart !== -1) {
              const feeEnd = sublisting.description.indexOf(feeEndMarker, feeStart);
              if (feeEnd !== -1) {
                const feeJson = sublisting.description.substring(
                  feeStart + feeMarker.length,
                  feeEnd
                );

                try {
                  const feeData = JSON.parse(feeJson);
                  setAdministrativeFee(feeData.administrativeFee || '');
                  setParkingFee(feeData.parkingFee || '');
                  setUtilitiesFee(feeData.utilitiesFee || '');
                  setOtherFee(feeData.otherFee || '');
                } catch (parseError) {
                  console.warn('Error parsing fee data from description:', parseError);
                }
              }
            }
          }
        } else {
          // For regular properties, load from property_features table
          const { data: features, error } = await supabase
            .from('property_features')
            .select('*')
            .eq('property_id', entityId)
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
        }
      } catch (error) {
        console.error('Error loading existing fees data:', error);
      }
    };

    loadExistingData();
  }, [entityId, isSubletMode]);

  const exitToDashboard = async () => {
    try {
      await saveCurrentFormData();
    } catch (err) {
      console.error('Error saving before exit:', err);
    } finally {
      navigateWithTransition(isSubletMode ? '/sublist/dashboard' : '/sell/dashboard');
    }
  };

  // Save on browser back/unload
  useEffect(() => {
    if (!entityId) return;
    const handleBeforeUnload = () => { saveCurrentFormData(); };
    const handlePopState = () => { saveCurrentFormData(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); window.removeEventListener('popstate', handlePopState); };
  }, [entityId, saveCurrentFormData]);

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
        <InteractiveProgressBar currentStep={5} propertyId={entityId} mode={mode} beforeNavigate={saveCurrentFormData} />

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
              onClick={() => {
                const paramName = isSubletMode ? 'sublisting_id' : 'property_id';
                const backPath = entityId
                  ? `/sell/create/amenities?${paramName}=${entityId}${isSubletMode ? '&mode=sublet' : ''}`
                  : `/sell/create/amenities${isSubletMode ? '?mode=sublet' : ''}`;
                handleNavigation(backPath);
              }}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              type="button"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              onClick={() => {
                const paramName = isSubletMode ? 'sublisting_id' : 'property_id';
                const nextPath = entityId
                  ? `/sell/create/final-details?${paramName}=${entityId}${isSubletMode ? '&mode=sublet' : ''}`
                  : `/sell/create/final-details${isSubletMode ? '?mode=sublet' : ''}`;
                handleNavigation(nextPath);
              }}
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
