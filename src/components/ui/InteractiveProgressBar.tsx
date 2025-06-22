'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface InteractiveProgressBarProps {
  currentStep: number;
  propertyId?: string | null;
  /** optional callback before we change page – parent can save form */
  beforeNavigate?: () => Promise<void> | void;
}

const InteractiveProgressBar: React.FC<InteractiveProgressBarProps> = ({ 
  currentStep, 
  propertyId,
  beforeNavigate
}) => {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [allowedSteps, setAllowedSteps] = useState<boolean[]>([]);
  const [furthestStep, setFurthestStep] = useState<number>(currentStep);

  const steps = [
    { label: 'Property Info', path: '/sell/create' },
    { label: 'Rent Details', path: '/sell/create/rent-details' },
    { label: 'Media', path: '/sell/create/media' },
    { label: 'Amenities', path: '/sell/create/amenities' },
    { label: 'Screening', path: '/sell/create/screening' },
    { label: 'Costs and Fees', path: '/sell/create/costs-and-fees' },
    { label: 'Final details', path: '/sell/create/final-details' },
    { label: 'Review', path: '/sell/create/review' },
    { label: 'Publish', path: '/sell/create/publish' }
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
    if (propertyId) {
      url += `?property_id=${propertyId}`;
    }
    router.push(url);
  };

  const getStepClassName = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      return 'bg-blue-600 cursor-pointer';
    }
    if (allowedSteps[stepIndex]) {
      return completedSteps[stepIndex] 
        ? 'bg-green-500 hover:bg-green-600 transition-colors cursor-pointer'
        : 'bg-gray-400 hover:bg-gray-500 transition-colors cursor-pointer';
    }
    return 'bg-gray-300 cursor-not-allowed';
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

  // Calculate progress bar width based on furthest step reached, not current step
  const progressWidth = furthestStep === 0 ? 0 : (furthestStep / (steps.length - 1)) * 100;

  return (
    <div className="mb-12 relative sticky top-16 z-20 bg-white/80 backdrop-blur">

      
      {/* Progress Bar Background - positioned to go through circle centers */}
      <div className="absolute left-0 right-0 top-[10px] sm:top-[12px] h-0.5 bg-blue-100">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      
      {/* Step Circles */}
      <div className="flex justify-between relative w-full">
        {steps.map((step, index) => (
          <div key={step.label} className="flex-1 relative flex flex-col items-center">
            <button
              onClick={() => handleStepClick(index)}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all duration-200 ${getStepClassName(index)} relative z-10`}
              title={allowedSteps[index] ? `Go to ${step.label}` : `Complete previous steps to unlock ${step.label}`}
              disabled={!allowedSteps[index]}
            >
              {/* Add checkmark for completed steps */}
              {completedSteps[index] && index !== currentStep && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
            
            {/* Step Label */}
            <div className={`text-xs mt-6 text-center whitespace-nowrap transition-colors ${getStepTextClassName(index)}`}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractiveProgressBar; 