import React, { useState } from 'react';
import { StepProps } from '@/src/types/onboarding';
import { Button } from '@/src/components/ui/button';
import Switch from '@/src/components/ui/switch';
import { ChevronLeft } from 'lucide-react';

interface ToggleRowProps {
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  disablePush: boolean;
  onChange: (field: 'email' | 'push', value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, email, push, disablePush, onChange }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{label}</h4>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Email Notifications</span>
        <Switch 
          checked={email} 
          onCheckedChange={(v) => onChange('email', v)}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${disablePush ? 'text-gray-400' : 'text-gray-700'}`}>
          SMS Notifications
        </span>
        <Switch 
          checked={push} 
          disabled={disablePush} 
          onCheckedChange={(v) => onChange('push', v)}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>
    </div>
  </div>
);

const NotificationPreferencesStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onPrevious }) => {
  const phoneAvailable = Boolean(data.phoneNumber && data.phoneNumber.trim());
  const [prefs, setPrefs] = useState({
    updatesSavedPropertiesEmail: data.updatesSavedPropertiesEmail ?? true,
    updatesSavedPropertiesPush: phoneAvailable ? (data.updatesSavedPropertiesPush ?? false) : false,
    newPropertiesEmail: data.newPropertiesEmail ?? true,
    newPropertiesPush: phoneAvailable ? (data.newPropertiesPush ?? false) : false,
  });

  const handleToggle = (keyBase: string, field: 'email' | 'push', value: boolean) => {
    const key = `${keyBase}${field === 'email' ? 'Email' : 'Push'}` as keyof typeof prefs;
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    onUpdate(prefs);
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
          Notification Preferences
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Choose how you’d like to stay updated with the latest property information and platform news
        </p>

        <div className="w-full space-y-4">
          <ToggleRow
            label="Property Updates"
            description="Get notified when saved properties have price changes, new photos, or status updates"
            email={prefs.updatesSavedPropertiesEmail}
            push={prefs.updatesSavedPropertiesPush}
            disablePush={!phoneAvailable}
            onChange={(field, val) => handleToggle('updatesSavedProperties', field, val)}
          />
          <ToggleRow
            label="New Property Matches"
            description="Receive alerts for new properties that match your preferences and search criteria"
            email={prefs.newPropertiesEmail}
            push={prefs.newPropertiesPush}
            disablePush={!phoneAvailable}
            onChange={(field, val) => handleToggle('newProperties', field, val)}
          />
        </div>

        <Button 
          onClick={handleNext}
          className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all text-lg flex items-center justify-center gap-2"
        >
          Next <span className="ml-2">→</span>
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1 px-1">
          <span>Step 3 of 4</span>
          <span>60% complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesStep;
