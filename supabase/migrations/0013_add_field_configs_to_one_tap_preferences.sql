-- Add field_configs column to one_tap_application_preferences table
ALTER TABLE "one_tap_application_preferences" 
ADD COLUMN "field_configs" jsonb; 