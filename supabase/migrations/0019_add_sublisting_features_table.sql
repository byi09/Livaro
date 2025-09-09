-- Add sublisting_features table to store features and amenities for sublistings

CREATE TABLE IF NOT EXISTS "sublisting_features" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "sublisting_id" uuid NOT NULL REFERENCES "sublistings"("id") ON DELETE CASCADE,
  "feature_name" varchar(255) NOT NULL,
  "feature_category" feature_category NOT NULL,
  "feature_value" varchar(255),
  "created_at" timestamp DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "sublisting_features_sublisting_id_idx" ON "sublisting_features" ("sublisting_id");
CREATE INDEX IF NOT EXISTS "sublisting_features_feature_name_idx" ON "sublisting_features" ("feature_name");
CREATE INDEX IF NOT EXISTS "sublisting_features_feature_category_idx" ON "sublisting_features" ("feature_category");

-- Add RLS policies for sublisting_features
ALTER TABLE "sublisting_features" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view features for sublistings they can view
CREATE POLICY "Users can view sublisting features" ON "sublisting_features"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "sublistings" s
      WHERE s."id" = "sublisting_features"."sublisting_id"
      AND (
        s."landlord_id" = auth.uid()
        OR EXISTS (
          SELECT 1 FROM "sublisting_listings" sl
          WHERE sl."sublisting_id" = s."id"
          AND sl."listing_status" = 'active'
        )
      )
    )
  );

-- Policy: Landlords can manage features for their sublistings
CREATE POLICY "Landlords can manage their sublisting features" ON "sublisting_features"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "sublistings" s
      WHERE s."id" = "sublisting_features"."sublisting_id"
      AND s."landlord_id" = auth.uid()
    )
  );
