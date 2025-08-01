'use client'

import React, { useState, useEffect } from 'react'
import { HiX, HiUser, HiAcademicCap, HiHome, HiCurrencyDollar, HiCalendar, HiCheck } from 'react-icons/hi'
import Spinner from '@/src/components/ui/Spinner'

interface StudentProfileFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface StudentProfile {
  firstName: string
  lastName: string
  email: string
  phone?: string
  university: string
  graduationYear: string
  major: string
  budget: {
    min: number
    max: number
  }
  preferredAreas: string[]
  moveInDate: string
  leaseLength: string
  pets: boolean
  parking: boolean
  roommates: boolean
  furnished: boolean
  utilitiesIncluded: boolean
}

export default function StudentProfileForm({ isOpen, onClose, onSuccess }: StudentProfileFormProps) {
  const [profile, setProfile] = useState<StudentProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    university: '',
    graduationYear: '',
    major: '',
    budget: {
      min: 0,
      max: 0
    },
    preferredAreas: [],
    moveInDate: '',
    leaseLength: '12 months',
    pets: false,
    parking: false,
    roommates: false,
    furnished: false,
    utilitiesIncluded: false
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  useEffect(() => {
    if (isOpen) {
      loadExistingProfile()
    }
  }, [isOpen])

  const loadExistingProfile = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/student/profile')
      const data = await response.json()
      
      if (data.profile) {
        // Load saved profile if it exists
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load existing profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof StudentProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBudgetChange = (type: 'min' | 'max', value: number) => {
    setProfile(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [type]: value
      }
    }))
  }

  const handleAreaChange = (area: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      preferredAreas: checked 
        ? [...prev.preferredAreas, area]
        : prev.preferredAreas.filter(a => a !== area)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/student/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile')
      }

      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('Error saving profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <HiUser className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <HiAcademicCap className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            University *
          </label>
          <input
            type="text"
            value={profile.university}
            onChange={(e) => handleInputChange('university', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., UC Berkeley"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Major *
          </label>
          <input
            type="text"
            value={profile.major}
            onChange={(e) => handleInputChange('major', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Computer Science"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Graduation Year *
          </label>
          <select
            value={profile.graduationYear}
            onChange={(e) => handleInputChange('graduationYear', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select year</option>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <HiCurrencyDollar className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Housing Preferences</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget Range (Monthly Rent)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={profile.budget.min}
              onChange={(e) => handleBudgetChange('min', parseInt(e.target.value) || 0)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Min"
            />
            <span className="flex items-center text-gray-500">to</span>
            <input
              type="number"
              value={profile.budget.max}
              onChange={(e) => handleBudgetChange('max', parseInt(e.target.value) || 0)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Max"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Lease Length
          </label>
          <select
            value={profile.leaseLength}
            onChange={(e) => handleInputChange('leaseLength', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="9 months">9 months</option>
            <option value="12 months">12 months</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Move-in Date
          </label>
          <input
            type="date"
            value={profile.moveInDate}
            onChange={(e) => handleInputChange('moveInDate', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Areas
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Downtown', 'University Area', 'North Berkeley', 'South Berkeley', 'Elmwood', 'Rockridge'].map(area => (
            <label key={area} className="flex items-center">
              <input
                type="checkbox"
                checked={profile.preferredAreas.includes(area)}
                onChange={(e) => handleAreaChange(area, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{area}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <HiHome className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Additional Preferences</h3>
      </div>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profile.pets}
            onChange={(e) => handleInputChange('pets', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">I have pets</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profile.parking}
            onChange={(e) => handleInputChange('parking', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">I need parking</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profile.roommates}
            onChange={(e) => handleInputChange('roommates', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">I'm open to roommates</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profile.furnished}
            onChange={(e) => handleInputChange('furnished', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">I prefer furnished</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profile.utilitiesIncluded}
            onChange={(e) => handleInputChange('utilitiesIncluded', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">I prefer utilities included</span>
        </label>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <HiUser className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Student Profile Setup
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 < currentStep 
                      ? 'bg-green-500 text-white' 
                      : i + 1 === currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {i + 1 < currentStep ? <HiCheck className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`w-12 h-1 mx-2 ${
                      i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex">
                  <HiX className="w-5 h-5 text-red-400 mt-0.5" />
                  <p className="ml-3 text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {renderCurrentStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : prevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={currentStep === totalSteps ? handleSave : nextStep}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Spinner size={16} variant="white" className="mr-2" />
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <HiCheck className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 