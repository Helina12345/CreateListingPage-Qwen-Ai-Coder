// ============================================================
// ListingDesk Pro — Shopify-Specific Fields Component
// Product Options, Metafields, SEO Settings, Shipping Zones
// ============================================================

import React from 'react';
import { Settings, Tag, Globe, Truck, Plus, X } from 'lucide-react';
import { Input, Select, Button, Badge } from '../ui';

interface ShopifySpecificFieldsProps {
  value: {
    productType?: string;
    vendor?: string;
    tags?: string[];
    collections?: string[];
    options?: Array<{
      name: string;
      values: string[];
    }>;
    metafields?: Array<{
      namespace: string;
      key: string;
      value: string;
      type: string;
    }>;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      urlHandle?: string;
    };
    shippingZones?: string[];
    requiresShipping?: boolean;
    taxable?: boolean;
    giftCard?: boolean;
  };
  onChange: (value: ShopifySpecificFieldsProps['value']) => void;
}

export function ShopifySpecificFields({ value, onChange }: ShopifySpecificFieldsProps) {
  const metafieldTypes = [
    { value: 'single_line_text_field', label: 'Single Line Text' },
    { value: 'multi_line_text_field', label: 'Multi Line Text' },
    { value: 'number_integer', label: 'Integer' },
    { value: 'number_decimal', label: 'Decimal' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'url', label: 'URL' },
    { value: 'color', label: 'Color' },
    { value: 'json', label: 'JSON' },
  ];

  const shippingZones = [
    { value: 'domestic', label: 'Domestic' },
    { value: 'north_america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia', label: 'Asia' },
    { value: 'australia', label: 'Australia' },
    { value: 'worldwide', label: 'Worldwide' },
  ];

  const handleAddOption = () => {
    const options = value.options || [];
    if (options.length >= 3) {
      alert('Shopify allows maximum 3 product options');
      return;
    }
    onChange({
      ...value,
      options: [...options, { name: '', values: [''] }],
    });
  };

  const handleUpdateOption = (index: number, field: 'name' | 'values', val: any) => {
    const options = [...(value.options || [])];
    options[index] = { ...options[index], [field]: val };
    onChange({ ...value, options });
  };

  const handleRemoveOption = (index: number) => {
    const options = (value.options || []).filter((_, i) => i !== index);
    onChange({ ...value, options });
  };

  const handleAddOptionValue = (optionIndex: number) => {
    const options = [...(value.options || [])];
    options[optionIndex].values.push('');
    onChange({ ...value, options });
  };

  const handleUpdateOptionValue = (optionIndex: number, valueIndex: number, val: string) => {
    const options = [...(value.options || [])];
    options[optionIndex].values[valueIndex] = val;
    onChange({ ...value, options });
  };

  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    const options = [...(value.options || [])];
    options[optionIndex].values = options[optionIndex].values.filter((_, i) => i !== valueIndex);
    onChange({ ...value, options });
  };

  const handleAddMetafield = () => {
    const metafields = value.metafields || [];
    onChange({
      ...value,
      metafields: [...metafields, { namespace: '', key: '', value: '', type: 'single_line_text_field' }],
    });
  };

  const handleUpdateMetafield = (index: number, field: string, val: string) => {
    const metafields = [...(value.metafields || [])];
    metafields[index] = { ...metafields[index], [field]: val };
    onChange({ ...value, metafields });
  };

  const handleRemoveMetafield = (index: number) => {
    const metafields = (value.metafields || []).filter((_, i) => i !== index);
    onChange({ ...value, metafields });
  };

  return (
    <div className="space-y-6">
      {/* Product Organization */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-green-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Product Organization
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Product Type"
            value={value.productType || ''}
            onChange={(e) => onChange({ ...value, productType: e.target.value })}
            placeholder="e.g., T-Shirt, Mug, Poster"
          />
          <Input
            label="Vendor"
            value={value.vendor || ''}
            onChange={(e) => onChange({ ...value, vendor: e.target.value })}
            placeholder="Brand or supplier name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(value.tags || []).map((tag, i) => (
              <Badge key={i} variant="default" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => onChange({ ...value, tags: (value.tags || []).filter((_, idx) => idx !== i) })}
                  className="hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            value=""
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                const input = e.target as HTMLInputElement;
                onChange({ ...value, tags: [...(value.tags || []), input.value.trim()] });
                input.value = '';
              }
            }}
            placeholder="Type and press Enter to add tags"
          />
        </div>
      </div>

      {/* Product Options (Max 3) */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Product Options
            </h4>
            <Badge variant="info">{(value.options || []).length}/3</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={(value.options || []).length >= 3}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Option
          </Button>
        </div>

        {(value.options || []).map((option, optionIndex) => (
          <div key={optionIndex} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Input
                label={`Option ${optionIndex + 1} Name`}
                value={option.name}
                onChange={(e) => handleUpdateOption(optionIndex, 'name', e.target.value)}
                placeholder="e.g., Size, Color, Material"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(optionIndex)}
                icon={<X className="h-4 w-4 text-red-500" />}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Values (press Enter to add)
              </label>
              <div className="flex flex-wrap gap-2">
                {option.values.map((val, valIndex) => (
                  <div key={valIndex} className="flex items-center gap-1">
                    <Input
                      value={val}
                      onChange={(e) => handleUpdateOptionValue(optionIndex, valIndex, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOptionValue(optionIndex);
                        }
                      }}
                      placeholder="Value"
                      className="w-24"
                    />
                    {option.values.length > 1 && (
                      <button
                        onClick={() => handleRemoveOptionValue(optionIndex, valIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddOptionValue(optionIndex)}
                icon={<Plus className="h-3 w-3" />}
              >
                Add Value
              </Button>
            </div>
          </div>
        ))}

        {(value.options || []).length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">
            No options added. Click "Add Option" to create variants (e.g., Size, Color).
          </p>
        )}
      </div>

      {/* Metafields */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Metafields
            </h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddMetafield}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Metafield
          </Button>
        </div>

        {(value.metafields || []).map((metafield, index) => (
          <div key={index} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Namespace"
                value={metafield.namespace}
                onChange={(e) => handleUpdateMetafield(index, 'namespace', e.target.value)}
                placeholder="e.g., custom, product"
              />
              <Input
                label="Key"
                value={metafield.key}
                onChange={(e) => handleUpdateMetafield(index, 'key', e.target.value)}
                placeholder="e.g., material, care_instructions"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Type"
                value={metafield.type}
                onChange={(e) => handleUpdateMetafield(index, 'type', e.target.value)}
                options={metafieldTypes}
              />
              <Input
                label="Value"
                value={metafield.value}
                onChange={(e) => handleUpdateMetafield(index, 'value', e.target.value)}
                placeholder="Field value"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveMetafield(index)}
              icon={<X className="h-3 w-3 text-red-500" />}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      {/* SEO Settings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-green-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            SEO Settings
          </h4>
        </div>

        <Input
          label="URL Handle"
          value={value.seo?.urlHandle || ''}
          onChange={(e) => onChange({ ...value, seo: { ...value.seo, urlHandle: e.target.value } })}
          placeholder="product-url-handle"
          hint="The URL slug for this product (lowercase, hyphens)"
        />

        <Input
          label="Meta Title"
          value={value.seo?.metaTitle || ''}
          onChange={(e) => onChange({ ...value, seo: { ...value.seo, metaTitle: e.target.value } })}
          placeholder="SEO title (max 70 characters)"
          hint="Leave blank to use product title"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Meta Description
          </label>
          <textarea
            value={value.seo?.metaDescription || ''}
            onChange={(e) => onChange({ ...value, seo: { ...value.seo, metaDescription: e.target.value } })}
            placeholder="SEO description (max 320 characters)"
            rows={3}
            maxLength={320}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(value.seo?.metaDescription || '').length}/320 characters
          </p>
        </div>
      </div>

      {/* Shipping & Tax */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-green-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Shipping & Tax
          </h4>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.requiresShipping !== false}
              onChange={(e) => onChange({ ...value, requiresShipping: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">This is a physical product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.taxable !== false}
              onChange={(e) => onChange({ ...value, taxable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Charge taxes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.giftCard || false}
              onChange={(e) => onChange({ ...value, giftCard: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">This is a gift card</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Shipping Zones
          </label>
          <div className="grid grid-cols-2 gap-2">
            {shippingZones.map((zone) => {
              const isSelected = (value.shippingZones || ['domestic']).includes(zone.value);
              return (
                <label
                  key={zone.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const zones = value.shippingZones || ['domestic'];
                      const updated = e.target.checked
                        ? [...zones, zone.value]
                        : zones.filter((z) => z !== zone.value);
                      onChange({ ...value, shippingZones: updated });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{zone.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
