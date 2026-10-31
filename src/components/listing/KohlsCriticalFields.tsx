// ============================================================
// ListingDesk Pro — Kohl's Critical Missing Fields Component
// Kohl's Card Promotions, Yes2You Rewards, Kohl's Cash, Content Score, Rich Media
// ============================================================

import React from 'react';
import { Input, Select, Button, Badge } from '../ui';
import { Upload, Video, Image as ImageIcon, X } from 'lucide-react';

interface KohlsCriticalFieldsProps {
  value: {
    kohlsCardPromotion?: {
      eligible: boolean;
      promotionType?: string;
      specialFinancingMonths?: number;
      minimumPurchase?: number;
    };
    yes2youRewards?: {
      enabled: boolean;
      rewardPoints?: number;
      bonusPoints?: number;
      expirationDays?: number;
    };
    kohlsCash?: {
      eligible: boolean;
      earningPeriod?: string;
      redemptionPeriod?: string;
      cashAmount?: number;
      minimumPurchase?: number;
    };
    contentScore?: {
      titleScore?: number;
      imageScore?: number;
      descriptionScore?: number;
      attributeScore?: number;
      overallScore?: number;
    };
    richMedia?: {
      videos?: Array<{ url: string; title: string }>;
      images360?: string[];
      lifestyleImages?: string[];
    };
  };
  onChange: (value: KohlsCriticalFieldsProps['value']) => void;
}

export function KohlsCriticalFields({ value, onChange }: KohlsCriticalFieldsProps) {
  const handleKohlsCardChange = (field: string, val: boolean | string | number) => {
    onChange({
      ...value,
      kohlsCardPromotion: {
        ...value.kohlsCardPromotion!,
        [field]: val,
      },
    });
  };

  const handleYes2YouChange = (field: string, val: boolean | number) => {
    onChange({
      ...value,
      yes2youRewards: {
        ...value.yes2youRewards!,
        [field]: val,
      },
    });
  };

  const handleKohlsCashChange = (field: string, val: boolean | string | number) => {
    onChange({
      ...value,
      kohlsCash: {
        ...value.kohlsCash!,
        [field]: val,
      },
    });
  };

  const handleContentScoreChange = (field: string, val: number) => {
    onChange({
      ...value,
      contentScore: {
        ...value.contentScore!,
        [field]: val,
      },
    });
  };

  const calculateOverallScore = () => {
    const scores = [
      value.contentScore?.titleScore || 0,
      value.contentScore?.imageScore || 0,
      value.contentScore?.descriptionScore || 0,
      value.contentScore?.attributeScore || 0,
    ];
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    handleContentScoreChange('overallScore', Math.round(avg));
  };

  const handleVideoAdd = () => {
    const url = prompt('Enter video URL:');
    if (url) {
      const videos = value.richMedia?.videos || [];
      onChange({
        ...value,
        richMedia: {
          ...value.richMedia!,
          videos: [...videos, { url, title: `Video ${videos.length + 1}` }],
        },
      });
    }
  };

  const handleVideoRemove = (index: number) => {
    const videos = (value.richMedia?.videos || []).filter((_, i) => i !== index);
    onChange({
      ...value,
      richMedia: { ...value.richMedia!, videos },
    });
  };

  const handleImage360Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const images360 = files.map(file => URL.createObjectURL(file));
    onChange({
      ...value,
      richMedia: {
        ...value.richMedia!,
        images360: [...(value.richMedia?.images360 || []), ...images360],
      },
    });
  };

  const handleLifestyleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const lifestyleImages = files.map(file => URL.createObjectURL(file));
    onChange({
      ...value,
      richMedia: {
        ...value.richMedia!,
        lifestyleImages: [...(value.richMedia?.lifestyleImages || []), ...lifestyleImages],
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Kohl's Critical Fields
      </h3>

      {/* Kohl's Card Promotional Eligibility */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Kohl's Card Promotional Eligibility
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.kohlsCardPromotion?.eligible || false}
              onChange={(e) => handleKohlsCardChange('eligible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Eligible</span>
          </label>
        </div>
        {value.kohlsCardPromotion?.eligible && (
          <div className="space-y-3 ml-6">
            <Select
              label="Promotion Type"
              value={value.kohlsCardPromotion?.promotionType || ''}
              onChange={(e) => handleKohlsCardChange('promotionType', e.target.value)}
              options={[
                { value: '', label: 'Select type...' },
                { value: 'special_financing', label: 'Special Financing' },
                { value: 'percent_off', label: 'Percentage Off' },
                { value: 'dollars_off', label: 'Dollars Off' },
                { value: 'free_shipping', label: 'Free Shipping' },
              ]}
            />
            {value.kohlsCardPromotion?.promotionType === 'special_financing' && (
              <Input
                label="Special Financing Months"
                type="number"
                value={value.kohlsCardPromotion?.specialFinancingMonths?.toString() || ''}
                onChange={(e) => handleKohlsCardChange('specialFinancingMonths', parseInt(e.target.value) || 0)}
                placeholder="6"
                min={0}
                max={24}
                hint="Number of months for special financing"
              />
            )}
            <Input
              label="Minimum Purchase Amount"
              type="number"
              value={value.kohlsCardPromotion?.minimumPurchase?.toString() || ''}
              onChange={(e) => handleKohlsCardChange('minimumPurchase', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </div>
        )}
      </div>

      {/* Yes2You Rewards Integration */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Yes2You Rewards
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.yes2youRewards?.enabled || false}
              onChange={(e) => handleYes2YouChange('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
          </label>
        </div>
        {value.yes2youRewards?.enabled && (
          <div className="space-y-3 ml-6">
            <Input
              label="Reward Points per Dollar"
              type="number"
              value={value.yes2youRewards?.rewardPoints?.toString() || ''}
              onChange={(e) => handleYes2YouChange('rewardPoints', parseInt(e.target.value) || 0)}
              placeholder="5"
              min={0}
              hint="Points earned per dollar spent"
            />
            <Input
              label="Bonus Points"
              type="number"
              value={value.yes2youRewards?.bonusPoints?.toString() || ''}
              onChange={(e) => handleYes2YouChange('bonusPoints', parseInt(e.target.value) || 0)}
              placeholder="0"
              min={0}
              hint="Additional bonus points for this product"
            />
            <Input
              label="Points Expiration (days)"
              type="number"
              value={value.yes2youRewards?.expirationDays?.toString() || ''}
              onChange={(e) => handleYes2YouChange('expirationDays', parseInt(e.target.value) || 0)}
              placeholder="365"
              min={0}
            />
          </div>
        )}
      </div>

      {/* Kohl's Cash Eligibility */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Kohl's Cash Eligibility
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.kohlsCash?.eligible || false}
              onChange={(e) => handleKohlsCashChange('eligible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Eligible</span>
          </label>
        </div>
        {value.kohlsCash?.eligible && (
          <div className="space-y-3 ml-6">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Earning Period Start"
                type="date"
                value={value.kohlsCash?.earningPeriod || ''}
                onChange={(e) => handleKohlsCashChange('earningPeriod', e.target.value)}
              />
              <Input
                label="Redemption Period Start"
                type="date"
                value={value.kohlsCash?.redemptionPeriod || ''}
                onChange={(e) => handleKohlsCashChange('redemptionPeriod', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Kohl's Cash Amount"
                type="number"
                value={value.kohlsCash?.cashAmount?.toString() || ''}
                onChange={(e) => handleKohlsCashChange('cashAmount', parseFloat(e.target.value) || 0)}
                placeholder="10.00"
                min={0}
                step={0.01}
                hint="Amount of Kohl's Cash earned"
              />
              <Input
                label="Minimum Purchase"
                type="number"
                value={value.kohlsCash?.minimumPurchase?.toString() || ''}
                onChange={(e) => handleKohlsCashChange('minimumPurchase', parseFloat(e.target.value) || 0)}
                placeholder="50.00"
                min={0}
                step={0.01}
                hint="Minimum purchase required to earn Kohl's Cash"
              />
            </div>
          </div>
        )}
      </div>

      {/* Product Content Score */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Product Content Score
        </h4>
        <p className="text-xs text-gray-500">
          Rate your listing quality (0-100). Higher scores improve visibility and conversion.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Title Score"
            type="number"
            value={value.contentScore?.titleScore?.toString() || ''}
            onChange={(e) => {
              handleContentScoreChange('titleScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
          <Input
            label="Image Score"
            type="number"
            value={value.contentScore?.imageScore?.toString() || ''}
            onChange={(e) => {
              handleContentScoreChange('imageScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
          <Input
            label="Description Score"
            type="number"
            value={value.contentScore?.descriptionScore?.toString() || ''}
            onChange={(e) => {
              handleContentScoreChange('descriptionScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
          <Input
            label="Attribute Score"
            type="number"
            value={value.contentScore?.attributeScore?.toString() || ''}
            onChange={(e) => {
              handleContentScoreChange('attributeScore', parseInt(e.target.value) || 0);
              calculateOverallScore();
            }}
            placeholder="0"
            min={0}
            max={100}
          />
        </div>
        {value.contentScore?.overallScore !== undefined && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Overall Content Score
              </span>
              <Badge
                variant={
                  value.contentScore.overallScore >= 80
                    ? 'success'
                    : value.contentScore.overallScore >= 60
                    ? 'warning'
                    : 'danger'
                }
              >
                {value.contentScore.overallScore}/100
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Rich Media Requirements */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Rich Media
        </h4>

        {/* Videos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Videos
            </label>
            <Button variant="outline" size="sm" onClick={handleVideoAdd} icon={<Video className="h-3.5 w-3.5" />}>
              Add Video
            </Button>
          </div>
          {value.richMedia?.videos?.map((video, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{video.title}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleVideoRemove(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* 360° Images */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            360° Product Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImage360Upload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {value.richMedia?.images360 && value.richMedia.images360.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ {value.richMedia.images360.length} image(s) uploaded
            </p>
          )}
        </div>

        {/* Lifestyle Images */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Lifestyle Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleLifestyleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {value.richMedia?.lifestyleImages && value.richMedia.lifestyleImages.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ {value.richMedia.lifestyleImages.length} lifestyle image(s) uploaded
            </p>
          )}
          <p className="text-xs text-gray-500">
            Show product in use or in lifestyle settings
          </p>
        </div>
      </div>
    </div>
  );
}
