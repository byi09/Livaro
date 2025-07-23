import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get landlord ID
    const { data: landlordData } = await supabase
      .from('users')
      .select(`
        customers!inner(
          landlords!inner(id)
        )
      `)
      .eq('id', user.id)
      .maybeSingle()

    let landlordId: string | null = null
    if (landlordData?.customers?.length && landlordData.customers[0].landlords?.length) {
      landlordId = landlordData.customers[0].landlords[0].id
    }

    if (!landlordId) {
      // Fallback path
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (customer?.id) {
        const { data: landlordRow } = await supabase
          .from('landlords')
          .select('id')
          .eq('customer_id', customer.id)
          .maybeSingle()
        landlordId = landlordRow?.id ?? null
      }
    }

    if (!landlordId) {
      return NextResponse.json(
        { error: 'Landlord profile not found' },
        { status: 404 }
      )
    }

    // Fetch One Tap Application preferences
    const { data: preferences, error } = await supabase
      .from('one_tap_application_preferences')
      .select('*')
      .eq('landlord_id', landlordId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get landlord ID
    const { data: landlordData } = await supabase
      .from('users')
      .select(`
        customers!inner(
          landlords!inner(id)
        )
      `)
      .eq('id', user.id)
      .maybeSingle()

    let landlordId: string | null = null
    if (landlordData?.customers?.length && landlordData.customers[0].landlords?.length) {
      landlordId = landlordData.customers[0].landlords[0].id
    }

    if (!landlordId) {
      // Fallback path
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (customer?.id) {
        const { data: landlordRow } = await supabase
          .from('landlords')
          .select('id')
          .eq('customer_id', customer.id)
          .maybeSingle()
        landlordId = landlordRow?.id ?? null
      }
    }

    if (!landlordId) {
      return NextResponse.json(
        { error: 'Landlord profile not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    const requiredFields = [
      'number_of_occupants',
      'desired_lease_start_month',
      'desired_lease_start_year',
      'preferred_lease_length',
      'move_in_flexibility',
      'pets_allowed',
      'parking_needed',
      'tenant_name',
      'tenant_email'
    ]

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Deactivate any existing preferences
    await supabase
      .from('one_tap_application_preferences')
      .update({ is_active: false })
      .eq('landlord_id', landlordId)

    // Create new preferences
    const { data: newPreferences, error } = await supabase
      .from('one_tap_application_preferences')
      .insert({
        landlord_id: landlordId,
        number_of_occupants: body.number_of_occupants,
        desired_lease_start_month: body.desired_lease_start_month,
        desired_lease_start_year: body.desired_lease_start_year,
        preferred_lease_length: body.preferred_lease_length,
        move_in_flexibility: body.move_in_flexibility,
        pets_allowed: body.pets_allowed,
        parking_needed: body.parking_needed,
        tenant_name: body.tenant_name,
        tenant_email: body.tenant_email,
        tenant_phone: body.tenant_phone || null,
        message_to_landlord: body.message_to_landlord || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating preferences:', error)
      return NextResponse.json(
        { error: 'Failed to create preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preferences: newPreferences })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 