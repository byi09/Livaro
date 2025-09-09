'use client'
import React, { useState, useEffect } from 'react'
import { HiX, HiUser, HiHome, HiQuestionMarkCircle, HiCheck, HiFilter } from 'react-icons/hi'
import Spinner from '@/src/components/ui/Spinner'

interface OneTapApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FilterPreference {
  enabled: boolean
  label: string
  value: string | number | boolean
  options?: string[]
  helpText?: string
  fieldType: 'dropdown' | 'yesno' | 'date' | 'text' | 'email' | 'phone' | 'textarea'
  required: boolean
}

interface FilterConfig {
  numberOfOccupants: FilterPreference
  leaseStartDate: FilterPreference
  leaseLength: FilterPreference
  moveInFlexibility: FilterPreference
  petsPreference: FilterPreference
  parkingPreference: FilterPreference
  tenantName: FilterPreference
  tenantEmail: FilterPreference
  tenantPhone: FilterPreference
  messageToLandlord: FilterPreference
}

export default function OneTapApplicationForm({ isOpen, onClose, onSuccess }: OneTapApplicationFormProps) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    numberOfOccupants: {
      enabled: true,
      label: 'Number of Occupants',
      value: '2',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      helpText: 'Range (1-10), for capacity matching',
      fieldType: 'dropdown',
      required: true
    },
    leaseStartDate: {
      enabled: true,
      label: 'Desired Lease Start Date',
      value: '',
      helpText: 'Month & year only',
      fieldType: 'date',
      required: true
    },
    leaseLength: {
      enabled: true,
      label: 'Preferred Lease Length',
      value: '12 months',
      options: ['3 months', '6 months', '9 months', '12 months', 'Other'],
      helpText: 'Options: 3 / 6 / 9 / 12 months / Other',
      fieldType: 'dropdown',
      required: true
    },
    moveInFlexibility: {
      enabled: true,
      label: 'Move-in Flexibility',
      value: true,
      helpText: 'Are you flexible on your move-in date?',
      fieldType: 'yesno',
      required: true
    },
    petsPreference: {
      enabled: true,
      label: 'Pets',
      value: false,
      helpText: 'No need to specify type',
      fieldType: 'yesno',
      required: true
    },
    parkingPreference: {
      enabled: true,
      label: 'Parking Needed',
      value: false,
      helpText: 'Simple toggle',
      fieldType: 'yesno',
      required: true
    },
    tenantName: {
      enabled: true,
      label: 'Name',
      value: '',
      helpText: 'First name only',
      fieldType: 'text',
      required: true
    },
    tenantEmail: {
      enabled: true,
      label: 'Email',
      value: '',
      helpText: 'Used for follow-up',
      fieldType: 'email',
      required: true
    },
    tenantPhone: {
      enabled: false,
      label: 'Phone Number',
      value: '',
      helpText: 'Optional contact',
      fieldType: 'phone',
      required: false
    },
    messageToLandlord: {
      enabled: false,
      label: 'Message to Landlord',
      value: '',
      helpText: 'Free text (e.g. "We\'re 3 quiet students...")',
      fieldType: 'textarea',
      required: false
    }
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadExistingPreferences()
    }
  }, [isOpen])

  const loadExistingPreferences = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/one-tap-application-preferences')
      const data = await response.json()
      
      if (data.preferences) {
        // Load saved configuration if it exists
        setFilterConfig(prev => ({
          ...prev,
          ...(data.preferences.field_configs && data.preferences.field_configs)
        }))
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      setError('Failed to load existing preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (filterKey: keyof FilterConfig, value: string | number | boolean) => {
    setFilterConfig(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        value
      }
    }))
  }

  const toggleFilter = (filterKey: keyof FilterConfig) => {
    setFilterConfig(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        enabled: !prev[filterKey].enabled
      }
    }))
  }

  const toggleRequired = (filterKey: keyof FilterConfig) => {
    setFilterConfig(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        required: !prev[filterKey].required
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Convert filterConfig to the format expected by the API
      const apiData = {
        include_number_of_occupants: filterConfig.numberOfOccupants.enabled,
        include_lease_start_date: filterConfig.leaseStartDate.enabled,
        include_lease_length: filterConfig.leaseLength.enabled,
        include_student_flexibility: filterConfig.moveInFlexibility.enabled,
        include_pets_preference: filterConfig.petsPreference.enabled,
        include_parking_preference: filterConfig.parkingPreference.enabled,
        include_tenant_name: filterConfig.tenantName.enabled,
        include_tenant_email: filterConfig.tenantEmail.enabled,
        include_tenant_phone: filterConfig.tenantPhone.enabled,
        include_message_to_landlord: filterConfig.messageToLandlord.enabled,
        field_configs: filterConfig
      }

      const response = await fetch('/api/one-tap-application-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('Error saving preferences:', error)
      setError(error instanceof Error ? error.message : 'Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const renderFilterItem = (filterKey: keyof FilterConfig, config: FilterPreference) => {
    return (
      <div key={filterKey} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HiFilter className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {config.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {config.helpText}
                </p>
              </div>
            </div>
          </div>
          
          {/* Enable/Disable Toggle */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={() => toggleFilter(filterKey)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Field Type and Required Badge */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {config.fieldType}
          </span>
          <button
            onClick={() => toggleRequired(filterKey)}
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border transition-colors ${
              config.required 
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {config.required ? 'Required' : 'Optional'}
          </button>
        </div>

        {/* Filter Value Selection */}
        {config.enabled && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {config.fieldType === 'dropdown' && config.options && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Preference
                </label>
                <select
                  value={config.value as string}
                  onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {config.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {config.fieldType === 'yesno' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Preference
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={filterKey}
                      value="true"
                      checked={config.value === true}
                      onChange={() => handleFilterChange(filterKey, true)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={filterKey}
                      value="false"
                      checked={config.value === false}
                      onChange={() => handleFilterChange(filterKey, false)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            )}

            {config.fieldType === 'date' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Preference
                </label>
                <input
                  type="month"
                  value={config.value as string}
                  onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}

            {(config.fieldType === 'text' || config.fieldType === 'email' || config.fieldType === 'phone' || config.fieldType === 'textarea') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Preference
                </label>
                {config.fieldType === 'textarea' ? (
                  <textarea
                    value={config.value as string}
                    onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your preference..."
                  />
                ) : (
                  <input
                    type={config.fieldType === 'email' ? 'email' : config.fieldType === 'phone' ? 'tel' : 'text'}
                    value={config.value as string}
                    onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={`Enter ${config.label.toLowerCase()}...`}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
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
        <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <HiFilter className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Application Form Fields
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure all fields for your tenant application form
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size={40} />
              </div>
            ) : (
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex">
                      <HiX className="w-5 h-5 text-red-400 mt-0.5" />
                      <p className="ml-3 text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Property & Lease Details Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HiHome className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Property & Lease Details</h3>
                  </div>
                  <div className="space-y-3">
                    {renderFilterItem('numberOfOccupants', filterConfig.numberOfOccupants)}
                    {renderFilterItem('leaseStartDate', filterConfig.leaseStartDate)}
                    {renderFilterItem('leaseLength', filterConfig.leaseLength)}
                  </div>
                </div>

                {/* Tenant Preferences Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <HiQuestionMarkCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tenant Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    {renderFilterItem('moveInFlexibility', filterConfig.moveInFlexibility)}
                    {renderFilterItem('petsPreference', filterConfig.petsPreference)}
                    {renderFilterItem('parkingPreference', filterConfig.parkingPreference)}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <HiUser className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="space-y-3">
                    {renderFilterItem('tenantName', filterConfig.tenantName)}
                    {renderFilterItem('tenantEmail', filterConfig.tenantEmail)}
                    {renderFilterItem('tenantPhone', filterConfig.tenantPhone)}
                    {renderFilterItem('messageToLandlord', filterConfig.messageToLandlord)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Spinner size={16} variant="white" className="mr-2" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <HiCheck className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 