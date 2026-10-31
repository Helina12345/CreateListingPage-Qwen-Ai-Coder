// ============================================================
// ListingDesk Pro — Walmart-Specific Fields Component
// Shipping dimensions, return policy, electronics flags
// ============================================================

import React from 'react';
import { Input, Select } from '../ui';

interface WalmartSpecificFieldsProps {
  value: {
    shippingWeight?: string;
    packageLength?: string;
    packageWidth?: string;
    packageHeight?: string;
    returnPolicy?: string;
    isElectronics?: boolean;
    isPrimaryVariant?: boolean;
    variantAttributes?: Record<string, string>;
  };
  onChange: (value: WalmartSpecificFieldsProps['value']) => void;
}

export function WalmartSpecificFields({ value, onChange }: WalmartSpecificFieldsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Walmart-Specific Fields
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Shipping Weight (lbs)"
          type="number"
          value={value.shippingWeight || ''}
          onChange={(e) => onChange({ ...value, shippingWeight: e.target.value })}
          placeholder="0.0"
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Length (in)"
            type="number"
            value={value.packageLength || ''}
            onChange={(e) => onChange({ ...value, packageLength: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Width (in)"
            type="number"
            value={value.packageWidth || ''}
            onChange={(e) => onChange({ ...value, packageWidth: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Height (in)"
            type="number"
            value={value.packageHeight || ''}
            onChange={(e) => onChange({ ...value, packageHeight: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <Select
        label="Return Policy"
        value={value.returnPolicy || '30_days'}
        onChange={(e) => onChange({ ...value, returnPolicy: e.target.value })}
        options={[
          { value: '30_days', label: '30 Day Returns' },
          { value: '60_days', label: '60 Day Returns' },
          { value: '90_days', label: '90 Day Returns' },
          { value: 'no_returns', label: 'No Returns' },
        ]}
      />

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isElectronics || false}
            onChange={(e) => onChange({ ...value, isElectronics: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Contains electronics</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isPrimaryVariant || false}
            onChange={(e) => onChange({ ...value, isPrimaryVariant: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Primary variant</span>
        </label>
      </div>
    </div>
  );
}
