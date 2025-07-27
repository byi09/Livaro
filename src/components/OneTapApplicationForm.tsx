'use client'
import { useState, useEffect } from 'react'
import { HiX, HiCheck, HiSparkles } from 'react-icons/hi'
import Spinner from '@/src/components/ui/Spinner'

interface OneTapApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  number_of_occupants: number
  desired_lease_start_month: number
  desired_lease_start_year: number
  preferred_lease_length: string
  move_in_flexibility: boolean
  pets_allowed: boolean
  parking_needed: boolean
  tenant_name: string
  tenant_email: string
  tenant_phone: string
  message_to_landlord: string
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const LEASE_LENGTHS = [
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '9', label: '9 months' },
  { value: '12', label: '12 months' },
  { value: 'other', label: 'Other' }
]

export default function OneTapApplicationForm({ isOpen, onClose, onSuccess }: OneTapApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    number_of_occupants: 1,
    desired_lease_start_month: new Date().getMonth() + 1,
    desired_lease_start_year: new Date().getFullYear(),
    preferred_lease_length: '12',
    move_in_flexibility: false, // Default to false
    pets_allowed: false, // Default to false
    parking_needed: false, // Default to false
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    message_to_landlord: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
        setFormData({
          number_of_occupants: data.preferences.number_of_occupants,
          desired_lease_start_month: data.preferences.desired_lease_start_month,
          desired_lease_start_year: data.preferences.desired_lease_start_year,
          preferred_lease_length: data.preferences.preferred_lease_length,
          move_in_flexibility: data.preferences.move_in_flexibility,
          pets_allowed: data.preferences.pets_allowed,
          parking_needed: data.preferences.parking_needed,
          tenant_name: data.preferences.tenant_name,
          tenant_email: data.preferences.tenant_email,
          tenant_phone: data.preferences.tenant_phone || '',
          message_to_landlord: data.preferences.message_to_landlord || ''
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      setError('Failed to load existing preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Client-side validation
    const requiredFields = {
      number_of_occupants: formData.number_of_occupants,
      desired_lease_start_month: formData.desired_lease_start_month,
      desired_lease_start_year: formData.desired_lease_start_year,
      preferred_lease_length: formData.preferred_lease_length,
      move_in_flexibility: formData.move_in_flexibility,
      pets_allowed: formData.pets_allowed,
      parking_needed: formData.parking_needed,
      tenant_name: formData.tenant_name,
      tenant_email: formData.tenant_email
    }

    // Check for missing required fields
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        console.error(`Missing required field: ${field}`, value)
        setError(`Missing required field: ${field}`)
        setIsSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch('/api/one-tap-application-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
              <HiSparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                One Tap Application Preferences
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Set up your preferences to streamline the rental application process for potential tenants.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 flex justify-center">
              <Spinner size={32} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Number of Occupants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Occupants *
                </label>
                <select
                  value={formData.number_of_occupants}
                  onChange={(e) => handleInputChange('number_of_occupants', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">For capacity matching</p>
              </div>

              {/* Desired Lease Start Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Lease Start Month *
                  </label>
                  <select
                    value={formData.desired_lease_start_month}
                    onChange={(e) => handleInputChange('desired_lease_start_month', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    {MONTHS.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Lease Start Year *
                  </label>
                  <select
                    value={formData.desired_lease_start_year}
                    onChange={(e) => handleInputChange('desired_lease_start_year', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Lease Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Lease Length *
                </label>
                <select
                  value={formData.preferred_lease_length}
                  onChange={(e) => handleInputChange('preferred_lease_length', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {LEASE_LENGTHS.map(lease => (
                    <option key={lease.value} value={lease.value}>{lease.label}</option>
                  ))}
                </select>
              </div>

              {/* Move-in Flexibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you flexible on your move-in date? *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="move_in_flexibility"
                      checked={formData.move_in_flexibility === true}
                      onChange={() => handleInputChange('move_in_flexibility', true)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="move_in_flexibility"
                      checked={formData.move_in_flexibility === false}
                      onChange={() => handleInputChange('move_in_flexibility', false)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Pets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have pets? *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pets_allowed"
                      checked={formData.pets_allowed === true}
                      onChange={() => handleInputChange('pets_allowed', true)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pets_allowed"
                      checked={formData.pets_allowed === false}
                      onChange={() => handleInputChange('pets_allowed', false)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Parking Needed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you need parking? *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="parking_needed"
                      checked={formData.parking_needed === true}
                      onChange={() => handleInputChange('parking_needed', true)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="parking_needed"
                      checked={formData.parking_needed === false}
                      onChange={() => handleInputChange('parking_needed', false)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.tenant_name}
                    onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.tenant_email}
                    onChange={(e) => handleInputChange('tenant_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Used for follow-up</p>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.tenant_phone}
                  onChange={(e) => handleInputChange('tenant_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="(555) 123-4567"
                />
                <p className="mt-1 text-xs text-gray-500">Optional contact</p>
              </div>

              {/* Message to Landlord */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Landlord
                </label>
                <textarea
                  value={formData.message_to_landlord}
                  onChange={(e) => handleInputChange('message_to_landlord', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g. 'We're 3 quiet students...'"
                />
                <p className="mt-1 text-xs text-gray-500">Free text - optional</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size={16} variant="white" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <HiCheck className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 