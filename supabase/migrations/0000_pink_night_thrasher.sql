CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."alert_frequency" AS ENUM('immediate', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."building_type" AS ENUM('high_rise', 'mid_rise', 'low_rise', 'garden_style');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('email', 'phone', 'text');--> statement-breakpoint
CREATE TYPE "public"."conversation_category" AS ENUM('landlord_inquiry', 'tenant_inquiry', 'rental_application', 'maintenance', 'lease_agreement', 'property_viewing', 'general');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('direct', 'group', 'support');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('employed', 'self_employed', 'unemployed', 'student', 'retired');--> statement-breakpoint
CREATE TYPE "public"."feature_category" AS ENUM('interior', 'exterior', 'building_amenities', 'appliances', 'utilities');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."image_type" AS ENUM('exterior', 'interior', 'aerial', 'floorplan');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'pending', 'rented', 'expired');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read');--> statement-breakpoint
CREATE TYPE "public"."message_tag" AS ENUM('urgent', 'follow_up_needed', 'documents_required', 'payment_related', 'viewing_scheduled', 'application_status', 'maintenance_request');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'file', 'system');--> statement-breakpoint
CREATE TYPE "public"."move_in_timeline" AS ENUM('immediately', '1_month', '2_months', '3_months', '6_months', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('notification', 'phone', 'email');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('member', 'admin', 'owner');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'rented', 'maintenance', 'off_market');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'house', 'condo', 'townhouse', 'studio', 'room', 'duplex');--> statement-breakpoint
CREATE TYPE "public"."tour_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."tour_type" AS ENUM('in_person', 'virtual', 'self_guided');--> statement-breakpoint
CREATE TYPE "public"."view_type" AS ENUM('listing_view', 'photo_view', 'virtual_tour', 'contact_info');--> statement-breakpoint
CREATE TABLE "building_amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"amenity_name" varchar(255) NOT NULL,
	"amenity_category" varchar(100),
	"amenity_description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "building_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"image_order" integer DEFAULT 0,
	"alt_text" varchar(255),
	"is_primary" boolean DEFAULT false,
	"image_type" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apartment_buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"building_name" varchar(255) NOT NULL,
	"building_number" varchar(50),
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"country" varchar(100) DEFAULT 'United States',
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"year_built" integer,
	"total_units" integer,
	"total_floors" integer,
	"building_type" varchar(100),
	"description" text,
	"parking_spaces" integer DEFAULT 0,
	"management_company" varchar(255),
	"on_site_manager" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" DEFAULT 'member',
	"can_add_members" boolean DEFAULT false,
	"can_remove_members" boolean DEFAULT false,
	"notifications_enabled" boolean DEFAULT true,
	"is_muted" boolean DEFAULT false,
	"muted_until" timestamp,
	"unread_count" integer DEFAULT 0,
	"last_read_at" timestamp,
	"is_active" boolean DEFAULT true,
	"left_at" timestamp,
	"joined_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_type" "conversation_type" DEFAULT 'direct',
	"category" "conversation_category" DEFAULT 'general',
	"title" varchar(255),
	"description" text,
	"avatar_s3_key" varchar(500),
	"is_archived" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"needs_response" boolean DEFAULT false,
	"last_responder_id" uuid,
	"priority" integer DEFAULT 0,
	"property_id" uuid,
	"rental_application_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"phone_number" varchar(255),
	"date_of_birth" date,
	"gender" "gender",
	"profile_image_s3_key" varchar(500),
	"current_city" varchar(100),
	"current_state" varchar(50),
	"current_zip_code" varchar(10),
	"interest_city" varchar(100),
	"interest_state" varchar(50),
	"interest_zip_code" varchar(10),
	"preferred_contact_method" "contact_method" DEFAULT 'email',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"invited_username" varchar(50) NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"expires_at" timestamp,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "landlords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"business_name" varchar(255),
	"business_license" varchar(100),
	"tax_id" varchar(50),
	"accepts_pets" boolean DEFAULT false,
	"allows_smoking" boolean DEFAULT false,
	"minimum_credit_score" integer,
	"minimum_income_multiplier" numeric(3, 1),
	"business_phone" varchar(255),
	"business_email" varchar(255),
	"identity_verified" boolean DEFAULT false,
	"background_check_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "liked_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text',
	"tags" json,
	"attachment_s3_key" varchar(500),
	"attachment_file_name" varchar(255),
	"attachment_file_size" integer,
	"attachment_mime_type" varchar(100),
	"reply_to_id" uuid,
	"thread_id" uuid,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip_codes" json,
	"boundary_polygon" text,
	"average_rent" numeric(8, 2),
	"median_rent" numeric(8, 2),
	"walk_score" integer,
	"transit_score" integer,
	"bike_score" integer,
	"crime_rating" numeric(3, 1),
	"school_rating" numeric(3, 1),
	"nightlife_rating" numeric(3, 1),
	"dining_rating" numeric(3, 1),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "one_tap_application_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"number_of_occupants" integer NOT NULL,
	"desired_lease_start_month" integer NOT NULL,
	"desired_lease_start_year" integer NOT NULL,
	"preferred_lease_length" varchar(20) NOT NULL,
	"move_in_flexibility" boolean NOT NULL,
	"pets_allowed" boolean NOT NULL,
	"parking_needed" boolean NOT NULL,
	"tenant_name" varchar(255) NOT NULL,
	"tenant_email" varchar(255) NOT NULL,
	"tenant_phone" varchar(255),
	"message_to_landlord" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid,
	"building_id" uuid,
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"country" varchar(100) DEFAULT 'United States',
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"property_type" "property_type" NOT NULL,
	"year_built" integer,
	"square_footage" integer,
	"lot_size" numeric(10, 2),
	"bedrooms" integer NOT NULL,
	"bathrooms" numeric(3, 1) NOT NULL,
	"half_bathrooms" integer DEFAULT 0,
	"parking_spaces" integer DEFAULT 0,
	"garage_spaces" integer DEFAULT 0,
	"has_basement" boolean DEFAULT false,
	"has_attic" boolean DEFAULT false,
	"property_status" "property_status" DEFAULT 'available',
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"feature_name" varchar(255) NOT NULL,
	"feature_category" "feature_category" NOT NULL,
	"feature_value" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"image_order" integer DEFAULT 0,
	"alt_text" varchar(255),
	"is_primary" boolean DEFAULT false,
	"image_type" "image_type",
	"room_type" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"monthly_rent" numeric(8, 2) NOT NULL,
	"security_deposit" numeric(8, 2),
	"pet_deposit" numeric(8, 2),
	"application_fee" numeric(6, 2),
	"minimum_lease_term" integer,
	"maximum_lease_term" integer,
	"available_date" date,
	"utilities_included" json,
	"parking_cost" numeric(6, 2),
	"listing_status" "listing_status" DEFAULT 'active',
	"list_date" date DEFAULT now(),
	"expiration_date" date,
	"view_count" integer DEFAULT 0,
	"listing_title" varchar(255),
	"listing_description" text,
	"virtual_tour_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renter_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"landlord_id" uuid NOT NULL,
	"tour_type" "tour_type" NOT NULL,
	"scheduled_at" timestamp,
	"status" "tour_status" DEFAULT 'scheduled',
	"duration" integer,
	"contact_phone" varchar(255),
	"special_instructions" text,
	"renter_rating" integer,
	"landlord_rating" integer,
	"renter_notes" text,
	"landlord_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renter_id" uuid,
	"property_id" uuid NOT NULL,
	"view_type" "view_type",
	"session_id" varchar(255),
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rental_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renter_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"landlord_id" uuid NOT NULL,
	"listing_id" uuid,
	"proposed_move_in_date" date,
	"proposed_rent" numeric(8, 2),
	"lease_duration" integer,
	"application_status" "application_status" DEFAULT 'pending',
	"applied_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"cover_letter" text,
	"references_provided" boolean DEFAULT false,
	"credit_check_consent" boolean DEFAULT false,
	"background_check_consent" boolean DEFAULT false,
	"landlord_notes" text,
	"rejection_reason" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "renter_search_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renter_id" uuid NOT NULL,
	"min_rent" numeric(8, 2),
	"max_rent" numeric(8, 2),
	"min_bedrooms" integer,
	"max_bedrooms" integer,
	"min_bathrooms" numeric(3, 1),
	"max_bathrooms" numeric(3, 1),
	"preferred_cities" json,
	"preferred_neighborhoods" json,
	"preferred_zip_codes" json,
	"max_commute_distance" integer,
	"commute_address" varchar(500),
	"property_types" json,
	"must_have_features" json,
	"preferred_features" json,
	"alerts_enabled" boolean DEFAULT true,
	"alert_frequency" "alert_frequency" DEFAULT 'daily',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "renter_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renter_id" uuid,
	"search_filters" json,
	"results_count" integer,
	"clicked_properties" json,
	"session_id" varchar(255),
	"searched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "renters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"monthly_budget" numeric(8, 2),
	"move_in_timeline" "move_in_timeline",
	"current_lease_expires_at" date,
	"current_rent" numeric(8, 2),
	"reason_for_moving" varchar(255),
	"pets_count" integer DEFAULT 0,
	"pet_types" varchar(255),
	"smoking_allowed" boolean DEFAULT false,
	"employment_status" "employment_status",
	"monthly_income" numeric(10, 2),
	"employer" varchar(255),
	"has_rental_history" boolean DEFAULT false,
	"previous_landlord_contact" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"renter_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"notes" text,
	"tags" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"updates_saved_properties_email" boolean DEFAULT true NOT NULL,
	"updates_saved_properties_push" boolean DEFAULT true NOT NULL,
	"new_properties_email" boolean DEFAULT true NOT NULL,
	"new_properties_push" boolean DEFAULT true NOT NULL,
	"news_email" boolean DEFAULT true NOT NULL,
	"news_push" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"account_status" "account_status" DEFAULT 'active',
	"stripe_customer_id" varchar(255),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"factor_id" uuid,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "building_amenities" ADD CONSTRAINT "building_amenities_building_id_apartment_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."apartment_buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_images" ADD CONSTRAINT "building_images_building_id_apartment_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."apartment_buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apartment_buildings" ADD CONSTRAINT "apartment_buildings_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_last_responder_id_users_id_fk" FOREIGN KEY ("last_responder_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_rental_application_id_rental_applications_id_fk" FOREIGN KEY ("rental_application_id") REFERENCES "public"."rental_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlords" ADD CONSTRAINT "landlords_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_properties" ADD CONSTRAINT "liked_properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_properties" ADD CONSTRAINT "liked_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_tap_application_preferences" ADD CONSTRAINT "one_tap_application_preferences_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_building_id_apartment_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."apartment_buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tours" ADD CONSTRAINT "property_tours_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tours" ADD CONSTRAINT "property_tours_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tours" ADD CONSTRAINT "property_tours_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_listing_id_property_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."property_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renter_search_preferences" ADD CONSTRAINT "renter_search_preferences_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renter_searches" ADD CONSTRAINT "renter_searches_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renters" ADD CONSTRAINT "renters_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;