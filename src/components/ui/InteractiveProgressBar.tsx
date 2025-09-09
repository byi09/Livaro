'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface InteractiveProgressBarProps {
  currentStep: number;
  propertyId?: string | null;
  mode?: string | null;
  /** optional callback before we change page – parent can save form */
  beforeNavigate?: () => Promise<void> | void;
}

const InteractiveProgressBar: React.FC<InteractiveProgressBarProps> = ({
  currentStep,
  propertyId,
  mode,
  beforeNavigate
}) => {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [allowedSteps, setAllowedSteps] = useState<boolean[]>([]);
  const [furthestStep, setFurthestStep] = useState<number>(currentStep);

  const steps = [
    { label: 'Manage Media', path: '/sell/manage-media' },
    { label: 'Property Info', path: '/sell/create' },
    { label: 'Rent Details', path: '/sell/create/rent-details' },
    { label: 'Media', path: '/sell/create/media' },
    { label: 'Amenities', path: '/sell/create/amenities' },
    { label: 'Additional Fees', path: '/sell/create/costs-and-fees' },
    { label: 'Review & Publish', path: '/sell/create/review' }
  ];

  // Load furthest step from localStorage when propertyId becomes available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultKey = 'furthestStep_default';
      const defaultStored = window.localStorage.getItem(defaultKey);
      const defaultStep = defaultStored ? parseInt(defaultStored, 10) : 0;

      let combinedStep = Math.max(defaultStep, currentStep);

      if (propertyId) {
        const propertyKey = `furthestStep_${propertyId}`;
        const stored = window.localStorage.getItem(propertyKey);
        const storedStep = stored ? parseInt(stored, 10) : 0;
        combinedStep = Math.max(combinedStep, storedStep);
        
        // If default held newer progress, migrate it to property key
        if (combinedStep > storedStep) {
          window.localStorage.setItem(propertyKey, combinedStep.toString());
        }
      }

      setFurthestStep(combinedStep);
    }
  }, [propertyId, currentStep]);

  useEffect(() => {
    const newFurthestStep = Math.max(furthestStep, currentStep);
    if (newFurthestStep > furthestStep) {
      setFurthestStep(newFurthestStep);
      if (typeof window !== 'undefined') {
        const key = propertyId ? `furthestStep_${propertyId}` : 'furthestStep_default';
        window.localStorage.setItem(key, newFurthestStep.toString());
      }
    }

    // Completed: any step before the furthest reached step is considered complete
    const completedArr = steps.map((_, idx) => idx < newFurthestStep);
    setCompletedSteps(completedArr);

    // Allowed: allow access to current step and any step up to the furthest reached
    const allowedArr = steps.map((_, idx) => idx <= newFurthestStep);
    setAllowedSteps(allowedArr);
    
    console.log('Progress state:', { 
      currentStep, 
      furthestStep, 
      newFurthestStep, 
      completedArr, 
      allowedArr,
      propertyId 
    });
  }, [currentStep, furthestStep, propertyId, steps.length]);

  const handleStepClick = async (stepIndex: number) => {
    console.log('Step click:', { stepIndex, allowed: allowedSteps[stepIndex] });
    
    // Only allow navigation if allowedSteps true
    if (!allowedSteps[stepIndex]) {
      return;
    }

    if (beforeNavigate) {
      try {
        await beforeNavigate();
      } catch (err) {
        console.error('beforeNavigate error', err);
        // still navigate to avoid blocking user
      }
    }

    const step = steps[stepIndex];
    let url = step.path;
    const params = [];

    if (propertyId) {
      params.push(`property_id=${propertyId}`);
    }

    if (mode) {
      params.push(`mode=${mode}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    router.push(url);
  };

  const getStepClassName = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      // Current step: diamond/rhombus shape with blue background
      return 'bg-blue-600 cursor-pointer transform rotate-45';
    }
    if (allowedSteps[stepIndex]) {
      return completedSteps[stepIndex] 
        ? 'bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer' // Completed: solid blue circle
        : 'bg-white border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer'; // Incomplete: empty white circle
    }
    return 'bg-white border-2 border-gray-200 cursor-not-allowed'; // Disabled: empty white circle
  };

  const getStepTextClassName = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      return 'text-gray-800 font-semibold';
    }
    if (allowedSteps[stepIndex]) {
      return completedSteps[stepIndex] 
        ? 'text-gray-800 font-medium'
        : 'text-gray-600 font-medium';
    }
    return 'text-gray-500';
  };

  // Calculate progress bar width - should end at the center of circles, not extend beyond
  const progressWidth = furthestStep === 0 ? 0 : (furthestStep / (steps.length - 1)) * 100;

  return (
    <div className="mb-12 relative sticky top-16 z-20 bg-white/80 backdrop-blur">
      {/* Step Circles Container */}
      <div className="flex justify-between relative w-full">
        {/* Progress Bar Background - positioned precisely to connect circle centers */}
        <div 
          className="absolute top-[10px] sm:top-[12px] h-1 bg-blue-100 rounded-full"
          style={{ 
            left: `calc(100% / ${steps.length} / 2)`,
            right: `calc(100% / ${steps.length} / 2)`,
          }}
        >
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={step.label} className="flex-1 relative flex flex-col items-center">
            <button
              onClick={() => handleStepClick(index)}
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${getStepClassName(index)} relative z-10 shadow-sm ${index === currentStep ? '' : 'rounded-full'}`}
              title={allowedSteps[index] ? `Go to ${step.label}` : `Complete previous steps to unlock ${step.label}`}
              disabled={!allowedSteps[index]}
            >
              {/* Add checkmark for completed steps (but not current step) */}
              {completedSteps[index] && index !== currentStep && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
            
            {/* Step Label */}
            <div className={`text-xs mt-6 text-center whitespace-nowrap transition-colors duration-300 ${getStepTextClassName(index)}`}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractiveProgressBar; 