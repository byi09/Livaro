import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { properties } from '@/src/db/schema';
import { or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search properties by address, city, state
    const searchResults = await db
      .select({
        id: properties.id,
        addressLine1: properties.addressLine1,
        addressLine2: properties.addressLine2,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
      })
      .from(properties)
      .where(
        or(
          ilike(properties.addressLine1, `%${query}%`),
          ilike(properties.addressLine2, `%${query}%`),
          ilike(properties.city, `%${query}%`),
          ilike(properties.state, `%${query}%`),
          ilike(properties.zipCode, `%${query}%`)
        )
      )
      .limit(20);

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Error searching properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 