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
      // No saved student profile yet – return a partially prefilled profile
      const defaultProfile = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: user.email,
        phone: customer.phoneNumber,
        university: '',
        graduationYear: '',
        major: '',
        budget: { min: 0, max: 0 },
        // Seed preferred areas from onboarding location of interest if available
        preferredAreas: [
          [customer.interestCity, customer.interestState]
            .filter(Boolean)
            .join(', ')
        ].filter((s) => s && s.trim().length > 0) as string[],
        moveInDate: '',
        leaseLength: '',
        pets: false,
        parking: false,
        roommates: false,
        furnished: false,
        utilitiesIncluded: false,
      }

      return NextResponse.json({ profile: defaultProfile })
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

    // Update customer name if provided
    if (body.firstName || body.lastName) {
      await db
        .update(customers)
        .set({
          firstName: body.firstName || customer.firstName,
          lastName: body.lastName || customer.lastName,
          phoneNumber: body.phone || customer.phoneNumber,
        })
        .where(eq(customers.id, customer.id))
    }

    const profileData = {
      customerId: customer.id,
      university: body.university ?? existingProfile[0]?.university ?? '',
      major: body.major ?? existingProfile[0]?.major ?? '',
      graduationYear: body.graduationYear ?? existingProfile[0]?.graduationYear ?? '',
      budgetMin: body.budget?.min || 0,
      budgetMax: body.budget?.max || 0,
      preferredAreas: body.preferredAreas ?? existingProfile[0]?.preferredAreas ?? [],
      moveInDate: body.moveInDate ?? existingProfile[0]?.moveInDate ?? null,
      leaseLength: body.leaseLength ?? existingProfile[0]?.leaseLength ?? '',
      pets: body.pets ?? existingProfile[0]?.pets ?? false,
      parking: body.parking ?? existingProfile[0]?.parking ?? false,
      roommates: body.roommates ?? existingProfile[0]?.roommates ?? false,
      furnished: body.furnished ?? existingProfile[0]?.furnished ?? false,
      utilitiesIncluded: body.utilitiesIncluded ?? existingProfile[0]?.utilitiesIncluded ?? false,
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