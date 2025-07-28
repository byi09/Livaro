-- Update one_tap_application_preferences table to be from landlord's perspective
-- Drop the existing table and recreate it with new fields

DROP TABLE IF EXISTS "one_tap_application_preferences";

CREATE TABLE "one_tap_application_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"include_number_of_occupants" boolean NOT NULL DEFAULT true,
	"include_lease_start_date" boolean NOT NULL DEFAULT true,
	"include_lease_length" boolean NOT NULL DEFAULT true,
	"include_student_flexibility" boolean NOT NULL DEFAULT true,
	"include_pets_preference" boolean NOT NULL DEFAULT true,
	"include_parking_preference" boolean NOT NULL DEFAULT true,
	"include_tenant_name" boolean NOT NULL DEFAULT true,
	"include_tenant_email" boolean NOT NULL DEFAULT true,
	"include_tenant_phone" boolean NOT NULL DEFAULT false,
	"include_message_to_landlord" boolean NOT NULL DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

ALTER TABLE "one_tap_application_preferences" ADD CONSTRAINT "one_tap_application_preferences_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "one_tap_application_preferences_landlord_id_idx" ON "one_tap_application_preferences" ("landlord_id"); 