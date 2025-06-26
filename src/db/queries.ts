"use server";

import { asc, desc, eq, gte, inArray, or, SQL, sql, and } from "drizzle-orm";
import { db } from ".";
import {
  conversations,
  messages,
  conversationParticipants,
  users,
  properties,
  propertyFeatures,
  propertyListings,
  customers,
  userPreferences,
  landlords
} from "./schema";
import type { FilterOptions, PropertyListing, SortOption } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

/**
 * Search for properties based on filters and sort options.
 *
 * @param options A set of filters to apply to the property search
 * @param sortOption The sorting option to apply to the results
 * @returns A list of properties that match the filters and are sorted according to the specified option
 */
export const searchPropertiesWithFilter = async (
  options: FilterOptions,
  sortOption: SortOption
) => {
  // ---------------------
  // |   Parse options   |
  // ---------------------
  const propertyTypes: SQL[] = [];
  for (const [type, isActive] of Object.entries(options.propertyTypes))
    if (isActive) propertyTypes.push(sql`${type.toLowerCase()}`);

  // ---------------------------
  // |   Prep-work for query   |
  // ---------------------------

  // build subqueries
  const featuresSubquery = db.$with("features_subquery").as(
    db
      .select({
        propertyId: propertyFeatures.propertyId,
        features: sql`ARRAY_AGG(${propertyFeatures.featureName})`.as("features")
      })
      .from(propertyFeatures)
      .groupBy(propertyFeatures.propertyId)
  );

  // append subqueries
  const qWith = db.with(featuresSubquery);
  const qSelect = qWith.select().from(properties);

  // append joins
  const qJoinListings = qSelect.innerJoin(
    propertyListings,
    eq(properties.id, propertyListings.propertyId)
  );

  const qJoinFeatures = qJoinListings.leftJoin(
    featuresSubquery,
    eq(properties.id, featuresSubquery.propertyId)
  );

  const qFinal = qJoinFeatures;

  // ---------------------------
  // |   Build WHERE clauses   |
  // ---------------------------

  const filters: SQL[] = [];

  // filter by location
  if (
    options.neBounds?.lat &&
    options.swBounds?.lat &&
    options.neBounds?.lng &&
    options.swBounds?.lng
  ) {
    filters.push(
      sql`${properties.latitude} BETWEEN ${options.swBounds.lat} AND ${options.neBounds.lat}`,
      sql`${properties.longitude} BETWEEN ${options.swBounds.lng} AND ${options.neBounds.lng}`
    );
  }

  // filter by price
  if (options.priceRange.min > 0 || options.priceRange.max > 0) {
    const minPrice = options.priceRange.min > 0 ? options.priceRange.min : 0;
    const maxPrice =
      options.priceRange.max > 0 ? options.priceRange.max : Infinity;

    filters.push(
      gte(propertyListings.monthlyRent, sql`${minPrice}`),
      gte(sql`${maxPrice}`, propertyListings.monthlyRent)
    );
  }

  // filter by property type
  if (propertyTypes.length > 0)
    filters.push(inArray(properties.propertyType, sql`${propertyTypes}`));

  // filter by number of bedrooms
  if (options.bedrooms > 0)
    filters.push(gte(properties.bedrooms, options.bedrooms));

  // filter by parking
  if (options.parking)
    filters.push(
      or(gte(properties.parkingSpaces, 1), gte(properties.garageSpaces, 1))!
    );

  // filter by pet friendly
  if (options.petsAllowed)
    filters.push(
      eq(sql`'Pet Friendly'`, sql`ANY(${featuresSubquery.features})`)
    );

  // filter by AC
  if (options.ac)
    filters.push(
      eq(sql`'Central AC/Heat'`, sql`ANY(${featuresSubquery.features})`)
    );

  // filter by in-unit laundry
  if (options.inUnitLaundry)
    filters.push(
      eq(sql`'In-Unit Laundry'`, sql`ANY(${featuresSubquery.features})`)
    );

  // TODO: filter by furnished

  // append filters
  const qData =
    filters.length > 0
      ? qFinal.where(sql.join(filters, sql.raw(" AND ")))
      : qFinal;

  // ------------------------------
  // |   Build ORDER BY clauses   |
  // ------------------------------

  const orderBy: SQL[] = [];

  switch (sortOption) {
    case "priceAsc":
      orderBy.push(asc(propertyListings.monthlyRent));
      break;
    case "priceDesc":
      orderBy.push(desc(propertyListings.monthlyRent));
      break;
    case "newest":
      orderBy.push(desc(propertyListings.createdAt));
      break;
    case "oldest":
      orderBy.push(asc(propertyListings.createdAt));
      break;
    case "bedrooms":
      orderBy.push(desc(properties.bedrooms));
      break;
    case "bathrooms":
      orderBy.push(desc(properties.bathrooms));
      break;
    default:
      throw new Error(`Unknown sort option: ${sortOption}`);
  }

  const q = qData.orderBy(sql.join(orderBy, sql.raw(", "))).limit(100); // Limit to 100 results for performance

  // uncomment to debug generated SQL
  // console.log(q.toSQL().sql);

  const results = await q;
  return results;
};

/**
 * Get nearby properties within a specified radius from a given latitude and longitude.
 * Results are sorted by distance from the specified point.
 * This function relies on functions from the earthdistance extension.
 *
 * @param lat Latitude of the center point
 * @param lng Longitude of the center point
 * @param radius Radius in meters to search within (default is 10 km)
 * @returns A list of property listings within the specified radius
 */
export const getNearbyProperties = async (
  lat: number,
  lng: number,
  radius: number = 10000, // default to 10km
  limit: number = 3
): Promise<PropertyListing[]> => {
  const featuresSubquery = db.$with("features_subquery").as(
    db
      .select({
        propertyId: propertyFeatures.propertyId,
        features: sql`ARRAY_AGG(${propertyFeatures.featureName})`.as("features")
      })
      .from(propertyFeatures)
      .groupBy(propertyFeatures.propertyId)
  );

  const results = await db
    .with(featuresSubquery)
    .select()
    .from(properties)
    .innerJoin(propertyListings, eq(properties.id, propertyListings.propertyId))
    .leftJoin(featuresSubquery, eq(properties.id, featuresSubquery.propertyId))
    .where(
      sql`
      earth_box(ll_to_earth(${lat}, ${lng}), ${radius}) @> ll_to_earth(${properties.latitude}, ${properties.longitude})
      AND earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(${properties.latitude}, ${properties.longitude})) <= ${radius}`
    )
    .orderBy(
      asc(
        sql`earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(${properties.latitude}, ${properties.longitude}))`
      )
    )
    .limit(limit);

  return results;
};

//--------------------------------
// Messaging
//--------------------------------

// Get all conversations for a user
export const getUserConversationsComplete = async (userId: string) => {
  const lastMessageSubquery = db.$with("last_message_subquery").as(
    db
      .select({
        conversationId: messages.conversationId,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        rn: sql<number>`row_number() over (partition by ${messages.conversationId} order by ${messages.createdAt} desc)`.as(
          "rn"
        )
      })
      .from(messages)
  );

  const participantsSubquery = db.$with("participants_subquery").as(
    db
      .select({
        conversationId: conversationParticipants.conversationId,
        participants:
          sql`json_agg(json_build_object('user', json_build_object('id', ${users.id}, 'username', ${users.username}, 'firstName', ${customers.firstName}, 'lastName', ${customers.lastName}), 'role', ${conversationParticipants.role}))`.as(
            "participants"
          )
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .innerJoin(customers, eq(users.id, customers.userId))
      .groupBy(conversationParticipants.conversationId)
  );

  const userConversations = await db
    .with(lastMessageSubquery, participantsSubquery)
    .select({
      id: conversations.id,
      conversationType: conversations.conversationType,
      title: conversations.title,
      isArchived: conversations.isArchived,
      propertyId: conversations.propertyId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      // from user's participation record
      unreadCount: conversationParticipants.unreadCount,
      lastReadAt: conversationParticipants.lastReadAt,
      isMuted: conversationParticipants.isMuted,
      // from subqueries
      participants: participantsSubquery.participants,
      lastMessage: {
        content: lastMessageSubquery.content,
        createdAt: lastMessageSubquery.createdAt,
        senderId: lastMessageSubquery.senderId
      },
      // from join
      property: {
        id: properties.id,
        addressLine1: properties.addressLine1,
        addressLine2: properties.addressLine2,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode
      }
    })
    .from(conversationParticipants)
    .innerJoin(
      conversations,
      eq(conversationParticipants.conversationId, conversations.id)
    )
    .innerJoin(
      participantsSubquery,
      eq(conversations.id, participantsSubquery.conversationId)
    )
    .leftJoin(
      lastMessageSubquery,
      and(
        eq(conversations.id, lastMessageSubquery.conversationId),
        eq(lastMessageSubquery.rn, 1)
      )
    )
    .leftJoin(properties, eq(conversations.propertyId, properties.id))
    .where(
      and(
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.isActive, true)
      )
    )
    .orderBy(desc(conversations.updatedAt));

  return userConversations;
};

export const userHasConversationAccess = async (
  userId: string,
  conversationId: string
): Promise<boolean> => {
  const participation = await db
    .select({ id: conversationParticipants.id })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.isActive, true)
      )
    )
    .limit(1);

  return participation.length > 0;
};

export const getMessagesByConversationId = async (conversationId: string) => {
  try {
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    return conversationMessages;
  } catch (error) {
    console.error("Error getting messages by conversation id:", error);
    return [];
  }
};

//--------------------------------
// Onboarding helpers
//--------------------------------

export const isUserOnboarded = async (userId: string): Promise<boolean> => {
  const existing = await db.query.customers.findFirst({
    where: eq(customers.userId, userId)
  });
  return !!existing;
};

export interface OnboardingPayload {
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // yyyy-mm-dd
  phoneNumber?: string;
  userType?: "renter" | "landlord";
  gender?: string;

  // New separate location fields
  currentCity?: string;
  currentState?: string;
  currentZipCode?: string;
  interestCity?: string;
  interestState?: string;
  interestZipCode?: string;

  // Legacy location fields for backward compatibility
  currentLocation?: string;
  locationOfInterest?: string;

  // notification prefs
  updatesSavedPropertiesEmail?: boolean;
  updatesSavedPropertiesPush?: boolean;
  newPropertiesEmail?: boolean;
  newPropertiesPush?: boolean;
  newsEmail?: boolean;
  newsPush?: boolean;
}

export const saveUserOnboarding = async (
  userId: string,
  { username, firstName, lastName, dateOfBirth }: OnboardingPayload
) => {
  // update username if provided
  if (username) {
    await db.update(users).set({ username }).where(eq(users.id, userId));
  }

  // upsert customer row (simple insert; rely on RLS to allow)
  const existing = await db.query.customers.findFirst({
    where: eq(customers.userId, userId)
  });

  if (existing) {
    await db
      .update(customers)
      .set({ firstName, lastName, dateOfBirth })
      .where(eq(customers.userId, userId));
  } else {
    await db.insert(customers).values({
      userId,
      firstName,
      lastName,
      dateOfBirth
    });
  }
};

// ----------------
// |   Settings   |
// ----------------

/**
 * Gets the authenticated user's account details.
 */
export const getUserAccountDetails = async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const results = await db
      .select()
      .from(users)
      .innerJoin(customers, eq(users.id, customers.userId))
      .where(eq(users.id, data.user.id));

    if (results.length === 0) {
      return {
        success: false,
        error: "User account details not found"
      };
    }

    const userDetails = results[0];

    return {
      success: true,
      accountDetails: {
        email: userDetails.users.email,
        username: userDetails.users.username,
        firstName: userDetails.customers.firstName,
        lastName: userDetails.customers.lastName
      }
    };
  } catch (error) {
    console.error("Error getting user account details:", error);
    return {
      success: false,
      error: "Failed to get user account details"
    };
  }
};

/**
 * Gets the authenticated user's notification preferences.
 * If no preferences exist, creates default preferences.
 * Note: user must be authenticated
 */
export const getNotificationPreferences = async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // fetch notification preferences from the database
    const results = await db.query.userPreferences.findFirst({
      where: eq(customers.userId, data.user.id),
      columns: {
        updatesSavedPropertiesEmail: true,
        updatesSavedPropertiesPush: true,
        newPropertiesEmail: true,
        newPropertiesPush: true,
        newsEmail: true,
        newsPush: true
      }
    });

    // if no preferences exist, create default preferences
    if (!results) {
      const defaultPreferences = {
        updatesSavedPropertiesEmail: true,
        updatesSavedPropertiesPush: false,
        newPropertiesEmail: true,
        newPropertiesPush: false,
        newsEmail: true,
        newsPush: false
      };

      await db.insert(userPreferences).values({
        userId: data.user.id,
        ...defaultPreferences
      });

      return {
        success: true,
        preferences: defaultPreferences
      };
    }

    return {
      success: true,
      preferences: results
    };
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return {
      success: false,
      error: "Failed to get notification preferences"
    };
  }
};

/**
 * Get landlord information for a property
 */
export async function getPropertyLandlord(propertyId: string) {
  try {
    const result = await db
      .select({
        landlordId: landlords.id,
        customerId: landlords.customerId,
        businessName: landlords.businessName,
        businessPhone: landlords.businessPhone,
        businessEmail: landlords.businessEmail,
        userId: customers.userId,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phoneNumber: customers.phoneNumber,
        userEmail: users.email,
        username: users.username,
      })
      .from(properties)
      .innerJoin(landlords, eq(properties.landlordId, landlords.id))
      .innerJoin(customers, eq(landlords.customerId, customers.id))
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(properties.id, propertyId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error fetching property landlord:', error);
    return null;
  }
}
