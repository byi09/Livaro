import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { likedProperties } from '@/src/db/schema';
import { eq, inArray,and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const propertyId = body?.propertyId;

  if (!propertyId) {
    return NextResponse.json({ message: 'Missing propertyId' }, { status: 400 });
  }


  // Check if already liked
  const existing = await db.query.likedProperties.findFirst({
    where: (lp, { eq, and }) =>
      and(eq(lp.userId, user.id), eq(lp.propertyId, propertyId)),
  });

  if (existing) {
    return NextResponse.json({ message: 'Already liked' }, { status: 200 });
  }

  // Insert new like
  await db.insert(likedProperties).values({
    userId: user.id,
    propertyId,
  });

  return NextResponse.json({ message: 'Liked successfully' }, { status: 200 });
}


export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const liked = await db.query.likedProperties.findMany({
    where: eq(likedProperties.userId, user.id),
  });

  const likedIds = liked.map(lp => lp.propertyId);
  if (likedIds.length === 0) {
    return NextResponse.json({ properties: [] });
  }

  // Corrected: Join listings and properties and format properly
  const listings = await db.query.propertyListings.findMany({
    where: (pl, { inArray }) => inArray(pl.propertyId, likedIds),
    with: {
      property: true,
    },
  });

  const properties = listings.map((listing) => ({
    property_listings: {
      id: listing.id,
      listingTitle: listing.listingTitle,
      monthlyRent: listing.monthlyRent,
      // Add more fields if needed
    },
    properties: {
      id: listing.property.id,
      addressLine1: listing.property.addressLine1,
      city: listing.property.city,
      state: listing.property.state,
      zipCode: listing.property.zipCode,
      bedrooms: listing.property.bedrooms,
      bathrooms: listing.property.bathrooms,
      squareFootage: listing.property.squareFootage,
      propertyType: listing.property.propertyType,
      // Add more if necessary
    }
  }));

  return NextResponse.json({ properties });
}


export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const propertyId = body?.propertyId;

  if (!propertyId) {
    return NextResponse.json({ message: 'Missing propertyId' }, { status: 400 });
  }

  // Delete the liked property
  await db.delete(likedProperties).where(
    and(eq(likedProperties.userId, user.id), eq(likedProperties.propertyId, propertyId))
  );
  return NextResponse.json({ message: 'Unliked successfully' }, { status: 200 });
}