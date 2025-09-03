import { useState, useCallback, useEffect } from 'react'

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  uploadedAt: Date
  extractedData?: Record<string, string>
  processed: boolean
}

interface UseUploadedMediaOptions {
  propertyId?: string | null
  autoProcess?: boolean
  onDataExtracted?: (data: Record<string, string>, fileId: string) => void
}

const STORAGE_KEY_PREFIX = 'uploaded-media-'

export function useUploadedMedia({
  propertyId,
  autoProcess = true,
  onDataExtracted,
}: UseUploadedMediaOptions = {}) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const storageKey = propertyId ? `${STORAGE_KEY_PREFIX}${propertyId}` : `${STORAGE_KEY_PREFIX}new`

  // Load stored files on mount
  useEffect(() => {
    const loadStoredFiles = () => {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsedFiles = JSON.parse(stored)
          // Convert date strings back to Date objects
          const files = parsedFiles.map((file: any) => ({
            ...file,
            uploadedAt: new Date(file.uploadedAt),
            // Note: File objects can't be serialized, so we'll lose the actual file content
            // This is mainly for tracking what was uploaded and extracted data
          }))
          setUploadedFiles(files)
        }
      } catch (error) {
        console.error('Error loading stored files:', error)
      }
    }

    loadStoredFiles()
  }, [storageKey])

  // Save files to localStorage whenever uploadedFiles changes
  useEffect(() => {
    try {
      const filesToStore = uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: file.uploadedAt.toISOString(),
        extractedData: file.extractedData,
        processed: file.processed,
      }))
      localStorage.setItem(storageKey, JSON.stringify(filesToStore))
    } catch (error) {
      console.error('Error saving files to storage:', error)
    }
  }, [uploadedFiles, storageKey])

  const addFiles = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      processed: false,
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    return newFiles
  }, [])

  const processFiles = useCallback(async (filesToProcess: UploadedFile[]) => {
    if (!autoProcess || filesToProcess.length === 0) return

    setIsProcessing(true)

    for (const uploadedFile of filesToProcess) {
      try {
        const formData = new FormData()
        formData.append('image', uploadedFile.file)

        const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const response = await fetch(`${baseURL}/api/image-to-data`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const extractedData = await response.json()
          
          // Update the file with extracted data
          setUploadedFiles(prev => prev.map(file => 
            file.id === uploadedFile.id 
              ? { ...file, extractedData, processed: true }
              : file
          ))

          // Notify parent component
          onDataExtracted?.(extractedData, uploadedFile.id)
        }
      } catch (error) {
        console.error(`Error processing file ${uploadedFile.name}:`, error)
        
        // Mark as processed even if failed to avoid reprocessing
        setUploadedFiles(prev => prev.map(file => 
          file.id === uploadedFile.id 
            ? { ...file, processed: true }
            : file
        ))
      }

      // Small delay between files
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsProcessing(false)
  }, [autoProcess, onDataExtracted])

  const addAndProcessFiles = useCallback(async (files: File[]) => {
    const newFiles = addFiles(files)
    if (autoProcess) {
      await processFiles(newFiles)
    }
    return newFiles
  }, [addFiles, processFiles, autoProcess])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const getAllExtractedData = useCallback(() => {
    const allData: Record<string, string> = {}
    
    uploadedFiles.forEach(file => {
      if (file.extractedData) {
        // Merge all extracted data, with later files potentially overriding earlier ones
        Object.assign(allData, file.extractedData)
      }
    })

    return allData
  }, [uploadedFiles])

  const reprocessUnprocessedFiles = useCallback(async () => {
    const unprocessedFiles = uploadedFiles.filter(file => !file.processed && file.file)
    if (unprocessedFiles.length > 0) {
      await processFiles(unprocessedFiles)
    }
  }, [uploadedFiles, processFiles])

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([])
    localStorage.removeItem(storageKey)
  }, [storageKey])

  const getFilesByType = useCallback((type: 'image' | 'video' | 'pdf') => {
    return uploadedFiles.filter(file => {
      if (type === 'image') return file.type.startsWith('image/')
      if (type === 'video') return file.type.startsWith('video/')
      if (type === 'pdf') return file.type === 'application/pdf'
      return false
    })
  }, [uploadedFiles])

  return {
    uploadedFiles,
    isProcessing,
    addFiles,
    addAndProcessFiles,
    removeFile,
    getAllExtractedData,
    reprocessUnprocessedFiles,
    clearAllFiles,
    getFilesByType,
    hasUnprocessedFiles: uploadedFiles.some(file => !file.processed),
    processedFilesCount: uploadedFiles.filter(file => file.processed).length,
    totalFilesCount: uploadedFiles.length,
  }
}
