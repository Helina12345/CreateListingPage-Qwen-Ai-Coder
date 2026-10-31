// ============================================================
// ListingDesk Pro — Variant Limits Validator Component
// Real-time validation of variant counts per marketplace
// ============================================================

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { MarketplaceId, ListingVariant } from '../../types';
import { MARKETPLACES } from '../../config/marketplaces';

interface VariantLimitsValidatorProps {
  variants: ListingVariant[];
  selectedMarketplaces: MarketplaceId[];
}

export function VariantLimitsValidator({ variants, selectedMarketplaces }: VariantLimitsValidatorProps) {
  const validation = useMemo(() => {
    return selectedMarketplaces.map((mpId) => {
      const mp = MARKETPLACES[mpId];
      const maxVariants = mp.id === 'shopify' ? 2048 :
                         mp.id === 'amazon' ? 2000 :
                         mp.id === 'ebay' ? 250 :
                         mp.id === 'etsy' ? 50 :
                         mp.id === 'walmart' ? 500 :
                         mp.id === 'tiktok_shop' ? 100 :
                         mp.id === 'shopee' ? 50 :
                         mp.id === 'lazada' ? 50 : 100;

      const currentCount = variants.length;
      const isValid = currentCount <= maxVariants;
      const remaining = maxVariants - currentCount;

      return {
        marketplaceId: mpId,
        marketplaceName: mp.name,
        icon: mp.icon,
        maxVariants,
        currentCount,
        isValid,
        remaining,
        percentage: (currentCount / maxVariants) * 100,
      };
    });
  }, [variants, selectedMarketplaces]);

  if (selectedMarketplaces.length === 0 || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Variant Limits by Marketplace
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {validation.map((v) => (
          <div
            key={v.marketplaceId}
            className={`rounded-lg border p-3 ${
              v.isValid
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{v.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {v.marketplaceName}
                </span>
              </div>
              {v.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {v.currentCount} / {v.maxVariants} variants
                </span>
                <span className={v.isValid ? 'text-green-600' : 'text-red-600'}>
                  {v.isValid ? `${v.remaining} remaining` : 'Over limit!'}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    v.percentage > 100 ? 'bg-red-500' :
                    v.percentage > 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(v.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {validation.some((v) => !v.isValid) && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-400">
              <p className="font-medium">Variant limit exceeded!</p>
              <p className="mt-1">
                Some marketplaces have variant limits. Please reduce the number of variants or
                create separate listings for products that exceed the limits.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
