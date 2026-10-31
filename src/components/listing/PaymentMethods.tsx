// ============================================================
// ListingDesk Pro — Payment Methods Component
// Handles payment method selection per marketplace
// ============================================================

import React from 'react';
import { CreditCard } from 'lucide-react';
import { Badge } from '../ui';
import type { MarketplaceId } from '../../types';

interface PaymentMethodsProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    acceptedPayments: string[];
  };
  onChange: (value: PaymentMethodsProps['value']) => void;
}

export function PaymentMethods({ selectedMarketplaces, value, onChange }: PaymentMethodsProps) {
  if (selectedMarketplaces.length === 0) {
    return null;
  }

  const paymentMethods = [
    { id: 'credit_card', label: 'Credit Card', icon: '💳' },
    { id: 'debit_card', label: 'Debit Card', icon: '💳' },
    { id: 'paypal', label: 'PayPal', icon: '🅿️' },
    { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', label: 'Google Pay', icon: '🔵' },
    { id: 'amazon_pay', label: 'Amazon Pay', icon: '📦' },
    { id: 'shopify_payments', label: 'Shopify Payments', icon: '🛍️' },
    { id: 'etsy_payments', label: 'Etsy Payments', icon: '🎨' },
    { id: 'ebay_managed', label: 'eBay Managed Payments', icon: '🏪' },
  ];

  // Get marketplace-specific payment methods
  const getMarketplacePayments = (mpId: MarketplaceId): string[] => {
    const map: Record<MarketplaceId, string[]> = {
      ebay: ['credit_card', 'debit_card', 'paypal', 'ebay_managed'],
      amazon: ['credit_card', 'debit_card', 'amazon_pay'],
      shopify: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'shopify_payments'],
      etsy: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'etsy_payments'],
      walmart: ['credit_card', 'debit_card', 'paypal'],
      tiktok_shop: ['credit_card', 'debit_card'],
      shopee: ['credit_card', 'debit_card'],
      lazada: ['credit_card', 'debit_card'],
      kohls: ['credit_card', 'debit_card', 'paypal'],
    };
    return map[mpId] || [];
  };

  // Get all available payment methods for selected marketplaces
  const availablePayments = Array.from(
    new Set(selectedMarketplaces.flatMap(mp => getMarketplacePayments(mp)))
  );

  const handleTogglePayment = (paymentId: string) => {
    const current = value.acceptedPayments || [];
    const updated = current.includes(paymentId)
      ? current.filter(p => p !== paymentId)
      : [...current, paymentId];

    onChange({ acceptedPayments: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Methods
        </h3>
      </div>

      <p className="text-xs text-gray-500">
        Select which payment methods to accept. Note: Some marketplaces have mandatory payment methods.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods
          .filter(pm => availablePayments.includes(pm.id))
          .map((payment) => {
            const isAccepted = (value.acceptedPayments || []).includes(payment.id);

            // Check if this is mandatory for any selected marketplace
            const isMandatory = selectedMarketplaces.some(mp => {
              const mpPayments = getMarketplacePayments(mp);
              // For most marketplaces, credit card is mandatory
              return payment.id === 'credit_card';
            });

            return (
              <label
                key={payment.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isAccepted
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAccepted}
                  onChange={() => handleTogglePayment(payment.id)}
                  disabled={isMandatory}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-lg">{payment.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {payment.label}
                    </span>
                    {isMandatory && <Badge variant="warning">Required</Badge>}
                  </div>
                </div>
              </label>
            );
          })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Payment methods are configured at the marketplace level.
          Changes here will apply to all selected marketplaces. Some marketplaces may
          require specific payment methods (e.g., eBay Managed Payments, Shopify Payments).
        </p>
      </div>
    </div>
  );
}
