import { useState, useCallback, useEffect } from 'react'
import { useSublistingSession } from './useSublistingSession'

export interface ProcessedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  processed: boolean
  extractedData?: Record<string, any>
  storagePath?: string
}

interface UseSublistingMediaOptions {
  autoProcess?: boolean
  onDataExtracted?: (data: Record<string, any>, fileId: string) => void
  onFileProcessed?: (fileId: string, success: boolean) => void
}

export function useSublistingMedia(options: UseSublistingMediaOptions = {}) {
  const { autoProcess = true, onDataExtracted, onFileProcessed } = options
  const { session, addMediaFile, getMediaFiles, updateExtractedData, getExtractedData } = useSublistingSession()
  
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [totalFilesCount, setTotalFilesCount] = useState(0)
  const [processedFilesCount, setProcessedFilesCount] = useState(0)

  // Load existing files when session is available
  useEffect(() => {
    if (session) {
      loadExistingFiles()
    }
  }, [session])

  const loadExistingFiles = useCallback(async () => {
    if (!session) return

    try {
      const mediaFiles = await getMediaFiles()
      const processedFiles: ProcessedFile[] = mediaFiles.map(media => ({
        id: media.id,
        name: media.file_name,
        size: media.file_size,
        type: media.file_type,
        uploadedAt: media.uploaded_at,
        processed: media.extraction_status === 'completed',
        extractedData: media.extracted_data,
        storagePath: media.storage_path
      }))

      setUploadedFiles(processedFiles)
      setTotalFilesCount(processedFiles.length)
      setProcessedFilesCount(processedFiles.filter(f => f.processed).length)
    } catch (error) {
      console.error('Error loading existing files:', error)
    }
  }, [session, getMediaFiles])

  // Add and process files
  const addAndProcessFiles = useCallback(async (files: File[]) => {
    if (!session) {
      console.error('No active sublisting session')
      return
    }

    setIsProcessing(true)

    try {
      const newFiles: ProcessedFile[] = []

      for (const file of files) {
        // Determine media type
        let mediaType: 'image' | 'video' | 'document' | 'pdf' = 'document'
        if (file.type.startsWith('image/')) {
          mediaType = 'image'
        } else if (file.type.startsWith('video/')) {
          mediaType = 'video'
        } else if (file.type === 'application/pdf') {
          mediaType = 'pdf'
        }

        // Add to database
        const mediaRecord = await addMediaFile(
          file.name,
          file.size,
          file.type,
          mediaType
        )

        const processedFile: ProcessedFile = {
          id: mediaRecord.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: mediaRecord.uploaded_at,
          processed: false
        }

        newFiles.push(processedFile)

        // Process file if autoProcess is enabled
        if (autoProcess) {
          processFile(file, processedFile.id)
        }
      }

      // Update state
      setUploadedFiles(prev => [...prev, ...newFiles])
      setTotalFilesCount(prev => prev + newFiles.length)
    } catch (error) {
      console.error('Error adding files:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [session, addMediaFile, autoProcess])

  // Process individual file with AI
  const processFile = useCallback(async (file: File, fileId: string) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/image-to-data', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`)
      }

      const extractedData = await response.json()

      // Update file status in database
      const { data, error } = await fetch('/api/sublisting/update-media-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: fileId,
          extractedData,
          status: 'completed'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update extraction status')
      }

      // Update local state
      setUploadedFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, processed: true, extractedData }
          : file
      ))

      setProcessedFilesCount(prev => prev + 1)

      // Call callbacks
      onDataExtracted?.(extractedData, fileId)
      onFileProcessed?.(fileId, true)

      // Update aggregated extracted data
      await updateAggregatedData()

    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error)
      
      // Update file status to failed
      await fetch('/api/sublisting/update-media-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: fileId,
          status: 'failed'
        })
      })

      onFileProcessed?.(fileId, false)
    }
  }, [onDataExtracted, onFileProcessed])

  // Update aggregated extracted data from all processed files
  const updateAggregatedData = useCallback(async () => {
    if (!session) return

    try {
      const processedFiles = uploadedFiles.filter(f => f.processed && f.extractedData)
      
      if (processedFiles.length === 0) return

      // Aggregate all extracted data
      const aggregatedData: Record<string, any> = {}
      let totalConfidence = 0
      let confidenceCount = 0

      for (const file of processedFiles) {
        if (file.extractedData) {
          // Merge extracted data, with more recent files taking precedence
          Object.assign(aggregatedData, file.extractedData)
          
          // Calculate confidence if available
          if (file.extractedData.confidence) {
            totalConfidence += file.extractedData.confidence
            confidenceCount++
          }
        }
      }

      const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : undefined

      // Update in database
      await updateExtractedData(aggregatedData, averageConfidence, processedFiles.length)

    } catch (error) {
      console.error('Error updating aggregated data:', error)
    }
  }, [session, uploadedFiles, updateExtractedData])

  // Get all extracted data (aggregated)
  const getAllExtractedData = useCallback(async () => {
    if (!session) return {}

    try {
      const extractedDataRecord = await getExtractedData()
      return extractedDataRecord?.aggregated_data || {}
    } catch (error) {
      console.error('Error fetching aggregated extracted data:', error)
      return {}
    }
  }, [session, getExtractedData])

  // Remove file
  const removeFile = useCallback(async (fileId: string) => {
    try {
      // Remove from database
      const response = await fetch('/api/sublisting/remove-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: fileId })
      })

      if (!response.ok) {
        throw new Error('Failed to remove file from database')
      }

      // Update local state
      setUploadedFiles(prev => {
        const filtered = prev.filter(f => f.id !== fileId)
        setTotalFilesCount(filtered.length)
        setProcessedFilesCount(filtered.filter(f => f.processed).length)
        return filtered
      })

      // Update aggregated data
      await updateAggregatedData()

    } catch (error) {
      console.error('Error removing file:', error)
    }
  }, [updateAggregatedData])

  // Get files by type
  const getFilesByType = useCallback((type: 'image' | 'video' | 'document' | 'pdf') => {
    return uploadedFiles.filter(file => {
      if (type === 'image') return file.type.startsWith('image/')
      if (type === 'video') return file.type.startsWith('video/')
      if (type === 'pdf') return file.type === 'application/pdf'
      return !file.type.startsWith('image/') && !file.type.startsWith('video/') && file.type !== 'application/pdf'
    })
  }, [uploadedFiles])

  return {
    // File management
    uploadedFiles,
    addAndProcessFiles,
    removeFile,
    getFilesByType,
    
    // Processing state
    isProcessing,
    totalFilesCount,
    processedFilesCount,
    
    // Data extraction
    getAllExtractedData,
    updateAggregatedData,
    
    // Session info
    sessionId: session?.id,
    isSessionActive: session?.session_status === 'draft' || session?.session_status === 'in_progress',
    
    // Helper methods
    refreshFiles: loadExistingFiles
  }
}
