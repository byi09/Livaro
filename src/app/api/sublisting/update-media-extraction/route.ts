import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { mediaId, extractedData, status } = await request.json()

    if (!mediaId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: mediaId, status' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update the media extraction status and data
    const updateData: any = {
      extraction_status: status,
      processed_at: new Date().toISOString()
    }

    if (extractedData) {
      updateData.extracted_data = extractedData
    }

    const { data, error } = await supabase
      .from('sublisting_session_media')
      .update(updateData)
      .eq('id', mediaId)
      .select(`
        *,
        sublisting_sessions!inner(user_id)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update media extraction status' },
        { status: 500 }
      )
    }

    // Verify the media belongs to the authenticated user
    if (data.sublisting_sessions.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        extraction_status: data.extraction_status,
        extracted_data: data.extracted_data,
        processed_at: data.processed_at
      }
    })

  } catch (error) {
    console.error('Error updating media extraction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
