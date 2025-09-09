-- Fix storage bucket creation and policies
-- This migration creates the missing storage buckets and sets up proper RLS policies

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('property-3d-tours', 'property-3d-tours', true, 52428800, ARRAY['model/gltf-binary', 'model/gltf+json'])
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage.objects
-- These policies allow authenticated users to manage files in the buckets

-- Property Images Bucket Policies
CREATE POLICY "Property images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Users can update their own property images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'property-images' AND (select auth.uid()) = owner);

CREATE POLICY "Users can delete their own property images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'property-images' AND (select auth.uid()) = owner);

-- Property 3D Tours Bucket Policies
CREATE POLICY "Property 3D tours are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-3d-tours');

CREATE POLICY "Authenticated users can upload property 3D tours" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'property-3d-tours');

CREATE POLICY "Users can update their own property 3D tours" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'property-3d-tours' AND (select auth.uid()) = owner);

CREATE POLICY "Users can delete their own property 3D tours" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'property-3d-tours' AND (select auth.uid()) = owner);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated role for storage operations
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT ON storage.buckets TO authenticated;

-- Create a function to safely create buckets (for future use)
CREATE OR REPLACE FUNCTION create_storage_bucket_if_not_exists(
  bucket_name TEXT,
  is_public BOOLEAN DEFAULT true,
  file_size_limit BIGINT DEFAULT 10485760,
  allowed_mime_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if bucket already exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = bucket_name
  ) INTO bucket_exists;
  
  -- Create bucket if it doesn't exist
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (bucket_name, bucket_name, is_public, file_size_limit, allowed_mime_types);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Comment explaining the fix
COMMENT ON FUNCTION create_storage_bucket_if_not_exists IS 
'Safely creates storage buckets without throwing errors if they already exist. This function bypasses RLS policies by using SECURITY DEFINER.';
