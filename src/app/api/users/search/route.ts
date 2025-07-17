import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { users, customers, landlords } from '@/src/db/schema';
import { eq, or, ilike } from 'drizzle-orm';

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

    // Search users by username, first name, last name
    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: customers.firstName,
        lastName: customers.lastName,
        customerId: customers.id,
        businessName: landlords.businessName,
      })
      .from(users)
      .innerJoin(customers, eq(users.id, customers.userId))
      .leftJoin(landlords, eq(customers.id, landlords.customerId))
      .where(
        or(
          ilike(users.username, `%${query}%`),
          ilike(customers.firstName, `%${query}%`),
          ilike(customers.lastName, `%${query}%`)
        )
      )
      .limit(20);

    // Determine role for each user and exclude current user
    const usersWithRoles = searchResults
      .filter(result => result.id !== user.id)
      .map((result) => ({
        id: result.id,
        username: result.username,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.businessName ? 'landlord' as const : 'renter' as const,
        businessName: result.businessName,
      }));

    const filteredResults = usersWithRoles;

    return NextResponse.json(filteredResults);

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 