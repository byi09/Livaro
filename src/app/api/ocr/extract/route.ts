import { type NextRequest } from 'next/server'

interface OCRSpaceResult {
  ParsedText: string
  TextOverlay: {
    Lines: Array<{
      LineText: string
      Words: Array<{
        WordText: string
        Left: number
        Top: number
        Height: number
        Width: number
      }>
    }>
  }
  HasErrored: boolean
  ErrorMessage?: string
  ErrorDetails?: string
}

interface OCRSpaceResponse {
  ParsedResults: OCRSpaceResult[]
  OCRExitCode: number
  IsErroredOnProcessing: boolean
  ErrorMessage?: string
  ErrorDetails?: string
}

export async function POST(request: NextRequest) {
  try {
    const { image, filename } = await request.json()

    if (!image) {
      return Response.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1]
    if (!base64Data) {
      return Response.json(
        { error: 'Invalid image format' },
        { status: 400 }
      )
    }

    // Use OCR.space API for text extraction
    const formData = new FormData()
    formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'true')
    formData.append('OCREngine', '2')
    formData.append('isTable', 'true')
    formData.append('scale', 'true')

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': process.env.OCR_SPACE_API_KEY || 'helloworld', // Free tier key
      },
      body: formData
    })

    if (!ocrResponse.ok) {
      console.error('OCR API response not ok:', ocrResponse.status, ocrResponse.statusText)
      return Response.json(
        { error: 'OCR processing failed' },
        { status: 500 }
      )
    }

    const ocrData: OCRSpaceResponse = await ocrResponse.json()

    if (ocrData.IsErroredOnProcessing) {
      console.error('OCR processing error:', ocrData.ErrorMessage, ocrData.ErrorDetails)
      return Response.json(
        { error: 'OCR processing failed', details: ocrData.ErrorMessage },
        { status: 500 }
      )
    }

    // Extract text from OCR results
    let extractedText = ''
    if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
      const result = ocrData.ParsedResults[0]
      if (result.HasErrored) {
        console.error('OCR result error:', result.ErrorMessage, result.ErrorDetails)
        return Response.json(
          { error: 'OCR processing failed', details: result.ErrorMessage },
          { status: 500 }
        )
      }
      extractedText = result.ParsedText || ''
    }

    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, '\n')
      .trim()

    return Response.json({
      text: cleanedText,
      filename: filename || 'unknown',
      success: true
    })

  } catch (error) {
    console.error('OCR extraction error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 