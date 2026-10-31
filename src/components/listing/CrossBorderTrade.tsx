// ============================================================
// ListingDesk Pro — Cross-Border Trade Component
// Handles international shipping and customs settings
// ============================================================

import React from 'react';
import { Globe, AlertTriangle } from 'lucide-react';
import { Input, Select } from '../ui';
import type { MarketplaceId } from '../../types';

interface CrossBorderTradeProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    shipsInternationally?: boolean;
    excludedCountries?: string[];
    customsInfo?: {
      hsCode?: string;
      countryOfOrigin?: string;
      description?: string;
      value?: number;
    };
  };
  onChange: (value: CrossBorderTradeProps['value']) => void;
}

export function CrossBorderTrade({ selectedMarketplaces, value, onChange }: CrossBorderTradeProps) {
  if (selectedMarketplaces.length === 0) {
    return null;
  }

  // Check if any selected marketplace supports international shipping
  const supportsInternational = selectedMarketplaces.some((mp) =>
    ['ebay', 'amazon', 'etsy', 'shopee', 'lazada'].includes(mp)
  );

  if (!supportsInternational) {
    return null;
  }

  const restrictedCountries = [
    { code: 'CU', name: 'Cuba' },
    { code: 'IR', name: 'Iran' },
    { code: 'KP', name: 'North Korea' },
    { code: 'SY', name: 'Syria' },
    { code: 'RU', name: 'Russia' },
    { code: 'BY', name: 'Belarus' },
  ];

  const handleToggleInternational = () => {
    onChange({
      ...value,
      shipsInternationally: !value.shipsInternationally,
    });
  };

  const handleToggleCountry = (countryCode: string) => {
    const excluded = value.excludedCountries || [];
    const newExcluded = excluded.includes(countryCode)
      ? excluded.filter(c => c !== countryCode)
      : [...excluded, countryCode];

    onChange({
      ...value,
      excludedCountries: newExcluded,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cross-Border Trade Settings
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ships-internationally"
            checked={value.shipsInternationally || false}
            onChange={handleToggleInternational}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="ships-internationally" className="text-sm text-gray-700 dark:text-gray-300">
            Ships Internationally
          </label>
        </div>

        {value.shipsInternationally && (
          <>
            {/* Excluded Countries */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Excluded Countries (Sanctioned/Restricted)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {restrictedCountries.map((country) => (
                  <label
                    key={country.code}
                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={(value.excludedCountries || []).includes(country.code)}
                      onChange={() => handleToggleCountry(country.code)}
                      className="h-3 w-3 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {country.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Customs Information */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Customs Information
              </h4>

              <Input
                label="HS Code (Harmonized System)"
                value={value.customsInfo?.hsCode || ''}
                onChange={(e) => onChange({
                  ...value,
                  customsInfo: {
                    ...value.customsInfo,
                    hsCode: e.target.value,
                  },
                })}
                placeholder="e.g., 6109.10.00"
                hint="Required for international customs clearance"
              />

              <Input
                label="Customs Description"
                value={value.customsInfo?.description || ''}
                onChange={(e) => onChange({
                  ...value,
                  customsInfo: {
                    ...value.customsInfo,
                    description: e.target.value,
                  },
                })}
                placeholder="Brief description for customs"
              />

              <Input
                label="Declared Value (USD)"
                type="number"
                value={value.customsInfo?.value?.toString() || ''}
                onChange={(e) => onChange({
                  ...value,
                  customsInfo: {
                    ...value.customsInfo,
                    value: parseFloat(e.target.value) || undefined,
                  },
                })}
                placeholder="Product value for customs"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-700 dark:text-yellow-400">
                  <p className="font-medium">Important:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>International shipments require customs documentation</li>
                    <li>Buyers may be responsible for import duties and taxes</li>
                    <li>Some products may be restricted in certain countries</li>
                    <li>Accurate HS codes help prevent customs delays</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
