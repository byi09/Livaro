'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import PageTransition from '@/src/components/ui/PageTransition';
import { usePageTransition } from '@/src/hooks/usePageTransition';

export default function AmenitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  
  const [customAmenities, setCustomAmenities] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Page transition hook
  const { navigateWithTransition } = usePageTransition();

  // Enhanced navigation with auto-save
  const handleNavigation = async (path: string) => {
    try {
      // Save current form data before navigating
      await saveCurrentFormData();
      await navigateWithTransition(path);
    } catch (error) {
      console.error('Error saving data before navigation:', error);
      // Navigate anyway to prevent user from being stuck
      await navigateWithTransition(path);
    }
  };

  // Function to save current form data
  const saveCurrentFormData = useCallback(async () => {
    if (!propertyId) return;

    try {
      const supabase = createClient();
      
      const features: Array<{property_id:string;feature_name:string;feature_category:'interior'|'exterior'|'building_amenities'|'appliances'|'utilities';feature_value:string;}> = [];

      if (formRef.current) {
        const formData = new FormData(formRef.current);
        for (const [key,value] of formData.entries()) {
          if (!key.startsWith('feature_')) continue;
          const parts = key.split('_');
          if (parts.length < 3) continue;
          let category:string;
          let name:string;
          if (parts[1]==='building' && parts[2]==='amenities') {category='building_amenities'; name=parts.slice(3).join('_');}
          else {category=parts[1]; name=parts.slice(2).join('_');}
          const valid=['interior','exterior','building_amenities','appliances','utilities'];
          if (!valid.includes(category)) continue;
          const cleanName=name.replace(/([A-Z])/g,' $1').toLowerCase().replace(/^./,s=>s.toUpperCase()).replace(/\b\w/g,l=>l.toUpperCase());
          features.push({property_id:propertyId!,feature_name:cleanName,feature_category:category as 'interior'|'exterior'|'building_amenities'|'appliances'|'utilities',feature_value:String(value)});
        }
      }

      // custom amenities
      if (customAmenities && customAmenities.trim()) {
        customAmenities.split(/[,\n]/).map(a=>a.trim()).filter(a=>a).forEach(a=>features.push({property_id:propertyId!,feature_name:a,feature_category:'building_amenities',feature_value:'available'}));
      }
      
      // Determine which existing feature rows need replacing
      const namesToReplace = features.map(f => f.feature_name);

      // Delete existing amenity features for this property (only those we will overwrite)
      if (namesToReplace.length) {
        const { error: deleteError } = await supabase
          .from('property_features')
          .delete()
          .eq('property_id', propertyId)
          .in('feature_name', namesToReplace);

        if (deleteError) {
          console.error('Error deleting previous features:', deleteError);
          throw deleteError;
        }
      }

      // Insert features after previous versions (if any) have been removed
      if (features.length > 0) {
        const { error: insertError } = await supabase
          .from('property_features')
          .insert(features);

        if (insertError) {
          console.error('Error saving features:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error in saveCurrentFormData:', error);
      throw error;
    }
  }, [propertyId, customAmenities]);

  // Load existing features on mount
  useEffect(() => {
    const loadExistingFeatures = async () => {
      if (!propertyId) return;

      try {
        const supabase = createClient();
        const { data: features, error } = await supabase
          .from('property_features')
          .select('*')
          .eq('property_id', propertyId);

        if (error) {
          console.error('Error loading existing features:', error);
          return;
        }

        if (features) {
          const customAmenitiesList: string[] = [];

          features.forEach(feature => {
            // Collect custom amenities (those not in standard categories)
            if (feature.feature_category === 'building_amenities' && feature.feature_value === 'available') {
              customAmenitiesList.push(feature.feature_name);
            }
          });

          if (customAmenitiesList.length > 0) {
            setCustomAmenities(customAmenitiesList.join(', '));
          }

          // Imperatively check inputs to reflect loaded data
          setTimeout(() => {
            const allInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name^="feature_"]'));
            allInputs.forEach(input => {
              const parts = input.name.split('_');
              if (parts.length < 3) return;
              let cat:string;
              let nameParts:string[];
              if (parts[1]==='building' && parts[2]==='amenities') {
                cat='building_amenities';
                nameParts=parts.slice(3);
              } else {
                cat=parts[1];
                nameParts=parts.slice(2);
              }
              const fname = nameParts.join('_').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
              const match = features.find(fe => fe.feature_category===cat && fe.feature_name===fname);
              if (!match) return;
              if (input.type==='checkbox') input.checked=true;
              else if (input.type==='radio') input.checked = input.value === match.feature_value;
            });
          }, 0);
        }
      } catch (error) {
        console.error('Error loading existing features:', error);
      }
    };

    loadExistingFeatures().finally(() => setIsLoading(false));
  }, [propertyId]);

  // Redirect if no property ID
  useEffect(() => {
    if (!propertyId) {
      router.push('/sell/create');
    }
  }, [propertyId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log('Amenities form submitted!');
    console.log('Property ID:', propertyId);
    
    try {
      const formData = new FormData(e.currentTarget);
      const supabase = createClient();
      
      console.log('Supabase client created successfully');
      
      // Extract features data - this will be an array of features
      const features: Array<{
        property_id: string;
        feature_name: string;
        feature_category: 'interior' | 'exterior' | 'building_amenities' | 'appliances' | 'utilities';
        feature_value: string;
      }> = [];
      
      // Get all form fields that start with 'feature_'
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('feature_') && value && value !== '' && propertyId) {
          const parts = key.split('_');
          if (parts.length >= 3) {
            // Handle compound categories like "building_amenities"
            let category: string;
            let name: string;
            
            if (parts[1] === 'building' && parts[2] === 'amenities') {
              category = 'building_amenities';
              name = parts.slice(3).join('_');
            } else {
              category = parts[1];
              name = parts.slice(2).join('_');
            }
            
            // Handle checkbox and radio values
            const featureValue = value as string;
            
            // Validate category
            const validCategories = ['interior', 'exterior', 'building_amenities', 'appliances', 'utilities'];
            if (!validCategories.includes(category)) {
              console.warn(`Invalid category: ${category}, skipping feature: ${key}`);
              continue;
            }
            
            // Clean up the feature name
            const cleanFeatureName = name
              .replace(/([A-Z])/g, ' $1')
              .toLowerCase()
              .replace(/^./, str => str.toUpperCase())
              .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
            
            features.push({
              property_id: propertyId,
              feature_name: cleanFeatureName,
              feature_category: category as 'interior' | 'exterior' | 'building_amenities' | 'appliances' | 'utilities',
              feature_value: featureValue
            });
          }
        }
      }

      // Handle custom amenities
      const customAmenitiesText = formData.get('custom_amenities') as string;
      if (customAmenitiesText && customAmenitiesText.trim() && propertyId) {
        // Split custom amenities by line or comma and add them as individual features
        const customFeatures = customAmenitiesText.split(/[,\n]/).map(amenity => amenity.trim()).filter(amenity => amenity);
        
        customFeatures.forEach(amenity => {
          features.push({
            property_id: propertyId,
            feature_name: amenity,
            feature_category: 'building_amenities' as const,
            feature_value: 'available'
          });
        });
      }

      console.log('Features to be inserted:', features);
      
      if (features.length > 0) {
        const namesToReplace = features.map(f => f.feature_name);

        // Remove any existing rows for these features first to avoid unique-constraint conflicts
        if (namesToReplace.length) {
          const { error: deleteError } = await supabase
            .from('property_features')
            .delete()
            .eq('property_id', propertyId)
            .in('feature_name', namesToReplace);

          if (deleteError) {
            console.error('Error deleting previous amenities:', deleteError);
            alert(`Error saving amenities: ${deleteError.message}. Please try again.`);
            setIsSubmitting(false);
            return;
          }
        }

        // Insert the property features
        const { data, error: insertError } = await supabase
          .from('property_features')
          .insert(features)
          .select();

        if (insertError) {
          console.error('Error creating property features:', insertError);
          console.error('Features that failed:', features);
          alert(`Error saving amenities: ${insertError.message}. Please try again.`);
          setIsSubmitting(false);
          return;
        }

        console.log('Property features created successfully:', data);
      } else {
        console.log('No features selected, skipping amenities save');
      }
      
      // Client-side redirect
      await navigateWithTransition(`/sell/create/screening?property_id=${propertyId}`);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const exitToDashboard = async () => {
    try {
      await saveCurrentFormData();
    } catch (err) {
      console.error('Error saving before exit:', err);
    } finally {
      router.push('/sell/dashboard');
    }
  };

  // ---- NEW EFFECT: auto-save on browser navigation/back/unload ----
  useEffect(() => {
    if (!propertyId) return;

    const handleBeforeUnload = () => {
      // Fire and forget – we do not await here because the page is unloading
      saveCurrentFormData();
    };

    const handlePopState = () => {
      // User pressed Back/Forward in browser history
      saveCurrentFormData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [propertyId, saveCurrentFormData]);

  if (!propertyId) {
    return <div>Loading...</div>;
  }

  return (
    <PageTransition isLoading={isLoading}>
      <main className="min-h-screen bg-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Amenities</h1>
          <button 
            onClick={exitToDashboard}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={3} propertyId={propertyId} beforeNavigate={saveCurrentFormData} />

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit}>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Highlight the Key Features of Your Home</h2>
          <p className="text-gray-600 mb-8">Showcase your amenities</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Utilities */}
            <div>
                <h3 className="font-semibold mb-4">Utilities</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_utilities_laundry" 
                      value="in_unit"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Laundry In Unit</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_utilities_laundry" 
                      value="in_building"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Laundry In Building</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_utilities_laundry" 
                      value="none"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>No Laundry Facilities</span>
                </label>
              </div>
            </div>

            {/* Appliances */}
            <div>
              <h3 className="font-semibold mb-4">Appliances</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_appliances_dishwasher"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Dishwasher</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_appliances_freezer"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Freezer</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_appliances_microwave"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Microwave</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_appliances_oven"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Oven</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_appliances_refrigerator"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Refrigerator</span>
                </label>
              </div>
            </div>

              {/* Building Amenities */}
            <div>
                <h3 className="font-semibold mb-4">Building Amenities</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_building_amenities_gym"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Gym/Fitness Center</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_building_amenities_pool"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Pool</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_building_amenities_elevator"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Elevator</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_building_amenities_parking"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Parking Available</span>
                </label>
              </div>
            </div>

              {/* Interior Features */}
            <div>
                <h3 className="font-semibold mb-4">Interior Features</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_cooling" 
                      value="central"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Central Air</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_cooling" 
                      value="wall"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Wall AC</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_cooling" 
                      value="window"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Window AC</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_interior_furnished"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Furnished</span>
                </label>
              </div>
            </div>

            {/* Heating */}
            <div>
              <h3 className="font-semibold mb-4">Heating</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_heating" 
                      value="baseboard"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Baseboard</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_heating" 
                      value="forced_air"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Forced Air</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_heating" 
                      value="heat_pump"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Heat Pump</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_heating" 
                      value="wall"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Wall Heater</span>
                </label>
              </div>
            </div>

            {/* Flooring */}
            <div>
              <h3 className="font-semibold mb-4">Flooring</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_flooring" 
                      value="carpet"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Carpet</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_flooring" 
                      value="hardwood"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Hardwood</span>
                </label>
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_flooring" 
                      value="tile"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                  <span>Tile</span>
                </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_interior_flooring" 
                      value="laminate"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Laminate</span>
                  </label>
                </div>
              </div>

              {/* Exterior Features */}
              <div>
                <h3 className="font-semibold mb-4">Exterior</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_exterior_balcony"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Balcony</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_exterior_patio"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Patio</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_exterior_yard"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Yard</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      name="feature_exterior_garden"
                      value="true"
                      className="form-checkbox text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Garden</span>
                  </label>
              </div>
            </div>

              {/* Pet Policy */}
            <div>
                <h3 className="font-semibold mb-4">Pet Policy</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_building_amenities_pets" 
                      value="allowed"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Pets Allowed</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_building_amenities_pets" 
                      value="not_allowed"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>No Pets</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_building_amenities_pets" 
                      value="cats_only"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Cats Only</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="feature_building_amenities_pets" 
                      value="small_pets"
                      className="form-radio text-blue-600" 
                      disabled={isSubmitting}
                    />
                    <span>Small Pets Only</span>
                </label>
                </div>
            </div>
          </div>

          {/* Custom Amenities */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Add in any other key amenities</h3>
            <textarea
                name="custom_amenities"
              value={customAmenities}
              onChange={(e) => setCustomAmenities(e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter additional amenities..."
                disabled={isSubmitting}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button 
              onClick={() => handleNavigation(`/sell/create/media?property_id=${propertyId}`)}
              className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              type="button"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              onClick={() => handleNavigation(`/sell/create/screening?property_id=${propertyId}`)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
        </form>
      </div>
    </main>
    </PageTransition>
  );
}

export const dynamic = 'force-dynamic';
