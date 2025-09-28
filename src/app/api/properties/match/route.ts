import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { properties, landlords, customers, users } from '@/src/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      zipCode, 
      bedrooms, 
      bathrooms,
      propertyType 
    } = await request.json();

    console.log('🔍 Matching properties for:', {
      addressLine1,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      propertyType
    });

    // Search for matching properties with multiple strategies
    
    // Strategy 1: Exact address match
    const exactMatches = await db
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
        and(
          ilike(properties.addressLine1, addressLine1.trim()),
          eq(properties.city, city.trim()),
          eq(properties.state, state.trim()),
          eq(properties.zipCode, zipCode.trim()),
          bedrooms ? eq(properties.bedrooms, parseInt(bedrooms)) : undefined,
          bathrooms ? eq(properties.bathrooms, parseFloat(bathrooms)) : undefined,
          propertyType ? eq(properties.propertyType, propertyType) : undefined
        )
      )
      .limit(5);

    // Strategy 2: Fuzzy address match (if no exact matches found)
    let fuzzyMatches = [];
    if (exactMatches.length === 0) {
      fuzzyMatches = await db
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
          and(
            // Fuzzy address matching
            or(
              ilike(properties.addressLine1, `%${addressLine1.trim()}%`),
              ilike(properties.addressLine1, `${addressLine1.trim()}%`),
              ilike(properties.addressLine1, `%${addressLine1.trim()}`),
            ),
            eq(properties.city, city.trim()),
            eq(properties.state, state.trim()),
            eq(properties.zipCode, zipCode.trim()),
            // Optional bedroom/bathroom matching for fuzzy search
            bedrooms ? or(
              eq(properties.bedrooms, parseInt(bedrooms)),
              eq(properties.bedrooms, parseInt(bedrooms) - 1),
              eq(properties.bedrooms, parseInt(bedrooms) + 1)
            ) : undefined,
          )
        )
        .limit(10);
    }

    const allMatches = exactMatches.length > 0 ? exactMatches : fuzzyMatches;

    // Calculate match confidence scores
    const matchesWithScores = allMatches.map(property => {
      let score = 0;
      let reasons = [];

      // Address match scoring
      if (property.addressLine1.toLowerCase().trim() === addressLine1.toLowerCase().trim()) {
        score += 40;
        reasons.push('Exact address match');
      } else if (property.addressLine1.toLowerCase().includes(addressLine1.toLowerCase().trim())) {
        score += 25;
        reasons.push('Partial address match');
      }

      // Location match scoring
      if (property.city.toLowerCase() === city.toLowerCase().trim() &&
          property.state.toLowerCase() === state.toLowerCase().trim() &&
          property.zipCode === zipCode.trim()) {
        score += 30;
        reasons.push('Exact location match');
      }

      // Property details scoring
      if (bedrooms && property.bedrooms === parseInt(bedrooms)) {
        score += 15;
        reasons.push('Bedroom count match');
      }
      
      if (bathrooms && Math.abs(property.bathrooms - parseFloat(bathrooms)) < 0.5) {
        score += 10;
        reasons.push('Bathroom count match');
      }

      if (propertyType && property.propertyType === propertyType) {
        score += 5;
        reasons.push('Property type match');
      }

      return {
        ...property,
        matchScore: score,
        matchReasons: reasons,
        isExactMatch: score >= 85,
        isGoodMatch: score >= 65,
      };
    });

    // Sort by match score (highest first)
    matchesWithScores.sort((a, b) => b.matchScore - a.matchScore);

    const bestMatch = matchesWithScores.length > 0 ? matchesWithScores[0] : null;
    const isConfidentMatch = bestMatch && bestMatch.matchScore >= 75;

    console.log(`🎯 Found ${matchesWithScores.length} potential matches`, {
      bestMatch: bestMatch ? {
        id: bestMatch.id,
        address: `${bestMatch.addressLine1}, ${bestMatch.city}`,
        score: bestMatch.matchScore,
        reasons: bestMatch.matchReasons
      } : null
    });

    return NextResponse.json({
      success: true,
      matches: matchesWithScores,
      bestMatch,
      isConfidentMatch,
      totalMatches: matchesWithScores.length,
      searchCriteria: {
        addressLine1,
        city,
        state,
        zipCode,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        propertyType,
      }
    });

  } catch (error) {
    console.error('❌ Error matching properties:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
