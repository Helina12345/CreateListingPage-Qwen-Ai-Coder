// ============================================================
// ListingDesk Pro — Listing Readiness Panel
// Shows validation status for each marketplace before publishing
// ============================================================

import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { validateListingForAllMarketplaces, type OverallValidationResult } from '../../services/validation';
import type { Listing, MarketplaceId } from '../../types';
import { MARKETPLACES } from '../../config/marketplaces';

interface ListingReadinessPanelProps {
  listing: Partial<Listing>;
  selectedMarketplaces: MarketplaceId[];
  fieldValues?: Partial<Record<MarketplaceId, Record<string, any>>>;
  categories?: Partial<Record<MarketplaceId, string>>;
  onPublish?: () => void;
}

export function ListingReadinessPanel({
  listing,
  selectedMarketplaces,
  fieldValues = {},
  categories = {},
  onPublish,
}: ListingReadinessPanelProps) {
  const [validationResult, setValidationResult] = useState<OverallValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (selectedMarketplaces.length === 0) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    // Debounce validation
    const timer = setTimeout(() => {
      const result = validateListingForAllMarketplaces(
        listing,
        selectedMarketplaces,
        fieldValues,
        categories
      );
      setValidationResult(result);
      setIsValidating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [listing, selectedMarketplaces, fieldValues, categories]);

  if (selectedMarketplaces.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">Select at least one marketplace to see readiness status</p>
      </div>
    );
  }

  if (isValidating || !validationResult) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Validating listing...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'needs_attention':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200';
      case 'needs_attention':
        return 'bg-yellow-50 border-yellow-200';
      case 'blocked':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'needs_attention':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`${getOverallStatusColor(validationResult.overallStatus)} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Listing Readiness</h3>
            <p className="text-sm opacity-90">
              {validationResult.readyCount} of {validationResult.totalMarketplaces} marketplaces ready
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{validationResult.readyCount}</div>
            <div className="text-sm opacity-90">Ready</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{validationResult.readyCount}</div>
          <div className="text-xs text-gray-600">Ready</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{validationResult.needsAttentionCount}</div>
          <div className="text-xs text-gray-600">Needs Attention</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{validationResult.blockedCount}</div>
          <div className="text-xs text-gray-600">Blocked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{validationResult.unknownCount}</div>
          <div className="text-xs text-gray-600">Unknown</div>
        </div>
      </div>

      {/* Marketplace Details */}
      <div className="divide-y divide-gray-200">
        {validationResult.results.map((result) => (
          <div key={result.marketplaceId} className={`p-4 ${getStatusColor(result.status)}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {MARKETPLACES[result.marketplaceId].name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                      {result.marketplaceId}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>
                        {result.requiredFieldsComplete} of {result.requiredFieldsTotal} required fields
                      </span>
                      <span>{Math.round((result.requiredFieldsComplete / result.requiredFieldsTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(result.requiredFieldsComplete / result.requiredFieldsTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recommended Fields */}
                  {result.recommendedFieldsTotal > 0 && (
                    <div className="text-xs text-gray-600 mb-2">
                      {result.recommendedFieldsComplete} of {result.recommendedFieldsTotal} recommended fields complete
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.errors.slice(0, 3).map((error, idx) => (
                        <div key={idx} className="text-xs text-red-700 flex items-start gap-1">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{error.message}</span>
                        </div>
                      ))}
                      {result.errors.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{result.errors.length - 3} more error(s)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.warnings.slice(0, 2).map((warning, idx) => (
                        <div key={idx} className="text-xs text-yellow-700 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Eligibility Issues */}
                  {result.eligibilityIssues.length > 0 && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                      <strong>Blocked:</strong> {result.eligibilityIssues.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                {result.status === 'ready' && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ready
                  </span>
                )}
                {result.status === 'needs_attention' && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Needs Attention
                  </span>
                )}
                {result.status === 'blocked' && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Blocked
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Button */}
      {onPublish && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {validationResult.canPublishAll ? (
            <button
              onClick={onPublish}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Publish to All {validationResult.totalMarketplaces} Marketplaces
            </button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {validationResult.readyCount} of {validationResult.totalMarketplaces} marketplaces are ready to publish
              </p>
              <button
                onClick={onPublish}
                disabled={validationResult.readyCount === 0}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Publish {validationResult.readyCount} Ready Marketplace{validationResult.readyCount !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
