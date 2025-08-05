import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { studentProfiles, customers } from '@/src/db/schema'

export async function GET() {
  try {
    const db = await import('@/src/db').then(m => m.db)
    
    // Test if we can query the student profiles table
    const profiles = await db.select().from(studentProfiles).limit(1)
    
    // Test if we can query customers table
    const customerCount = await db.select().from(customers).limit(1)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      studentProfilesCount: profiles.length,
      customersCount: customerCount.length,
      studentProfilesTableExists: true
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 