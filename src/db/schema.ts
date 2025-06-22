import { integer, pgTable, timestamp, pgEnum, uuid, varchar, date, boolean, decimal, text, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { year } from 'drizzle-orm/mysql-core';

// ==================== ENUMS ====================
export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);
export const accountStatusEnum = pgEnum('account_status', ['active', 'suspended', 'deactivated']);
export const contactMethodEnum = pgEnum('contact_method', ['email', 'phone', 'text']);
export const moveInTimelineEnum = pgEnum('move_in_timeline', ['immediately', '1_month', '2_months', '3_months', '6_months', 'flexible']);
export const employmentStatusEnum = pgEnum('employment_status', ['employed', 'self_employed', 'unemployed', 'student', 'retired']);

// Property enums
export const propertyTypeEnum = pgEnum('property_type', ['apartment', 'house', 'condo', 'townhouse', 'studio', 'room', 'duplex']);
export const propertyStatusEnum = pgEnum('property_status', ['available', 'rented', 'maintenance', 'off_market']);
export const listingStatusEnum = pgEnum('listing_status', ['active', 'pending', 'rented', 'expired']);
export const imageTypeEnum = pgEnum('image_type', ['exterior', 'interior', 'aerial', 'floorplan']);
export const featureCategoryEnum = pgEnum('feature_category', ['interior', 'exterior', 'building_amenities', 'appliances', 'utilities']);

// Application enums
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'approved', 'rejected', 'withdrawn']);
export const tourTypeEnum = pgEnum('tour_type', ['in_person', 'virtual', 'self_guided']);
export const tourStatusEnum = pgEnum('tour_status', ['scheduled', 'completed', 'cancelled', 'no_show']);

// Analytics enums
export const viewTypeEnum = pgEnum('view_type', ['listing_view', 'photo_view', 'virtual_tour', 'contact_info']);
export const alertFrequencyEnum = pgEnum('alert_frequency', ['immediate', 'daily', 'weekly']);

// ==================== MESSAGING ENUMS ====================
export const conversationTypeEnum = pgEnum('conversation_type', ['direct', 'group', 'support']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file', 'system']);
export const messageStatusEnum = pgEnum('message_status', ['sent', 'delivered', 'read']);
export const participantRoleEnum = pgEnum('participant_role', ['member', 'admin', 'owner']);

// ==================== NOTIFICATION ENUMS ====================
export const notificationTypeEnum = pgEnum('notification_type', ['notification', 'phone', 'email']);

// ==================== USER & CUSTOMER TABLES ====================

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    emailVerified: boolean('email_verified').default(false),
    accountStatus: accountStatusEnum('account_status').default('active'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    factorId: uuid('factor_id'),
});

export const customers = pgTable('customers', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Personal info
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 255 }),
    dateOfBirth: date('date_of_birth'),
    gender: genderEnum('gender'),
    profileImageS3Key: varchar('profile_image_s3_key', { length: 500 }),

    // Location
    currentCity: varchar('current_city', { length: 100 }),
    currentState: varchar('current_state', { length: 50 }),
    currentZipCode: varchar('current_zip_code', { length: 10 }),

    // Desired future location
    interestCity: varchar('interest_city', { length: 100 }),
    interestState: varchar('interest_state', { length: 50 }),
    interestZipCode: varchar('interest_zip_code', { length: 10 }),

    // Communication preferences
    preferredContactMethod: contactMethodEnum('preferred_contact_method').default('email'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== ROLE TABLES ====================

export const renters = pgTable('renters', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
        .notNull()
        .references(() => customers.id, { onDelete: 'cascade' }),

    // Rental search criteria
    monthlyBudget: decimal('monthly_budget', { precision: 8, scale: 2 }),
    moveInTimeline: moveInTimelineEnum('move_in_timeline'),

    // Current housing situation
    currentLeaseExpiresAt: date('current_lease_expires_at'),
    currentRent: decimal('current_rent', { precision: 8, scale: 2 }),
    reasonForMoving: varchar('reason_for_moving', { length: 255 }),

    // Lifestyle preferences
    petsCount: integer('pets_count').default(0),
    petTypes: varchar('pet_types', { length: 255 }), // "dog,cat" or JSON
    smokingAllowed: boolean('smoking_allowed').default(false),

    // Employment/Income (for landlord screening)
    employmentStatus: employmentStatusEnum('employment_status'),
    monthlyIncome: decimal('monthly_income', { precision: 10, scale: 2 }),
    employer: varchar('employer', { length: 255 }),

    // Rental history
    hasRentalHistory: boolean('has_rental_history').default(false),
    previousLandlordContact: varchar('previous_landlord_contact', { length: 255 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const landlords = pgTable('landlords', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
        .notNull()
        .references(() => customers.id, { onDelete: 'cascade' }),

    // Business info
    businessName: varchar('business_name', { length: 255 }),
    businessLicense: varchar('business_license', { length: 100 }),
    taxId: varchar('tax_id', { length: 50 }),

    // Landlord preferences
    acceptsPets: boolean('accepts_pets').default(false),
    allowsSmoking: boolean('allows_smoking').default(false),
    minimumCreditScore: integer('minimum_credit_score'),
    minimumIncomeMultiplier: decimal('minimum_income_multiplier', { precision: 3, scale: 1 }), // e.g., 3.0 for 3x rent

    // Contact for business
    businessPhone: varchar('business_phone', { length: 255 }),
    businessEmail: varchar('business_email', { length: 255 }),

    // Verification status
    identityVerified: boolean('identity_verified').default(false),
    backgroundCheckCompleted: boolean('background_check_completed').default(false),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== PROPERTY TABLES ====================

export const properties = pgTable('properties', {
    id: uuid('id').defaultRandom().primaryKey(),
    landlordId: uuid('landlord_id').references(() => landlords.id),
    buildingId: uuid('building_id').references(() => apartmentBuildings.id, { onDelete: 'cascade' }),

    // Address
    addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line_2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 50 }).notNull(),
    zipCode: varchar('zip_code', { length: 10 }).notNull(),
    country: varchar('country', { length: 100 }).default('United States'),

    // Coordinates for mapping
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),

    // Property details
    propertyType: propertyTypeEnum('property_type').notNull(),
    yearBuilt: integer('year_built'),
    squareFootage: integer('square_footage'),
    lotSize: decimal('lot_size', { precision: 10, scale: 2 }), // in sq ft
    bedrooms: integer('bedrooms').notNull(),
    bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }).notNull(),
    halfBathrooms: integer('half_bathrooms').default(0),

    // Parking and storage
    parkingSpaces: integer('parking_spaces').default(0),
    garageSpaces: integer('garage_spaces').default(0),
    hasBasement: boolean('has_basement').default(false),
    hasAttic: boolean('has_attic').default(false),

    // Property status
    propertyStatus: propertyStatusEnum('property_status').default('available'),
    description: text('description'),

    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const propertyListings = pgTable('property_listings', {
    id: uuid('id').defaultRandom().primaryKey(),
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id, { onDelete: 'cascade' }),

    // Rental details
    monthlyRent: decimal('monthly_rent', { precision: 8, scale: 2 }).notNull(),
    securityDeposit: decimal('security_deposit', { precision: 8, scale: 2 }),
    petDeposit: decimal('pet_deposit', { precision: 8, scale: 2 }),
    applicationFee: decimal('application_fee', { precision: 6, scale: 2 }),

    // Lease terms
    minimumLeaseTerm: integer('minimum_lease_term'), // months
    maximumLeaseTerm: integer('maximum_lease_term'), // months
    availableDate: date('available_date'),

    // Utilities and costs
    utilitiesIncluded: json('utilities_included'), // ["water", "electricity", "internet"]
    parkingCost: decimal('parking_cost', { precision: 6, scale: 2 }), // monthly

    // Listing management
    listingStatus: listingStatusEnum('listing_status').default('active'),
    listDate: date('list_date').defaultNow(),
    expirationDate: date('expiration_date'),
    viewCount: integer('view_count').default(0),

    // SEO and marketing
    listingTitle: varchar('listing_title', { length: 255 }),
    listingDescription: text('listing_description'),
    virtualTourUrl: varchar('virtual_tour_url', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const propertyImages = pgTable('property_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id, { onDelete: 'cascade' }),

    // Image details
    s3Key: varchar('s3_key', { length: 500 }).notNull(),
    imageOrder: integer('image_order').default(0),
    altText: varchar('alt_text', { length: 255 }),
    isPrimary: boolean('is_primary').default(false),

    // Categorization
    imageType: imageTypeEnum('image_type'),
    roomType: varchar('room_type', { length: 100 }), // kitchen, bedroom, bathroom, living_room

    createdAt: timestamp('created_at').defaultNow(),
});

export const propertyFeatures = pgTable('property_features', {
    id: uuid('id').defaultRandom().primaryKey(),
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id, { onDelete: 'cascade' }),

    featureName: varchar('feature_name', { length: 255 }).notNull(),
    featureCategory: featureCategoryEnum('feature_category').notNull(),
    featureValue: varchar('feature_value', { length: 255 }), // for features with values like "2-car garage"

    createdAt: timestamp('created_at').defaultNow(),
});

export const neighborhoods = pgTable('neighborhoods', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Location
    name: varchar('name', { length: 255 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 50 }).notNull(),
    zipCodes: json('zip_codes'), // array of zip codes in this neighborhood

    // Boundary (for mapping - would use PostGIS in production)
    boundaryPolygon: text('boundary_polygon'), // GeoJSON or WKT format

    // Neighborhood statistics
    averageRent: decimal('average_rent', { precision: 8, scale: 2 }),
    medianRent: decimal('median_rent', { precision: 8, scale: 2 }),
    walkScore: integer('walk_score'), // 0-100
    transitScore: integer('transit_score'), // 0-100
    bikeScore: integer('bike_score'), // 0-100

    // Demographics and amenities
    crimeRating: decimal('crime_rating', { precision: 3, scale: 1 }), // 1-10 scale
    schoolRating: decimal('school_rating', { precision: 3, scale: 1 }), // 1-10 scale
    nightlifeRating: decimal('nightlife_rating', { precision: 3, scale: 1 }),
    diningRating: decimal('dining_rating', { precision: 3, scale: 1 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const apartmentBuildings = pgTable('apartment_buildings', {
    id: uuid('id').defaultRandom().primaryKey(),
    landlordId: uuid('landlord_id')
        .notNull()
        .references(() => landlords.id),

    // Building identification
    buildingName: varchar('building_name', { length: 255 }).notNull(),
    buildingNumber: varchar('building_number', { length: 50 }), // e.g. "Building A", "Tower 1"
    // Address (Building level address)
    addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line_2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 50 }).notNull(),
    zipCode: varchar('zip_code', { length: 10 }).notNull(),
    country: varchar('country', { length: 100 }).default('United States'),

    // Coordinates
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),

    // Building details
    yearBuilt: integer('year_built'),
    totalUnits: integer('total_units'), // Total number of units in the building
    totalFloors: integer('total_floors'), // Total number of floors in the building
    buildingType: varchar('building_type', { length: 100 }), // e.g. "High-rise", "Mid-rise", "Garden-style"

    // Building description and amenities
    description: text('description'),
    parkingSpaces: integer('parking_spaces').default(0),

    // Management info
    managementCompany: varchar('management_company', { length: 255 }),
    onSiteManagerName: boolean('on_site_manager').default(false), // Is there an on-site manager?

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const apartmentBuildingAmenities = pgTable('building_amenities', {
    id: uuid('id').defaultRandom().primaryKey(),
    buildingId: uuid('building_id').notNull().references(() => apartmentBuildings.id, {onDelete: "cascade"}),
    
    amenityName: varchar('amenity_name', { length: 255 }).notNull(),
    amenityCategory: varchar('amenity_category', { length: 100 }), // "fitness", "recreation", "utilities", "security"
    amenityDescription: text('amenity_description'),
    
    createdAt: timestamp('created_at').defaultNow(),
});

export const apartmentBuildingImages = pgTable('building_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    buildingId: uuid('building_id').notNull().references(() => apartmentBuildings.id, {onDelete: "cascade"}),
    
    s3Key: varchar('s3_key', { length: 500 }).notNull(),
    imageOrder: integer('image_order').default(0),
    altText: varchar('alt_text', { length: 255 }),
    isPrimary: boolean('is_primary').default(false),
    imageType: varchar('image_type', { length: 100 }), // "exterior", "lobby", "amenity", "common_area"
    
    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== RENTAL APPLICATION TABLES ====================

export const rentalApplications = pgTable('rental_applications', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id')
        .notNull()
        .references(() => renters.id),
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id),
    landlordId: uuid('landlord_id')
        .notNull()
        .references(() => landlords.id),
    listingId: uuid('listing_id').references(() => propertyListings.id),

    // Application details
    proposedMoveInDate: date('proposed_move_in_date'),
    proposedRent: decimal('proposed_rent', { precision: 8, scale: 2 }),
    leaseDuration: integer('lease_duration'), // months

    // Status and timeline
    applicationStatus: applicationStatusEnum('application_status').default('pending'),
    appliedAt: timestamp('applied_at').defaultNow(),
    respondedAt: timestamp('responded_at'),

    // Application content
    coverLetter: text('cover_letter'),
    referencesProvided: boolean('references_provided').default(false),
    creditCheckConsent: boolean('credit_check_consent').default(false),
    backgroundCheckConsent: boolean('background_check_consent').default(false),

    // Landlord notes
    landlordNotes: text('landlord_notes'),
    rejectionReason: varchar('rejection_reason', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const propertyTours = pgTable('property_tours', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id')
        .notNull()
        .references(() => renters.id),
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id),
    landlordId: uuid('landlord_id')
        .notNull()
        .references(() => landlords.id),

    // Tour details
    tourType: tourTypeEnum('tour_type').notNull(),
    scheduledAt: timestamp('scheduled_at'),
    status: tourStatusEnum('status').default('scheduled'),
    duration: integer('duration'), // minutes

    // Contact info for tour
    contactPhone: varchar('contact_phone', { length: 255 }),
    specialInstructions: text('special_instructions'),

    // Feedback
    renterRating: integer('renter_rating'), // 1-5 stars for property
    landlordRating: integer('landlord_rating'), // 1-5 stars for renter
    renterNotes: text('renter_notes'),
    landlordNotes: text('landlord_notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== USER ACTIVITY TABLES ====================

export const savedProperties = pgTable('saved_properties', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id')
        .notNull()
        .references(() => renters.id),
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id),

    notes: text('notes'), // Renter's private notes
    tags: json('tags'), // ["favorite", "backup_option", "great_location"]

    createdAt: timestamp('created_at').defaultNow(),
});

export const propertyViews = pgTable('property_views', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id').references(() => renters.id), // nullable for anonymous views
    propertyId: uuid('property_id')
        .notNull()
        .references(() => properties.id),

    viewType: viewTypeEnum('view_type'),
    sessionId: varchar('session_id', { length: 255 }),
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 45 }),

    viewedAt: timestamp('viewed_at').defaultNow(),
});

export const renterSearches = pgTable('renter_searches', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id').references(() => renters.id), // nullable for anonymous searches

    // Search criteria
    searchFilters: json('search_filters'), // All the search criteria used
    resultsCount: integer('results_count'),
    clickedProperties: json('clicked_properties'), // Array of property IDs clicked

    // Session tracking
    sessionId: varchar('session_id', { length: 255 }),
    searchedAt: timestamp('searched_at').defaultNow(),
});

// ==================== PROPERTY SEARCH PREFERENCES ====================

export const renterSearchPreferences = pgTable('renter_search_preferences', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id')
        .notNull()
        .references(() => renters.id),

    // Search criteria
    minRent: decimal('min_rent', { precision: 8, scale: 2 }),
    maxRent: decimal('max_rent', { precision: 8, scale: 2 }),
    minBedrooms: integer('min_bedrooms'),
    maxBedrooms: integer('max_bedrooms'),
    minBathrooms: decimal('min_bathrooms', { precision: 3, scale: 1 }),
    maxBathrooms: decimal('max_bathrooms', { precision: 3, scale: 1 }),

    // Location preferences
    preferredCities: json('preferred_cities'), // ["San Francisco", "Oakland"]
    preferredNeighborhoods: json('preferred_neighborhoods'),
    preferredZipCodes: json('preferred_zip_codes'), // ["94102", "94103"]
    maxCommuteDistance: integer('max_commute_distance'), // in miles
    commuteAddress: varchar('commute_address', { length: 500 }),

    // Property preferences
    propertyTypes: json('property_types'), // ["apartment", "house", "condo"]
    mustHaveFeatures: json('must_have_features'), // ["parking", "pet_friendly", "washer_dryer"]
    preferredFeatures: json('preferred_features'), // nice to have features

    // Alert settings
    alertsEnabled: boolean('alerts_enabled').default(true),
    alertFrequency: alertFrequencyEnum('alert_frequency').default('daily'),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== MESSAGING TABLES ====================

// Conversations table - represents a chat conversation between users
export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Conversation metadata
    conversationType: conversationTypeEnum('conversation_type').default('direct'),
    title: varchar('title', { length: 255 }), // For group chats, null for direct messages
    description: text('description'), // Optional description for group chats
    avatarS3Key: varchar('avatar_s3_key', { length: 500 }), // Group avatar

    // Conversation settings
    isArchived: boolean('is_archived').default(false),
    isLocked: boolean('is_locked').default(false), // Prevents new messages

    // Related to property (if conversation is about a specific property)
    propertyId: uuid('property_id').references(() => properties.id),
    rentalApplicationId: uuid('rental_application_id').references(() => rentalApplications.id),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Conversation participants - who is in each conversation
export const conversationParticipants = pgTable('conversation_participants', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Participant role and permissions
    role: participantRoleEnum('role').default('member'),
    canAddMembers: boolean('can_add_members').default(false),
    canRemoveMembers: boolean('can_remove_members').default(false),

    // Participant preferences
    notificationsEnabled: boolean('notifications_enabled').default(true),
    isMuted: boolean('is_muted').default(false),
    mutedUntil: timestamp('muted_until'),

    // Read tracking
    unreadCount: integer('unread_count').default(0),
    lastReadAt: timestamp('last_read_at'),

    // Status
    isActive: boolean('is_active').default(true),
    leftAt: timestamp('left_at'),

    joinedAt: timestamp('joined_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages table - individual messages in conversations
export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
        .notNull()
        .references(() => users.id),

    // Message content
    content: text('content').notNull(),
    messageType: messageTypeEnum('message_type').default('text'),

    // File attachments (for image/file messages)
    attachmentS3Key: varchar('attachment_s3_key', { length: 500 }),
    attachmentFileName: varchar('attachment_file_name', { length: 255 }),
    attachmentFileSize: integer('attachment_file_size'), // in bytes
    attachmentMimeType: varchar('attachment_mime_type', { length: 100 }),

    // Message threading
    replyToId: uuid('reply_to_id'), // References another message ID
    threadId: uuid('thread_id'), // For organizing message threads

    // Message status
    isEdited: boolean('is_edited').default(false),
    editedAt: timestamp('edited_at'),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),

    // Message metadata
    metadata: json('metadata'), // For storing additional data like mentions, reactions, etc.

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Group invitations - for inviting users to group conversations
export const groupInvitations = pgTable('group_invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    invitedUsername: varchar('invited_username', { length: 50 }).notNull(), // Username to invite
    invitedBy: uuid('invited_by')
        .notNull()
        .references(() => users.id),

    // Invitation status
    status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected, expired
    expiresAt: timestamp('expires_at'),
    respondedAt: timestamp('responded_at'),

    createdAt: timestamp('created_at').defaultNow(),
});

// ==================== USER PREFERENCES ====================

export const userPreferences = pgTable('user_preferences', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Saved properties updates
    updatesSavedPropertiesEmail: boolean('updates_saved_properties_email').default(true).notNull(),
    updatesSavedPropertiesPush: boolean('updates_saved_properties_push').default(true).notNull(),

    // New matching properties
    newPropertiesEmail: boolean('new_properties_email').default(true).notNull(),
    newPropertiesPush: boolean('new_properties_push').default(true).notNull(),

    // General news
    newsEmail: boolean('news_email').default(true).notNull(),
    newsPush: boolean('news_push').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== NOTIFICATIONS TABLE ====================

export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    senderId: uuid('sender_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id').references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    readAt: timestamp('read_at'),
});

// ==================== RELATIONS ====================

// User relations
export const usersRelations = relations(users, ({ one }) => ({
    customer: one(customers, {
        fields: [users.id],
        references: [customers.userId],
    }),
}));

// Customer relations
export const customersRelations = relations(customers, ({ one }) => ({
    user: one(users, {
        fields: [customers.userId],
        references: [users.id],
    }),
    renter: one(renters, {
        fields: [customers.id],
        references: [renters.customerId],
    }),
    landlord: one(landlords, {
        fields: [customers.id],
        references: [landlords.customerId],
    }),
}));

// Renter relations
export const rentersRelations = relations(renters, ({ one, many }) => ({
    customer: one(customers, {
        fields: [renters.customerId],
        references: [customers.id],
    }),
    applications: many(rentalApplications),
    tours: many(propertyTours),
    savedProperties: many(savedProperties),
    searches: many(renterSearches),
    searchPreferences: many(renterSearchPreferences),
}));

// Landlord relations
export const landlordsRelations = relations(landlords, ({ one, many }) => ({
    customer: one(customers, {
        fields: [landlords.customerId],
        references: [customers.id],
    }),
    properties: many(properties),
    applications: many(rentalApplications),
    tours: many(propertyTours),
}));

// Property relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
    landlord: one(landlords, {
        fields: [properties.landlordId],
        references: [landlords.id],
    }),
    currentListing: one(propertyListings, {
        fields: [properties.id],
        references: [propertyListings.propertyId],
    }),
    listings: many(propertyListings),
    images: many(propertyImages),
    features: many(propertyFeatures),
    applications: many(rentalApplications),
    tours: many(propertyTours),
    views: many(propertyViews),
    savedBy: many(savedProperties),
}));

// Property listing relations
export const propertyListingsRelations = relations(propertyListings, ({ one, many }) => ({
    property: one(properties, {
        fields: [propertyListings.propertyId],
        references: [properties.id],
    }),
    applications: many(rentalApplications),
}));

// Property image relations
export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
    property: one(properties, {
        fields: [propertyImages.propertyId],
        references: [properties.id],
    }),
}));

// Property feature relations
export const propertyFeaturesRelations = relations(propertyFeatures, ({ one }) => ({
    property: one(properties, {
        fields: [propertyFeatures.propertyId],
        references: [properties.id],
    }),
}));

// Rental application relations
export const rentalApplicationsRelations = relations(rentalApplications, ({ one }) => ({
    renter: one(renters, {
        fields: [rentalApplications.renterId],
        references: [renters.id],
    }),
    property: one(properties, {
        fields: [rentalApplications.propertyId],
        references: [properties.id],
    }),
    landlord: one(landlords, {
        fields: [rentalApplications.landlordId],
        references: [landlords.id],
    }),
    listing: one(propertyListings, {
        fields: [rentalApplications.listingId],
        references: [propertyListings.id],
    }),
}));

// Property tour relations
export const propertyToursRelations = relations(propertyTours, ({ one }) => ({
    renter: one(renters, {
        fields: [propertyTours.renterId],
        references: [renters.id],
    }),
    property: one(properties, {
        fields: [propertyTours.propertyId],
        references: [properties.id],
    }),
    landlord: one(landlords, {
        fields: [propertyTours.landlordId],
        references: [landlords.id],
    }),
}));

// Saved properties relations
export const savedPropertiesRelations = relations(savedProperties, ({ one }) => ({
    renter: one(renters, {
        fields: [savedProperties.renterId],
        references: [renters.id],
    }),
    property: one(properties, {
        fields: [savedProperties.propertyId],
        references: [properties.id],
    }),
}));

// Property views relations
export const propertyViewsRelations = relations(propertyViews, ({ one }) => ({
    renter: one(renters, {
        fields: [propertyViews.renterId],
        references: [renters.id],
    }),
    property: one(properties, {
        fields: [propertyViews.propertyId],
        references: [properties.id],
    }),
}));

// Renter search preferences relations
export const renterSearchPreferencesRelations = relations(renterSearchPreferences, ({ one }) => ({
    renter: one(renters, {
        fields: [renterSearchPreferences.renterId],
        references: [renters.id],
    }),
}));

// ==================== MESSAGING RELATIONS ====================

// User relations (updated to include messaging)
export const usersMessagingRelations = relations(users, ({ many }) => ({
    sentMessages: many(messages),
    conversations: many(conversationParticipants),
    groupInvitationsSent: many(groupInvitations),
}));

// Conversation relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    participants: many(conversationParticipants),
    messages: many(messages),
    property: one(properties, {
        fields: [conversations.propertyId],
        references: [properties.id],
    }),
    rentalApplication: one(rentalApplications, {
        fields: [conversations.rentalApplicationId],
        references: [rentalApplications.id],
    }),
    invitations: many(groupInvitations),
}));

// Conversation participants relations
export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
    conversation: one(conversations, {
        fields: [conversationParticipants.conversationId],
        references: [conversations.id],
    }),
    user: one(users, {
        fields: [conversationParticipants.userId],
        references: [users.id],
    }),
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    replyTo: one(messages, {
        fields: [messages.replyToId],
        references: [messages.id],
        relationName: 'replyTo',
    }),
    replies: many(messages, {
        relationName: 'replyTo',
    }),
}));

// Group invitations relations
export const groupInvitationsRelations = relations(groupInvitations, ({ one }) => ({
    conversation: one(conversations, {
        fields: [groupInvitations.conversationId],
        references: [conversations.id],
    }),
    inviter: one(users, {
        fields: [groupInvitations.invitedBy],
        references: [users.id],
    }),
}));
