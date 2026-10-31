// ============================================================
// ListingDesk Pro — Shopify Critical Missing Fields Component
// Product Status, Sales Channels, Inventory Tracking, Product Feed
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';

interface ShopifyCriticalFieldsProps {
  value: {
    productStatus?: 'active' | 'draft' | 'archived';
    salesChannels?: string[];
    inventoryTracking?: {
      enabled: boolean;
      trackQuantity: boolean;
      continueSellingWhenOutOfStock: boolean;
    };
    productFeed?: {
      googleShopping: boolean;
      facebookCatalog: boolean;
      pinterestCatalog: boolean;
      tiktokCatalog: boolean;
    };
    sellingPlans?: {
      enabled: boolean;
      plans?: Array<{
        name: string;
        interval: 'day' | 'week' | 'month';
        intervalCount: number;
        discountPercentage?: number;
        discountAmount?: number;
      }>;
    };
    preOrder?: {
      enabled: boolean;
      expectedDate?: string;
      preOrderPrice?: number;
      depositRequired?: boolean;
      depositAmount?: number;
    };
  };
  onChange: (value: ShopifyCriticalFieldsProps['value']) => void;
}

export function ShopifyCriticalFields({ value, onChange }: ShopifyCriticalFieldsProps) {
  const handleInventoryTrackingChange = (field: string, val: boolean) => {
    onChange({
      ...value,
      inventoryTracking: {
        ...value.inventoryTracking!,
        [field]: val,
      },
    });
  };

  const handleProductFeedChange = (field: string, val: boolean) => {
    onChange({
      ...value,
      productFeed: {
        ...value.productFeed!,
        [field]: val,
      },
    });
  };

  const handleSellingPlanAdd = () => {
    const plans = value.sellingPlans?.plans || [];
    onChange({
      ...value,
      sellingPlans: {
        ...value.sellingPlans!,
        plans: [
          ...plans,
          {
            name: `Subscription ${plans.length + 1}`,
            interval: 'month',
            intervalCount: 1,
          },
        ],
      },
    });
  };

  const handleSellingPlanUpdate = (index: number, field: string, val: any) => {
    const plans = [...(value.sellingPlans?.plans || [])];
    plans[index] = { ...plans[index], [field]: val };
    onChange({
      ...value,
      sellingPlans: {
        ...value.sellingPlans!,
        plans,
      },
    });
  };

  const handleSellingPlanRemove = (index: number) => {
    const plans = (value.sellingPlans?.plans || []).filter((_, i) => i !== index);
    onChange({
      ...value,
      sellingPlans: {
        ...value.sellingPlans!,
        plans,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Shopify Critical Fields
      </h3>

      {/* Product Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Status <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...value, productStatus: 'active' })}
            className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
              (value.productStatus || 'draft') === 'active'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Badge variant="success">Active</Badge>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Visible to customers</p>
          </button>
          <button
            onClick={() => onChange({ ...value, productStatus: 'draft' })}
            className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
              (value.productStatus || 'draft') === 'draft'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Badge variant="warning">Draft</Badge>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Not visible</p>
          </button>
          <button
            onClick={() => onChange({ ...value, productStatus: 'archived' })}
            className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
              value.productStatus === 'archived'
                ? 'border-gray-500 bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Badge variant="default">Archived</Badge>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Hidden</p>
          </button>
        </div>
      </div>

      {/* Sales Channels Selection */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Sales Channels <span className="text-red-500">*</span>
        </h4>
        <p className="text-xs text-gray-500">
          Select which channels to publish this product to
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'online_store', label: 'Online Store', icon: '🌐' },
            { id: 'pos', label: 'Point of Sale', icon: '💳' },
            { id: 'facebook', label: 'Facebook', icon: '📘' },
            { id: 'instagram', label: 'Instagram', icon: '📷' },
            { id: 'google', label: 'Google Shopping', icon: '🔍' },
            { id: 'pinterest', label: 'Pinterest', icon: '📌' },
            { id: 'tiktok', label: 'TikTok', icon: '🎵' },
            { id: 'amazon', label: 'Amazon', icon: '📦' },
            { id: 'ebay', label: 'eBay', icon: '🏷️' },
            { id: 'etsy', label: 'Etsy', icon: '🎨' },
          ].map((channel) => {
            const isSelected = (value.salesChannels || ['online_store']).includes(channel.id);
            return (
              <label
                key={channel.id}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const channels = value.salesChannels || ['online_store'];
                    const updated = e.target.checked
                      ? [...channels, channel.id]
                      : channels.filter((c) => c !== channel.id);
                    onChange({ ...value, salesChannels: updated });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-lg">{channel.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{channel.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Inventory Tracking */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Inventory Tracking
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.inventoryTracking?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  inventoryTracking: {
                    ...value.inventoryTracking!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Track Quantity
            </span>
          </label>
          {value.inventoryTracking?.enabled && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.inventoryTracking?.continueSellingWhenOutOfStock || false}
                  onChange={(e) => handleInventoryTrackingChange('continueSellingWhenOutOfStock', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Continue selling when out of stock
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Product Feed Configuration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Product Feed Configuration
        </h4>
        <p className="text-xs text-gray-500">
          Enable product feeds for external platforms
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.productFeed?.googleShopping || false}
              onChange={(e) => handleProductFeedChange('googleShopping', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Google Shopping</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.productFeed?.facebookCatalog || false}
              onChange={(e) => handleProductFeedChange('facebookCatalog', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Facebook Catalog</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.productFeed?.pinterestCatalog || false}
              onChange={(e) => handleProductFeedChange('pinterestCatalog', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Pinterest Catalog</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.productFeed?.tiktokCatalog || false}
              onChange={(e) => handleProductFeedChange('tiktokCatalog', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">TikTok Catalog</span>
          </label>
        </div>
      </div>

      {/* Selling Plans / Subscriptions */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Selling Plans / Subscriptions
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.sellingPlans?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  sellingPlans: {
                    ...value.sellingPlans!,
                    enabled: e.target.checked,
                    plans: value.sellingPlans?.plans || [],
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable Subscriptions</span>
          </label>
        </div>
        {value.sellingPlans?.enabled && (
          <div className="space-y-3">
            {value.sellingPlans.plans?.map((plan, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Input
                    label="Plan Name"
                    value={plan.name}
                    onChange={(e) => handleSellingPlanUpdate(idx, 'name', e.target.value)}
                    placeholder="Monthly Subscription"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSellingPlanRemove(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Interval"
                    value={plan.interval}
                    onChange={(e) => handleSellingPlanUpdate(idx, 'interval', e.target.value)}
                    options={[
                      { value: 'day', label: 'Day(s)' },
                      { value: 'week', label: 'Week(s)' },
                      { value: 'month', label: 'Month(s)' },
                    ]}
                  />
                  <Input
                    label="Interval Count"
                    type="number"
                    value={plan.intervalCount.toString()}
                    onChange={(e) =>
                      handleSellingPlanUpdate(idx, 'intervalCount', parseInt(e.target.value) || 1)
                    }
                    min={1}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Discount %"
                    type="number"
                    value={plan.discountPercentage?.toString() || ''}
                    onChange={(e) =>
                      handleSellingPlanUpdate(idx, 'discountPercentage', parseFloat(e.target.value) || undefined)
                    }
                    placeholder="10"
                    hint="Percentage discount"
                  />
                  <Input
                    label="Discount Amount"
                    type="number"
                    value={plan.discountAmount?.toString() || ''}
                    onChange={(e) =>
                      handleSellingPlanUpdate(idx, 'discountAmount', parseFloat(e.target.value) || undefined)
                    }
                    placeholder="5.00"
                    hint="Fixed amount discount"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSellingPlanAdd}
            >
              + Add Subscription Plan
            </Button>
          </div>
        )}
      </div>

      {/* Pre-order Settings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Pre-order Settings
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.preOrder?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  preOrder: {
                    ...value.preOrder!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable Pre-order</span>
          </label>
        </div>
        {value.preOrder?.enabled && (
          <div className="space-y-3">
            <Input
              label="Expected Delivery Date"
              type="date"
              value={value.preOrder?.expectedDate || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  preOrder: { ...value.preOrder!, expectedDate: e.target.value },
                })
              }
            />
            <Input
              label="Pre-order Price"
              type="number"
              value={value.preOrder?.preOrderPrice?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  preOrder: {
                    ...value.preOrder!,
                    preOrderPrice: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              placeholder="0.00"
              hint="Special price for pre-orders (leave blank for regular price)"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.preOrder?.depositRequired || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    preOrder: { ...value.preOrder!, depositRequired: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Require Deposit
              </span>
            </label>
            {value.preOrder?.depositRequired && (
              <div className="ml-6">
                <Input
                  label="Deposit Amount"
                  type="number"
                  value={value.preOrder?.depositAmount?.toString() || ''}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      preOrder: {
                        ...value.preOrder!,
                        depositAmount: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
