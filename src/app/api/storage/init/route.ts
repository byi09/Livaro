import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST() {
  try {
    // Use regular client to check user authentication
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for bucket operations (bypasses RLS)
    const adminSupabase = await createAdminClient();

    // Check existing buckets
    const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 });
    }

    const results = {
      propertyImages: { exists: false, created: false, error: null as string | null },
      property3DTours: { exists: false, created: false, error: null as string | null }
    };

    // Create property-images bucket if it doesn't exist
    const propertyImagesBucket = buckets?.find(bucket => bucket.name === 'property-images');
    if (propertyImagesBucket) {
      results.propertyImages.exists = true;
    } else {
      // Create the bucket
      const { data: createdBucket, error: createError } = await adminSupabase.storage.createBucket('property-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating property-images bucket:', createError);
        results.propertyImages.error = createError.message;
      } else {
        results.propertyImages.created = true;
        console.log('Created property-images bucket successfully');
      }
    }

    // Create property-3d-tours bucket if it doesn't exist
    const property3DToursBucket = buckets?.find(bucket => bucket.name === 'property-3d-tours');
    if (property3DToursBucket) {
      results.property3DTours.exists = true;
    } else {
      // Create the bucket
      const { data: createdBucket, error: createError } = await adminSupabase.storage.createBucket('property-3d-tours', {
        public: true,
        allowedMimeTypes: ['model/gltf-binary', 'model/gltf+json'],
        fileSizeLimit: 52428800 // 50MB
      });

      if (createError) {
        console.error('Error creating property-3d-tours bucket:', createError);
        results.property3DTours.error = createError.message;
      } else {
        results.property3DTours.created = true;
        console.log('Created property-3d-tours bucket successfully');
      }
    }

    return NextResponse.json({ 
      success: true, 
      results 
    });

  } catch (error) {
    console.error('Storage initialization error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 