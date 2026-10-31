// ============================================================
// ListingDesk Pro — Kohl's-Specific Fields Component
// Brand registry, sampling program, content standards, UPC
// ============================================================

import React from 'react';
import { Input, Select } from '../ui';

interface KohlsSpecificFieldsProps {
  value: {
    brandRegistryStatus?: 'registered' | 'pending' | 'not_registered';
    isSampleProgram?: boolean;
    contentStandards?: string[];
    upc?: string;
    department?: string;
  };
  onChange: (value: KohlsSpecificFieldsProps['value']) => void;
}

export function KohlsSpecificFields({ value, onChange }: KohlsSpecificFieldsProps) {
  const contentStandards = [
    'Product images must be on white background',
    'Title must include brand name',
    'Description must be at least 100 characters',
    'Must have at least 3 product images',
    'Price must be competitive',
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Kohl's-Specific Fields
      </h4>

      {/* Brand Registry */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Brand Registry Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ ...value, brandRegistryStatus: 'registered' })}
            className={`rounded-lg border p-2 text-center text-xs ${
              value.brandRegistryStatus === 'registered'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            Registered
          </button>
          <button
            onClick={() => onChange({ ...value, brandRegistryStatus: 'pending' })}
            className={`rounded-lg border p-2 text-center text-xs ${
              value.brandRegistryStatus === 'pending'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => onChange({ ...value, brandRegistryStatus: 'not_registered' })}
            className={`rounded-lg border p-2 text-center text-xs ${
              (value.brandRegistryStatus || 'not_registered') === 'not_registered'
                ? 'border-gray-500 bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            Not Registered
          </button>
        </div>
      </div>

      <Input
        label="UPC"
        value={value.upc || ''}
        onChange={(e) => onChange({ ...value, upc: e.target.value })}
        placeholder="12-digit UPC code"
        hint="Required for Kohl's listings"
      />

      <Select
        label="Department"
        value={value.department || ''}
        onChange={(e) => onChange({ ...value, department: e.target.value })}
        options={[
          { value: '', label: 'Select department...' },
          { value: 'womens', label: "Women's" },
          { value: 'mens', label: "Men's" },
          { value: 'kids', label: 'Kids' },
          { value: 'home', label: 'Home' },
          { value: 'shoes', label: 'Shoes' },
          { value: 'accessories', label: 'Accessories' },
        ]}
      />

      {/* Product Sampling Program */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.isSampleProgram || false}
          onChange={(e) => onChange({ ...value, isSampleProgram: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Enroll in Product Sampling Program
          </span>
          <p className="text-xs text-gray-500">
            Send samples to Kohl's for quality review
          </p>
        </div>
      </label>

      {/* Content Standards */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Content Standards Compliance
        </label>
        <div className="space-y-1">
          {contentStandards.map((standard, i) => (
            <label key={i} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(value.contentStandards || []).includes(standard)}
                onChange={(e) => {
                  const current = value.contentStandards || [];
                  const updated = e.target.checked
                    ? [...current, standard]
                    : current.filter((s) => s !== standard);
                  onChange({ ...value, contentStandards: updated });
                }}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{standard}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
