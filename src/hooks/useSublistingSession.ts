import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export interface SublistingSessionData {
  id: string
  auth_session_id: string
  user_id: string
  session_status: 'draft' | 'in_progress' | 'completed' | 'expired' | 'cancelled'
  expires_at?: string
  sublease_file_name?: string
  is_sublet_approved?: boolean
  property_info_completed: boolean
  rent_details_completed: boolean
  media_completed: boolean
  amenities_completed: boolean
  review_completed: boolean
  property_id?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface SublistingSessionMedia {
  id: string
  sublisting_session_id: string
  file_name: string
  file_size: number
  file_type: string
  media_type: 'image' | 'video' | 'document' | 'pdf'
  storage_path?: string
  storage_bucket: string
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at?: string
  extracted_data?: Record<string, any>
  uploaded_at: string
  created_at: string
  updated_at: string
}

export interface SublistingFormData {
  id: string
  sublisting_session_id: string
  step_name: string
  form_data: Record<string, any>
  is_auto_filled: boolean
  created_at: string
  updated_at: string
}

interface UseSublistingSessionOptions {
  autoCreate?: boolean
  expiresHours?: number
}

export function useSublistingSession(options: UseSublistingSessionOptions = {}) {
  const { autoCreate = true, expiresHours = 24 } = options
  const [session, setSession] = useState<SublistingSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Get current auth session ID from JWT
  const getAuthSessionId = useCallback(async (): Promise<string | null> => {
    const { data: { session: authSession } } = await supabase.auth.getSession()
    if (!authSession?.access_token) return null

    try {
      // Decode JWT to get session_id claim
      const payload = JSON.parse(atob(authSession.access_token.split('.')[1]))
      return payload.session_id || null
    } catch (error) {
      console.error('Error decoding JWT:', error)
      return null
    }
  }, [supabase.auth])

  // Initialize or retrieve sublisting session
  const initializeSession = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const authSessionId = await getAuthSessionId()
      if (!authSessionId) {
        setError('No auth session ID found')
        setLoading(false)
        return
      }

      // Try to find existing sublisting session
      const { data: existingSession, error: fetchError } = await supabase
        .from('sublisting_sessions')
        .select('*')
        .eq('auth_session_id', authSessionId)
        .eq('user_id', user.id)
        .in('session_status', ['draft', 'in_progress'])
        .single()

      if (existingSession && !fetchError) {
        setSession(existingSession)
        setLoading(false)
        return
      }

      // Create new session if autoCreate is enabled
      if (autoCreate) {
        const { data: newSession, error: createError } = await supabase
          .rpc('get_or_create_sublisting_session', {
            p_auth_session_id: authSessionId,
            p_user_id: user.id,
            p_expires_hours: expiresHours
          })

        if (createError) {
          throw createError
        }

        // Fetch the created session
        const { data: createdSession, error: refetchError } = await supabase
          .from('sublisting_sessions')
          .select('*')
          .eq('id', newSession)
          .single()

        if (refetchError) {
          throw refetchError
        }

        setSession(createdSession)
      }
    } catch (err) {
      console.error('Error initializing sublisting session:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [supabase, autoCreate, expiresHours, getAuthSessionId])

  // Update session status or progress
  const updateSession = useCallback(async (updates: Partial<SublistingSessionData>) => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('sublisting_sessions')
        .update(updates)
        .eq('id', session.id)
        .select()
        .single()

      if (error) throw error

      setSession(data)
      return data
    } catch (err) {
      console.error('Error updating sublisting session:', err)
      setError(err instanceof Error ? err.message : 'Failed to update session')
      throw err
    }
  }, [session, supabase])

  // Save form data for a specific step
  const saveStepData = useCallback(async (
    stepName: string, 
    formData: Record<string, any>, 
    isAutoFilled = false
  ) => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('sublisting_session_data')
        .upsert({
          sublisting_session_id: session.id,
          step_name: stepName,
          form_data: formData,
          is_auto_filled: isAutoFilled
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error saving step data:', err)
      setError(err instanceof Error ? err.message : 'Failed to save step data')
      throw err
    }
  }, [session, supabase])

  // Load form data for a specific step
  const loadStepData = useCallback(async (stepName: string): Promise<SublistingFormData | null> => {
    if (!session) return null

    try {
      const { data, error } = await supabase
        .from('sublisting_session_data')
        .select('*')
        .eq('sublisting_session_id', session.id)
        .eq('step_name', stepName)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data || null
    } catch (err) {
      console.error('Error loading step data:', err)
      return null
    }
  }, [session, supabase])

  // Add media file to session
  const addMediaFile = useCallback(async (
    fileName: string,
    fileSize: number,
    fileType: string,
    mediaType: 'image' | 'video' | 'document' | 'pdf',
    storagePath?: string
  ): Promise<SublistingSessionMedia> => {
    if (!session) throw new Error('No active session')

    try {
      const { data, error } = await supabase
        .from('sublisting_session_media')
        .insert({
          sublisting_session_id: session.id,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          media_type: mediaType,
          storage_path: storagePath,
          storage_bucket: 'sublisting-media'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error adding media file:', err)
      throw err
    }
  }, [session, supabase])

  // Get all media files for session
  const getMediaFiles = useCallback(async (): Promise<SublistingSessionMedia[]> => {
    if (!session) return []

    try {
      const { data, error } = await supabase
        .from('sublisting_session_media')
        .select('*')
        .eq('sublisting_session_id', session.id)
        .order('uploaded_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching media files:', err)
      return []
    }
  }, [session, supabase])

  // Update extracted data for the session
  const updateExtractedData = useCallback(async (
    aggregatedData: Record<string, any>,
    confidence?: number,
    sourceMediaCount?: number
  ) => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('sublisting_extracted_data')
        .upsert({
          sublisting_session_id: session.id,
          aggregated_data: aggregatedData,
          extraction_confidence: confidence,
          source_media_count: sourceMediaCount,
          last_extraction_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error updating extracted data:', err)
      throw err
    }
  }, [session, supabase])

  // Get extracted data for session
  const getExtractedData = useCallback(async () => {
    if (!session) return null

    try {
      const { data, error } = await supabase
        .from('sublisting_extracted_data')
        .select('*')
        .eq('sublisting_session_id', session.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (err) {
      console.error('Error fetching extracted data:', err)
      return null
    }
  }, [session, supabase])

  // Complete the session and create final property
  const completeSession = useCallback(async (propertyId: string) => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('sublisting_sessions')
        .update({
          session_status: 'completed',
          property_id: propertyId,
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id)
        .select()
        .single()

      if (error) throw error

      setSession(data)
      return data
    } catch (err) {
      console.error('Error completing session:', err)
      throw err
    }
  }, [session, supabase])

  // Cancel the session
  const cancelSession = useCallback(async () => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('sublisting_sessions')
        .update({
          session_status: 'cancelled'
        })
        .eq('id', session.id)
        .select()
        .single()

      if (error) throw error

      setSession(data)
      return data
    } catch (err) {
      console.error('Error cancelling session:', err)
      throw err
    }
  }, [session, supabase])

  // Initialize session on mount
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  return {
    session,
    loading,
    error,
    initializeSession,
    updateSession,
    saveStepData,
    loadStepData,
    addMediaFile,
    getMediaFiles,
    updateExtractedData,
    getExtractedData,
    completeSession,
    cancelSession,
    // Helper computed values
    isActive: session?.session_status === 'draft' || session?.session_status === 'in_progress',
    isCompleted: session?.session_status === 'completed',
    progressPercentage: session ? 
      [
        session.property_info_completed,
        session.rent_details_completed,
        session.media_completed,
        session.amenities_completed,
        session.review_completed
      ].filter(Boolean).length * 20 : 0
  }
}
