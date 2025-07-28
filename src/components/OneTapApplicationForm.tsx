'use client'
import React, { useState, useEffect } from 'react'
import { HiX, HiUser, HiHome, HiQuestionMarkCircle, HiCheck, HiCog, HiSwitchHorizontal, HiChevronDown, HiChevronUp } from 'react-icons/hi'
import Spinner from '@/src/components/ui/Spinner'

interface OneTapApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FieldConfig {
  include: boolean
  label: string
  placeholder?: string
  options?: string[]
  required: boolean
  helpText?: string
  fieldType: 'dropdown' | 'date' | 'text' | 'yesno' | 'email' | 'phone' | 'textarea'
  selectedOptions?: string[] // New field for selected options
}

interface FormConfig {
  number_of_occupants: FieldConfig
  lease_start_date: FieldConfig
  lease_length: FieldConfig
  move_in_flexibility: FieldConfig
  pets_preference: FieldConfig
  parking_preference: FieldConfig
  tenant_name: FieldConfig
  tenant_email: FieldConfig
  tenant_phone: FieldConfig
  message_to_landlord: FieldConfig
}

export default function OneTapApplicationForm({ isOpen, onClose, onSuccess }: OneTapApplicationFormProps) {
  const [formConfig, setFormConfig] = useState<FormConfig>({
    number_of_occupants: {
      include: true,
      label: 'Include Number of Occupants',
      placeholder: 'Select maximum number of tenants',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      selectedOptions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      required: true,
      helpText: 'Ask tenants how many people will be living in the property',
      fieldType: 'dropdown'
    },
    lease_start_date: {
      include: true,
      label: 'Include Desired Lease Start Date',
      placeholder: 'Select when tenant wants to move in',
      required: true,
      helpText: 'Ask tenants when they want to start their lease (month & year only)',
      fieldType: 'date'
    },
    lease_length: {
      include: true,
      label: 'Include Preferred Lease Length',
      placeholder: 'Select lease duration preference',
      options: ['3 months', '6 months', '9 months', '12 months', 'Other'],
      selectedOptions: ['3 months', '6 months', '9 months', '12 months', 'Other'],
      required: true,
      helpText: 'Ask tenants their preferred lease term',
      fieldType: 'dropdown'
    },
    move_in_flexibility: {
      include: true,
      label: 'Include Student Flexibility',
      placeholder: 'Are you flexible on your move-in date?',
      options: ['Yes', 'No'],
      selectedOptions: ['Yes', 'No'],
      required: true,
      helpText: 'Ask if tenants are flexible with their move-in date',
      fieldType: 'yesno'
    },
    pets_preference: {
      include: true,
      label: 'Include Pets Info',
      placeholder: 'Do you have pets?',
      options: ['Yes', 'No'],
      selectedOptions: ['Yes', 'No'],
      required: true,
      helpText: 'Ask if tenants have pets (no need to specify type)',
      fieldType: 'yesno'
    },
    parking_preference: {
      include: true,
      label: 'Include Parking Info',
      placeholder: 'Do you need parking?',
      options: ['Yes', 'No'],
      selectedOptions: ['Yes', 'No'],
      required: true,
      helpText: 'Ask if tenants need parking',
      fieldType: 'yesno'
    },
    tenant_name: {
      include: true,
      label: 'Include Name',
      placeholder: 'Enter your first name',
      required: true,
      helpText: 'Ask for tenant\'s first name only',
      fieldType: 'text'
    },
    tenant_email: {
      include: true,
      label: 'Include Email',
      placeholder: 'Enter your email address',
      required: true,
      helpText: 'Ask for tenant\'s email (used for follow-up)',
      fieldType: 'email'
    },
    tenant_phone: {
      include: false,
      label: 'Include Phone Number',
      placeholder: 'Enter your phone number',
      required: false,
      helpText: 'Ask for tenant\'s phone number (optional contact)',
      fieldType: 'phone'
    },
    message_to_landlord: {
      include: false,
      label: 'Include Message to Landlord',
      placeholder: 'Tell us about yourself (e.g., "We\'re 3 quiet students...")',
      required: false,
      helpText: 'Allow tenants to send a free text message',
      fieldType: 'textarea'
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set())

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
        setFormConfig(prev => ({
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

  const handleConfigChange = (fieldKey: keyof FormConfig, configKey: keyof FieldConfig, value: unknown) => {
    setFormConfig(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [configKey]: value
      }
    }))
  }

  const toggleOptionSelection = (fieldKey: keyof FormConfig, option: string) => {
    const currentSelected = formConfig[fieldKey].selectedOptions || []
    const newSelected = currentSelected.includes(option)
      ? currentSelected.filter(o => o !== option)
      : [...currentSelected, option]
    
    handleConfigChange(fieldKey, 'selectedOptions', newSelected)
  }

  const toggleOptionsExpansion = (fieldKey: string) => {
    setExpandedOptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey)
      } else {
        newSet.add(fieldKey)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Convert formConfig to the format expected by the API
      const apiData = {
        include_number_of_occupants: formConfig.number_of_occupants.include,
        include_lease_start_date: formConfig.lease_start_date.include,
        include_lease_length: formConfig.lease_length.include,
        include_student_flexibility: formConfig.move_in_flexibility.include,
        include_pets_preference: formConfig.pets_preference.include,
        include_parking_preference: formConfig.parking_preference.include,
        include_tenant_name: formConfig.tenant_name.include,
        include_tenant_email: formConfig.tenant_email.include,
        include_tenant_phone: formConfig.tenant_phone.include,
        include_message_to_landlord: formConfig.message_to_landlord.include,
        field_configs: formConfig
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

  const renderPreferenceItem = (fieldKey: keyof FormConfig, config: FieldConfig) => {
    const isExpanded = expandedOptions.has(fieldKey)
    const hasOptions = config.options && config.options.length > 0
    const selectedCount = config.selectedOptions?.length || 0
    const totalCount = config.options?.length || 0

    return (
      <div key={fieldKey} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <HiSwitchHorizontal className="w-4 h-4 text-gray-600" />
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
          <div className="flex items-center space-x-3">
            {/* Required Toggle */}
            {config.include && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Required</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.required}
                    onChange={(e) => handleConfigChange(fieldKey, 'required', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}
            
            {/* Include Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.include}
                onChange={(e) => handleConfigChange(fieldKey, 'include', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Field Type Badge */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {config.fieldType}
          </span>
          {config.include && (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              config.required ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
              {config.required ? 'Required' : 'Optional'}
            </span>
          )}
        </div>

        {/* Options Configuration for Dropdown/YesNo fields */}
        {config.include && hasOptions && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Available Options</h4>
                <p className="text-xs text-gray-500">
                  {selectedCount} of {totalCount} options selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleOptionsExpansion(fieldKey)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <span>{isExpanded ? 'Hide' : 'Configure'}</span>
                {isExpanded ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isExpanded && (
              <div className="space-y-2">
                {config.options?.map((option) => {
                  const isSelected = config.selectedOptions?.includes(option) || false
                  return (
                    <label key={option} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOptionSelection(fieldKey, option)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                      {isSelected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Selected
                        </span>
                      )}
                    </label>
                  )
                })}
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
              <div className="p-3 bg-blue-100 rounded-xl">
                <HiCog className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Application Form Settings
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure which fields to include in your tenant application form
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

                {/* Property Details Section */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HiHome className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Property & Lease Details</h3>
                  </div>
                  <div className="space-y-3">
                    {renderPreferenceItem('number_of_occupants', formConfig.number_of_occupants)}
                    {renderPreferenceItem('lease_start_date', formConfig.lease_start_date)}
                    {renderPreferenceItem('lease_length', formConfig.lease_length)}
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
                    {renderPreferenceItem('move_in_flexibility', formConfig.move_in_flexibility)}
                    {renderPreferenceItem('pets_preference', formConfig.pets_preference)}
                    {renderPreferenceItem('parking_preference', formConfig.parking_preference)}
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
                    {renderPreferenceItem('tenant_name', formConfig.tenant_name)}
                    {renderPreferenceItem('tenant_email', formConfig.tenant_email)}
                    {renderPreferenceItem('tenant_phone', formConfig.tenant_phone)}
                    {renderPreferenceItem('message_to_landlord', formConfig.message_to_landlord)}
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
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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