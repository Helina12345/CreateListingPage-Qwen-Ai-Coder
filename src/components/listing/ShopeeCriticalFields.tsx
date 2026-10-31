// ============================================================
// ListingDesk Pro — Shopee Critical Missing Fields Component
// Mall Eligibility, Installment Plans, Vouchers, Add-on Deals, Chat Response, Preferred Seller
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';

interface ShopeeCriticalFieldsProps {
  value: {
    mallEligibility?: {
      eligible: boolean;
      authenticityGuarantee?: boolean;
      qualityAssurance?: boolean;
      returnPolicy?: string;
    };
    installmentPlan?: {
      enabled: boolean;
      periods?: number[];
      interestRate?: number;
      minOrderAmount?: number;
    };
    voucher?: {
      shopVoucher?: {
        enabled: boolean;
        discountType?: 'percentage' | 'fixed';
        discountValue?: number;
        minOrderAmount?: number;
        maxDiscount?: number;
      };
      productVoucher?: {
        enabled: boolean;
        discountType?: 'percentage' | 'fixed';
        discountValue?: number;
        minOrderAmount?: number;
        maxDiscount?: number;
      };
    };
    addOnDeal?: {
      enabled: boolean;
      mainProductId?: string;
      addOnProducts?: string[];
      addOnPrice?: number;
    };
    chatResponse?: {
      responseTime?: number;
      autoReply?: boolean;
      autoReplyMessage?: string;
    };
    preferredSeller?: {
      eligible: boolean;
      cancellationRate?: number;
      lateShipmentRate?: number;
      returnRate?: number;
    };
  };
  onChange: (value: ShopeeCriticalFieldsProps['value']) => void;
}

export function ShopeeCriticalFields({ value, onChange }: ShopeeCriticalFieldsProps) {
  const handleMallEligibilityChange = (field: string, val: boolean | string) => {
    onChange({
      ...value,
      mallEligibility: {
        ...value.mallEligibility!,
        [field]: val,
      },
    });
  };

  const handleInstallmentPlanChange = (field: string, val: boolean | number | number[]) => {
    onChange({
      ...value,
      installmentPlan: {
        ...value.installmentPlan!,
        [field]: val,
      },
    });
  };

  const handleShopVoucherChange = (field: string, val: boolean | number | string) => {
    onChange({
      ...value,
      voucher: {
        ...value.voucher!,
        shopVoucher: {
          ...value.voucher?.shopVoucher!,
          [field]: val,
        },
      },
    });
  };

  const handleProductVoucherChange = (field: string, val: boolean | number | string) => {
    onChange({
      ...value,
      voucher: {
        ...value.voucher!,
        productVoucher: {
          ...value.voucher?.productVoucher!,
          [field]: val,
        },
      },
    });
  };

  const handleAddOnDealChange = (field: string, val: boolean | number | string | string[]) => {
    onChange({
      ...value,
      addOnDeal: {
        ...value.addOnDeal!,
        [field]: val,
      },
    });
  };

  const handleChatResponseChange = (field: string, val: boolean | number | string) => {
    onChange({
      ...value,
      chatResponse: {
        ...value.chatResponse!,
        [field]: val,
      },
    });
  };

  const handlePreferredSellerChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      preferredSeller: {
        ...value.preferredSeller!,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Shopee Critical Fields
      </h3>

      {/* Shopee Mall Eligibility */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Shopee Mall Eligibility
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.mallEligibility?.eligible || false}
              onChange={(e) => handleMallEligibilityChange('eligible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mall Eligible</span>
          </label>
        </div>
        {value.mallEligibility?.eligible && (
          <div className="space-y-3 ml-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.mallEligibility?.authenticityGuarantee || false}
                onChange={(e) => handleMallEligibilityChange('authenticityGuarantee', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                100% Authenticity Guarantee
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.mallEligibility?.qualityAssurance || false}
                onChange={(e) => handleMallEligibilityChange('qualityAssurance', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Quality Assurance Certified
              </span>
            </label>
            <Select
              label="Return Policy"
              value={value.mallEligibility?.returnPolicy || ''}
              onChange={(e) => handleMallEligibilityChange('returnPolicy', e.target.value)}
              options={[
                { value: '', label: 'Select policy...' },
                { value: '7_days', label: '7 Days Return' },
                { value: '15_days', label: '15 Days Return' },
                { value: '30_days', label: '30 Days Return' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Installment Plan Options */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Installment Plan
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.installmentPlan?.enabled || false}
              onChange={(e) => handleInstallmentPlanChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.installmentPlan?.enabled && (
          <div className="space-y-3 ml-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Periods (months)
              </label>
              <div className="flex flex-wrap gap-2">
                {[3, 6, 9, 12, 18, 24].map((period) => (
                  <label key={period} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value.installmentPlan?.periods?.includes(period) || false}
                      onChange={(e) => {
                        const periods = value.installmentPlan?.periods || [];
                        const updated = e.target.checked
                          ? [...periods, period]
                          : periods.filter((p) => p !== period);
                        handleInstallmentPlanChange('periods', updated);
                      }}
                      className="h-3 w-3 rounded border-gray-300 text-orange-600"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{period}m</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Interest Rate (%)"
                type="number"
                value={value.installmentPlan?.interestRate?.toString() || ''}
                onChange={(e) => handleInstallmentPlanChange('interestRate', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={100}
                step={0.1}
              />
              <Input
                label="Min Order Amount"
                type="number"
                value={value.installmentPlan?.minOrderAmount?.toString() || ''}
                onChange={(e) => handleInstallmentPlanChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min={0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Voucher/Discount Setup */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Vouchers & Discounts
        </h4>

        {/* Shop Voucher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Shop Voucher
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.voucher?.shopVoucher?.enabled || false}
                onChange={(e) => handleShopVoucherChange('enabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Enable</span>
            </label>
          </div>
          {value.voucher?.shopVoucher?.enabled && (
            <div className="space-y-2 ml-6">
              <Select
                label="Discount Type"
                value={value.voucher.shopVoucher.discountType || 'percentage'}
                onChange={(e) => handleShopVoucherChange('discountType', e.target.value)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Discount Value"
                  type="number"
                  value={value.voucher.shopVoucher.discountValue?.toString() || ''}
                  onChange={(e) => handleShopVoucherChange('discountValue', parseFloat(e.target.value) || 0)}
                  placeholder="10"
                />
                <Input
                  label="Min Order"
                  type="number"
                  value={value.voucher.shopVoucher.minOrderAmount?.toString() || ''}
                  onChange={(e) => handleShopVoucherChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                <Input
                  label="Max Discount"
                  type="number"
                  value={value.voucher.shopVoucher.maxDiscount?.toString() || ''}
                  onChange={(e) => handleShopVoucherChange('maxDiscount', parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Voucher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Voucher
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.voucher?.productVoucher?.enabled || false}
                onChange={(e) => handleProductVoucherChange('enabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Enable</span>
            </label>
          </div>
          {value.voucher?.productVoucher?.enabled && (
            <div className="space-y-2 ml-6">
              <Select
                label="Discount Type"
                value={value.voucher.productVoucher.discountType || 'percentage'}
                onChange={(e) => handleProductVoucherChange('discountType', e.target.value)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Discount Value"
                  type="number"
                  value={value.voucher.productVoucher.discountValue?.toString() || ''}
                  onChange={(e) => handleProductVoucherChange('discountValue', parseFloat(e.target.value) || 0)}
                  placeholder="10"
                />
                <Input
                  label="Min Order"
                  type="number"
                  value={value.voucher.productVoucher.minOrderAmount?.toString() || ''}
                  onChange={(e) => handleProductVoucherChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                <Input
                  label="Max Discount"
                  type="number"
                  value={value.voucher.productVoucher.maxDiscount?.toString() || ''}
                  onChange={(e) => handleProductVoucherChange('maxDiscount', parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add-on Deal Configuration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Add-on Deal
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.addOnDeal?.enabled || false}
              onChange={(e) => handleAddOnDealChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.addOnDeal?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Main Product ID"
              value={value.addOnDeal?.mainProductId || ''}
              onChange={(e) => handleAddOnDealChange('mainProductId', e.target.value)}
              placeholder="Enter main product ID..."
            />
            <Input
              label="Add-on Product IDs (comma-separated)"
              value={value.addOnDeal?.addOnProducts?.join(', ') || ''}
              onChange={(e) => handleAddOnDealChange('addOnProducts', e.target.value.split(',').map(s => s.trim()))}
              placeholder="prod1, prod2, prod3"
            />
            <Input
              label="Add-on Price"
              type="number"
              value={value.addOnDeal?.addOnPrice?.toString() || ''}
              onChange={(e) => handleAddOnDealChange('addOnPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      {/* Chat Response Rate */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Chat Response Settings
        </h4>
        <div className="space-y-3">
          <Input
            label="Target Response Time (minutes)"
            type="number"
            value={value.chatResponse?.responseTime?.toString() || ''}
            onChange={(e) => handleChatResponseChange('responseTime', parseInt(e.target.value) || 0)}
            placeholder="60"
            min={0}
            hint="Target response time to maintain chat response rate"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.chatResponse?.autoReply || false}
              onChange={(e) => handleChatResponseChange('autoReply', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable Auto-Reply
            </span>
          </label>
          {value.chatResponse?.autoReply && (
            <div className="ml-6">
              <Input
                label="Auto-Reply Message"
                value={value.chatResponse?.autoReplyMessage || ''}
                onChange={(e) => handleChatResponseChange('autoReplyMessage', e.target.value)}
                placeholder="Thank you for your message! We'll get back to you soon..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Preferred Seller Status */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Preferred Seller Status
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.preferredSeller?.eligible || false}
              onChange={(e) => handlePreferredSellerChange('eligible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Eligible</span>
          </label>
        </div>
        {value.preferredSeller?.eligible && (
          <div className="space-y-3 ml-6">
            <p className="text-xs text-gray-500">
              Maintain these metrics to keep Preferred Seller status:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Cancellation Rate (%)"
                type="number"
                value={value.preferredSeller?.cancellationRate?.toString() || ''}
                onChange={(e) => handlePreferredSellerChange('cancellationRate', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={100}
                step={0.1}
              />
              <Input
                label="Late Shipment (%)"
                type="number"
                value={value.preferredSeller?.lateShipmentRate?.toString() || ''}
                onChange={(e) => handlePreferredSellerChange('lateShipmentRate', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={100}
                step={0.1}
              />
              <Input
                label="Return Rate (%)"
                type="number"
                value={value.preferredSeller?.returnRate?.toString() || ''}
                onChange={(e) => handlePreferredSellerChange('returnRate', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={100}
                step={0.1}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
