// ============================================================
// ListingDesk Pro — TikTok Shop-Specific Fields Component
// Video upload, size chart, certifications, pre-order
// ============================================================

import React from 'react';
import { Input, Button } from '../ui';
import { Video, FileText, Upload } from 'lucide-react';

interface TikTokShopSpecificFieldsProps {
  value: {
    videoUrl?: string;
    sizeChartUrl?: string;
    certifications?: string[];
    isSampleAvailable?: boolean;
    isPreOrder?: boolean;
    preOrderDays?: string;
  };
  onChange: (value: TikTokShopSpecificFieldsProps['value']) => void;
}

export function TikTokShopSpecificFields({ value, onChange }: TikTokShopSpecificFieldsProps) {
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange({ ...value, videoUrl: url });
    }
  };

  const handleSizeChartUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange({ ...value, sizeChartUrl: url });
    }
  };

  const handleCertificationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => URL.createObjectURL(file));
    onChange({ ...value, certifications: [...(value.certifications || []), ...urls] });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        TikTok Shop-Specific Fields
      </h4>

      {/* Video Upload */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-pink-600" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Video
          </label>
        </div>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
        />
        {value.videoUrl && (
          <video src={value.videoUrl} controls className="w-full max-w-xs rounded-lg" />
        )}
        <p className="text-xs text-gray-500">
          Recommended: 9:16 aspect ratio, 15-60 seconds, max 100MB
        </p>
      </div>

      {/* Size Chart */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-pink-600" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Size Chart
          </label>
        </div>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleSizeChartUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
        />
        {value.sizeChartUrl && (
          <p className="text-xs text-green-600">✓ Size chart uploaded</p>
        )}
      </div>

      {/* Certifications */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-pink-600" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Certifications
          </label>
        </div>
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleCertificationUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
        />
        {value.certifications && value.certifications.length > 0 && (
          <p className="text-xs text-green-600">
            ✓ {value.certifications.length} certification(s) uploaded
          </p>
        )}
      </div>

      {/* Pre-Order */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isSampleAvailable || false}
            onChange={(e) => onChange({ ...value, isSampleAvailable: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-pink-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Sample available</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isPreOrder || false}
            onChange={(e) => onChange({ ...value, isPreOrder: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-pink-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Pre-order available</span>
        </label>
      </div>

      {value.isPreOrder && (
        <Input
          label="Pre-Order Days"
          type="number"
          value={value.preOrderDays || ''}
          onChange={(e) => onChange({ ...value, preOrderDays: e.target.value })}
          placeholder="e.g., 14"
          hint="Number of days before item ships"
        />
      )}
    </div>
  );
}
