// ============================================================
// ListingDesk Pro — eBay-Specific Fields Component
// Auction/Fixed Price, Shipping Services, Payment Methods
// ============================================================

import React from 'react';
import { Gavel, DollarSign, CreditCard, Clock } from 'lucide-react';
import { Input, Select } from '../ui';

interface EbaySpecificFieldsProps {
  value: {
    listingFormat?: 'fixed' | 'auction';
    startPrice?: string;
    buyItNowPrice?: string;
    reservePrice?: string;
    auctionDuration?: string;
    auctionEndTime?: string;
    shippingService?: string;
    handlingTime?: string;
    expeditedShipping?: boolean;
    freeShipping?: boolean;
    paymentMethods?: string[];
    returnPolicy?: {
      acceptsReturns?: boolean;
      days?: number;
      whoPaysShipping?: 'buyer' | 'seller';
      description?: string;
    };
  };
  onChange: (value: EbaySpecificFieldsProps['value']) => void;
}

export function EbaySpecificFields({ value, onChange }: EbaySpecificFieldsProps) {
  const paymentOptions = [
    { id: 'paypal', label: 'PayPal', icon: '🅿️' },
    { id: 'credit_card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', label: 'Google Pay', icon: '🔵' },
  ];

  const shippingServices = [
    { value: 'usps_first', label: 'USPS First Class (3-5 days)' },
    { value: 'usps_priority', label: 'USPS Priority Mail (2-3 days)' },
    { value: 'usps_express', label: 'USPS Priority Mail Express (1-2 days)' },
    { value: 'ups_ground', label: 'UPS Ground (3-7 days)' },
    { value: 'ups_2day', label: 'UPS 2nd Day Air (2 days)' },
    { value: 'ups_next', label: 'UPS Next Day Air (1 day)' },
    { value: 'fedex_ground', label: 'FedEx Ground (3-7 days)' },
    { value: 'fedex_2day', label: 'FedEx 2Day (2 days)' },
    { value: 'fedex_overnight', label: 'FedEx Overnight (1 day)' },
    { value: 'dhl_express', label: 'DHL Express (2-4 days)' },
  ];

  return (
    <div className="space-y-6">
      {/* Listing Format */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Listing Format
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ ...value, listingFormat: 'fixed' })}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              (value.listingFormat || 'fixed') === 'fixed'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Fixed Price</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sell at a set price. Buyer pays the listed price.
            </p>
          </button>

          <button
            onClick={() => onChange({ ...value, listingFormat: 'auction' })}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              value.listingFormat === 'auction'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Gavel className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Auction</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Buyers bid on your item. Highest bidder wins.
            </p>
          </button>
        </div>

        {/* Fixed Price Fields */}
        {(value.listingFormat || 'fixed') === 'fixed' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price"
              type="number"
              value={value.startPrice || ''}
              onChange={(e) => onChange({ ...value, startPrice: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Buy It Now Price (optional)"
              type="number"
              value={value.buyItNowPrice || ''}
              onChange={(e) => onChange({ ...value, buyItNowPrice: e.target.value })}
              placeholder="0.00"
              hint="Allow buyers to purchase immediately"
            />
          </div>
        )}

        {/* Auction Fields */}
        {value.listingFormat === 'auction' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Starting Bid"
                type="number"
                value={value.startPrice || ''}
                onChange={(e) => onChange({ ...value, startPrice: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Reserve Price (optional)"
                type="number"
                value={value.reservePrice || ''}
                onChange={(e) => onChange({ ...value, reservePrice: e.target.value })}
                placeholder="0.00"
                hint="Minimum price you'll accept"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Auction Duration"
                value={value.auctionDuration || '7'}
                onChange={(e) => onChange({ ...value, auctionDuration: e.target.value })}
                options={[
                  { value: '1', label: '1 day' },
                  { value: '3', label: '3 days' },
                  { value: '5', label: '5 days' },
                  { value: '7', label: '7 days' },
                  { value: '10', label: '10 days' },
                ]}
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={value.auctionEndTime || ''}
                onChange={(e) => onChange({ ...value, auctionEndTime: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Buy It Now Price (optional)"
                type="number"
                value={value.buyItNowPrice || ''}
                onChange={(e) => onChange({ ...value, buyItNowPrice: e.target.value })}
                placeholder="0.00"
                hint="Allow immediate purchase"
              />
            </div>
          </div>
        )}
      </div>

      {/* Shipping */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Shipping Service
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Primary Shipping Service"
            value={value.shippingService || ''}
            onChange={(e) => onChange({ ...value, shippingService: e.target.value })}
            options={[
              { value: '', label: 'Select a service...' },
              ...shippingServices,
            ]}
          />
          <Select
            label="Handling Time"
            value={value.handlingTime || '1'}
            onChange={(e) => onChange({ ...value, handlingTime: e.target.value })}
            options={[
              { value: '0', label: 'Same day' },
              { value: '1', label: '1 business day' },
              { value: '2', label: '2 business days' },
              { value: '3', label: '3 business days' },
              { value: '5', label: '5 business days' },
              { value: '7', label: '7 business days' },
              { value: '10', label: '10 business days' },
              { value: '15', label: '15 business days' },
              { value: '21', label: '21 business days' },
              { value: '30', label: '30 business days' },
            ]}
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.expeditedShipping || false}
              onChange={(e) => onChange({ ...value, expeditedShipping: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Offer expedited shipping</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.freeShipping || false}
              onChange={(e) => onChange({ ...value, freeShipping: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Free shipping</span>
          </label>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Payment Methods
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {paymentOptions.map((option) => {
            const isSelected = (value.paymentMethods || ['paypal', 'credit_card']).includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const current = value.paymentMethods || ['paypal', 'credit_card'];
                    const updated = e.target.checked
                      ? [...current, option.id]
                      : current.filter((p) => p !== option.id);
                    onChange({ ...value, paymentMethods: updated });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Return Policy */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Return Policy
        </h4>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.returnPolicy?.acceptsReturns || false}
            onChange={(e) =>
              onChange({
                ...value,
                returnPolicy: {
                  ...value.returnPolicy,
                  acceptsReturns: e.target.checked,
                },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Accept returns</span>
        </label>

        {value.returnPolicy?.acceptsReturns && (
          <div className="space-y-3 pl-6">
            <Select
              label="Return Window"
              value={value.returnPolicy.days?.toString() || '30'}
              onChange={(e) =>
                onChange({
                  ...value,
                  returnPolicy: {
                    ...value.returnPolicy,
                    days: parseInt(e.target.value),
                  },
                })
              }
              options={[
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
                { value: '60', label: '60 days' },
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Who pays return shipping?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onChange({
                      ...value,
                      returnPolicy: { ...value.returnPolicy, whoPaysShipping: 'buyer' },
                    })
                  }
                  className={`rounded-lg border p-2 text-sm ${
                    value.returnPolicy.whoPaysShipping === 'buyer'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  Buyer
                </button>
                <button
                  onClick={() =>
                    onChange({
                      ...value,
                      returnPolicy: { ...value.returnPolicy, whoPaysShipping: 'seller' },
                    })
                  }
                  className={`rounded-lg border p-2 text-sm ${
                    value.returnPolicy.whoPaysShipping === 'seller'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  Seller
                </button>
              </div>
            </div>
            <Input
              label="Return Policy Description"
              value={value.returnPolicy.description || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  returnPolicy: { ...value.returnPolicy, description: e.target.value },
                })
              }
              placeholder="Describe your return policy..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
