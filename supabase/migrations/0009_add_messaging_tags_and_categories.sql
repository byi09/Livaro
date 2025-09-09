-- Add enum types for conversation categories and message tags
CREATE TYPE conversation_category AS ENUM (
    'landlord_inquiry',
    'tenant_inquiry', 
    'rental_application',
    'maintenance',
    'lease_agreement',
    'property_viewing',
    'general'
);

CREATE TYPE message_tag AS ENUM (
    'urgent',
    'follow_up_needed',
    'documents_required',
    'payment_related',
    'viewing_scheduled',
    'application_status',
    'maintenance_request'
);

-- Add category column to conversations table
ALTER TABLE conversations 
ADD COLUMN category conversation_category DEFAULT 'general';

-- Add management columns to conversations table
ALTER TABLE conversations 
ADD COLUMN needs_response boolean DEFAULT false;

ALTER TABLE conversations 
ADD COLUMN last_responder_id uuid REFERENCES users(id);

ALTER TABLE conversations 
ADD COLUMN priority integer DEFAULT 0;

-- Add tags column to messages table
ALTER TABLE messages 
ADD COLUMN tags jsonb; 