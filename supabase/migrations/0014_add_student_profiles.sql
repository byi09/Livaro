-- Create student_profiles table
CREATE TABLE IF NOT EXISTS "student_profiles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "university" varchar(255) NOT NULL,
    "major" varchar(255) NOT NULL,
    "graduation_year" varchar(4) NOT NULL,
    "student_id" varchar(100),
    "gpa" decimal(3,2),
    "budget_min" decimal(8,2),
    "budget_max" decimal(8,2),
    "preferred_areas" json,
    "move_in_date" date,
    "lease_length" varchar(50),
    "pets" boolean DEFAULT false,
    "parking" boolean DEFAULT false,
    "roommates" boolean DEFAULT false,
    "furnished" boolean DEFAULT false,
    "utilities_included" boolean DEFAULT false,
    "smoking" boolean DEFAULT false,
    "quiet_study" boolean DEFAULT false,
    "proximity_to_campus" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS "student_profiles_customer_id_idx" ON "student_profiles"("customer_id");

-- No sample data - let users create their own profiles 