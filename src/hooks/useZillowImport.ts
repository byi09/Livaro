import { useState, useCallback } from 'react'

interface ZillowImportOptions {
  onDataExtracted?: (data: Record<string, string>) => void
  onError?: (error: Error, fallbackInstructions?: any) => void
  onApiNotConfigured?: (fallbackInstructions: any) => void
}

export function useZillowImport({
  onDataExtracted,
  onError,
  onApiNotConfigured,
}: ZillowImportOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)

  const importFromZillow = useCallback(
    async (zillowUrl: string) => {
      if (!zillowUrl.trim()) {
        onError?.(new Error('Please enter a Zillow URL'))
        return
      }

      setIsProcessing(true)

      try {
        const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        const response = await fetch(`${baseURL}/api/zillow-to-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zillowUrl }),
        })

        const result = await response.json()

        if (!response.ok) {
          // Handle different types of errors
          if (response.status === 501) {
            // API not configured
            onApiNotConfigured?.(result.fallbackInstructions)
            return
          } else if (response.status === 422 || response.status === 503) {
            // Limited data or API issues - suggest fallback
            onError?.(new Error(result.error), result.fallbackInstructions)
            return
          } else {
            throw new Error(result.error || 'Failed to import from Zillow')
          }
        }

        onDataExtracted?.(result)
      } catch (error) {
        console.error('Zillow import error:', error)
        onError?.(error as Error)
      } finally {
        setIsProcessing(false)
      }
    },
    [onDataExtracted, onError, onApiNotConfigured]
  )

  return {
    importFromZillow,
    isProcessing,
  }
}