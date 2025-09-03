'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HiCloudUpload, HiDocument } from 'react-icons/hi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SublistCreatePage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)

    try {
      // TODO: Implement actual file upload to storage
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUploadedFile(file)
      toast.success('Sublease agreement uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload sublease agreement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleContinue = () => {
    // Store subletting context in session storage
    sessionStorage.setItem('subletting_mode', 'true')
    if (uploadedFile) {
      sessionStorage.setItem('sublease_file_name', uploadedFile.name)
    }
    
    // Redirect to the regular property creation flow
    router.push('/sell/create?mode=sublet')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 mt-16">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Sublease Listing</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start by uploading your sublease agreement, then we'll help you create a detailed listing to find the perfect subletter.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                1
              </div>
              <span className="ml-2 font-medium text-blue-600">Upload Agreement</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-medium">
                2
              </div>
              <span className="ml-2 text-gray-500">Property Details</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-medium">
                3
              </div>
              <span className="ml-2 text-gray-500">Publish Listing</span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {!uploadedFile ? (
              /* Upload Area */
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
                  <HiCloudUpload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Your Sublease Agreement
                </h3>
                <p className="text-gray-600 mb-6">
                  Drag and drop your PDF sublease agreement here, or click to browse
                </p>
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <HiCloudUpload className="w-4 h-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  PDF files only, max 10MB
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>
            ) : (
              /* File Uploaded State */
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiDocument className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sublease Agreement Uploaded
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HiDocument className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  Great! Now let's create your property listing details.
                </p>
                <div className="flex space-x-3 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-600 border-gray-300"
                  >
                    Upload Different File
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue to Property Details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              What happens next?
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <span>Upload your sublease agreement (PDF format)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <span>Fill out property details (location, amenities, photos)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <span>Set your preferences for potential subletters</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">4.</span>
                <span>Publish your listing to connect with verified students</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button 
            variant="ghost"
            onClick={() => router.push('/sublist/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </main>
  )
}
