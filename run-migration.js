// Script to generate SQL for adding tags column
const fs = require('fs');

const migrationSQL = `
-- First, create a function that can execute our migration
CREATE OR REPLACE FUNCTION add_tags_column()
RETURNS void AS $$
BEGIN
    -- Add enum types for conversation categories and message tags (if not exists)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_category') THEN
        CREATE TYPE conversation_category AS ENUM (
            'landlord_inquiry',
            'tenant_inquiry', 
            'rental_application',
            'maintenance',
            'lease_agreement',
            'property_viewing',
            'general'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_tag') THEN
        CREATE TYPE message_tag AS ENUM (
            'urgent',
            'follow_up_needed',
            'documents_required',
            'payment_related',
            'viewing_scheduled',
            'application_status',
            'maintenance_request'
        );
    END IF;

    -- Add columns if they don't exist
    BEGIN
        -- Add category column to conversations table
        ALTER TABLE conversations 
        ADD COLUMN category conversation_category DEFAULT 'general';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'column category already exists in conversations';
    END;

    BEGIN
        -- Add needs_response column
        ALTER TABLE conversations 
        ADD COLUMN needs_response boolean DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'column needs_response already exists in conversations';
    END;

    BEGIN
        -- Add last_responder_id column
        ALTER TABLE conversations 
        ADD COLUMN last_responder_id uuid REFERENCES users(id);
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'column last_responder_id already exists in conversations';
    END;

    BEGIN
        -- Add priority column
        ALTER TABLE conversations 
        ADD COLUMN priority integer DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'column priority already exists in conversations';
    END;

    BEGIN
        -- Add tags column to messages table
        ALTER TABLE messages 
        ADD COLUMN tags jsonb;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'column tags already exists in messages';
    END;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT add_tags_column();

-- Drop the function when done
DROP FUNCTION add_tags_column();
`;

// Write the SQL to a file
fs.writeFileSync('migration.sql', migrationSQL);

console.log('Migration SQL has been written to migration.sql');
console.log('To apply this migration:');
console.log('1. Go to the Supabase dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Paste the contents of migration.sql');
console.log('5. Click "Run" to execute the migration');
console.log('\nAfter running the migration, restart your Next.js server to see the changes.'); 