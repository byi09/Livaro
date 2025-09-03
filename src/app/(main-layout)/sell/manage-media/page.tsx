'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUploadedMedia } from '@/src/hooks/useUploadedMedia'
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar'

export default function ManageMediaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // Check for sublet mode
  const propertyId = searchParams.get('property_id')

  const isSubletMode = mode === 'sublet'
  
  // Get sublease file name from session storage if in sublet mode
  const subleaseFileName = typeof window !== 'undefined' 
    ? sessionStorage.getItem('subleaseFileName') 
    : null

  // State for extracted data summary
  const [extractedDataSummary, setExtractedDataSummary] = useState<Record<string, string>>({})

  // Uploaded media management hook - use start-page key to access files from start page
  const { 
    addAndProcessFiles, 
    isProcessing: isMediaProcessing,
    uploadedFiles,
    getAllExtractedData,
    totalFilesCount,
    processedFilesCount,
    removeFile,
    getFilesByType,
  } = useUploadedMedia({
    propertyId: propertyId || 'start-page', // Use start-page key if no propertyId to access files from start page
    autoProcess: true,
    onDataExtracted: (data, fileId) => {
      console.log('Data extracted from uploaded files:', data)
      
      // Update the extracted data summary
      setExtractedDataSummary(prev => {
        const updated = { ...prev, ...data }
        
        // Save to localStorage for the property info form to use
        const storageKey = propertyId ? `extracted-data-${propertyId}` : 'extracted-data-new'
        localStorage.setItem(storageKey, JSON.stringify(updated))
        
        return updated
      })
    },
  })

  // Load existing extracted data on mount
  useEffect(() => {
    console.log('Manage Media Page - Loading data...')
    console.log('Property ID:', propertyId)
    console.log('Total files from hook:', totalFilesCount)
    console.log('Uploaded files:', uploadedFiles)
    
    const allData = getAllExtractedData()
    console.log('All extracted data:', allData)
    
    if (Object.keys(allData).length > 0) {
      setExtractedDataSummary(allData)
      
      // Save to localStorage
      const storageKey = propertyId ? `extracted-data-${propertyId}` : 'extracted-data-new'
      localStorage.setItem(storageKey, JSON.stringify(allData))
    }
  }, [getAllExtractedData, propertyId, totalFilesCount, uploadedFiles])

  const [dragActive, setDragActive] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      addAndProcessFiles(files)
    }
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      addAndProcessFiles(fileArray)
    }
  }

  const handleContinue = () => {
    // Navigate to the property info page with the mode parameter
    const targetUrl = isSubletMode 
      ? '/sell/create?mode=sublet'
      : '/sell/create'
    
    router.push(targetUrl)
  }

  const handleBackToStart = () => {
    const targetUrl = isSubletMode 
      ? '/sell/start?mode=sublet'
      : '/sell/start'
    
    router.push(targetUrl)
  }

  const imageFiles = getFilesByType('image')
  const videoFiles = getFilesByType('video')
  const pdfFiles = getFilesByType('pdf')

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Step 1: Manage Your Media</h1>
          <button 
            onClick={() => router.push('/sell/dashboard')}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Save & Exit
          </button>
        </div>

        {/* Progress Bar - Step 0 since this is before Property Info */}
        <InteractiveProgressBar currentStep={0} propertyId={propertyId} />

        {/* Sublet Mode Banner */}
        {isSubletMode && subleaseFileName && (
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
                  <p><strong>Sublease Agreement:</strong> {subleaseFileName}</p>
                  <p>Upload additional media to help create your sublease listing.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Manage Your Media</h2>
              <p className="text-gray-600">Upload and organize your property media files</p>
            </div>

            {/* Files carried over notice */}
            {totalFilesCount > 0 && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      📁 Files Loaded Successfully
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Your uploaded files from the previous step have been loaded. 
                        You can add more files below or continue to the next step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div className="space-y-8">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Add More Media Files
                </h3>
                <p className="text-gray-600 mb-6">
                  Drag and drop files here, or click to browse
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf,video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="media-upload"
                  disabled={isMediaProcessing}
                />
                <label
                  htmlFor="media-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose Files
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Supports images, PDFs, and videos (max 10MB each)
                </p>
              </div>

              {/* Processing Status */}
              {isMediaProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-800">Processing Files</h4>
                      <p className="text-sm text-blue-600">
                        Extracting property data from uploaded files... ({processedFilesCount}/{totalFilesCount})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Files Summary */}
              {totalFilesCount > 0 && (
                <div className="space-y-6">
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Uploaded Files ({totalFilesCount})
                    </h3>
                    
                    {/* All Files List */}
                    <div className="space-y-3">
                      {uploadedFiles.map((file) => {
                        // Determine file type icon
                        let icon = null
                        let bgColor = 'bg-gray-100'
                        let textColor = 'text-gray-600'
                        
                        if (file.type.startsWith('image/')) {
                          bgColor = 'bg-blue-100'
                          textColor = 'text-blue-600'
                          icon = (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )
                        } else if (file.type.startsWith('video/')) {
                          bgColor = 'bg-purple-100'
                          textColor = 'text-purple-600'
                          icon = (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )
                        } else if (file.type === 'application/pdf') {
                          bgColor = 'bg-red-100'
                          textColor = 'text-red-600'
                          icon = (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )
                        }

                        return (
                          <div key={file.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            {/* File Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center mr-3`}>
                              <div className={textColor}>
                                {icon}
                              </div>
                            </div>
                            
                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                                    {file.processed && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        ✓ Processed
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="ml-4 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                  title="Remove file"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Extracted Data Preview */}
                    {!isMediaProcessing && processedFilesCount > 0 && Object.keys(extractedDataSummary).length > 0 && (
                      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 mb-3">
                          ✓ Data Extracted Successfully
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          {Object.entries(extractedDataSummary).slice(0, 8).map(([key, value]) => {
                            if (!value || value === 'null' || value === 'undefined') return null
                            
                            // Format key for display
                            const displayKey = key
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase())
                            
                            return (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-xs font-medium text-green-800">{displayKey}:</span>
                                <span className="text-xs text-green-700 ml-2 truncate max-w-32">
                                  {typeof value === 'string' && value.length > 30 
                                    ? `${value.substring(0, 30)}...` 
                                    : value
                                  }
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        
                        {Object.keys(extractedDataSummary).length > 8 && (
                          <p className="text-xs text-green-600 mb-2">
                            + {Object.keys(extractedDataSummary).length - 8} more fields extracted
                          </p>
                        )}
                        
                        <p className="text-sm text-green-700">
                          This information has been automatically saved and will pre-fill the property form in the next steps.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 px-8 py-6 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={handleBackToStart}
              className="px-6 py-3 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center shadow-sm"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button 
              onClick={handleContinue}
              disabled={isMediaProcessing}
              className="px-8 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isMediaProcessing ? 'Processing...' : 'Continue to Property Details'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
