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

ALTER TABLE "one_tap_application_preferences" ADD CONSTRAINT "one_tap_application_preferences_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "one_tap_application_preferences_landlord_id_idx" ON "one_tap_application_preferences" ("landlord_id"); 