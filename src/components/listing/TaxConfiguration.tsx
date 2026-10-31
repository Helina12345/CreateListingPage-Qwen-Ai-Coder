// ============================================================
// ListingDesk Pro — Tax Configuration Component
// Handles tax category, exemption, and VAT settings
// ============================================================

import React from 'react';
import { DollarSign } from 'lucide-react';
import { Input, Select } from '../ui';
import type { MarketplaceId } from '../../types';

interface TaxConfigurationProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    taxCategory?: string;
    taxExempt?: boolean;
    taxExemptReason?: string;
    vatRegistered?: boolean;
    vatNumber?: string;
  };
  onChange: (value: TaxConfigurationProps['value']) => void;
}

export function TaxConfiguration({ selectedMarketplaces, value, onChange }: TaxConfigurationProps) {
  if (selectedMarketplaces.length === 0) {
    return null;
  }

  const taxCategories = [
    { value: 'standard', label: 'Standard Taxable' },
    { value: 'reduced', label: 'Reduced Rate' },
    { value: 'zero', label: 'Zero Rated' },
    { value: 'exempt', label: 'Tax Exempt' },
    { value: 'digital', label: 'Digital Goods' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'clothing', label: 'Clothing & Apparel' },
    { value: 'electronics', label: 'Electronics' },
  ];

  const exemptionReasons = [
    { value: 'nonprofit', label: 'Non-profit Organization' },
    { value: 'government', label: 'Government Entity' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'religious', label: 'Religious Organization' },
    { value: 'resale', label: 'Resale Certificate' },
    { value: 'other', label: 'Other' },
  ];

  // Check if international marketplaces are selected
  const hasInternational = selectedMarketplaces.some((mp) =>
    ['ebay', 'amazon', 'etsy'].includes(mp)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tax Configuration
        </h3>
      </div>

      <div className="space-y-3">
        <Select
          label="Tax Category"
          value={value.taxCategory || ''}
          onChange={(e) => onChange({ ...value, taxCategory: e.target.value })}
          options={[
            { value: '', label: 'Select tax category...' },
            ...taxCategories,
          ]}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="tax-exempt"
            checked={value.taxExempt || false}
            onChange={(e) => onChange({ ...value, taxExempt: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="tax-exempt" className="text-sm text-gray-700 dark:text-gray-300">
            Tax Exempt
          </label>
        </div>

        {value.taxExempt && (
          <Select
            label="Exemption Reason"
            value={value.taxExemptReason || ''}
            onChange={(e) => onChange({ ...value, taxExemptReason: e.target.value })}
            options={[
              { value: '', label: 'Select reason...' },
              ...exemptionReasons,
            ]}
          />
        )}

        {hasInternational && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                VAT Information (International)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vat-registered"
                checked={value.vatRegistered || false}
                onChange={(e) => onChange({ ...value, vatRegistered: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="vat-registered" className="text-sm text-gray-700 dark:text-gray-300">
                VAT Registered
              </label>
            </div>

            {value.vatRegistered && (
              <Input
                label="VAT Number"
                value={value.vatNumber || ''}
                onChange={(e) => onChange({ ...value, vatNumber: e.target.value })}
                placeholder="e.g., GB123456789"
              />
            )}
          </>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Tax settings will be applied to all selected marketplaces.
          Some marketplaces may have additional tax requirements. Please consult with a tax
          professional for guidance on your specific situation.
        </p>
      </div>
    </div>
  );
}
