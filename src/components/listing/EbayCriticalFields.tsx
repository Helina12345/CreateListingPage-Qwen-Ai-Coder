// ============================================================
// ListingDesk Pro — eBay Critical Missing Fields Component
// Seller Policies, Promoted Listings, Best Offer, Private Listing
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';

interface EbayCriticalFieldsProps {
  value: {
    sellerPolicies?: {
      returnPolicyId?: string;
      paymentPolicyId?: string;
      shippingPolicyId?: string;
    };
    promotedListings?: {
      enabled: boolean;
      adRatePercentage?: number;
    };
    bestOffer?: {
      enabled: boolean;
      minimumPrice?: number;
      maximumPrice?: number;
      autoAcceptPrice?: number;
      autoDeclinePrice?: number;
    };
    privateListing?: boolean;
    lotListing?: {
      enabled: boolean;
      lotSize?: number;
      lotPrice?: number;
    };
    ebayPlus?: {
      eligible: boolean;
      fastNFree: boolean;
      oneDayHandling: boolean;
    };
    globalShipping?: {
      enabled: boolean;
      excludedCountries?: string[];
    };
    euCompliance?: {
      energyEfficiencyClass?: string;
      ceMarking: boolean;
      weeeRegistration?: string;
    };
  };
  onChange: (value: EbayCriticalFieldsProps['value']) => void;
}

export function EbayCriticalFields({ value, onChange }: EbayCriticalFieldsProps) {
  const handleSellerPolicyChange = (field: string, val: string) => {
    onChange({
      ...value,
      sellerPolicies: {
        ...value.sellerPolicies!,
        [field]: val,
      },
    });
  };

  const handleBestOfferChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      bestOffer: {
        ...value.bestOffer!,
        [field]: val,
      },
    });
  };

  const handleLotListingChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      lotListing: {
        ...value.lotListing!,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        eBay Critical Fields
      </h3>

      {/* Seller Policies Integration */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Seller Policies <span className="text-red-500">*</span>
        </h4>
        <div className="space-y-2">
          <Select
            label="Return Policy"
            value={value.sellerPolicies?.returnPolicyId || ''}
            onChange={(e) => handleSellerPolicyChange('returnPolicyId', e.target.value)}
            options={[
              { value: '', label: 'Select return policy...' },
              { value: 'rp1', label: '30 Day Returns - Buyer Pays' },
              { value: 'rp2', label: '30 Day Returns - Seller Pays' },
              { value: 'rp3', label: '60 Day Returns' },
              { value: 'rp4', label: 'No Returns' },
            ]}
          />
          <Select
            label="Payment Policy"
            value={value.sellerPolicies?.paymentPolicyId || ''}
            onChange={(e) => handleSellerPolicyChange('paymentPolicyId', e.target.value)}
            options={[
              { value: '', label: 'Select payment policy...' },
              { value: 'pp1', label: 'Immediate Payment Required' },
              { value: 'pp2', label: 'Payment Within 2 Days' },
              { value: 'pp3', label: 'Payment Within 5 Days' },
            ]}
          />
          <Select
            label="Shipping Policy"
            value={value.sellerPolicies?.shippingPolicyId || ''}
            onChange={(e) => handleSellerPolicyChange('shippingPolicyId', e.target.value)}
            options={[
              { value: '', label: 'Select shipping policy...' },
              { value: 'sp1', label: 'Free Standard Shipping' },
              { value: 'sp2', label: 'Calculated Shipping' },
              { value: 'sp3', label: 'Flat Rate Shipping' },
            ]}
          />
        </div>
        <p className="text-xs text-gray-500">
          Required: Link your listing to your seller policies
        </p>
      </div>

      {/* Promoted Listings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Promoted Listings
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.promotedListings?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  promotedListings: {
                    ...value.promotedListings!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.promotedListings?.enabled && (
          <div className="ml-6">
            <Input
              label="Ad Rate (%)"
              type="number"
              value={value.promotedListings?.adRatePercentage?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  promotedListings: {
                    ...value.promotedListings!,
                    adRatePercentage: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              placeholder="2.0"
              hint="Percentage of sale price paid as ad fee (typically 2-8%)"
            />
          </div>
        )}
      </div>

      {/* Best Offer Settings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Best Offer
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.bestOffer?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  bestOffer: {
                    ...value.bestOffer!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Allow Best Offer</span>
          </label>
        </div>
        {value.bestOffer?.enabled && (
          <div className="ml-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minimum Price"
                type="number"
                value={value.bestOffer?.minimumPrice?.toString() || ''}
                onChange={(e) => handleBestOfferChange('minimumPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Input
                label="Maximum Price"
                type="number"
                value={value.bestOffer?.maximumPrice?.toString() || ''}
                onChange={(e) => handleBestOfferChange('maximumPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Auto-Accept Price"
                type="number"
                value={value.bestOffer?.autoAcceptPrice?.toString() || ''}
                onChange={(e) => handleBestOfferChange('autoAcceptPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                hint="Automatically accept offers at or above this price"
              />
              <Input
                label="Auto-Decline Price"
                type="number"
                value={value.bestOffer?.autoDeclinePrice?.toString() || ''}
                onChange={(e) => handleBestOfferChange('autoDeclinePrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                hint="Automatically decline offers below this price"
              />
            </div>
          </div>
        )}
      </div>

      {/* Private Listing */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.privateListing || false}
            onChange={(e) => onChange({ ...value, privateListing: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Private Listing
            </span>
            <p className="text-xs text-gray-500">
              Hide bidder information (required for adult items)
            </p>
          </div>
        </label>
      </div>

      {/* Lot/Bulk Listing */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Lot/Bulk Listing
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.lotListing?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  lotListing: {
                    ...value.lotListing!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Sell as Lot</span>
          </label>
        </div>
        {value.lotListing?.enabled && (
          <div className="ml-6 grid grid-cols-2 gap-3">
            <Input
              label="Lot Size"
              type="number"
              value={value.lotListing?.lotSize?.toString() || ''}
              onChange={(e) => handleLotListingChange('lotSize', parseInt(e.target.value) || 0)}
              placeholder="10"
              hint="Number of items per lot"
            />
            <Input
              label="Lot Price"
              type="number"
              value={value.lotListing?.lotPrice?.toString() || ''}
              onChange={(e) => handleLotListingChange('lotPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              hint="Price for entire lot"
            />
          </div>
        )}
      </div>

      {/* eBay Plus Eligibility */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          eBay Plus Eligibility
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.ebayPlus?.eligible || false}
            onChange={(e) =>
              onChange({
                ...value,
                ebayPlus: { ...value.ebayPlus!, eligible: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">eBay Plus Eligible</span>
            <p className="text-xs text-gray-500">
              Must meet fast shipping and handling requirements
            </p>
          </div>
        </label>
        {value.ebayPlus?.eligible && (
          <div className="ml-6 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.ebayPlus?.fastNFree || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ebayPlus: { ...value.ebayPlus!, fastNFree: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Fast 'N Free</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.ebayPlus?.oneDayHandling || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ebayPlus: { ...value.ebayPlus!, oneDayHandling: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">1-Day Handling Time</span>
            </label>
          </div>
        )}
      </div>

      {/* Global Shipping Program */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Global Shipping Program
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.globalShipping?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  globalShipping: {
                    ...value.globalShipping!,
                    enabled: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.globalShipping?.enabled && (
          <div className="ml-6">
            <p className="text-xs text-gray-500 mb-2">
              Excluded Countries (cannot ship to these countries)
            </p>
            <div className="flex flex-wrap gap-2">
              {['Cuba', 'Iran', 'North Korea', 'Syria', 'Russia'].map((country) => (
                <label key={country} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.globalShipping?.excludedCountries?.includes(country) || false}
                    onChange={(e) => {
                      const excluded = value.globalShipping?.excludedCountries || [];
                      const updated = e.target.checked
                        ? [...excluded, country]
                        : excluded.filter((c) => c !== country);
                      onChange({
                        ...value,
                        globalShipping: { ...value.globalShipping!, excludedCountries: updated },
                      });
                    }}
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{country}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EU Compliance */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          EU Compliance
        </h4>
        <div className="space-y-2">
          <Select
            label="Energy Efficiency Class"
            value={value.euCompliance?.energyEfficiencyClass || ''}
            onChange={(e) =>
              onChange({
                ...value,
                euCompliance: {
                  ...value.euCompliance!,
                  energyEfficiencyClass: e.target.value,
                },
              })
            }
            options={[
              { value: '', label: 'Select class...' },
              { value: 'A+++', label: 'A+++ (Most Efficient)' },
              { value: 'A++', label: 'A++' },
              { value: 'A+', label: 'A+' },
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
              { value: 'D', label: 'D' },
              { value: 'E', label: 'E' },
              { value: 'F', label: 'F' },
              { value: 'G', label: 'G (Least Efficient)' },
            ]}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.euCompliance?.ceMarking || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  euCompliance: { ...value.euCompliance!, ceMarking: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">CE Marking Required</span>
          </label>
          <Input
            label="WEEE Registration Number"
            value={value.euCompliance?.weeeRegistration || ''}
            onChange={(e) =>
              onChange({
                ...value,
                euCompliance: { ...value.euCompliance!, weeeRegistration: e.target.value },
              })
            }
            placeholder="Enter WEEE registration number..."
            hint="Required for electrical/electronic products sold in EU"
          />
        </div>
      </div>
    </div>
  );
}
