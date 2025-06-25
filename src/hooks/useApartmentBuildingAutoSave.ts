import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

type FormDataValue = string | number | boolean | null | undefined
type ApartmentBuildingFormData = Record<string, FormDataValue>

interface ApartmentBuildingAutoSaveOptions {
  buildingId: string | null
  landlordId: string
  formData: ApartmentBuildingFormData
  debounceMs?: number
  onSaveSuccess?: (buildingId?: string) => void
  onSaveError?: (error: Error) => void
}

// too lazy to change from camel case everywhere, this function maps to snake case at the very end
function mapFormFieldToDbColumn(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    buildingName: 'building_name',
    buildingNumber: 'building_number',
    addressLine1: 'address_line_1',
    addressLine2: 'address_line_2',
    city: 'city',
    state: 'state',
    zipCode: 'zip_code',
    country: 'country',
    yearBuilt: 'year_built',
    totalUnits: 'total_units',
    totalFloors: 'total_floors',
    buildingType: 'building_type',
    description: 'description',
    parkingSpaces: 'parking_spaces',
    managementCompany: 'management_company',
    onSiteManager: 'on_site_manager', // if there's an on-site manager or not
  }

  return fieldMap[fieldName] || fieldName
}

export function useApartmentBuildingAutoSave({
  buildingId,
  landlordId,
  formData,
  debounceMs = 2000,
  onSaveSuccess,
  onSaveError,
}: ApartmentBuildingAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<string>('')
  const isSavingRef = useRef(false)

  const saveData = useCallback(
    async (data: ApartmentBuildingFormData) => {
      if (!landlordId || isSavingRef.current) return

      try {
        isSavingRef.current = true
        const supabase = createClient()

        const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
          //   enoty strings are allowed
          if (value !== null && value !== undefined) {
            const dbFieldName = mapFormFieldToDbColumn(key)

            // Convert string numbers to numbers
            if (
              typeof value === 'string' &&
              !isNaN(Number(value)) &&
              value.trim() !== ''
            ) {
              const numValue = Number(value)
              if (
                key === 'yearBuilt' ||
                key === 'totalUnits' ||
                key === 'totalFloors' ||
                key === 'parkingSpaces'
              ) {
                acc[dbFieldName] = numValue
              } else {
                acc[dbFieldName] = value
              }
            } else {
              if (
                value === '' &&
                (key === 'yearBuilt' ||
                  key === 'totalUnits' ||
                  key === 'totalFloors' ||
                  key === 'parkingSpaces')
              ) {
                acc[dbFieldName] = null
              } else if (key === 'onSiteManager') {
                acc[dbFieldName] = value === true || value === 'true'
              } else {
                acc[dbFieldName] = value
              }
            }
          }
          return acc
        }, {} as Record<string, FormDataValue>)

        let result

        if (buildingId) {
          // Update existing apartment building
          result = await supabase
            .from('apartment_buildings')
            .update(cleanData)
            .eq('id', buildingId)
        } else {
          // Only create new building if all required fields are present
          const hasRequiredFields =
            cleanData.building_name &&
            cleanData.building_name !== null &&
            cleanData.building_name !== '' &&
            cleanData.address_line_1 &&
            cleanData.address_line_1 !== null &&
            cleanData.address_line_1 !== '' &&
            cleanData.city &&
            cleanData.city !== null &&
            cleanData.city !== '' &&
            cleanData.state &&
            cleanData.state !== null &&
            cleanData.state !== '' &&
            cleanData.zip_code &&
            cleanData.zip_code !== null &&
            cleanData.zip_code !== ''

          if (hasRequiredFields) {
            result = await supabase
              .from('apartment_buildings')
              .insert([
                {
                  ...cleanData,
                  landlord_id: landlordId,
                  country: cleanData.country || 'United States',
                },
              ])
              .select('id')
              .single() // If successful, get new building ID for future updates
            if (result?.data?.id) {
              onSaveSuccess?.(result.data.id)
              return
            }
          } else {
            console.log(
              'Skipping apartment building creation via autosave - missing required fields'
            )
            return
          }
        }

        if (result?.error) {
          throw result.error
        }

        onSaveSuccess?.()
      } catch (error) {
        console.error('Apartment building auto-save error:', error)
        onSaveError?.(error as Error)
      } finally {
        isSavingRef.current = false
      }
    },
    [buildingId, landlordId, onSaveSuccess, onSaveError]
  )

  // Auto-save when form data changes
  useEffect(() => {
    const currentDataString = JSON.stringify(formData)

    // Skip if data hasn't changed
    if (currentDataString === previousDataRef.current) return

    previousDataRef.current = currentDataString

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveData(formData)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, saveData, debounceMs])

  // Save immediately when leaving the page
  const saveImmediately = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    return saveData(formData)
  }, [formData, saveData])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { saveImmediately }
}
