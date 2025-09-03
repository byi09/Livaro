'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar'
import { usePageTransition } from '@/src/hooks/usePageTransition'
import { useAutoSave } from '@/src/hooks/useAutoSave'
import { useImageAutofill } from '@/src/hooks/useImageAutoFill'

import { useUploadedMedia } from '@/src/hooks/useUploadedMedia'
import ApartmentBuildingSelector from './ApartmentBuildingSelector'
// Removed unused Button import

const FORM_STORAGE_KEY = 'sell-create-form-data'

export default function CreateListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property_id')
  const mode = searchParams.get('mode') // Check for sublet mode

  const [beds, setBeds] = useState('1')
  const [baths, setBaths] = useState('1')
  const [squareFootage, setSquareFootage] = useState('1500')
  const [propertyType, setPropertyType] = useState('apartment')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [landlordId, setLandlordId] = useState<string | null>(null)
  const [, setIsLoading] = useState(true)
  
  // Subletting-specific state
  const [isSubletMode, setIsSubletMode] = useState(false)
  const [allowSubletting, setAllowSubletting] = useState(true) // Default to yes for sublet mode
  const [subleaseFileName, setSubleaseFileName] = useState('')
  


  // Additional form fields for autosave
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [description, setDescription] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')

  // Additional property fields that can be extracted from images
  const [parkingSpaces, setParkingSpaces] = useState('')
  const [garageSpaces, setGarageSpaces] = useState('')
  const [halfBathrooms, setHalfBathrooms] = useState('')
  const [hasBasement, setHasBasement] = useState('')
  const [hasAttic, setHasAttic] = useState('')
  const [hasParking, setHasParking] = useState('')
  const [hasGarage, setHasGarage] = useState('')
  const [lotSize, setLotSize] = useState('')

  // Auto-save hook for existing properties (only when propertyId exists)
  const { saveImmediately } = useAutoSave({
    propertyId: propertyId, // Only auto-save when editing existing property
    formData: {
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city: city,
      state: state,
      zip_code: zipCode,
      property_type: propertyType,
      bedrooms: beds,
      bathrooms: baths,
      square_footage: squareFootage,
      year_built: yearBuilt,
      description: description,
      parking_spaces: parkingSpaces,
      garage_spaces: garageSpaces,
      half_bathrooms: halfBathrooms,
      has_basement: hasBasement,
      has_attic: hasAttic,
      lot_size: lotSize,
    },
    tableName: 'properties',
    debounceMs: 1500,
  })

  // Shared data extraction handler for both image and Zillow import
  const handleDataExtraction = (extractedData: Record<string, string>) => {
    // Update form state with extracted data - this will trigger useAutoSave automatically
    // Only update fields if they are currently empty or the new data is more specific
    if (extractedData.address_line_1 && !addressLine1)
      setAddressLine1(extractedData.address_line_1)
    if (extractedData.address_line_2 && !addressLine2)
      setAddressLine2(extractedData.address_line_2)
    if (extractedData.city && !city) setCity(extractedData.city)
    if (extractedData.state && !state) setState(extractedData.state)
    if (extractedData.zip_code && !zipCode) setZipCode(extractedData.zip_code)
    if (extractedData.bedrooms && beds === '1')
      setBeds(extractedData.bedrooms.toString())
    if (extractedData.bathrooms && baths === '1')
      setBaths(extractedData.bathrooms.toString())
    if (extractedData.square_footage && squareFootage === '1500')
      setSquareFootage(extractedData.square_footage.toString())
    if (extractedData.year_built && !yearBuilt)
      setYearBuilt(extractedData.year_built.toString())
    if (extractedData.description && !description)
      setDescription(extractedData.description)
    if (extractedData.property_type && propertyType === 'apartment')
      setPropertyType(extractedData.property_type)

    // Additional property fields that can be extracted from images
    if (extractedData.parking_spaces && !parkingSpaces)
      setParkingSpaces(extractedData.parking_spaces.toString())
    if (extractedData.garage_spaces && !garageSpaces)
      setGarageSpaces(extractedData.garage_spaces.toString())
    if (extractedData.half_bathrooms && !halfBathrooms)
      setHalfBathrooms(extractedData.half_bathrooms.toString())
    if (extractedData.has_basement && !hasBasement)
      setHasBasement(extractedData.has_basement)
    if (extractedData.has_attic && !hasAttic)
      setHasAttic(extractedData.has_attic)
    if (extractedData.lot_size && !lotSize)
      setLotSize(extractedData.lot_size.toString())
  }

  // Uploaded media management hook
  const { 
    addAndProcessFiles, 
    isProcessing: isMediaProcessing,
    uploadedFiles,
    getAllExtractedData,
    totalFilesCount,
    processedFilesCount,
  } = useUploadedMedia({
    propertyId,
    autoProcess: true,
    onDataExtracted: handleDataExtraction,
  })

  // Legacy image autofill hook for backward compatibility
  const { processMultipleImages, isProcessing } = useImageAutofill({
    onDataExtracted: handleDataExtraction,
    onError: error => {
      console.error('Image processing failed:', error)
      // Don't show alert for multiple files, just log the error
      console.log(
        'Failed to extract data from one of the images. Continuing with other files.'
      )
    },
  })



  // Page transition hook
  const { navigateWithTransition } = usePageTransition({
    beforeNavigate: saveImmediately,
  })

  // Check for subletting mode on mount
  useEffect(() => {
    const checkSubletMode = () => {
      // Check URL parameter
      if (mode === 'sublet') {
        setIsSubletMode(true)
        setAllowSubletting(true)
      }
      
      // Check session storage
      const sublettingMode = sessionStorage.getItem('subletting_mode')
      const fileName = sessionStorage.getItem('sublease_file_name')
      
      if (sublettingMode === 'true') {
        setIsSubletMode(true)
        setAllowSubletting(true)
        if (fileName) {
          setSubleaseFileName(fileName)
        }
      }
    }
    
    checkSubletMode()
  }, [mode])

  // State for tracking auto-filled data
  const [hasAutoFilledData, setHasAutoFilledData] = useState(false)

  // Set auto-filled data flag when extracted data is used
  useEffect(() => {
    const extractedStorageKey = propertyId ? `extracted-data-${propertyId}` : 'extracted-data-new'
    const extractedDataRaw = localStorage.getItem(extractedStorageKey)
    
    if (extractedDataRaw) {
      try {
        const extractedData = JSON.parse(extractedDataRaw)
        if (Object.keys(extractedData).length > 0) {
          setHasAutoFilledData(true)
        }
      } catch (error) {
        console.error('Error checking for extracted data:', error)
      }
    }
  }, [propertyId])

  // Load form data from localStorage on mount
  useEffect(() => {
    const loadFormData = async () => {
      // Get landlord ID for the current user
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('Authentication error:', authError)
          return
        }

        // Get customer and landlord data
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

        setLandlordId(landlordRow.id)

        if (propertyId) {
          // Load existing property data from database
          const { data: property, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', propertyId)
            .single()

          if (!error && property) {
            setBeds(property.bedrooms?.toString() || '1')
            setBaths(property.bathrooms?.toString() || '1')
            setSquareFootage(property.square_footage?.toString() || '1500')
            setPropertyType(property.property_type || 'apartment')
            setAddressLine1(property.address_line_1 || '')
            setAddressLine2(property.address_line_2 || '')
            setCity(property.city || '')
            setState(property.state || '')
            setZipCode(property.zip_code || '')
            setYearBuilt(property.year_built?.toString() || '')
            setDescription(property.description || '')
            setSelectedBuildingId(property.building_id || '')
          } else {
            console.log('No property data found or error occurred')
          }
        } else {
          console.log('No propertyId, loading from localStorage')

          // Check for building_id in URL params
          const buildingIdFromUrl = searchParams.get('building_id')
          if (buildingIdFromUrl) {
            setSelectedBuildingId(buildingIdFromUrl)
          }

          // Load from localStorage for new properties, but prioritize extracted data
          const savedData = localStorage.getItem(FORM_STORAGE_KEY)
          const extractedStorageKey = propertyId ? `extracted-data-${propertyId}` : 'extracted-data-new'
          const extractedDataRaw = localStorage.getItem(extractedStorageKey)
          
          console.log('=== FORM LOADING LOGIC ===')
          console.log('Saved form data:', savedData)
          console.log('Extracted data available:', extractedDataRaw)
          
          let extractedData: Record<string, string> = {}
          if (extractedDataRaw) {
            try {
              extractedData = JSON.parse(extractedDataRaw)
              console.log('Using extracted data as priority:', extractedData)
            } catch (e) {
              console.error('Error parsing extracted data:', e)
            }
          }
          
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData)
              
              // Use extracted data if available, otherwise use saved form data
              const finalData = {
                beds: extractedData.bedrooms || parsed.beds || '1',
                baths: extractedData.bathrooms || parsed.baths || '1',
                squareFootage: extractedData.square_footage || parsed.squareFootage || '1500',
                propertyType: extractedData.property_type || parsed.propertyType || 'apartment',
                addressLine1: extractedData.address_line_1 || parsed.addressLine1 || '',
                addressLine2: extractedData.address_line_2 || parsed.addressLine2 || '',
                city: extractedData.city || parsed.city || '',
                state: extractedData.state || parsed.state || '',
                zipCode: extractedData.zip_code || parsed.zipCode || '',
                yearBuilt: extractedData.year_built || parsed.yearBuilt || '',
                description: extractedData.description || parsed.description || ''
              }
              
              console.log('🎯 FINAL FORM DATA TO BE SET:', finalData)
              
              setBeds(finalData.beds)
              setBaths(finalData.baths)
              setSquareFootage(finalData.squareFootage)
              setPropertyType(finalData.propertyType)
              setAddressLine1(finalData.addressLine1)
              setAddressLine2(finalData.addressLine2)
              setCity(finalData.city)
              setState(finalData.state)
              setZipCode(finalData.zipCode)
              setYearBuilt(finalData.yearBuilt)
              setDescription(finalData.description)
              // Only override building selection if not provided in URL
              if (!buildingIdFromUrl) {
                setSelectedBuildingId(parsed.selectedBuildingId || '')
              }
              
              console.log('Form loaded with data priority: extracted > saved')
            } catch (error) {
              console.error('Error loading saved form data:', error)
            }
          } else if (Object.keys(extractedData).length > 0) {
            // No saved form data, but we have extracted data - use it directly
            console.log('No saved form data, using extracted data only:', extractedData)
            setBeds(extractedData.bedrooms || '1')
            setBaths(extractedData.bathrooms || '1')
            setSquareFootage(extractedData.square_footage || '1500')
            setPropertyType(extractedData.property_type || 'apartment')
            setAddressLine1(extractedData.address_line_1 || '')
            setAddressLine2(extractedData.address_line_2 || '')
            setCity(extractedData.city || '')
            setState(extractedData.state || '')
            setZipCode(extractedData.zip_code || '')
            setYearBuilt(extractedData.year_built || '')
            setDescription(extractedData.description || '')
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error)
      }
    }

    loadFormData().finally(() => setIsLoading(false))
  }, [propertyId, searchParams])

  // Auto-save form data to localStorage whenever it changes
  useEffect(() => {
    // Only auto-save to localStorage for new properties
    if (propertyId) return

    const formData = {
      beds,
      baths,
      squareFootage,
      propertyType,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      yearBuilt,
      description,
      selectedBuildingId,
    }
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData))
  }, [
    beds,
    baths,
    squareFootage,
    propertyType,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    yearBuilt,
    description,
    selectedBuildingId,
    propertyId,
  ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      if (propertyId) {
        // Update existing property
        console.log('Updating existing property:', propertyId)
        const propertyData = {
          address_line_1: formData.get('address_line_1') as string,
          address_line_2: (formData.get('address_line_2') as string) || null,
          city: formData.get('city') as string,
          state: formData.get('state') as string,
          zip_code: formData.get('zip_code') as string,
          property_type:
            (formData.get('property_type') as string) || 'apartment',
          bedrooms: parseInt(formData.get('bedrooms') as string),
          bathrooms: parseFloat(formData.get('bathrooms') as string),
          square_footage: parseInt(formData.get('square_footage') as string),
          description: (formData.get('description') as string) || null,
          year_built: formData.get('year_built')
            ? parseInt(formData.get('year_built') as string)
            : null,
          building_id: selectedBuildingId || null,
        }

        // Force save via autosave hook first
        try {
          await saveImmediately()
          console.log('Auto-save completed successfully')
        } catch (autoSaveError) {
          console.error(
            'Auto-save failed, trying direct update:',
            autoSaveError
          )
        }

        // Also do direct update to ensure data is saved
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', propertyId)

        if (error) {
          console.error('Error updating property:', error)
          alert('Error updating property. Please try again.')
          setIsSubmitting(false)
          return
        }

        console.log('Property updated successfully, navigating to rent-details')
        await navigateWithTransition(
          `/sell/create/rent-details?property_id=${propertyId}`
        )
      } else {
        // Create new property
        // Get the authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('Authentication error:', authError)
          alert('Please sign in to create a property')
          setIsSubmitting(false)
          return
        }

        // Step 1: find the customer record linked to the signed-in user
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (customerError || !customerData) {
          console.error('Customer record not found:', customerError)
          alert('Account profile not found. Please finish onboarding.')
          setIsSubmitting(false)
          return
        }

        // Step 2: fetch the landlord record for that customer
        const { data: landlordRow, error: landlordRowError } = await supabase
          .from('landlords')
          .select('id')
          .eq('customer_id', customerData.id)
          .single()

        if (landlordRowError || !landlordRow) {
          console.error('Landlord profile not found:', landlordRowError)
          alert('Landlord profile not found. Please complete your onboarding.')
          setIsSubmitting(false)
          return
        }

        const landlordId = landlordRow.id

        // Extract form data
        const propertyData = {
          landlord_id: landlordId,
          address_line_1: formData.get('address_line_1') as string,
          address_line_2: (formData.get('address_line_2') as string) || null,
          city: formData.get('city') as string,
          state: formData.get('state') as string,
          zip_code: formData.get('zip_code') as string,
          property_type:
            (formData.get('property_type') as string) || 'apartment',
          bedrooms: parseInt(formData.get('bedrooms') as string),
          bathrooms: parseFloat(formData.get('bathrooms') as string),
          square_footage: parseInt(formData.get('square_footage') as string),
          description: (formData.get('description') as string) || null,
          year_built: formData.get('year_built')
            ? parseInt(formData.get('year_built') as string)
            : null,
          building_id: selectedBuildingId || null,
        }

        // Insert the property
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select()

        if (error) {
          console.error('Error creating property:', error)
          alert('Error creating property. Please try again.')
          setIsSubmitting(false)
          return
        }

        console.log('Property created successfully:', data)

        // Clear saved form data on successful submission
        localStorage.removeItem(FORM_STORAGE_KEY)

        // Client-side redirect - much more reliable
        await navigateWithTransition(
          `/sell/create/rent-details?property_id=${data[0].id}`
        )
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
          {/* Sublet Mode Banner */}
          {isSubletMode && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    📄 Creating Sublease Listing
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    {subleaseFileName && (
                      <p className="mb-2">
                        <strong>Sublease Agreement:</strong> {subleaseFileName}
                      </p>
                    )}
                    <p>
                      You're creating a sublease listing. Complete the property details to help find the perfect subletter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">
              {isSubletMode ? (
                propertyId ? 'Edit Sublease Property Information' : 'Sublease Property Information'
              ) : (
                propertyId ? 'Edit Property Information' : 'Property Information'
              )}
            </h1>
            <button
              onClick={async () => {
                // Save data before exiting if editing existing property
                if (propertyId) {
                  try {
                    await saveImmediately()
                  } catch (error) {
                    console.error('Error saving before exit:', error)
                  }
                }
                // Redirect to appropriate dashboard
                if (isSubletMode) {
                  router.push('/sublist/dashboard')
                } else {
                  router.push('/sell/dashboard')
                }
              }}
              className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Save and Exit
            </button>
          </div>

          {/* Progress Bar */}
          <InteractiveProgressBar
            currentStep={1}
            propertyId={propertyId}
            beforeNavigate={saveImmediately}
          />

          {/* Auto-fill Notice */}
          {hasAutoFilledData && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ✨ Form Auto-Filled Successfully
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Property information has been automatically filled using data extracted from your uploaded media files. 
                      Please review and update any details as needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column - Basic Details */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">Basic Details</h2>

                  {/* Property Type */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
                      name="property_type"
                      value={propertyType}
                      onChange={e => setPropertyType(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="studio">Studio</option>
                      <option value="room">Room</option>
                      <option value="duplex">Duplex</option>
                    </select>
                  </div>

                  {/* Apartment Building Selector - Only show for apartments AND when landlordId is available */}
                  {propertyType === 'apartment' && landlordId && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apartment Building (Optional)
                      </label>
                      <ApartmentBuildingSelector
                        value={selectedBuildingId}
                        onChange={setSelectedBuildingId}
                        disabled={isSubmitting}
                        landlordId={landlordId}
                      />
                      {/* Hidden input to include building_id in form data */}
                      <input
                        type="hidden"
                        name="building_id"
                        value={selectedBuildingId}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Link this apartment to an existing building, or leave
                        blank for a standalone unit.
                      </p>
                    </div>
                  )}

                  {/* Address */}
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
                      placeholder="Apt, suite, etc. (optional)"
                      disabled={isSubmitting}
                    />
                  </div>

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
                        placeholder="Enter city"
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

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="Enter ZIP code"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Beds */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beds
                    </label>
                    <div className="relative">
                      <select
                        name="bedrooms"
                        value={beds}
                        onChange={e => setBeds(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                        required
                        disabled={isSubmitting}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <div className="relative">
                      <select
                        name="bathrooms"
                        value={baths}
                        onChange={e => setBaths(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="0.5">0.5 bathroom</option>
                        <option value="1">1 bathroom</option>
                        <option value="1.5">1.5 bathrooms</option>
                        <option value="2">2 bathrooms</option>
                        <option value="2.5">2.5 bathrooms</option>
                        <option value="3">3 bathrooms</option>
                        <option value="3.5">3.5 bathrooms</option>
                        <option value="4">4 bathrooms</option>
                        <option value="4.5">4.5 bathrooms</option>
                        <option value="5">5+ bathrooms</option>
                      </select>
                    </div>
                  </div>

                  {/* Square Footage */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Footage
                    </label>
                    <input
                      type="number"
                      name="square_footage"
                      value={squareFootage}
                      onChange={e => setSquareFootage(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="Enter square footage"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Year Built */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Built (Optional)
                    </label>
                    <input
                      type="number"
                      name="year_built"
                      value={yearBuilt}
                      onChange={e => setYearBuilt(e.target.value)}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-blue-50"
                      placeholder="Enter year built"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Subletting Question - Only show if not in sublet mode (sublet mode assumes yes) */}
                  {!isSubletMode && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Is it okay for this property to be sublisted?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="allow_subletting"
                            value="yes"
                            checked={allowSubletting === true}
                            onChange={() => setAllowSubletting(true)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Yes, allow subletting
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="allow_subletting"
                            value="no"
                            checked={allowSubletting === false}
                            onChange={() => setAllowSubletting(false)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            No, do not allow subletting
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        This setting controls whether tenants can sublet your property to others.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column - Property Description */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">
                    Describe Your Property
                  </h2>

                  {/* Quick Fill Options */}
                  <div className="mb-6 space-y-4">


                    {/* Media Upload for Auto-fill */}
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Quick Fill from Listing Media
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Upload property documents, listing screenshots, or screen recordings to automatically extract details. These files will be saved to help auto-fill later steps.
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf,video/*"
                        multiple
                        onChange={e => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            addAndProcessFiles(files)
                          }
                        }}
                        disabled={isMediaProcessing || isSubmitting}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {isMediaProcessing && (
                        <div className="mt-2 flex items-center text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Processing media files... ({processedFilesCount}/{totalFilesCount})
                        </div>
                      )}
                      {totalFilesCount > 0 && !isMediaProcessing && (
                        <div className="mt-2 text-sm text-green-600">
                          ✓ {totalFilesCount} file{totalFilesCount !== 1 ? 's' : ''} uploaded and saved for use in later steps
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: Screen record browsing through Zillow, Apartments.com, or other listing sites. The system will extract property details from the video frames.
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    What makes your place unique?
                  </p>
                  <textarea
                    name="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-[250px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    placeholder="Describe your property..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Next Button */}
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
                    ? propertyId
                      ? 'Updating Property...'
                      : 'Creating Property...'
                    : 'Next'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    
  )
}
