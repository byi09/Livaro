import React, { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { StepProps } from '@/src/types/onboarding';
import { ChevronLeft } from 'lucide-react';

const LocationInfoStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onPrevious }) => {
  const [currentCity, setCurrentCity] = useState(data.currentCity ?? '');
  const [currentState, setCurrentState] = useState(data.currentState ?? '');
  const [currentZipCode, setCurrentZipCode] = useState(data.currentZipCode ?? '');
  
  const [interestCity, setInterestCity] = useState(data.interestCity ?? '');
  const [interestState, setInterestState] = useState(data.interestState ?? '');
  const [interestZipCode, setInterestZipCode] = useState(data.interestZipCode ?? '');

  const handleNext = () => {
    const updateData = { 
      currentCity, 
      currentState, 
      currentZipCode,
      interestCity,
      interestState,
      interestZipCode,
      currentLocation: `${currentCity}, ${currentState} ${currentZipCode}`.trim(),
      locationOfInterest: `${interestCity}, ${interestState} ${interestZipCode}`.trim()
    };
    onUpdate(updateData);
    onNext?.();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white px-4 py-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Back"
          className="rounded-full p-2 hover:bg-gray-100 transition"
        >
          <ChevronLeft className="w-5 h-5 text-blue-600" />
        </button>
        <button
          type="button"
          aria-label="Cancel onboarding"
          className="text-gray-500 hover:text-gray-700 text-base font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <img src="/logo.png" alt="Home Icon" className="w-10 h-10 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
          Location Preferences
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Help us connect you with properties in the right areas and personalize your experience
        </p>

        <div className="w-full space-y-4">
          {/* Current Location Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Current Location</h4>
              <p className="text-xs text-gray-600">Where are you currently living? (Optional)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Input
                  id="currentCity"
                  placeholder="Enter City"
                  value={currentCity}
                  onChange={e => setCurrentCity(e.target.value)}
                  className="h-10 text-sm px-3 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <Input
                  id="currentState"
                  placeholder="Enter State"
                  value={currentState}
                  onChange={e => setCurrentState(e.target.value)}
                  className="h-10 text-sm px-3 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <Input
                  id="currentZipCode"
                  placeholder="Enter Zip Code"
                  value={currentZipCode}
                  onChange={e => setCurrentZipCode(e.target.value)}
                  className="h-10 text-sm px-3 rounded-lg border border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Location of Interest Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Location of Interest</h4>
              <p className="text-xs text-gray-600">Where are you looking to rent or lease properties?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Input
                  id="interestCity"
                  placeholder="Enter City"
                  value={interestCity}
                  onChange={e => setInterestCity(e.target.value)}
                  className="h-10 text-sm px-3 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <Input
                  id="interestState"
                  placeholder="Enter State"
                  value={interestState}
                  onChange={e => setInterestState(e.target.value)}
                  className="h-10 text-sm px-3 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <Input
                  id="interestZipCode"
                  placeholder="Enter Zip Code"
                  value={interestZipCode}
                  onChange={e => setInterestZipCode(e.target.value)}
                  className="h-10 text-sm px-3 rounded-lg border border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleNext}
          className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all text-lg flex items-center justify-center gap-2"
        >
          Finish Setup
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1 px-1">
          <span>Step 4 of 4</span>
          <span>100% complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
};

export default LocationInfoStep;
