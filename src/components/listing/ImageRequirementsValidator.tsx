// ============================================================
// ListingDesk Pro — Image Requirements Validator Component
// Real-time validation of image dimensions and formats per marketplace
// ============================================================

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, Loader } from 'lucide-react';
import type { MarketplaceId, ListingImage } from '../../types';
import { MARKETPLACES } from '../../config/marketplaces';

interface ImageRequirementsValidatorProps {
  images: ListingImage[];
  selectedMarketplaces: MarketplaceId[];
}

interface ImageValidation {
  imageId: string;
  imageUrl: string;
  width: number;
  height: number;
  format: string;
  sizeKB: number;
  validations: Array<{
    marketplaceId: MarketplaceId;
    marketplaceName: string;
    icon: string;
    isValid: boolean;
    issues: string[];
  }>;
}

export function ImageRequirementsValidator({ images, selectedMarketplaces }: ImageRequirementsValidatorProps) {
  const [validations, setValidations] = useState<ImageValidation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (images.length === 0 || selectedMarketplaces.length === 0) {
      setValidations([]);
      return;
    }

    setLoading(true);
    validateImages();
  }, [images, selectedMarketplaces]);

  const validateImages = async () => {
    const results: ImageValidation[] = [];

    for (const image of images) {
      if (!image.url) continue;

      try {
        const img = new Image();
        img.src = image.url;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const validation: ImageValidation = {
          imageId: image.id,
          imageUrl: image.url,
          width: img.width,
          height: img.height,
          format: image.url.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          sizeKB: 0, // Would need to fetch actual file size
          validations: selectedMarketplaces.map((mpId) => {
            const mp = MARKETPLACES[mpId];
            const issues: string[] = [];

            // Check minimum dimensions
            const minWidth = mp.id === 'amazon' ? 1000 :
                            mp.id === 'etsy' ? 2000 :
                            mp.id === 'tiktok_shop' ? 600 :
                            mp.id === 'ebay' ? 500 : 500;

            const minHeight = minWidth;

            if (img.width < minWidth) {
              issues.push(`Width ${img.width}px < ${minWidth}px minimum`);
            }
            if (img.height < minHeight) {
              issues.push(`Height ${img.height}px < ${minHeight}px minimum`);
            }

            // Check format
            const allowedFormats = mp.id === 'amazon' ? ['JPEG', 'JPG', 'PNG'] :
                                  mp.id === 'shopify' ? ['JPEG', 'JPG', 'PNG', 'GIF', 'WEBP'] :
                                  ['JPEG', 'JPG', 'PNG'];

            const format = image.url.split('.').pop()?.toUpperCase() || '';
            if (!allowedFormats.includes(format)) {
              issues.push(`Format ${format} not supported (allowed: ${allowedFormats.join(', ')})`);
            }

            // Amazon-specific: white background check (would need image analysis)
            if (mp.id === 'amazon' && image.isMain) {
              issues.push('⚠️ Amazon requires pure white background (RGB 255,255,255) for main image');
            }

            // TikTok Shop: no watermarks (would need image analysis)
            if (mp.id === 'tiktok_shop') {
              issues.push('⚠️ TikTok Shop prohibits watermarks and promotional text');
            }

            return {
              marketplaceId: mpId,
              marketplaceName: mp.name,
              icon: mp.icon,
              isValid: issues.filter(i => !i.startsWith('⚠️')).length === 0,
              issues,
            };
          }),
        };

        results.push(validation);
      } catch (error) {
        console.error('Failed to validate image:', error);
      }
    }

    setValidations(results);
    setLoading(false);
  };

  if (images.length === 0 || selectedMarketplaces.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <Loader className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Validating images...</span>
      </div>
    );
  }

  const hasErrors = validations.some((v) =>
    v.validations.some((val) => !val.isValid)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Image Requirements Validation
        </h4>
      </div>

      <div className="space-y-3">
        {validations.map((validation) => (
          <div key={validation.imageId} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800">
              <img
                src={validation.imageUrl}
                alt="Preview"
                className="h-12 w-12 object-cover rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {validation.width} × {validation.height}px
                  </span>
                  <span className="text-xs text-gray-500">{validation.format}</span>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {validation.validations.map((val) => (
                <div
                  key={val.marketplaceId}
                  className={`rounded-lg p-2 ${
                    val.isValid
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{val.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {val.marketplaceName}
                        </span>
                        {val.isValid ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        )}
                      </div>
                      {val.issues.length > 0 && (
                        <ul className="space-y-0.5">
                          {val.issues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasErrors && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-400">
              <p className="font-medium">Image requirements not met!</p>
              <p className="mt-1">
                Some images don't meet marketplace requirements. Please resize or replace images
                to ensure they meet the minimum dimensions and format requirements.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
