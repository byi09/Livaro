import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { studentProfiles, customers } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await import('@/src/db').then(m => m.db)
    
    // Get the customer for the current user
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1)

    if (customerResult.length === 0) {
      return NextResponse.json({ profile: null })
    }

    const customer = customerResult[0]

    // Get the student profile for this customer
    const profileResult = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.customerId, customer.id))
      .limit(1)

    if (profileResult.length === 0) {
      return NextResponse.json({ profile: null })
    }

    const profile = profileResult[0]

    // Transform the profile data to match the frontend expectations
    const transformedProfile = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: user.email,
      phone: customer.phoneNumber,
      university: profile.university || '',
      graduationYear: profile.graduationYear || '',
      major: profile.major || '',
      budget: {
        min: Number(profile.budgetMin) || 0,
        max: Number(profile.budgetMax) || 0
      },
      preferredAreas: profile.preferredAreas as string[] || [],
      moveInDate: profile.moveInDate || '',
      leaseLength: profile.leaseLength || '',
      pets: profile.pets || false,
      parking: profile.parking || false,
      roommates: profile.roommates || false,
      furnished: profile.furnished || false,
      utilitiesIncluded: profile.utilitiesIncluded || false
    }

    return NextResponse.json({ profile: transformedProfile })
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const db = await import('@/src/db').then(m => m.db)
    
    // Get the customer for the current user
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1)

    if (customerResult.length === 0) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    const customer = customerResult[0]

    // Check if student profile already exists
    const existingProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.customerId, customer.id))
      .limit(1)

    const profileData = {
      customerId: customer.id,
      university: body.university,
      major: body.major,
      graduationYear: body.graduationYear,
      budgetMin: body.budget?.min || 0,
      budgetMax: body.budget?.max || 0,
      preferredAreas: body.preferredAreas || [],
      moveInDate: body.moveInDate || null,
      leaseLength: body.leaseLength || '',
      pets: body.pets || false,
      parking: body.parking || false,
      roommates: body.roommates || false,
      furnished: body.furnished || false,
      utilitiesIncluded: body.utilitiesIncluded || false,
    }

    let result
    if (existingProfile.length > 0) {
      // Update existing profile
      result = await db
        .update(studentProfiles)
        .set(profileData)
        .where(eq(studentProfiles.customerId, customer.id))
        .returning()
    } else {
      // Create new profile
      result = await db
        .insert(studentProfiles)
        .values(profileData)
        .returning()
    }

    return NextResponse.json({ 
      message: 'Profile saved successfully',
      profile: result[0]
    })
  } catch (error) {
    console.error('Error saving student profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 