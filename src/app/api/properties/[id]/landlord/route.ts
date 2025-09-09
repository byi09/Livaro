import { NextRequest, NextResponse } from 'next/server';
import { getPropertyLandlord } from '@/src/db/queries';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const landlordInfo = await getPropertyLandlord(propertyId);

    if (!landlordInfo) {
      return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });
    }

    // Return landlord contact information
    return NextResponse.json({
      landlordId: landlordInfo.landlordId,
      userId: landlordInfo.userId,
      businessName: landlordInfo.businessName,
      businessPhone: landlordInfo.businessPhone,
      businessEmail: landlordInfo.businessEmail,
      firstName: landlordInfo.firstName,
      lastName: landlordInfo.lastName,
      phoneNumber: landlordInfo.phoneNumber,
      userEmail: landlordInfo.userEmail,
      username: landlordInfo.username,
    });

  } catch (error) {
    console.error('Error fetching landlord info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 