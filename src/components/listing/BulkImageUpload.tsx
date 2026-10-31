// ============================================================
// ListingDesk Pro — Bulk Image Upload Component
// Handles multi-file drag-and-drop image upload with progress
// ============================================================

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button, Badge, ProgressBar } from '../ui';
import type { ListingImage } from '../../types';

interface BulkImageUploadProps {
  value: ListingImage[];
  onChange: (images: ListingImage[]) => void;
  maxImages?: number;
}

export function BulkImageUpload({ value, onChange, maxImages = 24 }: BulkImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      alert('Please drop image files only');
      return;
    }

    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await processFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    // Check if we'll exceed max images
    const remainingSlots = maxImages - value.length;
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more images (max ${maxImages} total)`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const newImages: ListingImage[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Skipping ${file.name}: File too large (max 10MB)`);
          continue;
        }

        // Create preview URL
        const url = URL.createObjectURL(file);

        // Get image dimensions
        const dimensions = await getImageDimensions(url);

        newImages.push({
          id: `img_${Date.now()}_${i}`,
          url,
          alt: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          isMain: value.length === 0 && i === 0, // First image is main if no images exist
          position: value.length + i,
          width: dimensions.width,
          height: dimensions.height,
          size: file.size,
        });

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }

    // Add new images to existing ones
    onChange([...value, ...newImages]);
    setUploading(false);
    setUploadProgress(0);
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  const handleRemoveImage = (imageId: string) => {
    const image = value.find(img => img.id === imageId);
    if (image?.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
    onChange(value.filter(img => img.id !== imageId));
  };

  const handleSetMain = (imageId: string) => {
    onChange(value.map(img => ({
      ...img,
      isMain: img.id === imageId,
    })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulk Image Upload
          </h3>
        </div>
        <Badge variant="info">
          {value.length} / {maxImages} images
        </Badge>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="bulk-image-upload"
        />
        <label
          htmlFor="bulk-image-upload"
          className="cursor-pointer"
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag and drop images here, or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supports JPG, PNG, WebP (max 10MB per file)
          </p>
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Uploading...</span>
            <span className="text-gray-500">{Math.round(uploadProgress)}%</span>
          </div>
          <ProgressBar value={uploadProgress} max={100} />
        </div>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Images
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {value.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />

                {/* Main Badge */}
                {image.isMain && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="success">Main</Badge>
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.isMain && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetMain(image.id)}
                    >
                      Set as Main
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveImage(image.id)}
                    icon={<X className="h-4 w-4" />}
                  >
                    Remove
                  </Button>
                </div>

                {/* Image Info */}
                {image.width && image.height && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                    {image.width} × {image.height}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Tip:</strong> Upload multiple images at once by dragging them into the drop zone
          or selecting multiple files. The first image will be set as the main image automatically.
        </p>
      </div>
    </div>
  );
}
