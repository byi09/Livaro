import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { rentalApplications, properties, propertyListings, landlords, customers, renters } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await import('@/src/db').then(m => m.db)
    
    // Get the customer and renter for the current user
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1)

    if (customerResult.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const customer = customerResult[0]

    // Get the renter for this customer
    const renterResult = await db
      .select()
      .from(renters)
      .where(eq(renters.customerId, customer.id))
      .limit(1)

    if (renterResult.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const renter = renterResult[0]

    // Get all applications for this renter
    const applications = await db
      .select({
        id: rentalApplications.id,
        propertyId: rentalApplications.propertyId,
        proposedMoveInDate: rentalApplications.proposedMoveInDate,
        proposedRent: rentalApplications.proposedRent,
        applicationStatus: rentalApplications.applicationStatus,
        appliedAt: rentalApplications.appliedAt,
        coverLetter: rentalApplications.coverLetter,
        // Property details
        propertyAddressLine1: properties.addressLine1,
        propertyCity: properties.city,
        propertyState: properties.state,
        propertyBedrooms: properties.bedrooms,
        propertyBathrooms: properties.bathrooms,
        // Listing details
        listingTitle: propertyListings.listingTitle,
        monthlyRent: propertyListings.monthlyRent,
        // Landlord details
        landlordName: landlords.businessName,
      })
      .from(rentalApplications)
      .leftJoin(properties, eq(rentalApplications.propertyId, properties.id))
      .leftJoin(propertyListings, eq(rentalApplications.listingId, propertyListings.id))
      .leftJoin(landlords, eq(rentalApplications.landlordId, landlords.id))
      .where(eq(rentalApplications.renterId, renter.id))

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 