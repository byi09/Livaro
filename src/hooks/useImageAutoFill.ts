import { useState, useCallback, useRef } from 'react'

interface ImageAutofillOptions {
  onDataExtracted?: (data: Record<string, string>) => void
  onError?: (error: Error) => void
  onProgress?: (current: number, total: number) => void
}

export function useImageAutofill({
  onDataExtracted,
  onError,
  onProgress,
}: ImageAutofillOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const processingQueueRef = useRef<File[]>([])
  const currentProcessingRef = useRef(0)

  const processImage = useCallback(
    async (imageFile: File) => {
      // Add to queue if not already processing
      if (!isProcessing) {
        setIsProcessing(true)
        processingQueueRef.current = [imageFile]
        currentProcessingRef.current = 0
      } else {
        processingQueueRef.current.push(imageFile)
        return
      }

      const baseURL =
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

      while (processingQueueRef.current.length > currentProcessingRef.current) {
        const currentFile =
          processingQueueRef.current[currentProcessingRef.current]

        try {
          onProgress?.(
            currentProcessingRef.current + 1,
            processingQueueRef.current.length
          )

          const formData = new FormData()
          formData.append('image', currentFile)

          const response = await fetch(`${baseURL}/api/image-to-data`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to process image: ${currentFile.name}`)
          }

          const extractedData = await response.json()
          onDataExtracted?.(extractedData)
        } catch (error) {
          console.error(
            `Image processing error for ${currentFile.name}:`,
            error
          )
          onError?.(error as Error)
        }

        currentProcessingRef.current++

        // Small delay between processing files to avoid overwhelming the API
        if (currentProcessingRef.current < processingQueueRef.current.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Reset processing state when done with all files
      setIsProcessing(false)
      processingQueueRef.current = []
      currentProcessingRef.current = 0
    },
    [onDataExtracted, onError, onProgress, isProcessing]
  )

  const processMultipleImages = useCallback(
    async (imageFiles: File[]) => {
      if (imageFiles.length === 0) return

      setIsProcessing(true)
      processingQueueRef.current = [...imageFiles]
      currentProcessingRef.current = 0

      const baseURL =
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

      for (let i = 0; i < imageFiles.length; i++) {
        const currentFile = imageFiles[i]

        try {
          onProgress?.(i + 1, imageFiles.length)

          const formData = new FormData()
          formData.append('image', currentFile)

          const response = await fetch(`${baseURL}/api/image-to-data`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to process image: ${currentFile.name}`)
          }

          const extractedData = await response.json()
          onDataExtracted?.(extractedData)
        } catch (error) {
          console.error(
            `Image processing error for ${currentFile.name}:`,
            error
          )
          onError?.(error as Error)
        }

        // Small delay between processing files
        if (i < imageFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
      }

      setIsProcessing(false)
      processingQueueRef.current = []
      currentProcessingRef.current = 0
    },
    [onDataExtracted, onError, onProgress]
  )

  return {
    processImage,
    processMultipleImages,
    isProcessing,
  }
}
