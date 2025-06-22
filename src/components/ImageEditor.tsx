'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { RotateCw, Check, X, Crop as CropIcon, Type, Move, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import Spinner from './ui/Spinner';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedFile: File, title: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageEditor({ imageFile, onSave, onCancel, isOpen }: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'rotate' | 'title'>('crop');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when component opens
  useEffect(() => {
    if (isOpen && imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);

      // Set default title based on filename
      const nameWithoutExt = imageFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  }, [isOpen, imageFile]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setImageSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      setRotation(0);
      setScale(1);
      setTitle('');
      setActiveTab('crop');
    }
  }, [isOpen]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Set a default crop that's visible and properly sized
    const crop = centerAspectCrop(width, height, 16 / 9);
    setCrop(crop);
    // Convert to pixel crop for completion
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (crop.x / 100) * width,
      y: (crop.y / 100) * height,
      width: (crop.width / 100) * width,
      height: (crop.height / 100) * height,
    };
    setCompletedCrop(pixelCrop);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    
    if (!image || !canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Calculate dimensions
    let { width: imageWidth, height: imageHeight } = image;
    
    // Apply rotation to dimensions
    if (rotation === 90 || rotation === 270) {
      [imageWidth, imageHeight] = [imageHeight, imageWidth];
    }

    // Set canvas size
    if (completedCrop && completedCrop.width && completedCrop.height) {
      // Crop mode
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      
      // Save context
      ctx.save();
      
      // Apply rotation around center of crop
      ctx.translate(completedCrop.width / 2, completedCrop.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw image
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        -completedCrop.width / 2,
        -completedCrop.height / 2,
        completedCrop.width,
        completedCrop.height
      );
      
      ctx.restore();
    } else {
      // No crop, just rotation and scale
      canvas.width = imageWidth * scale;
      canvas.height = imageHeight * scale;
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      
      ctx.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
        image.naturalWidth,
        image.naturalHeight
      );
      
      ctx.restore();
    }

    return canvas;
  };

  const handleSave = async () => {
    if (!imgRef.current || !title.trim()) return;
    
    setProcessing(true);
    
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Failed to generate canvas');

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          setProcessing(false);
          return;
        }

        // Create new file with edited image
        const editedFile = new File([blob], `${title}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        onSave(editedFile, title);
        setProcessing(false);
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error saving edited image:', error);
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Edit Image</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('crop')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 transition-colors ${
              activeTab === 'crop'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CropIcon className="w-4 h-4" />
            <span>Crop</span>
          </button>
          <button
            onClick={() => setActiveTab('rotate')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 transition-colors ${
              activeTab === 'rotate'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Rotate</span>
          </button>
          <button
            onClick={() => setActiveTab('title')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 transition-colors ${
              activeTab === 'title'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Title</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Image Preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
            <div className="max-w-full max-h-full relative">
              {activeTab === 'crop' && imageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                  className="max-w-full max-h-full"
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-w-full max-h-full"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                    }}
                  />
                </ReactCrop>
              )}

              {activeTab !== 'crop' && imageSrc && (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Edit preview"
                  className="max-w-full max-h-full"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 border-l border-gray-200 p-6 space-y-6">
            {activeTab === 'crop' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Crop Settings</h3>
                <p className="text-sm text-gray-600">
                  Drag to select the area you want to keep. You can resize and move the selection.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (imgRef.current) {
                        const { width, height } = imgRef.current;
                        // Free crop - no aspect ratio constraint
                        const newCrop = {
                          unit: '%' as const,
                          x: 10,
                          y: 10,
                          width: 80,
                          height: 80,
                        };
                        setCrop(newCrop);
                        const pixelCrop: PixelCrop = {
                          unit: 'px',
                          x: (newCrop.x / 100) * width,
                          y: (newCrop.y / 100) * height,
                          width: (newCrop.width / 100) * width,
                          height: (newCrop.height / 100) * height,
                        };
                        setCompletedCrop(pixelCrop);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                  >
                    Free Crop
                  </button>
                  <button
                    onClick={() => {
                      if (imgRef.current) {
                        const { width, height } = imgRef.current;
                        const newCrop = centerAspectCrop(width, height, 16/9);
                        setCrop(newCrop);
                        const pixelCrop: PixelCrop = {
                          unit: 'px',
                          x: (newCrop.x / 100) * width,
                          y: (newCrop.y / 100) * height,
                          width: (newCrop.width / 100) * width,
                          height: (newCrop.height / 100) * height,
                        };
                        setCompletedCrop(pixelCrop);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    16:9 Aspect Ratio
                  </button>
                  <button
                    onClick={() => {
                      if (imgRef.current) {
                        const { width, height } = imgRef.current;
                        const newCrop = centerAspectCrop(width, height, 1);
                        setCrop(newCrop);
                        const pixelCrop: PixelCrop = {
                          unit: 'px',
                          x: (newCrop.x / 100) * width,
                          y: (newCrop.y / 100) * height,
                          width: (newCrop.width / 100) * width,
                          height: (newCrop.height / 100) * height,
                        };
                        setCompletedCrop(pixelCrop);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Square (1:1)
                  </button>
                  <button
                    onClick={() => {
                      if (imgRef.current) {
                        const { width, height } = imgRef.current;
                        const newCrop = centerAspectCrop(width, height, 4/3);
                        setCrop(newCrop);
                        const pixelCrop: PixelCrop = {
                          unit: 'px',
                          x: (newCrop.x / 100) * width,
                          y: (newCrop.y / 100) * height,
                          width: (newCrop.width / 100) * width,
                          height: (newCrop.height / 100) * height,
                        };
                        setCompletedCrop(pixelCrop);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    4:3 Aspect Ratio
                  </button>
                  <button
                    onClick={() => {
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                    }}
                    className="w-full px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Reset Crop
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'rotate' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Rotate & Scale</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation: {rotation}°
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRotate}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        Rotate 90°
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scale: {Math.round(scale * 100)}%
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <button
                        onClick={() => setScale(Math.min(2, scale + 0.1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'title' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Image Title</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter image title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length}/100 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Suggested titles:</p>
                  <div className="space-y-1">
                    {['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Exterior View'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setTitle(suggestion)}
                        className="block w-full text-left px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <button
                onClick={handleSave}
                disabled={processing || !title.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {processing ? (
                  <>
                    <Spinner size={16} variant="white" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
} 