-- Migration: Add subletting notification support
-- This migration adds the necessary fields and types to support landlord notifications when properties are sublisted

-- 1. Add 'subletting' to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subletting';

-- 2. Add original_property_id reference to sublistings table
ALTER TABLE sublistings 
ADD COLUMN IF NOT EXISTS original_property_id uuid REFERENCES properties(id) ON DELETE CASCADE;

-- 3. Add subletting notification preferences to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS subletting_notifications_email boolean DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS subletting_notifications_push boolean DEFAULT true NOT NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sublistings_original_property_id ON sublistings(original_property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type_receiver ON notifications(type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_sublistings_landlord_id ON sublistings(landlord_id);

-- 5. Add comments for documentation
COMMENT ON COLUMN sublistings.original_property_id IS 'References the original property being sublisted';
COMMENT ON COLUMN user_preferences.subletting_notifications_email IS 'Whether user wants email notifications when their property is sublisted';
COMMENT ON COLUMN user_preferences.subletting_notifications_push IS 'Whether user wants push notifications when their property is sublisted';

-- 6. Enable Row Level Security policies for subletting notifications
-- Drop existing policies if they exist, then create new ones
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view subletting notifications sent to them" ON notifications;
    DROP POLICY IF EXISTS "Authenticated users can create subletting notifications" ON notifications;
    
    -- Create new policies
    CREATE POLICY "Users can view subletting notifications sent to them" 
    ON notifications FOR SELECT 
    USING (receiver_id = auth.uid() AND type = 'subletting');

    CREATE POLICY "Authenticated users can create subletting notifications" 
    ON notifications FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND type = 'subletting');
END $$;
