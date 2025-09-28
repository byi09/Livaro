import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { sublistings, sublistingListings } from '@/src/db/schema';
import { notifyLandlordOfSubletting } from '@/src/lib/notification-service';

export async function POST(request: NextRequest) {
  console.log('🎯 /api/sublistings/create called');

  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);
    const body = await request.json();
    console.log('📦 Request body:', body);
    console.log('🔍 Validation check:', {
      addressLine1: !!body.addressLine1,
      city: !!body.city,
      state: !!body.state,
      zipCode: !!body.zipCode,
      bedrooms: !!body.bedrooms,
      bathrooms: !!body.bathrooms,
      monthlyRent: !!body.monthlyRent
    });
    
    // Extract sublisting data from request (same structure as properties)
    const {
      // Original property reference for notifications
      originalPropertyId,
      
      // Property Information (same as properties)
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country = 'United States',
      latitude,
      longitude,
      
      // Property Details (same as properties)
      bedrooms,
      bathrooms,
      propertyType = 'apartment',
      yearBuilt,
      squareFootage,
      lotSize,
      halfBathrooms = 0,
      parkingSpaces = 0,
      garageSpaces = 0,
      hasBasement = false,
      hasAttic = false,
      
      // Status and Metadata (same as properties)
      propertyStatus = 'available',
      description,
      
      // Listing Details (same as property_listings)
      monthlyRent,
      securityDeposit,
      petDeposit,
      applicationFee,
      minimumLeaseTerm = 12,
      maximumLeaseTerm = 12,
      availableDate,
      listingTitle,
      listingDescription,
      listingStatus = 'draft',
    } = body;

    // Validate required fields
    if (!addressLine1 || !city || !state || !zipCode || !bedrooms || !bathrooms || !monthlyRent) {
      return NextResponse.json(
        { error: 'Missing required fields: addressLine1, city, state, zipCode, bedrooms, bathrooms, monthlyRent' },
        { status: 400 }
      );
    }

    console.log('💾 Creating sublisting in database...');
    
    // Create the sublisting (same structure as properties)
    const [sublisting] = await db.insert(sublistings).values({
      landlordId: user.id,
      originalPropertyId: originalPropertyId || null,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      propertyType,
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
      squareFootage: squareFootage ? parseInt(squareFootage) : null,
      lotSize: lotSize ? parseFloat(lotSize) : null,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseFloat(bathrooms),
      halfBathrooms: parseInt(halfBathrooms),
      parkingSpaces: parseInt(parkingSpaces),
      garageSpaces: parseInt(garageSpaces),
      hasBasement,
      hasAttic,
      propertyStatus,
      description,
    } as any).returning();

    console.log('✅ Sublisting created:', sublisting);

    console.log('💾 Creating sublisting listing in database...');
    
    // Create the sublisting listing (only essential columns)
    const [sublistingListing] = await db.insert(sublistingListings).values({
      sublistingId: sublisting.id,
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
      petDeposit: petDeposit ? parseFloat(petDeposit) : null,
      applicationFee: applicationFee ? parseFloat(applicationFee) : null,
      minimumLeaseTerm: parseInt(minimumLeaseTerm),
      maximumLeaseTerm: parseInt(maximumLeaseTerm),
      availableDate,
      listingTitle,
      listingDescription,
      listingStatus,
    } as any).returning();

    console.log('✅ Sublisting listing created:', sublistingListing);
    console.log('🎉 Both records created successfully!');

    // Send notification to original property landlord if originalPropertyId is provided
    let notificationResult = null;
    if (originalPropertyId) {
      console.log('📬 Sending landlord notification for original property:', originalPropertyId);
      
      const propertyAddress = `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}, ${city}, ${state} ${zipCode}`;
      
      try {
        notificationResult = await notifyLandlordOfSubletting({
          sublistingId: sublisting.id,
          originalPropertyId,
          sublettingUserId: user.id,
          propertyAddress,
          monthlyRent: parseFloat(monthlyRent),
          availableDate,
        });

        console.log('📬 Notification result:', notificationResult);
      } catch (notificationError) {
        console.error('⚠️ Failed to send landlord notification (non-blocking):', notificationError);
        // Don't fail the sublisting creation if notification fails
        notificationResult = { success: false, error: notificationError.message };
      }
    } else {
      console.log('📭 No original property ID provided - skipping landlord notification');
    }

    return NextResponse.json({
      success: true,
      sublisting: sublisting,
      sublistingListing: sublistingListing,
      notificationResult,
      message: 'Sublisting created successfully'
    });

  } catch (error) {
    console.error('Error creating sublisting:', error);
    return NextResponse.json(
      { error: 'Failed to create sublisting' },
      { status: 500 }
    );
  }
}
