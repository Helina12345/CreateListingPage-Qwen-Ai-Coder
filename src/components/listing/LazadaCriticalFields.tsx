// ============================================================
// ListingDesk Pro — Lazada Critical Missing Fields Component
// LazMall Eligibility, Campaign Participation, Free Shipping, Flexi Combo, Quality Score, SEO Tags
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';

interface LazadaCriticalFieldsProps {
  value: {
    lazmallEligibility?: {
      eligible: boolean;
      brandAuthorization?: string;
      authenticityCertificate?: string;
      minimumOrderQuantity?: number;
    };
    campaignParticipation?: {
      enabled: boolean;
      campaignType?: string;
      campaignName?: string;
      startDate?: string;
      endDate?: string;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
    };
    freeShipping?: {
      enabled: boolean;
      minOrderAmount?: number;
      maxWeight?: number;
      regions?: string[];
    };
    flexiCombo?: {
      enabled: boolean;
      buyQuantity?: number;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      maxDiscount?: number;
    };
    qualityScore?: {
      titleScore?: number;
      imageScore?: number;
      descriptionScore?: number;
      overallScore?: number;
    };
    seoTags?: {
      keywords?: string[];
      searchTerms?: string;
      metaDescription?: string;
    };
  };
  onChange: (value: LazadaCriticalFieldsProps['value']) => void;
}

export function LazadaCriticalFields({ value, onChange }: LazadaCriticalFieldsProps) {
  const handleLazmallChange = (field: string, val: boolean | string | number) => {
    onChange({
      ...value,
      lazmallEligibility: {
        ...value.lazmallEligibility!,
        [field]: val,
      },
    });
  };

  const handleCampaignChange = (field: string, val: boolean | string | number) => {
    onChange({
      ...value,
      campaignParticipation: {
        ...value.campaignParticipation!,
        [field]: val,
      },
    });
  };

  const handleFreeShippingChange = (field: string, val: boolean | number | string[]) => {
    onChange({
      ...value,
      freeShipping: {
        ...value.freeShipping!,
        [field]: val,
      },
    });
  };

  const handleFlexiComboChange = (field: string, val: boolean | number | string) => {
    onChange({
      ...value,
      flexiCombo: {
        ...value.flexiCombo!,
        [field]: val,
      },
    });
  };

  const handleQualityScoreChange = (field: string, val: number) => {
    onChange({
      ...value,
      qualityScore: {
        ...value.qualityScore!,
        [field]: val,
      },
    });
  };

  const handleSeoTagsChange = (field: string, val: string | string[]) => {
    onChange({
      ...value,
      seoTags: {
        ...value.seoTags!,
        [field]: val,
      },
    });
  };

  const calculateOverallScore = () => {
    const scores = [
      value.qualityScore?.titleScore || 0,
      value.qualityScore?.imageScore || 0,
      value.qualityScore?.descriptionScore || 0,
    ];
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    handleQualityScoreChange('overallScore', Math.round(avg));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Lazada Critical Fields
      </h3>

      {/* LazMall Eligibility */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            LazMall Eligibility
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.lazmallEligibility?.eligible || false}
              onChange={(e) => handleLazmallChange('eligible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Eligible</span>
          </label>
        </div>
        {value.lazmallEligibility?.eligible && (
          <div className="space-y-3 ml-6">
            <Input
              label="Brand Authorization Document"
              value={value.lazmallEligibility?.brandAuthorization || ''}
              onChange={(e) => handleLazmallChange('brandAuthorization', e.target.value)}
              placeholder="Upload or enter document URL..."
              hint="Official brand authorization letter or certificate"
            />
            <Input
              label="Authenticity Certificate"
              value={value.lazmallEligibility?.authenticityCertificate || ''}
              onChange={(e) => handleLazmallChange('authenticityCertificate', e.target.value)}
              placeholder="Enter certificate number..."
            />
            <Input
              label="Minimum Order Quantity"
              type="number"
              value={value.lazmallEligibility?.minimumOrderQuantity?.toString() || ''}
              onChange={(e) => handleLazmallChange('minimumOrderQuantity', parseInt(e.target.value) || 0)}
              placeholder="1"
              min={1}
            />
          </div>
        )}
      </div>

      {/* Campaign Participation */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Campaign Participation
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.campaignParticipation?.enabled || false}
              onChange={(e) => handleCampaignChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.campaignParticipation?.enabled && (
          <div className="space-y-3 ml-6">
            <Select
              label="Campaign Type"
              value={value.campaignParticipation?.campaignType || ''}
              onChange={(e) => handleCampaignChange('campaignType', e.target.value)}
              options={[
                { value: '', label: 'Select type...' },
                { value: 'flash_sale', label: 'Flash Sale' },
                { value: 'mega_sale', label: 'Mega Sale (11.11, 12.12)' },
                { value: 'payday_sale', label: 'Payday Sale' },
                { value: 'birthday_sale', label: 'Birthday Sale' },
                { value: 'custom', label: 'Custom Campaign' },
              ]}
            />
            <Input
              label="Campaign Name"
              value={value.campaignParticipation?.campaignName || ''}
              onChange={(e) => handleCampaignChange('campaignName', e.target.value)}
              placeholder="Enter campaign name..."
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="datetime-local"
                value={value.campaignParticipation?.startDate || ''}
                onChange={(e) => handleCampaignChange('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="datetime-local"
                value={value.campaignParticipation?.endDate || ''}
                onChange={(e) => handleCampaignChange('endDate', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Discount Type"
                value={value.campaignParticipation?.discountType || 'percentage'}
                onChange={(e) => handleCampaignChange('discountType', e.target.value)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />
              <Input
                label="Discount Value"
                type="number"
                value={value.campaignParticipation?.discountValue?.toString() || ''}
                onChange={(e) => handleCampaignChange('discountValue', parseFloat(e.target.value) || 0)}
                placeholder="10"
                min={0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Free Shipping Program */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Free Shipping Program
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.freeShipping?.enabled || false}
              onChange={(e) => handleFreeShippingChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.freeShipping?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Minimum Order Amount"
              type="number"
              value={value.freeShipping?.minOrderAmount?.toString() || ''}
              onChange={(e) => handleFreeShippingChange('minOrderAmount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min={0}
            />
            <Input
              label="Maximum Weight (kg)"
              type="number"
              value={value.freeShipping?.maxWeight?.toString() || ''}
              onChange={(e) => handleFreeShippingChange('maxWeight', parseFloat(e.target.value) || 0)}
              placeholder="5.0"
              min={0}
              step={0.1}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Eligible Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {['Java', 'Sumatra', 'Kalimantan', 'Sulawesi', 'Bali', 'Papua'].map((region) => (
                  <label key={region} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value.freeShipping?.regions?.includes(region) || false}
                      onChange={(e) => {
                        const regions = value.freeShipping?.regions || [];
                        const updated = e.target.checked
                          ? [...regions, region]
                          : regions.filter((r) => r !== region);
                        handleFreeShippingChange('regions', updated);
                      }}
                      className="h-3 w-3 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{region}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Flexi Combo Setup */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Flexi Combo (Multi-Buy Discount)
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.flexiCombo?.enabled || false}
              onChange={(e) => handleFlexiComboChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.flexiCombo?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Buy Quantity"
              type="number"
              value={value.flexiCombo?.buyQuantity?.toString() || ''}
              onChange={(e) => handleFlexiComboChange('buyQuantity', parseInt(e.target.value) || 0)}
              placeholder="2"
              min={2}
              hint="Customer must buy this quantity to get discount"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Discount Type"
                value={value.flexiCombo?.discountType || 'percentage'}
                onChange={(e) => handleFlexiComboChange('discountType', e.target.value)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />
              <Input
                label="Discount Value"
                type="number"
                value={value.flexiCombo?.discountValue?.toString() || ''}
                onChange={(e) => handleFlexiComboChange('discountValue', parseFloat(e.target.value) || 0)}
                placeholder="10"
                min={0}
              />
            </div>
            {value.flexiCombo?.discountType === 'percentage' && (
              <Input
                label="Max Discount Amount"
                type="number"
                value={value.flexiCombo?.maxDiscount?.toString() || ''}
                onChange={(e) => handleFlexiComboChange('maxDiscount', parseFloat(e.target.value) || 0)}
                placeholder="100.00"
                min={0}
                hint="Maximum discount per order"
              />
            )}
          </div>
        )}
      </div>

      {/* Product Quality Score */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Product Quality Score
        </h4>
        <p className="text-xs text-gray-500">
          Rate your listing quality (0-100). Higher scores improve visibility.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Title Score"
            type="number"
            value={value.qualityScore?.titleScore?.toString() || ''}
            onChange={(e) => {
              handleQualityScoreChange('titleScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
          <Input
            label="Image Score"
            type="number"
            value={value.qualityScore?.imageScore?.toString() || ''}
            onChange={(e) => {
              handleQualityScoreChange('imageScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
          <Input
            label="Description Score"
            type="number"
            value={value.qualityScore?.descriptionScore?.toString() || ''}
            onChange={(e) => {
              handleQualityScoreChange('descriptionScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
        </div>
        {value.qualityScore?.overallScore !== undefined && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Overall Quality Score
              </span>
              <Badge
                variant={
                  value.qualityScore.overallScore >= 80
                    ? 'success'
                    : value.qualityScore.overallScore >= 60
                    ? 'warning'
                    : 'danger'
                }
              >
                {value.qualityScore.overallScore}/100
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Search Optimization Tags */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Search Optimization (SEO)
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Keywords (press Enter to add)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {value.seoTags?.keywords?.map((keyword, idx) => (
                <Badge key={idx} variant="default" className="flex items-center gap-1">
                  {keyword}
                  <button
                    onClick={() => {
                      const keywords = (value.seoTags?.keywords || []).filter((_, i) => i !== idx);
                      handleSeoTagsChange('keywords', keywords);
                    }}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value=""
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  const input = e.target as HTMLInputElement;
                  const keywords = value.seoTags?.keywords || [];
                  handleSeoTagsChange('keywords', [...keywords, input.value.trim()]);
                  input.value = '';
                }
              }}
              placeholder="Type keyword and press Enter..."
            />
          </div>
          <Input
            label="Search Terms"
            value={value.seoTags?.searchTerms || ''}
            onChange={(e) => handleSeoTagsChange('searchTerms', e.target.value)}
            placeholder="Additional search terms for Lazada search..."
            hint="Comma-separated terms that improve search visibility"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Description
            </label>
            <textarea
              value={value.seoTags?.metaDescription || ''}
              onChange={(e) => handleSeoTagsChange('metaDescription', e.target.value)}
              placeholder="Brief description for search results (max 160 characters)..."
              rows={3}
              maxLength={160}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(value.seoTags?.metaDescription || '').length}/160 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
