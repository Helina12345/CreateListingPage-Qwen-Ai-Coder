// ============================================================
// ListingDesk Pro — Shipping & Returns Configuration Component
// Shipping profile selection and return policy configuration
// ============================================================

import React, { useState } from 'react';
import { Truck, RotateCcw, Plus } from 'lucide-react';
import { Button, Input, Select } from '../ui';
import type { MarketplaceId } from '../../types';

interface ShippingReturnsConfigProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    shippingProfile?: string;
    fulfillmentMethod?: 'FBM' | 'FBA';
    returnPolicy?: {
      acceptsReturns: boolean;
      days?: number;
      whoPaysShipping?: 'buyer' | 'seller';
    };
  };
  onChange: (value: ShippingReturnsConfigProps['value']) => void;
}

export function ShippingReturnsConfig({ selectedMarketplaces, value, onChange }: ShippingReturnsConfigProps) {
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  const shippingProfiles = [
    { id: 'standard', name: 'Standard (5-7 days)', cost: '5.99' },
    { id: 'express', name: 'Express (2-3 days)', cost: '12.99' },
    { id: 'overnight', name: 'Overnight (1 day)', cost: '24.99' },
    { id: 'free', name: 'Free Shipping', cost: '0.00' },
  ];

  if (selectedMarketplaces.length === 0) {
    return null;
  }

  const needsFulfillmentMethod = selectedMarketplaces.includes('amazon');
  const needsReturnPolicy = selectedMarketplaces.some((mp) => ['ebay', 'amazon', 'walmart'].includes(mp));

  return (
    <div className="space-y-4">
      {/* Fulfillment Method (Amazon) */}
      {needsFulfillmentMethod && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fulfillment Method (Amazon)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChange({ ...value, fulfillmentMethod: 'FBM' })}
              className={`rounded-lg border p-4 text-left transition-all ${
                value.fulfillmentMethod === 'FBM'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-gray-900 dark:text-gray-100">FBM</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fulfilled by Merchant - You ship the product
              </p>
            </button>

            <button
              onClick={() => onChange({ ...value, fulfillmentMethod: 'FBA' })}
              className={`rounded-lg border p-4 text-left transition-all ${
                value.fulfillmentMethod === 'FBA'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-gray-900 dark:text-gray-100">FBA</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fulfilled by Amazon - Amazon ships the product
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Shipping Profile Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Shipping Profile
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateProfile(!showCreateProfile)}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Create New
          </Button>
        </div>

        {showCreateProfile && (
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 space-y-3">
            <Input label="Profile Name" placeholder="e.g., Standard Shipping" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Handling Time (days)" type="number" placeholder="1-3" />
              <Input label="Shipping Cost" type="number" placeholder="5.99" />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm">Save Profile</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateProfile(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shippingProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onChange({ ...value, shippingProfile: profile.id })}
              className={`rounded-lg border p-3 text-left transition-all ${
                value.shippingProfile === profile.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {profile.name}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  ${profile.cost}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Return Policy Configuration */}
      {needsReturnPolicy && (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Return Policy
            </h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="acceptsReturns"
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
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label htmlFor="acceptsReturns" className="text-sm text-gray-700 dark:text-gray-300">
                Accept returns
              </label>
            </div>

            {value.returnPolicy?.acceptsReturns && (
              <div className="space-y-3 pl-7">
                <Select
                  label="Return Window"
                  value={value.returnPolicy?.days?.toString() || '30'}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      returnPolicy: {
                        acceptsReturns: value.returnPolicy?.acceptsReturns || false,
                        days: parseInt(e.target.value),
                        whoPaysShipping: value.returnPolicy?.whoPaysShipping,
                      },
                    })
                  }
                  options={[
                    { value: '14', label: '14 days' },
                    { value: '30', label: '30 days' },
                    { value: '60', label: '60 days' },
                    { value: '90', label: '90 days' },
                  ]}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Who pays for return shipping?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        onChange({
                          ...value,
                          returnPolicy: {
                            acceptsReturns: value.returnPolicy?.acceptsReturns || false,
                            days: value.returnPolicy?.days,
                            whoPaysShipping: 'buyer',
                          },
                        })
                      }
                      className={`rounded-lg border p-2 text-sm ${
                        value.returnPolicy?.whoPaysShipping === 'buyer'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      Buyer
                    </button>
                    <button
                      onClick={() =>
                        onChange({
                          ...value,
                          returnPolicy: {
                            acceptsReturns: value.returnPolicy?.acceptsReturns || false,
                            days: value.returnPolicy?.days,
                            whoPaysShipping: 'seller',
                          },
                        })
                      }
                      className={`rounded-lg border p-2 text-sm ${
                        value.returnPolicy?.whoPaysShipping === 'seller'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      Seller
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
