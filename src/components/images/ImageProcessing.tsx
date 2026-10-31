// ============================================================
// ListingDesk Pro — Image Processing Component
// Real image compression, enhancement, background removal
// ============================================================

import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import {
  compressImage,
  enhanceImage,
  removeBackground,
  addWatermark,
  generateAltText,
  type ImageProcessingResult,
  type ImageEnhancementOptions,
  type WatermarkOptions,
  type AltTextSuggestion
} from '../../services/images';

interface ImageProcessingProps {
  onImageProcessed?: (url: string) => void;
}

export function ImageProcessing({ onImageProcessed }: ImageProcessingProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImageProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'compress' | 'enhance' | 'background' | 'watermark' | 'alt'>('compress');

  // Enhancement options
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpness, setSharpness] = useState(0);

  // Watermark options
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkOptions['position']>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);

  // Alt text suggestions
  const [altSuggestions, setAltSuggestions] = useState<AltTextSuggestion[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setAltSuggestions([]);
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const res = await compressImage(selectedFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        format: 'webp',
      });
      setResult(res);
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        onImageProcessed?.(res.url);
      }
    } catch (error: any) {
      setResult({
        success: false,
        originalSize: selectedFile.size,
        processedSize: selectedFile.size,
        compressionRatio: 0,
        error: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEnhance = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const options: ImageEnhancementOptions = {
        brightness,
        contrast,
        saturation,
        sharpness,
      };
      const res = await enhanceImage(selectedFile, options);
      setResult(res);
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        onImageProcessed?.(res.url);
      }
    } catch (error: any) {
      setResult({
        success: false,
        originalSize: selectedFile.size,
        processedSize: selectedFile.size,
        compressionRatio: 0,
        error: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const res = await removeBackground(selectedFile);
      setResult(res);
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        onImageProcessed?.(res.url);
      }
    } catch (error: any) {
      setResult({
        success: false,
        originalSize: selectedFile.size,
        processedSize: selectedFile.size,
        compressionRatio: 0,
        error: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddWatermark = async () => {
    if (!selectedFile || !watermarkText) return;
    setProcessing(true);
    try {
      const options: WatermarkOptions = {
        text: watermarkText,
        position: watermarkPosition,
        opacity: watermarkOpacity,
      };
      const res = await addWatermark(selectedFile, options);
      setResult(res);
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        onImageProcessed?.(res.url);
      }
    } catch (error: any) {
      setResult({
        success: false,
        originalSize: selectedFile.size,
        processedSize: selectedFile.size,
        compressionRatio: 0,
        error: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateAltText = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    try {
      const suggestions = await generateAltText(selectedFile);
      setAltSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate alt text:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Image Processing
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Compress, enhance, remove backgrounds, and add watermarks
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="block w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-indigo-500 transition-colors"
        >
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload an image
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-6">
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-contain"
              style={{ backgroundColor: activeTab === 'background' ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px' : undefined }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      {selectedFile && (
        <>
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            {(['compress', 'enhance', 'background', 'watermark', 'alt'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'alt' ? 'Alt Text' : tab}
              </button>
            ))}
          </div>

          {/* Compress Tab */}
          {activeTab === 'compress' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compress your image to reduce file size while maintaining quality.
              </p>
              <Button
                onClick={handleCompress}
                loading={processing}
                disabled={!selectedFile}
                className="w-full"
              >
                Compress Image
              </Button>
            </div>
          )}

          {/* Enhance Tab */}
          {activeTab === 'enhance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brightness: {brightness}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contrast: {contrast}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Saturation: {saturation}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sharpness: {sharpness}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sharpness}
                  onChange={(e) => setSharpness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleEnhance}
                loading={processing}
                disabled={!selectedFile}
                className="w-full"
              >
                Apply Enhancements
              </Button>
            </div>
          )}

          {/* Background Removal Tab */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remove the background from your image using AI-powered detection.
              </p>
              <Button
                onClick={handleRemoveBackground}
                loading={processing}
                disabled={!selectedFile}
                className="w-full"
              >
                Remove Background
              </Button>
            </div>
          )}

          {/* Watermark Tab */}
          {activeTab === 'watermark' && (
            <div className="space-y-4">
              <Input
                label="Watermark Text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Enter watermark text"
              />

              <Select
                label="Position"
                value={watermarkPosition}
                onChange={(e) => setWatermarkPosition(e.target.value as any)}
                options={[
                  { value: 'top-left', label: 'Top Left' },
                  { value: 'top-right', label: 'Top Right' },
                  { value: 'bottom-left', label: 'Bottom Left' },
                  { value: 'bottom-right', label: 'Bottom Right' },
                  { value: 'center', label: 'Center' },
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opacity: {Math.round(watermarkOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleAddWatermark}
                loading={processing}
                disabled={!selectedFile || !watermarkText}
                className="w-full"
              >
                Add Watermark
              </Button>
            </div>
          )}

          {/* Alt Text Tab */}
          {activeTab === 'alt' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate descriptive alt text for accessibility and SEO.
              </p>
              <Button
                onClick={handleGenerateAltText}
                loading={processing}
                disabled={!selectedFile}
                className="w-full"
              >
                Generate Alt Text
              </Button>

              {altSuggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Suggestions
                  </h4>
                  {altSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {suggestion.text}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                        <div className="flex gap-1">
                          {suggestion.keywords.map((keyword, kidx) => (
                            <Badge key={kidx} variant="default">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {result.success ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600">
                      ✓ Processing Complete
                    </span>
                    {result.compressionRatio > 0 && (
                      <Badge variant="success">
                        {result.compressionRatio}% smaller
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Original: {formatFileSize(result.originalSize)}</div>
                    <div>Processed: {formatFileSize(result.processedSize)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  ✗ Error: {result.error}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
