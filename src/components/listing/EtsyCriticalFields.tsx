// ============================================================
// ListingDesk Pro — Etsy Critical Missing Fields Component
// Digital Files, Shop Sections, Personalization, Gift Wrap
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';
import { Upload, X } from 'lucide-react';

interface EtsyCriticalFieldsProps {
  value: {
    digitalFiles?: Array<{
      name: string;
      url: string;
      size: number;
    }>;
    shopSection?: string;
    personalization?: {
      enabled: boolean;
      required: boolean;
      instructions?: string;
      maxLength?: number;
    };
    listingDuration?: '4_months' | 'until_sold';
    giftWrap?: {
      available: boolean;
      price?: number;
      message?: string;
    };
    buyerMessage?: string;
  };
  onChange: (value: EtsyCriticalFieldsProps['value']) => void;
}

export function EtsyCriticalFields({ value, onChange }: EtsyCriticalFieldsProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const digitalFiles = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
    }));
    onChange({ ...value, digitalFiles: [...(value.digitalFiles || []), ...digitalFiles] });
  };

  const handleFileRemove = (index: number) => {
    const digitalFiles = (value.digitalFiles || []).filter((_, i) => i !== index);
    onChange({ ...value, digitalFiles });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Etsy Critical Fields
      </h3>

      {/* Digital File Upload */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Digital Files
        </h4>
        <p className="text-xs text-gray-500">
          Upload up to 5 files (max 20MB each) for digital products
        </p>
        <div className="space-y-2">
          {value.digitalFiles?.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <Badge variant="info">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileRemove(idx)}
                icon={<X className="h-4 w-4" />}
              />
            </div>
          ))}
          {(value.digitalFiles?.length || 0) < 5 && (
            <div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.zip,.ai,.psd"
                onChange={handleFileUpload}
                className="hidden"
                id="digital-file-upload"
              />
              <label
                htmlFor="digital-file-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Upload Digital Files
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Shop Section Assignment */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Shop Section
        </label>
        <Select
          value={value.shopSection || ''}
          onChange={(e) => onChange({ ...value, shopSection: e.target.value })}
          options={[
            { value: '', label: 'Select shop section...' },
            { value: 'jewelry', label: 'Jewelry' },
            { value: 'clothing', label: 'Clothing' },
            { value: 'home-decor', label: 'Home & Living' },
            { value: 'art', label: 'Art & Prints' },
            { value: 'craft-supplies', label: 'Craft Supplies' },
            { value: 'vintage', label: 'Vintage Items' },
            { value: 'digital', label: 'Digital Downloads' },
            { value: 'wedding', label: 'Wedding & Parties' },
          ]}
        />
        <p className="text-xs text-gray-500">
          Organize your listing in your shop
        </p>
      </div>

      {/* Personalization Fields */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Personalization
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.personalization?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  personalization: {
                    ...value.personalization!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Accept Personalization
            </span>
          </label>
        </div>
        {value.personalization?.enabled && (
          <div className="space-y-3 ml-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.personalization?.required || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    personalization: {
                      ...value.personalization!,
                      required: e.target.checked,
                    },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Personalization Required
              </span>
            </label>
            <Input
              label="Instructions for Buyers"
              value={value.personalization?.instructions || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  personalization: {
                    ...value.personalization!,
                    instructions: e.target.value,
                  },
                })
              }
              placeholder="e.g., Please enter the name to be engraved..."
            />
            <Input
              label="Max Character Length"
              type="number"
              value={value.personalization?.maxLength?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  personalization: {
                    ...value.personalization!,
                    maxLength: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="50"
            />
          </div>
        )}
      </div>

      {/* Listing Duration */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Listing Duration
        </label>
        <Select
          value={value.listingDuration || '4_months'}
          onChange={(e) => onChange({ ...value, listingDuration: e.target.value as any })}
          options={[
            { value: '4_months', label: '4 Months (Standard)' },
            { value: 'until_sold', label: 'Until Sold' },
          ]}
        />
        <p className="text-xs text-gray-500">
          How long should this listing remain active?
        </p>
      </div>

      {/* Gift Wrap Options */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Gift Wrap
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.giftWrap?.available || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  giftWrap: {
                    ...value.giftWrap!,
                    available: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Offer Gift Wrap
            </span>
          </label>
        </div>
        {value.giftWrap?.available && (
          <div className="space-y-3 ml-6">
            <Input
              label="Gift Wrap Price"
              type="number"
              value={value.giftWrap?.price?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  giftWrap: {
                    ...value.giftWrap!,
                    price: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              placeholder="5.00"
            />
            <Input
              label="Gift Message"
              value={value.giftWrap?.message || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  giftWrap: {
                    ...value.giftWrap!,
                    message: e.target.value,
                  },
                })
              }
              placeholder="Optional gift message template..."
            />
          </div>
        )}
      </div>

      {/* Message to Buyers */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message to Buyers (Post-Purchase)
        </label>
        <textarea
          value={value.buyerMessage || ''}
          onChange={(e) => onChange({ ...value, buyerMessage: e.target.value })}
          placeholder="Thank you for your purchase! Your item will ship within 1-2 business days..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
        />
        <p className="text-xs text-gray-500">
          This message will be sent to buyers after purchase
        </p>
      </div>
    </div>
  );
}
