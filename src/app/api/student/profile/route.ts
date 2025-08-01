import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // For demo purposes, return a mock profile
    // In the future, this would fetch from a student_profiles table
    const mockProfile = {
      firstName: 'test',
      lastName: '1',
      email: 'test1@edu.in',
      phone: '1234567890',
      university: 'UC Berkeley',
      graduationYear: '2026',
      major: 'Computer Science',
      budget: {
        min: 1800,
        max: 3200
      },
      preferredAreas: ['University Area', 'North Berkeley', 'Downtown'],
      moveInDate: '2024-08-01',
      leaseLength: '12 months',
      pets: false,
      parking: true,
      roommates: true,
      furnished: false,
      utilitiesIncluded: true
    }
    return NextResponse.json({ profile: mockProfile })
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
    
    // In the future, this would save to a student_profiles table
    // For now, just return success
    return NextResponse.json({ 
      message: 'Profile saved successfully',
      profile: body 
    })
  } catch (error) {
    console.error('Error saving student profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 