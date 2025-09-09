/**
 * Example component demonstrating how to use the sublisting session management
 * This shows how to integrate session-based data storage for sublisting workflow
 */

'use client'
import React from 'react'
import { useSublistingSession } from '@/src/hooks/useSublistingSession'
import { useSublistingMedia } from '@/src/hooks/useSublistingMedia'

export default function SublistingSessionExample() {
  const {
    session,
    loading,
    error,
    updateSession,
    saveStepData,
    loadStepData,
    completeSession,
    isActive,
    progressPercentage
  } = useSublistingSession({
    autoCreate: true,
    expiresHours: 24
  })

  const {
    uploadedFiles,
    addAndProcessFiles,
    removeFile,
    isProcessing,
    totalFilesCount,
    processedFilesCount,
    getAllExtractedData
  } = useSublistingMedia({
    autoProcess: true,
    onDataExtracted: (data, fileId) => {
      console.log('Data extracted from file:', fileId, data)
    }
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      await addAndProcessFiles(Array.from(files))
    }
  }

  const handleSavePropertyInfo = async () => {
    const propertyData = {
      address: '123 Example St',
      bedrooms: 2,
      bathrooms: 1,
      rent: 1500
    }

    await saveStepData('property_info', propertyData, false)
    await updateSession({ propertyInfoCompleted: true })
  }

  const handleLoadPropertyInfo = async () => {
    const data = await loadStepData('property_info')
    console.log('Loaded property info:', data)
  }

  const handleCompleteSession = async () => {
    // In a real app, you'd create the property first and get its ID
    const mockPropertyId = 'property-123'
    await completeSession(mockPropertyId)
  }

  if (loading) {
    return <div>Loading session...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sublisting Session Management Demo</h1>
      
      {/* Session Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Session Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Session ID:</strong> {session?.id}</p>
            <p><strong>Status:</strong> {session?.sessionStatus}</p>
            <p><strong>Active:</strong> {isActive ? 'Yes' : 'No'}</p>
            <p><strong>Progress:</strong> {progressPercentage}%</p>
          </div>
          <div>
            <p><strong>Property Info:</strong> {session?.propertyInfoCompleted ? '✅' : '❌'}</p>
            <p><strong>Rent Details:</strong> {session?.rentDetailsCompleted ? '✅' : '❌'}</p>
            <p><strong>Media:</strong> {session?.mediaCompleted ? '✅' : '❌'}</p>
            <p><strong>Amenities:</strong> {session?.amenitiesCompleted ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Media Upload</h2>
        <input
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          onChange={handleFileUpload}
          className="mb-4"
        />
        
        <div className="mb-4">
          <p><strong>Files:</strong> {totalFilesCount}</p>
          <p><strong>Processed:</strong> {processedFilesCount}</p>
          <p><strong>Processing:</strong> {isProcessing ? 'Yes' : 'No'}</p>
        </div>

        {uploadedFiles.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Uploaded Files:</h3>
            <ul className="space-y-2">
              {uploadedFiles.map(file => (
                <li key={file.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <div className="flex items-center space-x-2">
                    {file.processed && <span className="text-green-600">✅ Processed</span>}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Form Data Management */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Form Data Management</h2>
        <div className="space-x-4">
          <button
            onClick={handleSavePropertyInfo}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Property Info
          </button>
          <button
            onClick={handleLoadPropertyInfo}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Load Property Info
          </button>
        </div>
      </div>

      {/* Session Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Session Actions</h2>
        <div className="space-x-4">
          <button
            onClick={() => updateSession({ sessionStatus: 'in_progress' })}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Mark In Progress
          </button>
          <button
            onClick={handleCompleteSession}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Complete Session
          </button>
          <button
            onClick={() => updateSession({ sessionStatus: 'cancelled' })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel Session
          </button>
        </div>
      </div>
    </div>
  )
}
