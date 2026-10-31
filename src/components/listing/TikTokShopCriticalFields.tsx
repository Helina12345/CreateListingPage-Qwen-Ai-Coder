// ============================================================
// ListingDesk Pro — TikTok Shop Critical Missing Fields Component
// Product Classification, Affiliate Program, Sample Requests, Flash Sales, Bundle Deals, FBT
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';

interface TikTokShopCriticalFieldsProps {
  value: {
    productClassification?: {
      category?: string;
      restrictedCategory?: boolean;
      restrictedReason?: string;
    };
    affiliateProgram?: {
      enabled: boolean;
      commissionRate?: number;
      minCommission?: number;
      maxCommission?: number;
    };
    sampleRequest?: {
      enabled: boolean;
      samplePrice?: number;
      maxSamplesPerCreator?: number;
      approvalRequired?: boolean;
    };
    flashSale?: {
      enabled: boolean;
      startTime?: string;
      endTime?: string;
      flashSalePrice?: number;
      stockLimit?: number;
    };
    bundleDeal?: {
      enabled: boolean;
      bundles?: Array<{
        name: string;
        products: string[];
        discountPercentage?: number;
        discountAmount?: number;
      }>;
    };
    fbt?: {
      enabled: boolean;
      fulfillmentCenter?: string;
      shippingMethod?: string;
    };
  };
  onChange: (value: TikTokShopCriticalFieldsProps['value']) => void;
}

export function TikTokShopCriticalFields({ value, onChange }: TikTokShopCriticalFieldsProps) {
  const handleProductClassificationChange = (field: string, val: string | boolean) => {
    onChange({
      ...value,
      productClassification: {
        ...value.productClassification!,
        [field]: val,
      },
    });
  };

  const handleAffiliateProgramChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      affiliateProgram: {
        ...value.affiliateProgram!,
        [field]: val,
      },
    });
  };

  const handleSampleRequestChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      sampleRequest: {
        ...value.sampleRequest!,
        [field]: val,
      },
    });
  };

  const handleFlashSaleChange = (field: string, val: boolean | number | string) => {
    onChange({
      ...value,
      flashSale: {
        ...value.flashSale!,
        [field]: val,
      },
    });
  };

  const handleBundleDealAdd = () => {
    const bundles = value.bundleDeal?.bundles || [];
    onChange({
      ...value,
      bundleDeal: {
        ...value.bundleDeal!,
        enabled: true,
        bundles: [...bundles, { name: `Bundle ${bundles.length + 1}`, products: [] }],
      },
    });
  };

  const handleBundleDealUpdate = (index: number, field: string, val: any) => {
    const bundles = [...(value.bundleDeal?.bundles || [])];
    bundles[index] = { ...bundles[index], [field]: val };
    onChange({
      ...value,
      bundleDeal: { ...value.bundleDeal!, bundles },
    });
  };

  const handleBundleDealRemove = (index: number) => {
    const bundles = (value.bundleDeal?.bundles || []).filter((_, i) => i !== index);
    onChange({
      ...value,
      bundleDeal: { ...value.bundleDeal!, bundles },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        TikTok Shop Critical Fields
      </h3>

      {/* Product Classification */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Product Classification
        </h4>
        <div className="space-y-3">
          <Select
            label="Category"
            value={value.productClassification?.category || ''}
            onChange={(e) => handleProductClassificationChange('category', e.target.value)}
            options={[
              { value: '', label: 'Select category...' },
              { value: 'fashion', label: 'Fashion' },
              { value: 'beauty', label: 'Beauty' },
              { value: 'home', label: 'Home & Living' },
              { value: 'electronics', label: 'Electronics' },
              { value: 'food', label: 'Food & Beverages' },
              { value: 'kids', label: 'Mom & Baby' },
              { value: 'health', label: 'Health' },
            ]}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.productClassification?.restrictedCategory || false}
              onChange={(e) => handleProductClassificationChange('restrictedCategory', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pink-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Restricted Category
            </span>
          </label>
          {value.productClassification?.restrictedCategory && (
            <Input
              label="Restriction Reason"
              value={value.productClassification?.restrictedReason || ''}
              onChange={(e) => handleProductClassificationChange('restrictedReason', e.target.value)}
              placeholder="Explain why this category is restricted..."
            />
          )}
        </div>
      </div>

      {/* Affiliate Program Settings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Affiliate Program
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.affiliateProgram?.enabled || false}
              onChange={(e) => handleAffiliateProgramChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pink-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.affiliateProgram?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Commission Rate (%)"
              type="number"
              value={value.affiliateProgram?.commissionRate?.toString() || ''}
              onChange={(e) => handleAffiliateProgramChange('commissionRate', parseFloat(e.target.value) || 0)}
              placeholder="10"
              min={0}
              max={100}
              step={0.1}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min Commission (%)"
                type="number"
                value={value.affiliateProgram?.minCommission?.toString() || ''}
                onChange={(e) => handleAffiliateProgramChange('minCommission', parseFloat(e.target.value) || 0)}
                placeholder="5"
                min={0}
                max={100}
              />
              <Input
                label="Max Commission (%)"
                type="number"
                value={value.affiliateProgram?.maxCommission?.toString() || ''}
                onChange={(e) => handleAffiliateProgramChange('maxCommission', parseFloat(e.target.value) || 0)}
                placeholder="50"
                min={0}
                max={100}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sample Request Configuration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Sample Request for Affiliates
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.sampleRequest?.enabled || false}
              onChange={(e) => handleSampleRequestChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pink-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.sampleRequest?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Sample Price"
              type="number"
              value={value.sampleRequest?.samplePrice?.toString() || ''}
              onChange={(e) => handleSampleRequestChange('samplePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              hint="Price for sample requests (0 for free samples)"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max Samples per Creator"
                type="number"
                value={value.sampleRequest?.maxSamplesPerCreator?.toString() || ''}
                onChange={(e) => handleSampleRequestChange('maxSamplesPerCreator', parseInt(e.target.value) || 0)}
                placeholder="1"
                min={1}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.sampleRequest?.approvalRequired || false}
                  onChange={(e) => handleSampleRequestChange('approvalRequired', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-pink-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Require Approval
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Flash Sale Setup */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Flash Sale
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.flashSale?.enabled || false}
              onChange={(e) => handleFlashSaleChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pink-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.flashSale?.enabled && (
          <div className="space-y-3 ml-6">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="datetime-local"
                value={value.flashSale?.startTime || ''}
                onChange={(e) => handleFlashSaleChange('startTime', e.target.value)}
              />
              <Input
                label="End Time"
                type="datetime-local"
                value={value.flashSale?.endTime || ''}
                onChange={(e) => handleFlashSaleChange('endTime', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Flash Sale Price"
                type="number"
                value={value.flashSale?.flashSalePrice?.toString() || ''}
                onChange={(e) => handleFlashSaleChange('flashSalePrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Input
                label="Stock Limit"
                type="number"
                value={value.flashSale?.stockLimit?.toString() || ''}
                onChange={(e) => handleFlashSaleChange('stockLimit', parseInt(e.target.value) || 0)}
                placeholder="100"
                min={1}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bundle Deal Configuration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Bundle Deals
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.bundleDeal?.enabled || false}
              onChange={(e) => onChange({
                ...value,
                bundleDeal: { ...value.bundleDeal!, enabled: e.target.checked },
              })}
              className="h-4 w-4 rounded border-gray-300 text-pink-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.bundleDeal?.enabled && (
          <div className="space-y-3 ml-6">
            {value.bundleDeal.bundles?.map((bundle, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    label="Bundle Name"
                    value={bundle.name}
                    onChange={(e) => handleBundleDealUpdate(idx, 'name', e.target.value)}
                    placeholder="Bundle 1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleBundleDealRemove(idx)}>
                    Remove
                  </Button>
                </div>
                <Input
                  label="Products (comma-separated IDs)"
                  value={bundle.products.join(', ')}
                  onChange={(e) => handleBundleDealUpdate(idx, 'products', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="prod1, prod2, prod3"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Discount %"
                    type="number"
                    value={bundle.discountPercentage?.toString() || ''}
                    onChange={(e) => handleBundleDealUpdate(idx, 'discountPercentage', parseFloat(e.target.value) || undefined)}
                    placeholder="10"
                    min={0}
                    max={100}
                  />
                  <Input
                    label="Discount Amount"
                    type="number"
                    value={bundle.discountAmount?.toString() || ''}
                    onChange={(e) => handleBundleDealUpdate(idx, 'discountAmount', parseFloat(e.target.value) || undefined)}
                    placeholder="5.00"
                    min={0}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleBundleDealAdd}>
              + Add Bundle
            </Button>
          </div>
        )}
      </div>

      {/* TikTok Shop Fulfillment (FBT) */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Fulfilled by TikTok (FBT)
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.fbt?.enabled || false}
              onChange={(e) => onChange({
                ...value,
                fbt: { ...value.fbt!, enabled: e.target.checked },
              })}
              className="h-4 w-4 rounded border-gray-300 text-pink-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.fbt?.enabled && (
          <div className="space-y-3 ml-6">
            <Select
              label="Fulfillment Center"
              value={value.fbt?.fulfillmentCenter || ''}
              onChange={(e) => onChange({
                ...value,
                fbt: { ...value.fbt!, fulfillmentCenter: e.target.value },
              })}
              options={[
                { value: '', label: 'Select center...' },
                { value: 'us-east', label: 'US East' },
                { value: 'us-west', label: 'US West' },
                { value: 'sea', label: 'Southeast Asia' },
                { value: 'uk', label: 'United Kingdom' },
              ]}
            />
            <Select
              label="Shipping Method"
              value={value.fbt?.shippingMethod || ''}
              onChange={(e) => onChange({
                ...value,
                fbt: { ...value.fbt!, shippingMethod: e.target.value },
              })}
              options={[
                { value: '', label: 'Select method...' },
                { value: 'standard', label: 'Standard (5-7 days)' },
                { value: 'express', label: 'Express (2-3 days)' },
                { value: 'next-day', label: 'Next Day' },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
