// ============================================================
// ListingDesk Pro — Etsy-Specific Fields Component
// Renew on Sold, Supply Declaration, Vintage Verification
// ============================================================

import React from 'react';
import { RefreshCw, Package, Clock } from 'lucide-react';
import { Select } from '../ui';

interface EtsySpecificFieldsProps {
  value: {
    whoMade?: 'i_did' | 'someone_else' | 'company';
    whenMade?: 'made_to_order' | '2020_2025' | '2010_2019' | '2000_2009' | 'before_2000';
    isSupply?: boolean;
    isVintage?: boolean;
    vintageEra?: string;
    renewOnSold?: boolean;
    shouldAutoRenew?: boolean;
    isCustomizable?: boolean;
    isPersonalizable?: boolean;
    isDigital?: boolean;
    digitalDelivery?: string[];
  };
  onChange: (value: EtsySpecificFieldsProps['value']) => void;
}

export function EtsySpecificFields({ value, onChange }: EtsySpecificFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Who Made It */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Who Made It?
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ ...value, whoMade: 'i_did' })}
            className={`rounded-lg border-2 p-3 text-center transition-all ${
              (value.whoMade || 'i_did') === 'i_did'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-sm font-medium">I Did</div>
            <div className="text-xs text-gray-500">Handmade by me</div>
          </button>
          <button
            onClick={() => onChange({ ...value, whoMade: 'someone_else' })}
            className={`rounded-lg border-2 p-3 text-center transition-all ${
              value.whoMade === 'someone_else'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-sm font-medium">Someone Else</div>
            <div className="text-xs text-gray-500">Made by a collaborator</div>
          </button>
          <button
            onClick={() => onChange({ ...value, whoMade: 'company' })}
            className={`rounded-lg border-2 p-3 text-center transition-all ${
              value.whoMade === 'company'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-sm font-medium">Company</div>
            <div className="text-xs text-gray-500">Made by a company</div>
          </button>
        </div>
      </div>

      {/* When Made */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          When Was It Made?
        </h4>
        <Select
          value={value.whenMade || 'made_to_order'}
          onChange={(e) => onChange({ ...value, whenMade: e.target.value as any })}
          options={[
            { value: 'made_to_order', label: 'Made to Order' },
            { value: '2020_2025', label: '2020 - 2025' },
            { value: '2010_2019', label: '2010 - 2019' },
            { value: '2000_2009', label: '2000 - 2009' },
            { value: 'before_2000', label: 'Before 2000 (Vintage)' },
          ]}
        />
      </div>

      {/* Supply Declaration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Supply Declaration
          </h4>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isSupply || false}
            onChange={(e) => onChange({ ...value, isSupply: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              This is a craft supply
            </span>
            <p className="text-xs text-gray-500">
              Supplies are tools, materials, or ingredients used to create items
            </p>
          </div>
        </label>
      </div>

      {/* Vintage Verification */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Vintage Item
          </h4>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isVintage || false}
            onChange={(e) => onChange({ ...value, isVintage: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              This is a vintage item (20+ years old)
            </span>
            <p className="text-xs text-gray-500">
              Items must be at least 20 years old to be listed as vintage
            </p>
          </div>
        </label>

        {value.isVintage && (
          <div className="pl-6">
            <Select
              label="Vintage Era"
              value={value.vintageEra || ''}
              onChange={(e) => onChange({ ...value, vintageEra: e.target.value })}
              options={[
                { value: '', label: 'Select era...' },
                { value: '2000s', label: '2000s' },
                { value: '1990s', label: '1990s' },
                { value: '1980s', label: '1980s' },
                { value: '1970s', label: '1970s' },
                { value: '1960s', label: '1960s' },
                { value: '1950s', label: '1950s' },
                { value: '1940s', label: '1940s' },
                { value: '1930s', label: '1930s' },
                { value: '1920s', label: '1920s' },
                { value: '1910s', label: '1910s' },
                { value: 'pre_1920', label: 'Before 1920' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Renew on Sold */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Renewal Settings
          </h4>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.renewOnSold || false}
            onChange={(e) => onChange({ ...value, renewOnSold: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Automatically renew when sold
            </span>
            <p className="text-xs text-gray-500">
              Listing will be renewed for $0.20 when it sells
            </p>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.shouldAutoRenew || false}
            onChange={(e) => onChange({ ...value, shouldAutoRenew: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-renew after 4 months
            </span>
            <p className="text-xs text-gray-500">
              Listing will automatically renew every 4 months
            </p>
          </div>
        </label>
      </div>

      {/* Digital Product */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Product Type
        </h4>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isDigital || false}
            onChange={(e) => onChange({ ...value, isDigital: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              This is a digital product
            </span>
            <p className="text-xs text-gray-500">
              No physical item will be shipped
            </p>
          </div>
        </label>

        {value.isDigital && (
          <div className="pl-6 space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Digital Delivery Methods
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Download', 'Email', 'External Link'].map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(value.digitalDelivery || []).includes(method)}
                    onChange={(e) => {
                      const current = value.digitalDelivery || [];
                      const updated = e.target.checked
                        ? [...current, method]
                        : current.filter((m) => m !== method);
                      onChange({ ...value, digitalDelivery: updated });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{method}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isCustomizable || false}
            onChange={(e) => onChange({ ...value, isCustomizable: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Can be customized
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isPersonalizable || false}
            onChange={(e) => onChange({ ...value, isPersonalizable: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Can be personalized
          </span>
        </label>
      </div>
    </div>
  );
}
