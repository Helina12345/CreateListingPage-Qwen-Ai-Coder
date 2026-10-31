// ============================================================
// ListingDesk Pro — Product Identifiers & Compliance Component
// Expanded product identifiers and compliance declarations
// ============================================================

import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Input, Select } from '../ui';
import type { MarketplaceId } from '../../types';

interface ProductIdentifiersComplianceProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    upc?: string;
    ean?: string;
    isbn?: string;
    jan?: string;
    asin?: string;
    conditionNotes?: string;
    compliance?: {
      fda?: boolean;
      ce?: boolean;
      fcc?: boolean;
      cpsia?: boolean;
      prop65?: boolean;
    };
  };
  onChange: (value: ProductIdentifiersComplianceProps['value']) => void;
  condition: string;
}

export function ProductIdentifiersCompliance({
  selectedMarketplaces,
  value,
  onChange,
  condition,
}: ProductIdentifiersComplianceProps) {
  const needsISBN = selectedMarketplaces.some((mp) => ['amazon', 'ebay'].includes(mp));
  const needsJAN = selectedMarketplaces.includes('amazon'); // For Japan market
  const needsASIN = selectedMarketplaces.includes('amazon');
  const needsConditionNotes = condition !== 'new' && selectedMarketplaces.some((mp) => ['ebay', 'amazon'].includes(mp));
  const needsCompliance = selectedMarketplaces.length > 0;

  if (selectedMarketplaces.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Product Identifiers */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Product Identifiers
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="UPC (Universal Product Code)"
            value={value.upc || ''}
            onChange={(e) => onChange({ ...value, upc: e.target.value })}
            placeholder="012345678905"
            hint="12-digit barcode (required for Amazon, Walmart)"
          />

          <Input
            label="EAN (European Article Number)"
            value={value.ean || ''}
            onChange={(e) => onChange({ ...value, ean: e.target.value })}
            placeholder="4006381333931"
            hint="13-digit barcode (international)"
          />

          {needsISBN && (
            <Input
              label="ISBN (International Standard Book Number)"
              value={value.isbn || ''}
              onChange={(e) => onChange({ ...value, isbn: e.target.value })}
              placeholder="978-3-16-148410-0"
              hint="For books only (10 or 13 digits)"
            />
          )}

          {needsJAN && (
            <Input
              label="JAN (Japanese Article Number)"
              value={value.jan || ''}
              onChange={(e) => onChange({ ...value, jan: e.target.value })}
              placeholder="4901234567890"
              hint="For Japan market (13 digits)"
            />
          )}

          {needsASIN && (
            <Input
              label="ASIN (Amazon Standard Identification Number)"
              value={value.asin || ''}
              onChange={(e) => onChange({ ...value, asin: e.target.value })}
              placeholder="B08N5WRWNW"
              hint="Amazon-specific identifier (10 characters)"
            />
          )}
        </div>
      </div>

      {/* Condition Notes */}
      {needsConditionNotes && (
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Condition Notes
          </label>
          <textarea
            value={value.conditionNotes || ''}
            onChange={(e) => onChange({ ...value, conditionNotes: e.target.value })}
            rows={3}
            placeholder="Describe the condition in detail (e.g., 'Minor scratches on back, fully functional')"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500">
            Required for used/refurbished items on eBay and Amazon. Be specific about any defects or wear.
          </p>
        </div>
      )}

      {/* Compliance Declarations */}
      {needsCompliance && (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Compliance Declarations
            </h4>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.compliance?.fda || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    compliance: { ...value.compliance, fda: e.target.checked },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  FDA Compliance (Food & Drug Administration)
                </span>
                <p className="text-xs text-gray-500">
                  Required for food, drugs, medical devices, cosmetics
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.compliance?.ce || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    compliance: { ...value.compliance, ce: e.target.checked },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  CE Marking (Conformité Européenne)
                </span>
                <p className="text-xs text-gray-500">
                  Required for products sold in European Economic Area
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.compliance?.fcc || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    compliance: { ...value.compliance, fcc: e.target.checked },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  FCC Compliance (Federal Communications Commission)
                </span>
                <p className="text-xs text-gray-500">
                  Required for electronics, wireless devices
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.compliance?.cpsia || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    compliance: { ...value.compliance, cpsia: e.target.checked },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  CPSIA Compliance (Consumer Product Safety Improvement Act)
                </span>
                <p className="text-xs text-gray-500">
                  Required for children's products (under 12 years)
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.compliance?.prop65 || false}
                onChange={(e) =>
                  onChange({
                    ...value,
                    compliance: { ...value.compliance, prop65: e.target.checked },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  California Prop 65 Warning
                </span>
                <p className="text-xs text-gray-500">
                  Required for products sold in California containing certain chemicals
                </p>
              </div>
            </label>
          </div>

          {value.compliance && Object.values(value.compliance).some((v) => v) && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  <p className="font-medium">Compliance declarations recorded</p>
                  <p className="mt-1">
                    Ensure you have proper documentation for all declared compliance standards.
                    Marketplaces may request proof of compliance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
