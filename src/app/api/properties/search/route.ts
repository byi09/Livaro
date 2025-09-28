import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { properties, landlords, customers, users } from '@/src/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query must be at least 3 characters long' 
      }, { status: 400 });
    }

    console.log('🔍 Searching properties for query:', query);

    const searchTerm = query.trim();
    
    // Search properties by address, city, or other relevant fields
    const results = await db
      .select({
        id: properties.id,
        addressLine1: properties.addressLine1,
        addressLine2: properties.addressLine2,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        propertyType: properties.propertyType,
        squareFootage: properties.squareFootage,
        landlordId: properties.landlordId,
        // Landlord info
        landlordName: customers.firstName,
        landlordLastName: customers.lastName,
        landlordEmail: users.email,
      })
      .from(properties)
      .leftJoin(landlords, eq(properties.landlordId, landlords.id))
      .leftJoin(customers, eq(landlords.customerId, customers.id))
      .leftJoin(users, eq(customers.userId, users.id))
      .where(
        or(
          ilike(properties.addressLine1, `%${searchTerm}%`),
          ilike(properties.city, `%${searchTerm}%`),
          ilike(properties.zipCode, `%${searchTerm}%`),
          and(
            ilike(properties.city, `%${searchTerm.split(' ')[0]}%`),
            ilike(properties.state, `%${searchTerm.split(' ')[1] || ''}%`)
          )
        )
      )
      .limit(limit);

    // Format results with additional display information
    const formattedResults = results.map(property => ({
      ...property,
      fullAddress: `${property.addressLine1}${property.addressLine2 ? ', ' + property.addressLine2 : ''}, ${property.city}, ${property.state} ${property.zipCode}`,
      displayName: `${property.addressLine1}, ${property.city}, ${property.state}`,
      landlordFullName: property.landlordName && property.landlordLastName 
        ? `${property.landlordName} ${property.landlordLastName}` 
        : 'Unknown Landlord',
    }));

    console.log(`🎯 Found ${formattedResults.length} properties matching "${query}"`);

    return NextResponse.json({
      success: true,
      properties: formattedResults,
      totalResults: formattedResults.length,
      searchQuery: query,
      limit,
    });

  } catch (error) {
    console.error('❌ Error searching properties:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}