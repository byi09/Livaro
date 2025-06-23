'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';

// Valid feature category enum value to store screening info
const SCREENING_CATEGORY = 'utilities' as const;

export default function ScreeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const [incomeRatio, setIncomeRatio] = useState('1.5X');
  const [creditScore, setCreditScore] = useState('850');

  const incomeRatioOptions = ['1.5X', '2X', '2.5X', '3X'];

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
      
      const features = [
        {
          property_id: propertyId,
          feature_name: 'Income to Rent Ratio',
          feature_category: SCREENING_CATEGORY,
          feature_value: incomeRatio
        },
        {
          property_id: propertyId,
          feature_name: 'Minimum Credit Score',
          feature_category: SCREENING_CATEGORY,
          feature_value: creditScore
        }
      ];

      const screeningNames = ['Income to Rent Ratio', 'Minimum Credit Score'];
      await supabase
        .from('property_features')
        .delete()
        .eq('property_id', propertyId)
        .in('feature_name', screeningNames);

      // Insert new screening features
      const { error } = await supabase
        .from('property_features')
        .insert(features);

      if (error) {
        console.error('Error saving screening data:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveCurrentFormData:', error);
      throw error;
    }
  };

  // Load existing screening data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!propertyId) return;

      try {
        const supabase = createClient();
        const { data: features, error } = await supabase
          .from('property_features')
          .select('*')
          .eq('property_id', propertyId)
          .in('feature_name', ['Income to Rent Ratio', 'Minimum Credit Score']);

        if (error) {
          console.error('Error loading existing screening data:', error);
          return;
        }

        if (features) {
          features.forEach(feature => {
            if (feature.feature_name === 'Income to Rent Ratio') {
              setIncomeRatio(feature.feature_value);
            } else if (feature.feature_name === 'Minimum Credit Score') {
              setCreditScore(feature.feature_value);
            }
          });
        }
      } catch (error) {
        console.error('Error loading existing screening data:', error);
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

    const handleBeforeUnload = () => {
      saveCurrentFormData();
    };
    const handlePopState = () => {
      saveCurrentFormData();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [propertyId, saveCurrentFormData]);

  return (
    <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Screening Requirements</h1>
          <button 
            onClick={exitToDashboard}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={4} propertyId={propertyId} beforeNavigate={saveCurrentFormData} />

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 text-center">What Do You Expect From Renters?</h2>

          {/* Income to Rent Ratio */}
          <div className="mb-12">
            <label className="block text-lg font-semibold mb-3">
              Income to Rent Ratio
            </label>
            <div className="relative">
              <select
                value={incomeRatio}
                onChange={(e) => setIncomeRatio(e.target.value)}
                className="block w-48 pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-blue-50 appearance-none"
              >
                {incomeRatioOptions.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Credit Score */}
          <div className="mb-12">
            <label className="block text-lg font-semibold mb-3">
              Credit Score
            </label>
            <input
              type="number"
              value={creditScore}
              onChange={(e) => setCreditScore(e.target.value)}
              min="300"
              max="850"
              className="block w-48 pl-4 pr-4 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-blue-50"
              placeholder="Enter minimum credit score"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button 
              onClick={() => handleNavigation(`/sell/create/amenities?property_id=${propertyId}`)}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              type="button"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              onClick={() => handleNavigation(`/sell/create/costs-and-fees?property_id=${propertyId}`)}
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
