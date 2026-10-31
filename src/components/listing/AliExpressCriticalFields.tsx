// ============================================================
// ListingDesk Pro — AliExpress Critical Missing Fields Component
// Shipping Methods, Processing Time, Dropshipping, Sourcing, Ratings, MOQ
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';

interface AliExpressCriticalFieldsProps {
  value: {
    shippingMethod?: {
      methods?: string[];
      freeShipping?: boolean;
      estimatedDelivery?: string;
      trackingAvailable?: boolean;
    };
    processingTime?: {
      days?: number;
      businessDaysOnly?: boolean;
      customHandling?: boolean;
    };
    dropshipping?: {
      enabled: boolean;
      blindShipping?: boolean;
      noInvoice?: boolean;
      customPackaging?: boolean;
      packagingDetails?: string;
    };
    sourcing?: {
      alternatives?: Array<{
        productId: string;
        productName: string;
        price: number;
        supplier: string;
      }>;
      autoSource?: boolean;
      minProfitMargin?: number;
    };
    supplierRating?: {
      displayRating: boolean;
      minRating?: number;
      showTransactionHistory?: boolean;
      showResponseRate?: boolean;
    };
    moq?: {
      enabled: boolean;
      minimumQuantity?: number;
      bulkDiscounts?: Array<{
        quantity: number;
        discountPercentage: number;
      }>;
    };
  };
  onChange: (value: AliExpressCriticalFieldsProps['value']) => void;
}

export function AliExpressCriticalFields({ value, onChange }: AliExpressCriticalFieldsProps) {
  const handleShippingMethodChange = (field: string, val: boolean | string | string[]) => {
    onChange({
      ...value,
      shippingMethod: {
        ...value.shippingMethod!,
        [field]: val,
      },
    });
  };

  const handleProcessingTimeChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      processingTime: {
        ...value.processingTime!,
        [field]: val,
      },
    });
  };

  const handleDropshippingChange = (field: string, val: boolean | string) => {
    onChange({
      ...value,
      dropshipping: {
        ...value.dropshipping!,
        [field]: val,
      },
    });
  };

  const handleSourcingChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      sourcing: {
        ...value.sourcing!,
        [field]: val,
      },
    });
  };

  const handleSourcingAlternativeAdd = () => {
    const alternatives = value.sourcing?.alternatives || [];
    onChange({
      ...value,
      sourcing: {
        ...value.sourcing!,
        alternatives: [
          ...alternatives,
          { productId: '', productName: '', price: 0, supplier: '' },
        ],
      },
    });
  };

  const handleSourcingAlternativeUpdate = (index: number, field: string, val: any) => {
    const alternatives = [...(value.sourcing?.alternatives || [])];
    alternatives[index] = { ...alternatives[index], [field]: val };
    onChange({
      ...value,
      sourcing: { ...value.sourcing!, alternatives },
    });
  };

  const handleSourcingAlternativeRemove = (index: number) => {
    const alternatives = (value.sourcing?.alternatives || []).filter((_, i) => i !== index);
    onChange({
      ...value,
      sourcing: { ...value.sourcing!, alternatives },
    });
  };

  const handleSupplierRatingChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      supplierRating: {
        ...value.supplierRating!,
        [field]: val,
      },
    });
  };

  const handleMoqChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      moq: {
        ...value.moq!,
        [field]: val,
      },
    });
  };

  const handleBulkDiscountAdd = () => {
    const discounts = value.moq?.bulkDiscounts || [];
    onChange({
      ...value,
      moq: {
        ...value.moq!,
        bulkDiscounts: [...discounts, { quantity: 0, discountPercentage: 0 }],
      },
    });
  };

  const handleBulkDiscountUpdate = (index: number, field: string, val: number) => {
    const discounts = [...(value.moq?.bulkDiscounts || [])];
    discounts[index] = { ...discounts[index], [field]: val };
    onChange({
      ...value,
      moq: { ...value.moq!, bulkDiscounts: discounts },
    });
  };

  const handleBulkDiscountRemove = (index: number) => {
    const discounts = (value.moq?.bulkDiscounts || []).filter((_, i) => i !== index);
    onChange({
      ...value,
      moq: { ...value.moq!, bulkDiscounts: discounts },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        AliExpress Critical Fields
      </h3>

      {/* Shipping Method Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Shipping Methods
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Shipping Methods
          </label>
          <div className="flex flex-wrap gap-2">
            {['ePacket', 'DHL', 'FedEx', 'UPS', 'EMS', 'China Post', 'Singapore Post'].map((method) => (
              <label key={method} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.shippingMethod?.methods?.includes(method) || false}
                  onChange={(e) => {
                    const methods = value.shippingMethod?.methods || [];
                    const updated = e.target.checked
                      ? [...methods, method]
                      : methods.filter((m) => m !== method);
                    handleShippingMethodChange('methods', updated);
                  }}
                  className="h-3 w-3 rounded border-gray-300 text-red-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{method}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.shippingMethod?.freeShipping || false}
              onChange={(e) => handleShippingMethodChange('freeShipping', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Free Shipping</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.shippingMethod?.trackingAvailable || false}
              onChange={(e) => handleShippingMethodChange('trackingAvailable', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Tracking Available</span>
          </label>
        </div>
        <Select
          label="Estimated Delivery Time"
          value={value.shippingMethod?.estimatedDelivery || ''}
          onChange={(e) => handleShippingMethodChange('estimatedDelivery', e.target.value)}
          options={[
            { value: '', label: 'Select...' },
            { value: '7-15', label: '7-15 days' },
            { value: '15-30', label: '15-30 days' },
            { value: '30-60', label: '30-60 days' },
            { value: '60-90', label: '60-90 days' },
          ]}
        />
      </div>

      {/* Processing Time Configuration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Processing Time
        </h4>
        <Input
          label="Processing Time (days)"
          type="number"
          value={value.processingTime?.days?.toString() || ''}
          onChange={(e) => handleProcessingTimeChange('days', parseInt(e.target.value) || 0)}
          placeholder="3"
          min={0}
          max={30}
          hint="Number of days to prepare order before shipping"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.processingTime?.businessDaysOnly || false}
              onChange={(e) => handleProcessingTimeChange('businessDaysOnly', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Business Days Only
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.processingTime?.customHandling || false}
              onChange={(e) => handleProcessingTimeChange('customHandling', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Custom Handling Required
            </span>
          </label>
        </div>
      </div>

      {/* Dropshipping Settings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Dropshipping Settings
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.dropshipping?.enabled || false}
              onChange={(e) => handleDropshippingChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.dropshipping?.enabled && (
          <div className="space-y-3 ml-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.dropshipping?.blindShipping || false}
                onChange={(e) => handleDropshippingChange('blindShipping', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Blind Shipping
                </span>
                <p className="text-xs text-gray-500">
                  No supplier information in package
                </p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.dropshipping?.noInvoice || false}
                onChange={(e) => handleDropshippingChange('noInvoice', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  No Invoice Included
                </span>
                <p className="text-xs text-gray-500">
                  Don't include invoice with original price
                </p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.dropshipping?.customPackaging || false}
                onChange={(e) => handleDropshippingChange('customPackaging', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Custom Packaging
                </span>
                <p className="text-xs text-gray-500">
                  Use your own branding/packaging
                </p>
              </div>
            </label>
            {value.dropshipping?.customPackaging && (
              <Input
                label="Packaging Details"
                value={value.dropshipping?.packagingDetails || ''}
                onChange={(e) => handleDropshippingChange('packagingDetails', e.target.value)}
                placeholder="Describe your custom packaging requirements..."
              />
            )}
          </div>
        )}
      </div>

      {/* Product Sourcing Alternatives */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Product Sourcing Alternatives
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.sourcing?.autoSource || false}
              onChange={(e) => handleSourcingChange('autoSource', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-Source Alternatives
            </span>
          </label>
        </div>
        {value.sourcing?.autoSource && (
          <div className="space-y-3 ml-6">
            <Input
              label="Minimum Profit Margin (%)"
              type="number"
              value={value.sourcing?.minProfitMargin?.toString() || ''}
              onChange={(e) => handleSourcingChange('minProfitMargin', parseFloat(e.target.value) || 0)}
              placeholder="20"
              min={0}
              max={100}
              hint="Only source alternatives with at least this profit margin"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alternative Products
                </label>
                <Button variant="outline" size="sm" onClick={handleSourcingAlternativeAdd}>
                  + Add Alternative
                </Button>
              </div>
              {value.sourcing?.alternatives?.map((alt, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Alternative {idx + 1}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleSourcingAlternativeRemove(idx)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Product ID"
                      value={alt.productId}
                      onChange={(e) => handleSourcingAlternativeUpdate(idx, 'productId', e.target.value)}
                      placeholder="Product ID"
                    />
                    <Input
                      label="Product Name"
                      value={alt.productName}
                      onChange={(e) => handleSourcingAlternativeUpdate(idx, 'productName', e.target.value)}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Price"
                      type="number"
                      value={alt.price.toString()}
                      onChange={(e) => handleSourcingAlternativeUpdate(idx, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <Input
                      label="Supplier"
                      value={alt.supplier}
                      onChange={(e) => handleSourcingAlternativeUpdate(idx, 'supplier', e.target.value)}
                      placeholder="Supplier name"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Supplier Rating Display */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Supplier Rating Display
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.supplierRating?.displayRating || false}
            onChange={(e) => handleSupplierRatingChange('displayRating', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-red-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Display Supplier Rating
          </span>
        </label>
        {value.supplierRating?.displayRating && (
          <div className="space-y-3 ml-6">
            <Input
              label="Minimum Supplier Rating"
              type="number"
              value={value.supplierRating?.minRating?.toString() || ''}
              onChange={(e) => handleSupplierRatingChange('minRating', parseFloat(e.target.value) || 0)}
              placeholder="4.5"
              min={0}
              max={5}
              step={0.1}
              hint="Only display suppliers with at least this rating"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.supplierRating?.showTransactionHistory || false}
                onChange={(e) => handleSupplierRatingChange('showTransactionHistory', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show Transaction History
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.supplierRating?.showResponseRate || false}
                onChange={(e) => handleSupplierRatingChange('showResponseRate', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show Response Rate
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Minimum Order Quantity */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Minimum Order Quantity (MOQ)
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.moq?.enabled || false}
              onChange={(e) => handleMoqChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable MOQ</span>
          </label>
        </div>
        {value.moq?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Minimum Quantity"
              type="number"
              value={value.moq?.minimumQuantity?.toString() || ''}
              onChange={(e) => handleMoqChange('minimumQuantity', parseInt(e.target.value) || 0)}
              placeholder="10"
              min={1}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bulk Discounts
                </label>
                <Button variant="outline" size="sm" onClick={handleBulkDiscountAdd}>
                  + Add Discount Tier
                </Button>
              </div>
              {value.moq?.bulkDiscounts?.map((discount, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    label=""
                    type="number"
                    value={discount.quantity.toString()}
                    onChange={(e) => handleBulkDiscountUpdate(idx, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Quantity"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">×</span>
                  <Input
                    label=""
                    type="number"
                    value={discount.discountPercentage.toString()}
                    onChange={(e) => handleBulkDiscountUpdate(idx, 'discountPercentage', parseFloat(e.target.value) || 0)}
                    placeholder="Discount %"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">% off</span>
                  <Button variant="ghost" size="sm" onClick={() => handleBulkDiscountRemove(idx)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
