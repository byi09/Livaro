'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Loader, Eye, Check } from 'lucide-react'
import Image from 'next/image'

interface ExtractedData {
  propertyType?: string
  bedrooms?: string
  bathrooms?: string
  squareFootage?: string
  monthlyRent?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  description?: string
  listingTitle?: string
  availableDate?: string
  amenities?: string[]
  yearBuilt?: string
  securityDeposit?: string
  petDeposit?: string
  applicationFee?: string
  confidence?: number
}

interface ScreenshotProcessorProps {
  onDataExtracted: (data: ExtractedData) => void
  onClose: () => void
}

export default function ScreenshotProcessor({ onDataExtracted, onClose }: ScreenshotProcessorProps) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setUploadedImages(prev => [...prev, ...imageFiles])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setUploadedImages(prev => [...prev, ...imageFiles])
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const processScreenshots = async () => {
    if (uploadedImages.length === 0) return

    setProcessing(true)
    setProcessingProgress('Uploading images...')

    try {
      // Step 1: Extract text from images using OCR
      setProcessingProgress('Extracting text from images...')
      const allExtractedText: string[] = []

      for (const [index, file] of uploadedImages.entries()) {
        setProcessingProgress(`Processing image ${index + 1} of ${uploadedImages.length}...`)
        
        // Convert image to base64 for OCR processing
        const base64Image = await convertToBase64(file)
        
        // Call OCR service
        const ocrResponse = await fetch('/api/ocr/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            filename: file.name
          })
        })

        if (!ocrResponse.ok) {
          throw new Error('OCR processing failed')
        }

        const { text } = await ocrResponse.json()
        allExtractedText.push(text)
      }

      // Step 2: Use AI to categorize and extract relevant property data
      setProcessingProgress('Analyzing extracted text with AI...')
      const aiResponse = await fetch('/api/ai/extract-property-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedTexts: allExtractedText,
          context: 'property_listing'
        })
      })

      if (!aiResponse.ok) {
        throw new Error('AI processing failed')
      }

      const extractedPropertyData = await aiResponse.json()
      setExtractedData(extractedPropertyData)
      setProcessingProgress('Processing complete!')

    } catch (error) {
      console.error('Error processing screenshots:', error)
      setProcessingProgress('Error processing images. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleUseExtractedData = () => {
    if (extractedData) {
      onDataExtracted(extractedData)
      onClose()
    }
  }

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Screenshot Property Extractor</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload Area */}
          {uploadedImages.length === 0 && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg mb-2">Drag & drop property screenshots here</p>
                <p className="text-gray-500 mb-4">or click to select files</p>
                <p className="text-sm text-gray-400">Supports PNG, JPG, GIF, BMP, WebP</p>
              </label>
            </div>
          )}

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Uploaded Images ({uploadedImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openImageModal(URL.createObjectURL(file))}
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openImageModal(URL.createObjectURL(file))}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Add more images button */}
              <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-more"
                />
                <label htmlFor="file-upload-more" className="cursor-pointer">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Add more images</p>
                </label>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processing && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-blue-700">{processingProgress}</span>
              </div>
            </div>
          )}

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-green-800">
                Extracted Property Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(extractedData).map(([key, value]) => {
                  if (key === 'confidence' || !value) return null
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-gray-700">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    </div>
                  )
                })}
              </div>
              {extractedData.confidence && (
                <div className="mt-3 text-sm text-gray-600">
                  Confidence: {Math.round(extractedData.confidence * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {uploadedImages.length > 0 && !extractedData && (
              <Button 
                onClick={processScreenshots}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Extract Property Data'
                )}
              </Button>
            )}
            {extractedData && (
              <Button 
                onClick={handleUseExtractedData}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Extracted Data
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <Image
              src={selectedImage}
              alt="Selected screenshot"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 