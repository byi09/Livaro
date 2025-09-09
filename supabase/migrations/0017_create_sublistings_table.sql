-- Migration to create sublistings table
-- This table will store sublease listings separately from regular properties
-- Using the SAME structure as the properties table for consistency

-- First, let's create the property type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'studio', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create property status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('available', 'rented', 'maintenance', 'unlisted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sublistings table with SAME structure as properties table
CREATE TABLE IF NOT EXISTS sublistings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID REFERENCES auth.users(id),
    building_id UUID, -- Can reference apartment_buildings if needed
    
    -- Address (same as properties)
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    
    -- Coordinates for mapping (same as properties)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Property details (same as properties)
    property_type property_type NOT NULL,
    year_built INTEGER,
    square_footage INTEGER,
    lot_size DECIMAL(10,2), -- in sq ft
    bedrooms INTEGER NOT NULL,
    bathrooms DECIMAL(3,1) NOT NULL,
    half_bathrooms INTEGER DEFAULT 0,
    
    -- Parking and storage (same as properties)
    parking_spaces INTEGER DEFAULT 0,
    garage_spaces INTEGER DEFAULT 0,
    has_basement BOOLEAN DEFAULT false,
    has_attic BOOLEAN DEFAULT false,
    
    -- Property status (same as properties)
    property_status property_status DEFAULT 'available',
    description TEXT,
    
    -- Metadata (same as properties)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sublisting_listings table (equivalent to property_listings)
CREATE TABLE IF NOT EXISTS sublisting_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sublisting_id UUID NOT NULL REFERENCES sublistings(id) ON DELETE CASCADE,
    
    -- Rental details (same as property_listings)
    monthly_rent DECIMAL(8,2) NOT NULL,
    security_deposit DECIMAL(8,2),
    pet_deposit DECIMAL(8,2),
    application_fee DECIMAL(8,2),
    
    -- Lease terms (same as property_listings)
    minimum_lease_term INTEGER DEFAULT 12, -- months
    maximum_lease_term INTEGER DEFAULT 12, -- months
    available_date DATE,
    
    -- Listing details (same as property_listings)
    listing_title VARCHAR(255),
    listing_description TEXT,
    listing_status VARCHAR(20) DEFAULT 'draft', -- draft, active, rented, expired
    
    -- Timestamps (same as property_listings)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create sublisting_media table for images/videos
CREATE TABLE IF NOT EXISTS sublisting_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sublisting_id UUID NOT NULL REFERENCES sublistings(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
    file_size INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance (same pattern as properties table)
CREATE INDEX IF NOT EXISTS idx_sublistings_landlord_id ON sublistings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_sublistings_property_status ON sublistings(property_status);
CREATE INDEX IF NOT EXISTS idx_sublistings_city_state ON sublistings(city, state);
CREATE INDEX IF NOT EXISTS idx_sublistings_created_at ON sublistings(created_at);
CREATE INDEX IF NOT EXISTS idx_sublisting_listings_sublisting_id ON sublisting_listings(sublisting_id);
CREATE INDEX IF NOT EXISTS idx_sublisting_listings_status ON sublisting_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_sublisting_media_sublisting_id ON sublisting_media(sublisting_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE sublistings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sublisting_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sublisting_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sublistings (same pattern as properties)
CREATE POLICY "Users can view their own sublistings" ON sublistings
    FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Users can insert their own sublistings" ON sublistings
    FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Users can update their own sublistings" ON sublistings
    FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Users can delete their own sublistings" ON sublistings
    FOR DELETE USING (auth.uid() = landlord_id);

-- RLS Policies for sublisting_listings (same pattern as property_listings)
CREATE POLICY "Users can manage listings for their sublistings" ON sublisting_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sublistings 
            WHERE sublistings.id = sublisting_listings.sublisting_id 
            AND sublistings.landlord_id = auth.uid()
        )
    );

-- RLS Policies for sublisting_media
CREATE POLICY "Users can manage media for their sublistings" ON sublisting_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sublistings 
            WHERE sublistings.id = sublisting_media.sublisting_id 
            AND sublistings.landlord_id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp (same as properties)
CREATE OR REPLACE FUNCTION update_sublistings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sublistings_updated_at
    BEFORE UPDATE ON sublistings
    FOR EACH ROW
    EXECUTE FUNCTION update_sublistings_updated_at();

-- Add trigger for sublisting_listings updated_at
CREATE OR REPLACE FUNCTION update_sublisting_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sublisting_listings_updated_at
    BEFORE UPDATE ON sublisting_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_sublisting_listings_updated_at();

-- Add helpful comments
COMMENT ON TABLE sublistings IS 'Stores sublease properties with same structure as properties table';
COMMENT ON TABLE sublisting_listings IS 'Stores sublease listing details with same structure as property_listings table';
COMMENT ON TABLE sublisting_media IS 'Stores media files for sublease listings';
