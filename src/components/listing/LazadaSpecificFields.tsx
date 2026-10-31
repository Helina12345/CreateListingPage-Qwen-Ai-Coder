// ============================================================
// ListingDesk Pro — Lazada-Specific Fields Component
// Category attributes, brand, package contents, warranty, FBL
// ============================================================

import React from 'react';
import { Input, Select } from '../ui';

interface LazadaSpecificFieldsProps {
  value: {
    categoryAttributes?: Record<string, string>;
    brandName?: string;
    packageContent?: string;
    warrantyType?: string;
    warrantyPeriod?: string;
    isFulfilledByLazada?: boolean;
  };
  onChange: (value: LazadaSpecificFieldsProps['value']) => void;
}

export function LazadaSpecificFields({ value, onChange }: LazadaSpecificFieldsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Lazada-Specific Fields
      </h4>

      <Input
        label="Brand Name"
        value={value.brandName || ''}
        onChange={(e) => onChange({ ...value, brandName: e.target.value })}
        placeholder="Enter brand name"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Package Contents
        </label>
        <textarea
          value={value.packageContent || ''}
          onChange={(e) => onChange({ ...value, packageContent: e.target.value })}
          placeholder="What's included in the package..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Warranty Type"
          value={value.warrantyType || ''}
          onChange={(e) => onChange({ ...value, warrantyType: e.target.value })}
          options={[
            { value: '', label: 'Select...' },
            { value: 'local', label: 'Local Seller Warranty' },
            { value: 'international', label: 'International Warranty' },
            { value: 'no', label: 'No Warranty' },
          ]}
        />
        <Select
          label="Warranty Period"
          value={value.warrantyPeriod || ''}
          onChange={(e) => onChange({ ...value, warrantyPeriod: e.target.value })}
          options={[
            { value: '', label: 'Select...' },
            { value: '1_month', label: '1 Month' },
            { value: '3_months', label: '3 Months' },
            { value: '6_months', label: '6 Months' },
            { value: '1_year', label: '1 Year' },
            { value: '2_years', label: '2 Years' },
          ]}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.isFulfilledByLazada || false}
          onChange={(e) => onChange({ ...value, isFulfilledByLazada: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Fulfilled by Lazada (FBL)
        </span>
      </label>
    </div>
  );
}
