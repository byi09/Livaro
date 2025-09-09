-- Migration: Add sublisting session management tables
-- This migration creates new tables for managing sublisting sessions and associated data
-- Uses Supabase Auth session_id to track user sessions for sublisting workflow

-- Create enum for sublisting session status
CREATE TYPE sublisting_session_status AS ENUM ('draft', 'in_progress', 'completed', 'expired', 'cancelled');

-- Create enum for sublisting media type
CREATE TYPE sublisting_media_type AS ENUM ('image', 'video', 'document', 'pdf');

-- Create enum for sublisting data extraction status
CREATE TYPE extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Table to track sublisting sessions tied to Supabase Auth sessions
CREATE TABLE sublisting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to Supabase Auth session via session_id from JWT claims
    auth_session_id UUID NOT NULL,
    
    -- Link to the user who created this sublisting session
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session metadata
    session_status sublisting_session_status DEFAULT 'draft',
    expires_at TIMESTAMPTZ, -- Optional expiration for draft sessions
    
    -- Sublisting specific data
    sublease_file_name VARCHAR(255), -- Original sublease document filename
    is_sublet_approved BOOLEAN DEFAULT NULL, -- Answer to "Is it okay for the property to be sublisted?"
    
    -- Progress tracking
    property_info_completed BOOLEAN DEFAULT FALSE,
    rent_details_completed BOOLEAN DEFAULT FALSE,
    media_completed BOOLEAN DEFAULT FALSE,
    amenities_completed BOOLEAN DEFAULT FALSE,
    review_completed BOOLEAN DEFAULT FALSE,
    
    -- Final property reference (when completed)
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Indexes for efficient queries
    CONSTRAINT unique_auth_session_sublisting UNIQUE(auth_session_id, user_id)
);

-- Table to store media files associated with sublisting sessions
CREATE TABLE sublisting_session_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to sublisting session
    sublisting_session_id UUID NOT NULL REFERENCES sublisting_sessions(id) ON DELETE CASCADE,
    
    -- File metadata
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    file_type VARCHAR(100) NOT NULL, -- MIME type
    media_type sublisting_media_type NOT NULL,
    
    -- Storage information
    storage_path VARCHAR(1000), -- Path in Supabase Storage
    storage_bucket VARCHAR(100) DEFAULT 'sublisting-media',
    
    -- Processing status
    extraction_status extraction_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    
    -- Extracted data from AI processing
    extracted_data JSONB, -- Store extracted property data as JSON
    
    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store form data for sublisting sessions (acts as draft storage)
CREATE TABLE sublisting_session_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to sublisting session
    sublisting_session_id UUID NOT NULL REFERENCES sublisting_sessions(id) ON DELETE CASCADE,
    
    -- Form step identifier
    step_name VARCHAR(50) NOT NULL, -- 'property_info', 'rent_details', 'amenities', etc.
    
    -- Form data as JSON
    form_data JSONB NOT NULL,
    
    -- Auto-filled flag
    is_auto_filled BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per step per session
    CONSTRAINT unique_session_step UNIQUE(sublisting_session_id, step_name)
);

-- Table to track extracted data aggregation across all media files in a session
CREATE TABLE sublisting_extracted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to sublisting session
    sublisting_session_id UUID NOT NULL REFERENCES sublisting_sessions(id) ON DELETE CASCADE,
    
    -- Aggregated extracted data from all media files
    aggregated_data JSONB NOT NULL,
    
    -- Confidence scores and metadata
    extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00
    source_media_count INTEGER DEFAULT 0,
    
    -- Processing metadata
    last_extraction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One record per session
    CONSTRAINT unique_session_extracted_data UNIQUE(sublisting_session_id)
);

-- Create indexes for performance
CREATE INDEX idx_sublisting_sessions_auth_session ON sublisting_sessions(auth_session_id);
CREATE INDEX idx_sublisting_sessions_user_status ON sublisting_sessions(user_id, session_status);
CREATE INDEX idx_sublisting_sessions_expires ON sublisting_sessions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_sublisting_session_media_session ON sublisting_session_media(sublisting_session_id);
CREATE INDEX idx_sublisting_session_media_extraction ON sublisting_session_media(extraction_status);
CREATE INDEX idx_sublisting_session_data_session ON sublisting_session_data(sublisting_session_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_sublisting_sessions_updated_at 
    BEFORE UPDATE ON sublisting_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sublisting_session_media_updated_at 
    BEFORE UPDATE ON sublisting_session_media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sublisting_session_data_updated_at 
    BEFORE UPDATE ON sublisting_session_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sublisting_extracted_data_updated_at 
    BEFORE UPDATE ON sublisting_extracted_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sublisting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sublisting_session_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE sublisting_session_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sublisting_extracted_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own sublisting sessions
CREATE POLICY "Users can view their own sublisting sessions" ON sublisting_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sublisting sessions" ON sublisting_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sublisting sessions" ON sublisting_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sublisting sessions" ON sublisting_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for media (through sublisting_sessions relationship)
CREATE POLICY "Users can view their sublisting session media" ON sublisting_session_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_media.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their sublisting session media" ON sublisting_session_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_media.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their sublisting session media" ON sublisting_session_media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_media.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their sublisting session media" ON sublisting_session_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_media.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

-- RLS Policies for session data (through sublisting_sessions relationship)
CREATE POLICY "Users can view their sublisting session data" ON sublisting_session_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their sublisting session data" ON sublisting_session_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their sublisting session data" ON sublisting_session_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their sublisting session data" ON sublisting_session_data
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_session_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

-- RLS Policies for extracted data (through sublisting_sessions relationship)
CREATE POLICY "Users can view their sublisting extracted data" ON sublisting_extracted_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_extracted_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their sublisting extracted data" ON sublisting_extracted_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_extracted_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their sublisting extracted data" ON sublisting_extracted_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_extracted_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their sublisting extracted data" ON sublisting_extracted_data
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sublisting_sessions ss 
            WHERE ss.id = sublisting_extracted_data.sublisting_session_id 
            AND ss.user_id = auth.uid()
        )
    );

-- Function to clean up expired draft sessions (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sublisting_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sublisting_sessions 
    WHERE session_status = 'draft' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create sublisting session based on auth session
CREATE OR REPLACE FUNCTION get_or_create_sublisting_session(
    p_auth_session_id UUID,
    p_user_id UUID,
    p_expires_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Try to find existing session
    SELECT id INTO session_id
    FROM sublisting_sessions
    WHERE auth_session_id = p_auth_session_id 
    AND user_id = p_user_id
    AND session_status IN ('draft', 'in_progress');
    
    -- If not found, create new session
    IF session_id IS NULL THEN
        INSERT INTO sublisting_sessions (
            auth_session_id,
            user_id,
            expires_at
        ) VALUES (
            p_auth_session_id,
            p_user_id,
            NOW() + INTERVAL '1 hour' * p_expires_hours
        )
        RETURNING id INTO session_id;
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables for documentation
COMMENT ON TABLE sublisting_sessions IS 'Tracks sublisting creation sessions tied to Supabase Auth sessions';
COMMENT ON TABLE sublisting_session_media IS 'Stores media files uploaded during sublisting sessions';
COMMENT ON TABLE sublisting_session_data IS 'Stores form data for each step of sublisting creation';
COMMENT ON TABLE sublisting_extracted_data IS 'Stores aggregated extracted data from AI processing of media files';
