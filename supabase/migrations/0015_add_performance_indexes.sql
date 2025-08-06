-- Performance optimization indexes for property queries
-- This migration adds indexes to improve property search and filtering performance

-- Properties table indexes
CREATE INDEX IF NOT EXISTS "properties_latitude_longitude_idx" ON "properties" ("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "properties_property_type_idx" ON "properties" ("property_type");
CREATE INDEX IF NOT EXISTS "properties_bedrooms_idx" ON "properties" ("bedrooms");
CREATE INDEX IF NOT EXISTS "properties_bathrooms_idx" ON "properties" ("bathrooms");
CREATE INDEX IF NOT EXISTS "properties_parking_spaces_idx" ON "properties" ("parking_spaces");
CREATE INDEX IF NOT EXISTS "properties_property_status_idx" ON "properties" ("property_status");

-- Property listings table indexes
CREATE INDEX IF NOT EXISTS "property_listings_monthly_rent_idx" ON "property_listings" ("monthly_rent");
CREATE INDEX IF NOT EXISTS "property_listings_listing_status_idx" ON "property_listings" ("listing_status");
CREATE INDEX IF NOT EXISTS "property_listings_available_date_idx" ON "property_listings" ("available_date");
CREATE INDEX IF NOT EXISTS "property_listings_created_at_idx" ON "property_listings" ("created_at");

-- Property features table indexes for efficient joins
CREATE INDEX IF NOT EXISTS "property_features_property_id_idx" ON "property_features" ("property_id");
CREATE INDEX IF NOT EXISTS "property_features_feature_name_idx" ON "property_features" ("feature_name");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "properties_location_type_idx" ON "properties" ("latitude", "longitude", "property_type");
CREATE INDEX IF NOT EXISTS "properties_beds_baths_idx" ON "properties" ("bedrooms", "bathrooms");
CREATE INDEX IF NOT EXISTS "property_listings_rent_status_idx" ON "property_listings" ("monthly_rent", "listing_status");

-- Text search indexes for address fields
CREATE INDEX IF NOT EXISTS "properties_city_gin_idx" ON "properties" USING gin (to_tsvector('english', "city"));
CREATE INDEX IF NOT EXISTS "properties_address_gin_idx" ON "properties" USING gin (to_tsvector('english', "address_line_1"));