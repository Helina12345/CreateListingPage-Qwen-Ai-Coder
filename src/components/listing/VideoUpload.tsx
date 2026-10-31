// ============================================================
// ListingDesk Pro — Video Upload Component
// Supports video upload for eBay and TikTok Shop
// ============================================================

import React, { useState, useRef } from 'react';
import { Video, Upload, X, Play } from 'lucide-react';
import { Button, Badge } from '../ui';
import type { MarketplaceId } from '../../types';

interface VideoUploadProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    url?: string;
    duration?: number;
    size?: number;
  };
  onChange: (value: VideoUploadProps['value']) => void;
}

export function VideoUpload({ selectedMarketplaces, value, onChange }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only show for marketplaces that support video
  const supportsVideo = selectedMarketplaces.some((mp) => ['ebay', 'tiktok_shop'].includes(mp));

  if (!supportsVideo) {
    return null;
  }

  const maxDuration = selectedMarketplaces.includes('ebay') ? 60 : 60; // 1 minute
  const maxSizeMB = 100; // 100MB

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Video must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
        video.src = previewUrl;
      });

      const duration = video.duration;

      // Validate duration
      if (duration > maxDuration) {
        alert(`Video must be less than ${maxDuration} seconds`);
        URL.revokeObjectURL(previewUrl);
        setPreview(null);
        setUploading(false);
        return;
      }

      // In production, this would upload to your backend/S3
      // For now, we'll use the local preview URL
      onChange({
        url: previewUrl,
        duration: Math.round(duration),
        size: file.size,
      });

      setUploading(false);
    } catch (error) {
      console.error('Video upload error:', error);
      alert('Failed to process video');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (value.url && value.url.startsWith('blob:')) {
      URL.revokeObjectURL(value.url);
    }
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-blue-600" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Video
        </label>
        {value.url && <Badge variant="success">Uploaded</Badge>}
      </div>

      <p className="text-xs text-gray-500">
        {selectedMarketplaces.includes('ebay') && 'eBay: Max 1 minute video'}
        {selectedMarketplaces.includes('tiktok_shop') && 'TikTok Shop: Max 1 minute video'}
      </p>

      {!value.url ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors dark:border-gray-600"
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-sm text-gray-500">Processing video...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Click to upload video</p>
                <p className="text-xs text-gray-400">MP4, MOV, AVI (max {maxSizeMB}MB, {maxDuration}s)</p>
              </div>
            )}
          </label>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <video
            src={value.url}
            controls
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleRemove}
              icon={<X className="h-4 w-4" />}
            >
              Remove
            </Button>
          </div>
          {value.duration && value.size && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {formatDuration(value.duration)} • {formatFileSize(value.size)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
