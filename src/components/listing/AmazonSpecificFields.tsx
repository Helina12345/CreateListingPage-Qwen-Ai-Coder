// ============================================================
// ListingDesk Pro — Amazon-Specific Fields Component
// FBA/FBM, Backend Search Terms, Condition Guidelines, Brand Registry
// ============================================================

import React from 'react';
import { Package, Search, Shield, Info } from 'lucide-react';
import { Input, Select, Badge } from '../ui';

interface AmazonSpecificFieldsProps {
  value: {
    fulfillmentChannel?: 'FBA' | 'FBM';
    backendSearchTerms?: string;
    conditionGuideline?: string;
    brandRegistryStatus?: 'registered' | 'pending' | 'not_registered';
    brandRegistryId?: string;
    giftWrap?: boolean;
    giftMessage?: boolean;
    isAdult?: boolean;
    isHazmat?: boolean;
    hazmatDetails?: {
      regulated?: boolean;
      unpdp?: boolean;
      component?: string;
    };
    manufacturer?: string;
    mfrPartNumber?: string;
    searchTerms?: string;
    subjectMatter?: string;
    targetAudience?: string;
    otherItemAttributes?: string;
  };
  onChange: (value: AmazonSpecificFieldsProps['value']) => void;
}

export function AmazonSpecificFields({ value, onChange }: AmazonSpecificFieldsProps) {
  const conditionGuidelines = [
    { value: 'New', label: 'New', description: 'Brand new, unused, unopened, undamaged item' },
    { value: 'UsedLikeNew', label: 'Used - Like New', description: 'Perfect working condition, original packaging' },
    { value: 'UsedVeryGood', label: 'Used - Very Good', description: 'Shows limited wear, fully functional' },
    { value: 'UsedGood', label: 'Used - Good', description: 'Shows wear, fully functional' },
    { value: 'UsedAcceptable', label: 'Used - Acceptable', description: 'Considerable wear but fully functional' },
    { value: 'CollectibleLikeNew', label: 'Collectible - Like New', description: 'Perfect condition, original packaging' },
    { value: 'CollectibleVeryGood', label: 'Collectible - Very Good', description: 'Shows limited wear' },
    { value: 'CollectibleGood', label: 'Collectible - Good', description: 'Shows wear but intact' },
    { value: 'CollectibleAcceptable', label: 'Collectible - Acceptable', description: 'Shows significant wear but intact' },
    { value: 'Refurbished', label: 'Refurbished', description: 'Refurbished by manufacturer or seller' },
    { value: 'Club', label: 'Club Edition', description: 'Book club or reading group edition' },
  ];

  return (
    <div className="space-y-6">
      {/* Fulfillment Channel */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Fulfillment Channel
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ ...value, fulfillmentChannel: 'FBA' })}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              (value.fulfillmentChannel || 'FBA') === 'FBA'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">FBA</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Fulfilled by Amazon</strong>
              <br />
              Amazon stores, picks, packs, ships, and provides customer service.
            </p>
          </button>

          <button
            onClick={() => onChange({ ...value, fulfillmentChannel: 'FBM' })}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              value.fulfillmentChannel === 'FBM'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">FBM</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Fulfilled by Merchant</strong>
              <br />
              You store, pack, and ship orders yourself.
            </p>
          </button>
        </div>

        {value.fulfillmentChannel === 'FBA' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-xs text-orange-700 dark:text-orange-400">
              <strong>FBA Requirements:</strong> Products must be properly labeled with FNSKU,
              packaged according to Amazon's requirements, and shipped to an Amazon fulfillment center.
            </p>
          </div>
        )}
      </div>

      {/* Backend Search Terms */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Backend Search Terms
          </h4>
          <Badge variant="info">Max 250 bytes</Badge>
        </div>

        <Input
          label="Search Terms"
          value={value.backendSearchTerms || ''}
          onChange={(e) => onChange({ ...value, backendSearchTerms: e.target.value })}
          placeholder="Enter keywords that don't appear in title/description..."
          hint="These terms help customers find your product but aren't visible to them. Max 250 bytes."
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium">Backend Search Terms Guidelines:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Don't repeat words already in title/description</li>
                <li>Don't use brand names (yours or competitors')</li>
                <li>Don't use subjective claims (best, cheapest, etc.)</li>
                <li>Use single words, not phrases</li>
                <li>Separate words with spaces, not commas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Condition Guidelines */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Condition Guidelines
          </h4>
        </div>

        <Select
          label="Condition"
          value={value.conditionGuideline || 'New'}
          onChange={(e) => onChange({ ...value, conditionGuideline: e.target.value })}
          options={conditionGuidelines.map((g) => ({ value: g.value, label: g.label }))}
        />

        {value.conditionGuideline && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{conditionGuidelines.find((g) => g.value === value.conditionGuideline)?.label}:</strong>
              <br />
              {conditionGuidelines.find((g) => g.value === value.conditionGuideline)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Brand Registry */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Brand Registry
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ ...value, brandRegistryStatus: 'registered' })}
            className={`rounded-lg border p-3 text-center transition-all ${
              value.brandRegistryStatus === 'registered'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Registered</div>
            <div className="text-xs text-gray-500">Brand is registered</div>
          </button>
          <button
            onClick={() => onChange({ ...value, brandRegistryStatus: 'pending' })}
            className={`rounded-lg border p-3 text-center transition-all ${
              value.brandRegistryStatus === 'pending'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Pending</div>
            <div className="text-xs text-gray-500">Application in progress</div>
          </button>
          <button
            onClick={() => onChange({ ...value, brandRegistryStatus: 'not_registered' })}
            className={`rounded-lg border p-3 text-center transition-all ${
              (value.brandRegistryStatus || 'not_registered') === 'not_registered'
                ? 'border-gray-500 bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Not Registered</div>
            <div className="text-xs text-gray-500">No brand registry</div>
          </button>
        </div>

        {value.brandRegistryStatus === 'registered' && (
          <Input
            label="Brand Registry ID"
            value={value.brandRegistryId || ''}
            onChange={(e) => onChange({ ...value, brandRegistryId: e.target.value })}
            placeholder="Enter your Brand Registry ID"
            hint="Required for registered brands to access enhanced brand content"
          />
        )}
      </div>

      {/* Additional Amazon Fields */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Additional Amazon Fields
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Manufacturer"
            value={value.manufacturer || ''}
            onChange={(e) => onChange({ ...value, manufacturer: e.target.value })}
            placeholder="Manufacturer name"
          />
          <Input
            label="Mfr Part Number"
            value={value.mfrPartNumber || ''}
            onChange={(e) => onChange({ ...value, mfrPartNumber: e.target.value })}
            placeholder="Manufacturer part number"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Subject Matter"
            value={value.subjectMatter || ''}
            onChange={(e) => onChange({ ...value, subjectMatter: e.target.value })}
            placeholder="e.g., Fiction, Non-fiction, Educational"
          />
          <Input
            label="Target Audience"
            value={value.targetAudience || ''}
            onChange={(e) => onChange({ ...value, targetAudience: e.target.value })}
            placeholder="e.g., Adults, Children, Teens"
          />
        </div>

        <Input
          label="Other Item Attributes"
          value={value.otherItemAttributes || ''}
          onChange={(e) => onChange({ ...value, otherItemAttributes: e.target.value })}
          placeholder="Any other relevant attributes"
        />

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.giftWrap || false}
              onChange={(e) => onChange({ ...value, giftWrap: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Gift wrap available</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.giftMessage || false}
              onChange={(e) => onChange({ ...value, giftMessage: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Gift message available</span>
          </label>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.isAdult || false}
              onChange={(e) => onChange({ ...value, isAdult: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Adult product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.isHazmat || false}
              onChange={(e) => onChange({ ...value, isHazmat: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Contains hazardous materials</span>
          </label>
        </div>

        {value.isHazmat && (
          <div className="space-y-3 pl-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.hazmatDetails?.regulated || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    hazmatDetails: { ...value.hazmatDetails, regulated: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Regulated product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.hazmatDetails?.unpdp || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    hazmatDetails: { ...value.hazmatDetails, unpdp: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">UNPDP (United Nations Proper Shipping Name)</span>
            </label>
            <Input
              label="Component"
              value={value.hazmatDetails?.component || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  hazmatDetails: { ...value.hazmatDetails, component: e.target.value },
                })
              }
              placeholder="Hazardous component"
            />
          </div>
        )}
      </div>
    </div>
  );
}
