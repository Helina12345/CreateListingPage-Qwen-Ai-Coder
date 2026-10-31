// ============================================================
// ListingDesk Pro — Product Dimensions Component
// Handles product dimensions (length, width, height) and weight
// ============================================================

import React from 'react';
import { Ruler } from 'lucide-react';
import { Input, Select } from '../ui';

interface ProductDimensionsProps {
  value: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    dimensionsUnit?: 'inches' | 'cm';
    weightUnit?: 'lbs' | 'oz' | 'kg' | 'g';
  };
  onChange: (value: ProductDimensionsProps['value']) => void;
}

export function ProductDimensions({ value, onChange }: ProductDimensionsProps) {
  const handleDimensionChange = (field: 'length' | 'width' | 'height' | 'weight', val: string) => {
    const numValue = parseFloat(val);
    onChange({
      ...value,
      [field]: isNaN(numValue) ? undefined : numValue,
    });
  };

  const calculateVolumetricWeight = (): number | null => {
    if (!value.length || !value.width || !value.height) return null;

    // Convert to inches if needed
    let l = value.length;
    let w = value.width;
    let h = value.height;

    if (value.dimensionsUnit === 'cm') {
      l = l / 2.54;
      w = w / 2.54;
      h = h / 2.54;
    }

    // Volumetric weight formula (in inches): (L x W x H) / 139 for lbs
    const volumetricWeight = (l * w * h) / 139;

    // Convert to selected weight unit
    if (value.weightUnit === 'lbs') return volumetricWeight;
    if (value.weightUnit === 'oz') return volumetricWeight * 16;
    if (value.weightUnit === 'kg') return volumetricWeight * 0.453592;
    if (value.weightUnit === 'g') return volumetricWeight * 453.592;

    return volumetricWeight;
  };

  const volumetricWeight = calculateVolumetricWeight();
  const actualWeight = value.weight || 0;
  const billableWeight = volumetricWeight && volumetricWeight > actualWeight ? volumetricWeight : actualWeight;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Dimensions & Weight
        </h3>
      </div>

      <p className="text-xs text-gray-500">
        Accurate dimensions are required for shipping calculations and may affect carrier rates.
      </p>

      {/* Unit Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Dimensions Unit"
          value={value.dimensionsUnit || 'inches'}
          onChange={(e) => onChange({ ...value, dimensionsUnit: e.target.value as any })}
          options={[
            { value: 'inches', label: 'Inches (in)' },
            { value: 'cm', label: 'Centimeters (cm)' },
          ]}
        />
        <Select
          label="Weight Unit"
          value={value.weightUnit || 'lbs'}
          onChange={(e) => onChange({ ...value, weightUnit: e.target.value as any })}
          options={[
            { value: 'lbs', label: 'Pounds (lbs)' },
            { value: 'oz', label: 'Ounces (oz)' },
            { value: 'kg', label: 'Kilograms (kg)' },
            { value: 'g', label: 'Grams (g)' },
          ]}
        />
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Dimensions
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label={`Length (${value.dimensionsUnit || 'inches'})`}
            type="number"
            value={value.length?.toString() || ''}
            onChange={(e) => handleDimensionChange('length', e.target.value)}
            placeholder="0"
            min={0}
            step={0.1}
          />
          <Input
            label={`Width (${value.dimensionsUnit || 'inches'})`}
            type="number"
            value={value.width?.toString() || ''}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            placeholder="0"
            min={0}
            step={0.1}
          />
          <Input
            label={`Height (${value.dimensionsUnit || 'inches'})`}
            type="number"
            value={value.height?.toString() || ''}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            placeholder="0"
            min={0}
            step={0.1}
          />
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Weight
        </h4>
        <Input
          label={`Weight (${value.weightUnit || 'lbs'})`}
          type="number"
          value={value.weight?.toString() || ''}
          onChange={(e) => handleDimensionChange('weight', e.target.value)}
          placeholder="0"
          min={0}
          step={0.1}
        />
      </div>

      {/* Volumetric Weight Calculation */}
      {volumetricWeight && actualWeight > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Shipping Weight Calculation
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Actual Weight</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {actualWeight.toFixed(2)} {value.weightUnit || 'lbs'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Volumetric Weight</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {volumetricWeight.toFixed(2)} {value.weightUnit || 'lbs'}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <p className="text-gray-500 text-xs">Billable Weight (whichever is greater)</p>
            <p className="font-bold text-indigo-600 text-lg">
              {billableWeight.toFixed(2)} {value.weightUnit || 'lbs'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Carriers use the greater of actual weight or volumetric weight
          (dimensional weight) for shipping calculations. Volumetric weight is calculated as
          (Length × Width × Height) / 139 for inches, or (Length × Width × Height) / 5000 for cm.
        </p>
      </div>
    </div>
  );
}
