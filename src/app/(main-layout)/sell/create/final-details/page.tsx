'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';

export default function FinalDetailsPage() {
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
  
  const [leasePolicy, setLeasePolicy] = useState('');
  const [rentersInsurance, setRentersInsurance] = useState<'Yes' | 'No' | ''>('');
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
      
      router.push(finalPath);
    } catch (error) {
      console.error('Error saving data before navigation:', error);
      // Navigate anyway to prevent user from being stuck
      const finalPath = isSubletMode && !path.includes('mode=') 
        ? `${path}${path.includes('?') ? '&' : '?'}mode=sublet`
        : path;
      router.push(finalPath);
    }
  };

  // Function to save current form data
  const saveCurrentFormData = async () => {
    if (!entityId) return;

    try {
      const supabase = createClient();

      // Save final details as features (use correct table based on mode)
      const features = [];
      const tableName = isSubletMode ? 'sublisting_features' : 'property_features';
      const idField = isSubletMode ? 'sublisting_id' : 'property_id';

      if (leasePolicy && leasePolicy.trim() !== '') {
        features.push({
          [idField]: entityId,
          feature_name: 'Lease Policy',
          feature_category: FEATURE_CATEGORY,
          feature_value: leasePolicy
        });
      }

      if (rentersInsurance) {
        features.push({
          [idField]: entityId,
          feature_name: 'Renters Insurance Required',
          feature_category: FEATURE_CATEGORY,
          feature_value: rentersInsurance
        });
      }

      // Delete existing policy features by name (handles legacy category values)
      const names = ['Lease Policy', 'Renters Insurance Required'];
      await supabase
        .from(tableName)
        .delete()
        .eq(idField, entityId)
        .in('feature_name', names);

      // Insert new policy features if any exist
      if (features.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .insert(features);

        if (error) {
          console.error('Error saving final details data:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in saveCurrentFormData:', error);
      throw error;
    }
  };

  const exitToDashboard = async () => {
    try {
      await saveCurrentFormData();
    } catch (err) {
      console.error('Error saving before exit:', err);
    } finally {
      router.push(isSubletMode ? '/sublist/dashboard' : '/sell/dashboard');
    }
  };

  useEffect(() => {
    if (!entityId) return;
    const handleBeforeUnload = () => { saveCurrentFormData(); };
    const handlePopState = () => { saveCurrentFormData(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); window.removeEventListener('popstate', handlePopState); };
  }, [entityId, saveCurrentFormData]);

  // Load existing final details data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!entityId) return;

      try {
        const supabase = createClient();
        const tableName = isSubletMode ? 'sublisting_features' : 'property_features';
        const idField = isSubletMode ? 'sublisting_id' : 'property_id';

        const { data: features, error } = await supabase
          .from(tableName)
          .select('*')
          .eq(idField, entityId)
          .in('feature_name', ['Lease Policy', 'Renters Insurance Required']);

        if (error) {
          console.error('Error loading existing final details data:', error);
          return;
        }

        if (features) {
          features.forEach(feature => {
            if (feature.feature_name === 'Lease Policy') {
              setLeasePolicy(feature.feature_value);
            } else if (feature.feature_name === 'Renters Insurance Required') {
              setRentersInsurance(feature.feature_value as 'Yes' | 'No');
            }
          });
        }
      } catch (error) {
        console.error('Error loading existing final details data:', error);
      }
    };

    loadExistingData();
  }, [entityId, isSubletMode]);

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Final Details</h1>
          <button 
            onClick={exitToDashboard}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={6} propertyId={entityId} mode={mode} beforeNavigate={saveCurrentFormData} />

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">What should renters know about the lease</h2>
          <p className="text-gray-600 mb-8 text-center">Describe your extra policies</p>

          {/* Lease Policy Description */}
          <div className="mb-12">
            <textarea
              value={leasePolicy}
              onChange={(e) => setLeasePolicy(e.target.value)}
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-blue-50"
              placeholder="Enter your lease policies and any additional information renters should know..."
            />
          </div>

          {/* Renters Insurance Required */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold mb-4 text-center">Renters Insurance Required</h3>
            <div className="flex justify-center gap-8">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="insurance"
                  value="Yes"
                  checked={rentersInsurance === 'Yes'}
                  onChange={(e) => setRentersInsurance(e.target.value as 'Yes')}
                  className="form-radio text-blue-600"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="insurance"
                  value="No"
                  checked={rentersInsurance === 'No'}
                  onChange={(e) => setRentersInsurance(e.target.value as 'No')}
                  className="form-radio text-blue-600"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                const paramName = isSubletMode ? 'sublisting_id' : 'property_id';
                const backPath = entityId
                  ? `/sell/create/costs-and-fees?${paramName}=${entityId}${isSubletMode ? '&mode=sublet' : ''}`
                  : `/sell/create/costs-and-fees${isSubletMode ? '?mode=sublet' : ''}`;
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
                  ? `/sell/create/publish?${paramName}=${entityId}${isSubletMode ? '&mode=sublet' : ''}`
                  : `/sell/create/publish${isSubletMode ? '?mode=sublet' : ''}`;
                handleNavigation(nextPath);
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              Finish & Publish
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
