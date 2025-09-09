'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useApartmentBuildingAutoSave } from '@/src/hooks/useApartmentBuildingAutoSave'

const APARTMENT_BUILDING_FORM_STORAGE_KEY = 'apartment-building-form-data'

export default function ApartmentBuildingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialBuildingId = searchParams.get('building_id')

  const [buildingId, setBuildingId] = useState<string | null>(initialBuildingId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [landlordId, setLandlordId] = useState<string>('')

  const [buildingName, setBuildingName] = useState('')
  const [buildingNumber, setBuildingNumber] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('United States')
  const [yearBuilt, setYearBuilt] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [totalFloors, setTotalFloors] = useState('')
  const [buildingType, setBuildingType] = useState('')
  const [description, setDescription] = useState('')
  const [parkingSpaces, setParkingSpaces] = useState('')
  const [managementCompany, setManagementCompany] = useState('')
  const [onSiteManager, setOnSiteManager] = useState(false)

  const { saveImmediately } = useApartmentBuildingAutoSave({
    buildingId: buildingId,
    formData: {
      buildingName,
      buildingNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      yearBuilt,
      totalUnits,
      totalFloors,
      buildingType,
      description,
      parkingSpaces,
      managementCompany,
      onSiteManager,
    },
    debounceMs: 1500,
    onSaveSuccess: (newBuildingId?: string) => {
      console.log('Apartment building auto-saved successfully')
      // update the buildingId state if new building was created
      if (newBuildingId && !buildingId) {
        setBuildingId(newBuildingId)
        // Update the URL to include the building_id
        const newUrl = `/sell/create/apartment-building?building_id=${newBuildingId}`
        window.history.replaceState(null, '', newUrl)
      }
    },
    onSaveError: error => {
      console.error('Auto-save error:', error)
    },
  })

  // Load initial form data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('Authentication error:', authError)
          router.push('/sign-in')
          return
        }

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (customerError || !customerData) {
          console.error('Customer record not found:', customerError)
          return
        }

        const { data: landlordRow, error: landlordRowError } = await supabase
          .from('landlords')
          .select('id')
          .eq('customer_id', customerData.id)
          .single()

        if (landlordRowError || !landlordRow) {
          console.error('Landlord profile not found:', landlordRowError)
          return
        }

        setLandlordId(landlordRow.id) // Load existing building data if editing
        if (buildingId) {
          const { data: building, error: buildingError } = await supabase
            .from('apartment_buildings')
            .select('*')
            .eq('id', buildingId)
            .single()

          if (!buildingError && building) {
            setBuildingName(building.building_name || '')
            setBuildingNumber(building.building_number || '')
            setAddressLine1(building.address_line_1 || '')
            setAddressLine2(building.address_line_2 || '')
            setCity(building.city || '')
            setState(building.state || '')
            setZipCode(building.zip_code || '')
            setCountry(building.country || 'United States')
            setYearBuilt(building.year_built?.toString() || '')
            setTotalUnits(building.total_units?.toString() || '')
            setTotalFloors(building.total_floors?.toString() || '')
            setBuildingType(building.building_type || '')
            setDescription(building.description || '')
            setParkingSpaces(building.parking_spaces?.toString() || '')
            setManagementCompany(building.management_company || '')
            setOnSiteManager(building.on_site_manager || false)
          }
        } else {
          // Load from localStorage for new buildings
          const savedData = localStorage.getItem(
            APARTMENT_BUILDING_FORM_STORAGE_KEY
          )
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData)
              setBuildingName(parsed.buildingName || '')
              setBuildingNumber(parsed.buildingNumber || '')
              setAddressLine1(parsed.addressLine1 || '')
              setAddressLine2(parsed.addressLine2 || '')
              setCity(parsed.city || '')
              setState(parsed.state || '')
              setZipCode(parsed.zipCode || '')
              setCountry(parsed.country || 'United States')
              setYearBuilt(parsed.yearBuilt || '')
              setTotalUnits(parsed.totalUnits || '')
              setTotalFloors(parsed.totalFloors || '')
              setBuildingType(parsed.buildingType || '')
              setDescription(parsed.description || '')
              setParkingSpaces(parsed.parkingSpaces || '')
              setManagementCompany(parsed.managementCompany || '')
              setOnSiteManager(parsed.onSiteManager || false)
            } catch (error) {
              console.error('Error loading saved form data:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, [buildingId, router])

  // Auto-save form data to localStorage for new buildings
  useEffect(() => {
    if (buildingId || !landlordId) return

    const formData = {
      buildingName,
      buildingNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      yearBuilt,
      totalUnits,
      totalFloors,
      buildingType,
      description,
      parkingSpaces,
      managementCompany,
      onSiteManager,
    }
    localStorage.setItem(
      APARTMENT_BUILDING_FORM_STORAGE_KEY,
      JSON.stringify(formData)
    )
  }, [
    buildingName,
    buildingNumber,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    country,
    yearBuilt,
    totalUnits,
    totalFloors,
    buildingType,
    description,
    parkingSpaces,
    managementCompany,
    onSiteManager,
    buildingId,
    landlordId,
  ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      const buildingData = {
        building_name: formData.get('building_name') as string,
        building_number: (formData.get('building_number') as string) || null,
        address_line_1: formData.get('address_line_1') as string,
        address_line_2: (formData.get('address_line_2') as string) || null,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip_code: formData.get('zip_code') as string,
        country: (formData.get('country') as string) || 'United States',
        year_built: formData.get('year_built')
          ? parseInt(formData.get('year_built') as string)
          : null,
        total_units: formData.get('total_units')
          ? parseInt(formData.get('total_units') as string)
          : null,
        total_floors: formData.get('total_floors')
          ? parseInt(formData.get('total_floors') as string)
          : null,
        building_type: (formData.get('building_type') as string) || null,
        description: (formData.get('description') as string) || null,
        parking_spaces: formData.get('parking_spaces')
          ? parseInt(formData.get('parking_spaces') as string)
          : 0,
        management_company:
          (formData.get('management_company') as string) || null,
        on_site_manager: formData.get('on_site_manager') === 'on',
      }

      if (buildingId) {
        // Update existing building
        await saveImmediately()

        const { error } = await supabase
          .from('apartment_buildings')
          .update(buildingData)
          .eq('id', buildingId)

        if (error) {
          console.error('Error updating apartment building:', error)
          alert('Error updating building. Please try again.')
          setIsSubmitting(false)
          return
        }
        alert('Building updated successfully!')
        router.push('/sell/dashboard')
      } else {
        // Create new building
        const { data, error } = await supabase
          .from('apartment_buildings')
          .insert([{ ...buildingData, landlord_id: landlordId }])
          .select()

        if (error) {
          console.error('Error creating apartment building:', error)
          alert('Error creating building. Please try again.')
          setIsSubmitting(false)
          return
        }

        // Clear localStorage on success
        localStorage.removeItem(APARTMENT_BUILDING_FORM_STORAGE_KEY)

        console.log('Building created successfully:', data)
        alert('Building created successfully!')
        router.push(`/sell/dashboard`)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-12 px-6 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">
            {buildingId ? 'Edit Apartment Building' : 'List Apartment Building'}
          </h1>
          <button
            onClick={async () => {
              if (buildingId) {
                try {
                  await saveImmediately()
                } catch (error) {
                  console.error('Error saving before exit:', error)
                }
              }
              router.push('/sell/dashboard')
            }}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Building Details */}
              <div>
                <h2 className="text-xl font-semibold mb-6">
                  Building Information
                </h2>

                {/* Building Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Name *
                  </label>
                  <input
                    type="text"
                    name="building_name"
                    value={buildingName}
                    onChange={e => setBuildingName(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="e.g., Sunset Apartments"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Building Number */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Number
                  </label>
                  <input
                    type="text"
                    name="building_number"
                    value={buildingNumber}
                    onChange={e => setBuildingNumber(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="e.g., Building A, Tower 1"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Address Line 1 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="Enter street address"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Address Line 2 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line_2"
                    value={addressLine2}
                    onChange={e => setAddressLine2(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="Suite, floor, etc. (optional)"
                    disabled={isSubmitting}
                  />
                </div>

                {/* City, State, Zip */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="City"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="State"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code *
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="Zip Code"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="Country"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Building Specifications */}
              <div>
                <h2 className="text-xl font-semibold mb-6">
                  Building Specifications
                </h2>
                {/* Year Built */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    name="year_built"
                    value={yearBuilt}
                    onChange={e => setYearBuilt(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="e.g., 2020"
                    min="1800"
                    max={new Date().getFullYear()}
                    disabled={isSubmitting}
                  />
                </div>
                {/* Total Units and Floors */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Units
                    </label>
                    <input
                      type="number"
                      name="total_units"
                      value={totalUnits}
                      onChange={e => setTotalUnits(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="e.g., 50"
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Floors
                    </label>
                    <input
                      type="number"
                      name="total_floors"
                      value={totalFloors}
                      onChange={e => setTotalFloors(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="e.g., 5"
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {/* Building Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Type
                  </label>
                  <select
                    name="building_type"
                    value={buildingType}
                    onChange={e => setBuildingType(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    disabled={isSubmitting}
                  >
                    <option value="">Select building type</option>
                    <option value="High-rise">High-rise</option>
                    <option value="Mid-rise">Mid-rise</option>
                    <option value="Low-rise">Low-rise</option>
                    <option value="Garden-style">Garden-style</option>
                  </select>
                </div>
                {/* Parking Spaces */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Spaces
                  </label>
                  <input
                    type="number"
                    name="parking_spaces"
                    value={parkingSpaces}
                    onChange={e => setParkingSpaces(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="e.g., 25"
                    min="0"
                    disabled={isSubmitting}
                  />
                </div>
                {/* Management Company */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Management Company
                  </label>
                  <input
                    type="text"
                    name="management_company"
                    value={managementCompany}
                    onChange={e => setManagementCompany(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                    placeholder="e.g., ABC Property Management"
                    disabled={isSubmitting}
                  />
                </div>{' '}
                {/* On-site Manager */}
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="on_site_manager"
                      checked={onSiteManager}
                      onChange={e => setOnSiteManager(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label className="ml-2 block text-sm font-medium text-gray-700">
                      Has On-site Manager
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Building Description</h3>
              <textarea
                name="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-[150px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                placeholder="Describe the apartment building, amenities, neighborhood, etc..."
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSubmitting
                  ? 'Saving...'
                  : buildingId
                  ? 'Update Building'
                  : 'Create Building'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
