import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { studentProfiles, customers, rentalApplications, renters, properties, propertyListings } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await import('@/src/db').then(m => m.db)
    
    // Get all customers
    const customersData = await db.select().from(customers).limit(5)
    
    // Get all student profiles
    const studentProfilesData = await db.select().from(studentProfiles).limit(5)
    
    // Get all rental applications
    const applicationsData = await db.select().from(rentalApplications).limit(5)
    
    // Get all properties
    const propertiesData = await db.select().from(properties).limit(5)

    return NextResponse.json({
      message: 'Test data retrieved successfully',
      data: {
        customers: customersData.length,
        studentProfiles: studentProfilesData.length,
        applications: applicationsData.length,
        properties: propertiesData.length,
        sampleStudentProfile: studentProfilesData[0] || null,
        sampleApplication: applicationsData[0] || null
      }
    })
  } catch (error) {
    console.error('Error fetching test data:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 