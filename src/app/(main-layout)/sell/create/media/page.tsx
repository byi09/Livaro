'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/src/components/ui/Toast';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import Spinner from '@/src/components/ui/Spinner';
import { Upload, Image as ImageIcon, Trash2, RotateCcw, CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

/* eslint-disable @next/next/no-img-element */

interface UploadedFile {
  file: File;
  url?: string | null;
  uploading: boolean;
  error?: string;
  progress?: number;
  id: string; // Add unique ID for tracking
}

interface ExistingImage {
  id: string;
  s3_key: string;
  image_order: number;
  alt_text?: string;
  is_primary: boolean;
  image_type?: string;
  room_type?: string;
  url: string;
}

// Photo Modal Component
interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: ExistingImage[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

const PhotoModal = ({ isOpen, onClose, photos, currentIndex, onNavigate }: PhotoModalProps) => {
  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Photo Counter */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-white bg-black bg-opacity-50 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
        {currentIndex + 1} of {photos.length}
      </div>

      {/* Navigation Buttons */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 sm:p-3 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 sm:p-3 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div 
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.alt_text || 'Property image'}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: '90vh', maxWidth: '90vw' }}
        />
        
        {/* Image Info */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm sm:text-base">
                {currentPhoto.room_type ? 
                  currentPhoto.room_type.charAt(0).toUpperCase() + currentPhoto.room_type.slice(1).replace('_', ' ') : 
                  'Property Image'
                }
              </p>
              <p className="text-xs sm:text-sm text-gray-300">
                {currentPhoto.is_primary && (
                  <span className="inline-flex items-center mr-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Primary Photo
                  </span>
                )}
                Order: {currentPhoto.image_order + 1}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preview Modal Component for Upload Photos
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: UploadedFile;
}

const PreviewModal = ({ isOpen, onClose, photo }: PreviewModalProps) => {
  if (!isOpen || !photo.url) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
        aria-label="Close preview"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Main Image */}
      <div 
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt="Upload preview"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: '90vh', maxWidth: '90vw' }}
        />
        
        {/* Image Info */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm sm:text-base">{photo.file.name}</p>
              <p className="text-xs sm:text-sm text-gray-300">
                {photo.uploading ? `Uploading ${photo.progress || 0}%` : 'Upload Preview'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Improved concurrency utility
const processWithConcurrency = async <T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency = 3
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item, batchIndex) => 
      processor(item, i + batchIndex)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

export default function MediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const { success, error: showError } = useToast();
  
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [tourFile, setTourFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Photo modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Preview modal state for upload photos
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<UploadedFile | null>(null);

  // Local drag state for image re-ordering
  const dragItemIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tourInputRef = useRef<HTMLInputElement>(null);

  // Store active upload intervals with proper typing
  const uploadIntervals = useRef<Map<string, number>>(new Map());

  // Initialize Supabase Storage buckets
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const response = await fetch('/api/storage/init', {
          method: 'POST',
        });
        
        if (!response.ok) {
          console.error('Failed to initialize storage buckets');
          return;
        }

        const result = await response.json();
        console.log('Storage initialization result:', result);
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    };

    initializeStorage();
  }, []);

  // Load existing images from database
  useEffect(() => {
    const loadExistingImages = async () => {
      if (!propertyId) return;
      
      try {
        const supabase = createClient();
        
        // Fetch existing images
        const { data: images, error } = await supabase
          .from('property_images')
          .select('*')
          .eq('property_id', propertyId)
          .order('image_order', { ascending: true });

        if (error) {
          console.error('Error loading existing images:', error);
          showError('Failed to load existing images', error.message);
          return;
        }

        // Generate public URLs for existing images
        const imagesWithUrls = images?.map(image => {
          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(image.s3_key);
          
          return {
            ...image,
            url: publicUrl
          };
        }) || [];

        setExistingImages(imagesWithUrls);
      } catch (error) {
        console.error('Unexpected error loading images:', error);
        showError('Failed to load images', 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadExistingImages();
  }, [propertyId, showError]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      uploadIntervals.current.forEach(intervalId => {
        window.clearInterval(intervalId);
      });
      uploadIntervals.current.clear();
    };
  }, []);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleFileUpload(imageFiles);
    }
  };

  const uploadFile = async (file: File, bucketName: string, folder: string): Promise<{ publicUrl: string; s3Key: string } | null> => {
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return { publicUrl, s3Key: fileName };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Update photo progress by ID
  const updatePhotoProgress = (photoId: string, progress: number) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, progress } : photo
    ));
  };

  // Start smooth progress animation for a photo
  const startProgressAnimation = (photoId: string) => {
    const intervalId = window.setInterval(() => {
      setPhotos(prev => {
        const photo = prev.find(p => p.id === photoId);
        if (!photo || !photo.uploading || (photo.progress ?? 0) >= 85) {
          // Stop if photo not found, not uploading, or reached 85%
          const interval = uploadIntervals.current.get(photoId);
          if (interval) {
            window.clearInterval(interval);
            uploadIntervals.current.delete(photoId);
          }
          return prev;
        }
        
        return prev.map(p => 
          p.id === photoId ? { ...p, progress: Math.min((p.progress ?? 0) + 1, 85) } : p
        );
      });
    }, 100); // Slower, smoother animation

    uploadIntervals.current.set(photoId, intervalId);
  };

  // Stop progress animation for a photo
  const stopProgressAnimation = (photoId: string) => {
    const intervalId = uploadIntervals.current.get(photoId);
    if (intervalId) {
      window.clearInterval(intervalId);
      uploadIntervals.current.delete(photoId);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!propertyId || files.length === 0) return;

    setUploading(true);

    // Create upload items with unique IDs
    const uploadItems: UploadedFile[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      url: URL.createObjectURL(file),
      uploading: true,
      progress: 0,
    }));

    setPhotos(uploadItems);

    // Start progress animations for all files
    uploadItems.forEach(item => {
      startProgressAnimation(item.id);
    });

    try {
      // Step 1: Compression (5-15%)
      let processedFiles: File[] = files;
      
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        
        // Set initial compression progress
        uploadItems.forEach(item => updatePhotoProgress(item.id, 5));
        
        processedFiles = await Promise.all(
          files.map(async (file, index) => {
            const compressed = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
            
            updatePhotoProgress(uploadItems[index].id, 15);
            return compressed;
          })
        );
      } catch (compressionErr) {
        console.warn('Image compression skipped:', compressionErr);
        uploadItems.forEach(item => updatePhotoProgress(item.id, 15));
      }

      // Step 2: Upload files with proper concurrency (15-90%)
      const uploadResults = await processWithConcurrency(
        processedFiles,
        async (file, index) => {
          const photoId = uploadItems[index].id;
          
          try {
            // Stop the smooth animation and set to uploading progress
            stopProgressAnimation(photoId);
            updatePhotoProgress(photoId, 20);
            
            const result = await uploadFile(file, 'property-images', 'listings');
            
            // Set to 90% when upload completes
            updatePhotoProgress(photoId, 90);
            
            return result;
          } catch (error) {
            stopProgressAnimation(photoId);
            const message = error instanceof Error ? error.message : 'Upload failed';
            
            setPhotos(prev => prev.map(photo => 
              photo.id === photoId 
                ? { ...photo, error: message, uploading: false, progress: 0 }
                : photo
            ));
            
            throw error;
          }
        },
        3 // Max 3 concurrent uploads
      );

      // Step 3: Database insertion (90-100%)
      const successfulUploads = uploadResults
        .map((result, index) => ({ result, index, photoId: uploadItems[index].id }))
        .filter(({ result }) => result.status === 'fulfilled');

      if (successfulUploads.length > 0) {
        const startOrder = existingImages.length;
        const rowsToInsert = successfulUploads
          .map(({ result, index, photoId }) => {
            if (result.status === 'fulfilled' && result.value) {
              updatePhotoProgress(photoId, 95);
              return {
                property_id: propertyId,
                s3_key: result.value.s3Key,
                image_order: startOrder + index,
                is_primary: startOrder === 0 && index === 0,
                alt_text: `Property photo ${startOrder + index + 1}`,
              };
            }
            return null;
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        // Insert into database
        try {
          const supabase = createClient();
          const { error: insertErr } = await supabase
            .from('property_images')
            .insert(rowsToInsert);

          if (insertErr) {
            throw insertErr;
          }

          // Mark all as complete (100%)
          successfulUploads.forEach(({ photoId }) => {
            stopProgressAnimation(photoId);
            updatePhotoProgress(photoId, 100);
          });

          // Update existing images immediately
          const newImages: ExistingImage[] = rowsToInsert.map((row, idx) => {
            const uploadResult = successfulUploads[idx];
            const publicUrl = uploadResult.result.status === 'fulfilled' ? 
              uploadResult.result.value?.publicUrl || '' : '';
            
            return {
              id: `temp-${Date.now()}-${idx}`,
              s3_key: row.s3_key,
              image_order: row.image_order,
              is_primary: row.is_primary,
              alt_text: row.alt_text,
              url: publicUrl,
              image_type: 'listing',
              room_type: undefined
            };
          });
          
          setExistingImages(prev => [...prev, ...newImages]);
          success(`${successfulUploads.length} image(s) uploaded successfully!`);

        } catch (dbError) {
          console.error('Database insertion error:', dbError);
          showError('Upload failed', dbError instanceof Error ? dbError.message : 'Database error');
        }
      }

      // Handle failed uploads
      const failedUploads = uploadResults.filter(result => result.status === 'rejected');
      if (failedUploads.length > 0) {
        showError('Some uploads failed', `${failedUploads.length} file(s) failed to upload`);
      }

    } catch (error) {
      console.error('Upload process error:', error);
      showError('Upload failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setUploading(false);
      
      // Clear all intervals
      uploadIntervals.current.forEach(intervalId => {
        window.clearInterval(intervalId);
      });
      uploadIntervals.current.clear();

      // Clear photos after a delay
      setTimeout(() => {
        setPhotos([]);
        // Refresh existing images to get proper IDs
        refreshExistingImages();
      }, 1500);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !propertyId) return;
    
    const files = Array.from(e.target.files);
    
    // Clear the input immediately for better UX
    e.target.value = '';
    
    // Start upload process
    await handleFileUpload(files);
  };

  // Helper to refresh existing images list (used by multiple places)
  const refreshExistingImages = async () => {
    if (!propertyId) return;
    const supabase = createClient();
    const { data: refreshedImages } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('image_order', { ascending: true });
    if (refreshedImages) {
      const imagesWithUrls = refreshedImages.map((image) => {
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(image.s3_key);
        return { ...image, url: publicUrl };
      });
      setExistingImages(imagesWithUrls);
    }
  };

  const handleTourUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !propertyId) return;

    const file = e.target.files[0];
    const newTourFile: UploadedFile = {
      id: `tour-${Date.now()}`,
      file,
      uploading: true
    };

    setTourFile(newTourFile);
    setUploading(true);

    try {
      const uploadResult = await uploadFile(file, 'property-3d-tours', 'listings');
      
      if (!uploadResult) {
        throw new Error('Failed to get upload URL');
      }
      
      const { publicUrl } = uploadResult;
      
      setTourFile(prev => prev ? { ...prev, url: publicUrl, uploading: false } : null);
      success('3D tour uploaded successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setTourFile(prev => prev ? { ...prev, uploading: false, error: errorMessage } : null);
      showError('Upload failed', errorMessage);
    }

    setUploading(false);
    // Clear the input
    e.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    stopProgressAnimation(photoId);
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const removeTour = () => {
    setTourFile(null);
  };

  const deleteExistingImage = async (imageId: string, s3Key: string) => {
    try {
      setDeleting(imageId);
      const supabase = createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-images')
        .remove([s3Key]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        throw new Error('Failed to delete image record');
      }

      // Update local state
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      success('Image deleted successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      showError('Delete failed', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  // Redirect if no property ID
  useEffect(() => {
    if (!propertyId) {
      router.push('/sell/create');
    }
  }, [propertyId, router]);

  // ---- Drag-and-drop re-ordering ----
  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleImageReorder = async (index: number) => {
    const from = dragItemIndex.current;
    dragItemIndex.current = null;
    if (from === null || from === index) return;

    const reordered = [...existingImages];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    // Update local order numbers
    const updated = reordered.map((img, idx) => ({ ...img, image_order: idx, is_primary: idx === 0 }));
    setExistingImages(updated);

    // Persist order to DB
    try {
      const supabase = createClient();
      await Promise.all(
        updated.map((img) =>
          supabase
            .from('property_images')
            .update({ image_order: img.image_order, is_primary: img.is_primary })
            .eq('id', img.id)
        )
      );
    } catch (err) {
      console.error('Failed to save new image order', err);
      showError('Save order failed', 'Could not save new image order');
    }
  };

  // Photo modal handlers
  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsModalOpen(false);
  };

  const navigatePhoto = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  // Preview modal handlers
  const openPreviewModal = (photo: UploadedFile) => {
    setPreviewPhoto(photo);
    setIsPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewPhoto(null);
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      if (e.key === 'Escape') {
        closePhotoModal();
      } else if (e.key === 'ArrowLeft') {
        const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : existingImages.length - 1;
        navigatePhoto(newIndex);
      } else if (e.key === 'ArrowRight') {
        const newIndex = currentPhotoIndex < existingImages.length - 1 ? currentPhotoIndex + 1 : 0;
        navigatePhoto(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentPhotoIndex, existingImages.length]);

  if (!propertyId) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Media Upload</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>

        {/* Progress Bar */}
        <InteractiveProgressBar currentStep={2} propertyId={propertyId} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Photos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-2">Add Photos</h2>
            <p className="text-gray-600 mb-6">More photos = more informed renters</p>
            
            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] mb-6 transition-all duration-200 ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="photos"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              
              {dragOver ? (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-blue-600 mb-2">Drop images here</p>
                  <p className="text-sm text-blue-500">Release to upload your photos</p>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label
                    htmlFor="photos"
                    className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                      uploading 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                    }`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Photos'}
                  </label>
                  <p className="text-sm text-gray-500 mt-3">
                    or drag and drop images here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports JPEG, PNG, WebP (max 5MB each)
                  </p>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Spinner size={24} className="text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading your images...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && existingImages.length === 0 && photos.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600">No images uploaded yet</p>
                <p className="text-xs text-gray-500 mt-1">Upload some photos to showcase your property</p>
              </div>
            )}

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Uploaded Images ({existingImages.length})
                  </h3>
                  {/* Link to dedicated sort page */}
                  <button
                    onClick={() => router.push(`/sell/create/media/sort?property_id=${propertyId}`)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reorder
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                    {existingImages.map((image, idx) => (
                      <div
                        key={image.id}
                        className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-200"
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleImageReorder(idx)}
                        title="Drag to reorder"
                      >
                        {/* Image Thumbnail */}
                        <div 
                          className="aspect-video relative overflow-hidden cursor-pointer"
                          onClick={() => openPhotoModal(idx)}
                          title="Click to view full size"
                        >
                          <img
                            src={image.url}
                            alt={image.alt_text || 'Property image'}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5LjUwNjU5IDI2IDEgMTcuNzMzIDEgNy43MzNWNkg0MFY3LjczM0M0MCAxNy43MzMgMzAuNDkzNCAyNiAyMCAyNloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+Cg==';
                            }}
                          />
                          
                          {/* Zoom Icon Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                          
                          {/* Primary Badge */}
                          {image.is_primary && (
                            <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Primary
                            </div>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening modal when clicking delete
                              deleteExistingImage(image.id, image.s3_key);
                            }}
                            disabled={deleting === image.id}
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:bg-gray-400"
                            title="Delete image"
                          >
                            {deleting === image.id ? (
                              <Spinner size={14} colorClass="text-white" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        
                        {/* Image Info */}
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {image.room_type ? 
                              image.room_type.charAt(0).toUpperCase() + image.room_type.slice(1).replace('_', ' ') : 
                              'Property Image'
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Order: {idx + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Currently Uploading Photos */}
            {photos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Currently Uploading ({photos.length})</h3>
                <div className="grid grid-cols-1 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative border border-gray-200 rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1">
                          {photo.file.name}
                        </span>
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                          disabled={photo.uploading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Preview */}
                      {photo.url && (
                        <div className="group relative mb-3">
                          <div 
                            className="relative overflow-hidden rounded-lg cursor-pointer"
                            onClick={() => openPreviewModal(photo)}
                            title="Click to view full size"
                          >
                            <img 
                              src={photo.url} 
                              alt="preview" 
                              className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105" 
                            />
                            
                            {/* Zoom Icon Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </div>
                        </div>
                      )}

                      {photo.uploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-700">
                              Uploading {photo.progress || 0}%
                            </span>
                            <Spinner size={16} className="text-blue-600" />
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300 ease-out"
                              style={{ width: `${photo.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {photo.error && (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <p className="text-xs">{photo.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - 3D Tour */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-2">Add 3D Tour</h2>
            <p className="text-gray-600 mb-6">A tour can save time from in-person visits</p>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all flex flex-col items-center justify-center min-h-[200px] mb-6">
              <input
                ref={tourInputRef}
                type="file"
                id="tour"
                accept=".glb,.gltf"
                onChange={handleTourUpload}
                className="hidden"
                disabled={uploading || !!tourFile}
              />
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <label
                  htmlFor="tour"
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                    uploading || tourFile
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  }`}
                >
                  {uploading ? 'Uploading...' : tourFile ? 'File Selected' : 'Upload 3D Tour'}
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Supports GLB, GLTF files (max 50MB)
                </p>
              </div>
            </div>

            {/* Uploaded Tour */}
            {tourFile && (
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1">
                    {tourFile.file.name}
                  </span>
                  <button
                    onClick={removeTour}
                    className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                    disabled={tourFile.uploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {tourFile.uploading && (
                  <div className="mt-3 flex items-center">
                    <Spinner size={16} className="text-blue-600 mr-2" />
                    <p className="text-sm text-blue-600 font-medium">Uploading 3D tour...</p>
                  </div>
                )}
                
                {tourFile.error && (
                  <div className="mt-3 flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <p className="text-sm">{tourFile.error}</p>
                  </div>
                )}
                
                {tourFile.url && !tourFile.uploading && (
                  <div className="mt-3 flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <p className="text-sm font-medium">Uploaded successfully</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12">
          <button 
            onClick={() => router.push(`/sell/create/rent-details?property_id=${propertyId}`)}
            className="inline-flex items-center px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <button 
            onClick={() => router.push(`/sell/create/amenities?property_id=${propertyId}`)}
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Next'}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Photo Modal */}
      {isModalOpen && (
        <PhotoModal
          isOpen={isModalOpen}
          onClose={closePhotoModal}
          photos={existingImages}
          currentIndex={currentPhotoIndex}
          onNavigate={navigatePhoto}
        />
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={closePreviewModal}
          photo={previewPhoto!}
        />
      )}
    </main>
  );
}
