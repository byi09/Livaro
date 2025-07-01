import { useEffect, useRef, useCallback } from 'react'

type FormDataValue = string | number | boolean | null | undefined
type ApartmentBuildingFormData = Record<string, FormDataValue>

interface ApartmentBuildingAutoSaveOptions {
  buildingId: string | null
  formData: ApartmentBuildingFormData
  debounceMs?: number
  onSaveSuccess?: (buildingId?: string) => void
  onSaveError?: (error: Error) => void
}

export function useApartmentBuildingAutoSave({
  buildingId,
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
      if (isSavingRef.current) return

      try {
        isSavingRef.current = true

        // Only save to localStorage, not the database.
        localStorage.setItem(
          'apartment-building-form-data',
          JSON.stringify(data)
        )

        console.log('Form data auto-saved to localStorage')

        if (onSaveSuccess) {
          onSaveSuccess(buildingId || undefined)
        }
      } catch (error) {
        console.error('Error auto-saving to localStorage:', error)
        if (onSaveError) {
          if (error instanceof Error) {
            onSaveError(error)
          } else {
            onSaveError(new Error('An unknown error occurred during auto-save'))
          }
        }
      } finally {
        isSavingRef.current = false
      }
    },
    [buildingId, onSaveSuccess, onSaveError]
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
  const saveImmediately = useCallback(async () => {
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
