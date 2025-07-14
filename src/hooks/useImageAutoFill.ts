import { useState, useCallback } from 'react'

interface ImageAutofillOptions {
  onDataExtracted?: (data: Record<string, string>) => void
  onError?: (error: Error) => void
}

export function useImageAutofill({
  onDataExtracted,
  onError,
}: ImageAutofillOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)

  const processImage = useCallback(
    async (imageFile: File) => {
      setIsProcessing(true)
      const baseURL =
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      try {
        const formData = new FormData()
        formData.append('image', imageFile)

        const response = await fetch(`${baseURL}/api/image-to-data`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to process image')
        }

        const extractedData = await response.json()

        // Return data in the same format your form expects
        onDataExtracted?.(extractedData)
      } catch (error) {
        console.error('Image processing error:', error)
        onError?.(error as Error)
      } finally {
        setIsProcessing(false)
      }
    },
    [onDataExtracted, onError]
  )

  return {
    processImage,
    isProcessing,
  }
}
