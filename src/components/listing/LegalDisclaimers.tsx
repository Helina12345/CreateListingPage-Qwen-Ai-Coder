// ============================================================
// ListingDesk Pro — Legal Disclaimers Component
// Handles various legal disclaimers and warnings
// ============================================================

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { MarketplaceId } from '../../types';

interface LegalDisclaimersProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    prop65?: boolean;
    prop65Text?: string;
    ageRestriction?: boolean;
    minAge?: number;
    healthWarning?: boolean;
    healthWarningText?: string;
    chokingHazard?: boolean;
    smallParts?: boolean;
    batteryIncluded?: boolean;
    customDisclaimer?: string;
  };
  onChange: (value: LegalDisclaimersProps['value']) => void;
}

export function LegalDisclaimers({ selectedMarketplaces, value, onChange }: LegalDisclaimersProps) {
  if (selectedMarketplaces.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Legal Disclaimers & Warnings
        </h3>
      </div>

      <p className="text-xs text-gray-500">
        Add required legal disclaimers and safety warnings. Some are mandatory for certain
        product categories or regions.
      </p>

      <div className="space-y-3">
        {/* California Prop 65 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="prop65"
              checked={value.prop65 || false}
              onChange={(e) => onChange({ ...value, prop65: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="prop65" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              California Proposition 65 Warning
            </label>
          </div>
          {value.prop65 && (
            <textarea
              value={value.prop65Text || ''}
              onChange={(e) => onChange({ ...value, prop65Text: e.target.value })}
              placeholder="WARNING: This product can expose you to chemicals including [chemical name], which is known to the State of California to cause [cancer/birth defects/other reproductive harm]. For more information go to www.P65Warnings.ca.gov."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          )}
        </div>

        {/* Age Restriction */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ageRestriction"
              checked={value.ageRestriction || false}
              onChange={(e) => onChange({ ...value, ageRestriction: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="ageRestriction" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Age Restriction
            </label>
          </div>
          {value.ageRestriction && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Minimum Age:</label>
              <input
                type="number"
                value={value.minAge || 18}
                onChange={(e) => onChange({ ...value, minAge: parseInt(e.target.value) || 18 })}
                min={1}
                max={99}
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">years</span>
            </div>
          )}
        </div>

        {/* Health Warning */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="healthWarning"
              checked={value.healthWarning || false}
              onChange={(e) => onChange({ ...value, healthWarning: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="healthWarning" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Health/Safety Warning
            </label>
          </div>
          {value.healthWarning && (
            <textarea
              value={value.healthWarningText || ''}
              onChange={(e) => onChange({ ...value, healthWarningText: e.target.value })}
              placeholder="Enter health or safety warning text..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          )}
        </div>

        {/* Choking Hazard */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chokingHazard"
              checked={value.chokingHazard || false}
              onChange={(e) => onChange({ ...value, chokingHazard: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="chokingHazard" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Choking Hazard Warning
            </label>
          </div>
          {value.chokingHazard && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smallParts"
                checked={value.smallParts || false}
                onChange={(e) => onChange({ ...value, smallParts: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="smallParts" className="text-sm text-gray-600 dark:text-gray-400">
                Contains small parts (not suitable for children under 3 years)
              </label>
            </div>
          )}
        </div>

        {/* Battery Included */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="batteryIncluded"
              checked={value.batteryIncluded || false}
              onChange={(e) => onChange({ ...value, batteryIncluded: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="batteryIncluded" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Battery Included Warning
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Required for products containing lithium batteries
          </p>
        </div>

        {/* Custom Disclaimer */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Disclaimer
          </label>
          <textarea
            value={value.customDisclaimer || ''}
            onChange={(e) => onChange({ ...value, customDisclaimer: e.target.value })}
            placeholder="Add any additional legal disclaimers or warnings..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={3}
          />
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-700 dark:text-orange-400">
            <p className="font-medium">Legal Compliance</p>
            <p className="mt-1">
              Ensure all required disclaimers are included for your product category and target markets.
              Failure to include required warnings may result in listing removal or legal liability.
              Consult with a legal professional if unsure about requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
