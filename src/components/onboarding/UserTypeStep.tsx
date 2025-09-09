import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { StepProps } from '@/src/types/onboarding';
import { cn } from '@/utils/styles';

const OPTIONS: Array<{ value: 'renter' | 'landlord' | 'both'; title: string; desc: string; gradient: string }> = [
  { 
    value: 'renter', 
    title: 'Renter', 
    desc: 'Looking for the perfect place to call home', 
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    value: 'landlord', 
    title: 'Landlord', 
    desc: 'Have properties to lease and manage', 
    gradient: 'from-green-500 to-emerald-500'
  },
  { 
    value: 'both', 
    title: 'Both', 
    desc: 'Renting and leasing properties', 
    gradient: 'from-purple-500 to-pink-500'
  },
];

const UserTypeStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onPrevious, onCancel }) => {
  const [type, setType] = useState<'renter' | 'landlord' | 'both' | ''>(data.userType as 'renter' | 'landlord' | 'both' || '');
  const [err, setErr] = useState('');

  const handleNext = () => {
    if (!type) { setErr('Please select an option'); return; }
    const userType = type === 'both' ? 'renter' : type;
    onUpdate({ userType });
    onNext?.();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white px-4 py-4">
      {/* Top Row */}
      <div className="flex justify-between items-center mb-3">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Back"
          className="rounded-full p-2 hover:bg-gray-100 transition"
        >
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel onboarding"
          className="text-gray-500 hover:text-gray-700 text-base font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <img src="/logo.png" alt="Home" className="w-10 h-10 mb-2" />
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
          What brings you here?
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Help us customize your experience and show you what matters most
        </p>
        
        <div className="w-full space-y-4">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setType(opt.value); setErr(''); }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-[1.01]",
                type === opt.value
                  ? "border-blue-600 bg-white shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center text-white font-bold text-base shadow-sm",
                  opt.gradient
                )}>
                  {opt.title[0]}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{opt.title}</h4>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                type === opt.value
                  ? "border-blue-600"
                  : "border-gray-300 group-hover:border-gray-400"
              )}>
                {type === opt.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                )}
              </div>
            </button>
          ))}
        </div>

        {err && (
          <p className="text-sm text-red-500 text-center font-medium mt-3">{err}</p>
        )}

        <Button 
          onClick={handleNext}
          className="w-full h-12 mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all text-lg flex items-center justify-center gap-2"
        >
          Next <span className="ml-2">→</span>
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto mt-5">
        <div className="flex justify-between text-sm text-gray-600 mb-1 px-1">
          <span>Step 2 of 4</span>
          <span>40% complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "40%" }} />
        </div>
      </div>
    </div>
  );
};

export default UserTypeStep;
