'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/src/components/ui/Toast';


interface ExistingImage {
  id: string;
  s3_key: string;
  image_order: number;
  alt_text?: string;
  is_primary: boolean;
  url: string;
}

export default function SortImagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const { success, error: showError } = useToast();

  const [images, setImages] = useState<ExistingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dragItemIndex = useRef<number | null>(null);

  // Fetch existing images
  useEffect(() => {
    const fetchImages = async () => {
      if (!propertyId) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('image_order', { ascending: true });

      if (error) {
        console.error('Error fetching images:', error);
        showError('Failed to load images', error.message);
        return;
      }

      const withUrls = data.map((img) => {
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(img.s3_key);
        return { ...img, url: publicUrl } as ExistingImage;
      });
      setImages(withUrls);
      setLoading(false);
    };

    fetchImages();
  }, [propertyId, showError]);

  // Drag-and-drop handlers
  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDrop = (index: number) => {
    const from = dragItemIndex.current;
    dragItemIndex.current = null;
    if (from === null || from === index) return;

    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    setImages(reordered);
  };

  const saveOrder = async () => {
    if (!propertyId) return;
    setSaving(true);
    const supabase = createClient();

    try {
      const updates = images.map((img, idx) =>
        supabase
          .from('property_images')
          .update({
            image_order: idx,
            is_primary: idx === 0, // Make first image primary
          })
          .eq('id', img.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(({ error }) => error);
      if (hasError) {
        showError('Save failed', 'Could not save new order');
      } else {
        success('Order saved');
        router.back();
      }
    } catch (err) {
      console.error('Save order error:', err);
      showError('Save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (!propertyId) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Reorder Images</h1>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-blue-600">Saving...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative border rounded-lg overflow-hidden bg-white cursor-move"
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                title="Drag to reorder"
              >
                <img
                  src={img.url}
                  alt={img.alt_text || 'Property image'}
                  className="w-full h-32 object-cover"
                />
                {idx === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={saveOrder}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </main>
  );
} 