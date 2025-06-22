'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/src/components/ui/Toast';
import InteractiveProgressBar from '@/src/components/ui/InteractiveProgressBar';
import Spinner from '@/src/components/ui/Spinner';
import { Upload, Image as ImageIcon, Trash2, RotateCcw, CheckCircle, AlertCircle, Eye, Edit3 } from 'lucide-react';
import ImageLightbox from '@/src/components/ui/ImageLightbox';
import ImageEditor from '@/src/components/ImageEditor';

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
      handleFilesForEditing(imageFiles);
    }
  };

  const uploadFile = async (file: File, bucketName: string, folder: string): Promise<{ publicUrl: string; s3Key: string } | null> => {
    try {
      console.log('Starting upload:', { fileName: file.name, bucketName, folder, fileSize: file.size });
      
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading to path:', fileName);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', {
          message: error.message,
          error: error
        });
        
        // Try a simpler path structure if nested folders fail
        const simpleFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        console.log('Retrying with simple path:', simpleFileName);
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucketName)
          .upload(simpleFileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error('Retry also failed:', retryError);
          throw new Error(`Storage upload failed: ${error.message}. Retry failed: ${retryError.message}`);
        }
        
        console.log('Retry successful:', retryData);
        
        // Get public URL for simple path
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(simpleFileName);
          
        return { publicUrl, s3Key: simpleFileName };
      }

      console.log('Upload successful, data:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      return { publicUrl, s3Key: fileName };
    } catch (error) {
      console.error('Upload error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error,
        fileName: file.name,
        bucketName: bucketName
      });
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
      // Step 1: Improved Compression with progress (5-20%)
      let processedFiles: File[] = files;
      
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        
        // Set initial compression progress
        uploadItems.forEach(item => updatePhotoProgress(item.id, 5));
        
        processedFiles = await Promise.all(
          files.map(async (file, index) => {
            const compressed = await imageCompression(file, {
              maxSizeMB: 0.8, // Reduced for better performance
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              onProgress: (progress) => {
                // Convert compression progress to upload progress (5-20%)
                const uploadProgress = 5 + (progress * 0.15);
                updatePhotoProgress(uploadItems[index].id, Math.round(uploadProgress));
              }
            });
            
            updatePhotoProgress(uploadItems[index].id, 20);
            return compressed;
          })
        );
      } catch (compressionErr) {
        console.warn('Image compression skipped:', compressionErr);
        uploadItems.forEach(item => updatePhotoProgress(item.id, 20));
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
              const originalFile = processedFiles[index];
              const customTitle = (originalFile as any).customTitle;
              
              return {
                property_id: propertyId,
                s3_key: result.value.s3Key,
                image_order: startOrder + index,
                is_primary: startOrder === 0 && index === 0,
                alt_text: customTitle || `Property photo ${startOrder + index + 1}`,
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

  // Handle files for editing flow
  const handleFilesForEditing = (files: File[]) => {
    if (files.length === 0) return;
    
    setPendingFiles(files);
    setEditingFile(files[0]); // Start with first file
    setEditorOpen(true);
  };

  // Handle edited file save
  const handleEditedFileSave = (editedFile: File, title: string) => {
    // Update the file with title in alt_text or similar field
    const fileWithTitle = new File([editedFile], editedFile.name, {
      type: editedFile.type,
      lastModified: editedFile.lastModified,
    });
    
    // Store title as a custom property (we'll handle this in upload)
    (fileWithTitle as any).customTitle = title;
    
    // Remove current file from pending and process next or upload
    const remainingFiles = pendingFiles.slice(1);
    setPendingFiles(remainingFiles);
    
    // Upload the edited file
    handleFileUpload([fileWithTitle]);
    
    if (remainingFiles.length > 0) {
      // Edit next file
      setEditingFile(remainingFiles[0]);
    } else {
      // Close editor, all files processed
      setEditorOpen(false);
      setEditingFile(null);
    }
  };

  // Handle editor cancel
  const handleEditedFileCancel = () => {
    // Process next file or close
    const remainingFiles = pendingFiles.slice(1);
    setPendingFiles(remainingFiles);
    
    if (remainingFiles.length > 0) {
      setEditingFile(remainingFiles[0]);
    } else {
      setEditorOpen(false);
      setEditingFile(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !propertyId) return;
    
    const files = Array.from(e.target.files);
    
    // Clear the input immediately for better UX
    e.target.value = '';
    
    // Start editing flow instead of direct upload
    handleFilesForEditing(files);
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

  const lightboxImages = existingImages.map((img) => ({ src: img.url, alt: img.alt_text }));

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
                  <div className="space-y-3">
                    <label
                      htmlFor="photos"
                      className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                        uploading 
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                      }`}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload & Edit Photos'}
                    </label>
                    
                    <input
                      type="file"
                      id="photos-direct"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        if (!e.target.files || !propertyId) return;
                        const files = Array.from(e.target.files);
                        e.target.value = '';
                        await handleFileUpload(files);
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                    
                    <label
                      htmlFor="photos-direct"
                      className={`inline-flex items-center px-4 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer border ${
                        uploading 
                          ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Skip Edit & Upload Directly
                    </label>
                  </div>
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
                <button
                  onClick={async () => {
                    console.log('Manually initializing storage...');
                    try {
                      const response = await fetch('/api/storage/init', {
                        method: 'POST',
                      });
                      const result = await response.json();
                      console.log('Storage init result:', result);
                      if (result.success) {
                        success('Storage initialized successfully!');
                      } else {
                        showError('Storage initialization failed', JSON.stringify(result));
                      }
                    } catch (error) {
                      console.error('Storage init error:', error);
                      showError('Storage initialization error', error instanceof Error ? error.message : 'Unknown error');
                    }
                  }}
                  className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Initialize Storage
                </button>
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
                        className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleImageReorder(idx)}
                        title="Drag to reorder"
                      >
                        {/* Image Thumbnail */}
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={image.url}
                            alt={image.alt_text || 'Property image'}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5LjUwNjU5IDI2IDEgMTcuNzMzIDEgNy43MzNWNkg0MFY3LjczM0M0MCAxNy43MzMgMzAuNDkzNCAyNiAyMCAyNloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+Cg==';
                            }}
                          />
                          
                          {/* Primary Badge */}
                          {image.is_primary && (
                            <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Primary
                            </div>
                          )}
                          
                          {/* Edit Button */}
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              // Convert image URL to File for editing
                              fetch(image.url)
                                .then(res => res.blob())
                                .then(blob => {
                                  const file = new File([blob], `${image.alt_text || 'image'}.jpg`, { type: blob.type });
                                  setEditingFile(file);
                                  setEditorOpen(true);
                                });
                            }}
                            className="absolute top-3 left-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Edit image"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteExistingImage(image.id, image.s3_key); }}
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

                          {/* View Hint Icon */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition bg-opacity-0 group-hover:bg-opacity-20">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
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

            {/* Pending Files for Editing */}
            {pendingFiles.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Files Waiting for Edit ({pendingFiles.length} remaining)
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    📝 Currently editing: <strong>{editingFile?.name}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {pendingFiles.length - 1} more files in queue
                  </p>
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
                          onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                          className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                          disabled={photo.uploading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Preview */}
                      {photo.url && (
                        <img src={photo.url} alt="preview" className="w-full h-32 object-cover mb-3 rounded-lg" />
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
                    onClick={(e) => { e.stopPropagation(); removeTour(); }}
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
      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Image Editor Modal */}
      {editingFile && (
        <ImageEditor
          imageFile={editingFile}
          onSave={handleEditedFileSave}
          onCancel={handleEditedFileCancel}
          isOpen={editorOpen}
        />
      )}
    </main>
  );
}
