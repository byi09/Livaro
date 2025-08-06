import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/utils/styles";
import { StepProps } from "@/src/types/onboarding";


const PersonalInfoStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onPrevious }) => {
  const handleBack = () => {
    onPrevious?.();  // Go back to Welcome Screen
  };

  const handleCancel = () => {
    window.location.href = '/';  // Go back to homepage
  };

  const [formData, setFormData] = useState({
    username: data.username ?? "",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    dateOfBirth: data.dateOfBirth,
    phone: data.phone ?? "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    data.dateOfBirth ? new Date(data.dateOfBirth) : null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!selectedDate) newErrors.dateOfBirth = "Date of birth is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(formData.username)}`);
      if (res.ok) {
        const users = await res.json();
        if (users && users.length > 0) {
          setErrors((prev) => ({ ...prev, username: "Username already taken" }));
          setCheckingUsername(false);
          return;
        }
      }
    } catch (err) {
      console.error("Username check failed", err);
    }
    setCheckingUsername(false);
    onUpdate({
      ...formData,
      dateOfBirth: selectedDate ? selectedDate.toISOString().split("T")[0] : ""
    });
    onNext?.();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen flex flex-col justify-start bg-white px-4 py-4">
      {/* Top Row */}
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-full p-2 hover:bg-gray-100 transition"
          aria-label="Back"
        >
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 text-base font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <div className="mb-2">
          <img src="/logo.png" alt="Home" className="w-10 h-10 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
          Tell us about yourself
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          We need some basic information to create your personalized profile
        </p>

        <form className="w-full space-y-3">
          {/* Username */}
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                className={cn(
                  "w-full h-11 px-4 rounded-lg border-2 focus:ring-2 text-base outline-none",
                  errors.username
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300"
                )}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-pulse">...</div>
                </div>
              )}
            </div>
            {errors.username && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center">
                <span className="mr-1">!</span> {errors.username}
              </p>
            )}
          </div>

          {/* First & Last Name */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                className={cn(
                  "w-full h-11 px-4 rounded-lg border-2 focus:ring-2 text-base outline-none",
                  errors.firstName
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300"
                )}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center">
                  <span className="mr-1">!</span> {errors.firstName}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                className={cn(
                  "w-full h-11 px-4 rounded-lg border-2 focus:ring-2 text-base outline-none",
                  errors.lastName
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300"
                )}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center">
                  <span className="mr-1">!</span> {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="relative">
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                setSelectedDate(date);
                if (errors.dateOfBirth)
                  setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
              }}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select your date of birth"
              maxDate={new Date()}
              minDate={new Date("1900-01-01")}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              wrapperClassName="w-full"
              className={cn(
                "w-full h-11 px-4 pr-10 rounded-lg border-2 focus:ring-2 text-base outline-none",
                errors.dateOfBirth
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300"
              )}
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center">
                <span className="mr-1">!</span> {errors.dateOfBirth}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="relative">
            <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (optional)
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+1 (xxx) xxx-xxxx"
              className="w-full h-11 px-4 pr-10 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base outline-none"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="8" />
            </svg>
          </div>

          {/* Next Button */}
          <div>
            <Button
              type="button"
              onClick={handleNext}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all text-lg flex items-center justify-center gap-2"
              disabled={checkingUsername}
            >
              {checkingUsername ? (
                <>
    
                  Checking...
                </>
              ) : (
                <>
                  Next <span className="ml-2">→</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1 px-1">
          <span>Step 1 of 4</span>
          <span>20% complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "20%" }} />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
