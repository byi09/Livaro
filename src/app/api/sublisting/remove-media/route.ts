import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const { mediaId } = await request.json()

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing required field: mediaId' },
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

    // First, get the media record to verify ownership and get storage info
    const { data: mediaRecord, error: fetchError } = await supabase
      .from('sublisting_session_media')
      .select(`
        *,
        sublisting_sessions!inner(user_id)
      `)
      .eq('id', mediaId)
      .single()

    if (fetchError || !mediaRecord) {
      return NextResponse.json(
        { error: 'Media record not found' },
        { status: 404 }
      )
    }

    // Verify the media belongs to the authenticated user
    if (mediaRecord.sublisting_sessions.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete from storage if storage path exists
    if (mediaRecord.storage_path) {
      try {
        const { error: storageError } = await supabase.storage
          .from(mediaRecord.storage_bucket)
          .remove([mediaRecord.storage_path])

        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        }
      } catch (storageError) {
        console.warn('Storage deletion error:', storageError)
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('sublisting_session_media')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      console.error('Database deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete media record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Media file deleted successfully'
    })

  } catch (error) {
    console.error('Error removing media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
