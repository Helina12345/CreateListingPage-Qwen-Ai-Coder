// ============================================================
// ListingDesk Pro — Shopee-Specific Fields Component
// Category tree, shipping weight, days to ship, pre-order
// ============================================================

import React from 'react';
import { Input, Select } from '../ui';

interface ShopeeSpecificFieldsProps {
  value: {
    categoryTree?: string[];
    shippingWeight?: string;
    daysToShip?: string;
    isPreOrder?: boolean;
    condition?: 'new' | 'used';
    isFreeShipping?: boolean;
  };
  onChange: (value: ShopeeSpecificFieldsProps['value']) => void;
}

export function ShopeeSpecificFields({ value, onChange }: ShopeeSpecificFieldsProps) {
  const categoryTree = [
    { id: 'fashion', label: 'Fashion', children: ['Men', 'Women', 'Kids', 'Bags', 'Shoes'] },
    { id: 'beauty', label: 'Health & Beauty', children: ['Skincare', 'Makeup', 'Haircare', 'Fragrance'] },
    { id: 'home', label: 'Home & Living', children: ['Furniture', 'Decor', 'Kitchen', 'Bedding'] },
    { id: 'electronics', label: 'Mobile & Gadgets', children: ['Phones', 'Tablets', 'Accessories', 'Wearables'] },
    { id: 'baby', label: 'Baby & Kids', children: ['Diapers', 'Feeding', 'Toys', 'Clothing'] },
    { id: 'food', label: 'Food & Beverages', children: ['Snacks', 'Drinks', 'Cooking', 'Health'] },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Shopee-Specific Fields
      </h4>

      {/* Category Tree Navigation */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          {categoryTree.map((cat) => (
            <div key={cat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                {cat.label}
              </div>
              <div className="flex flex-wrap gap-1">
                {cat.children.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onChange({ ...value, categoryTree: [cat.id, sub] })}
                    className={`text-xs px-2 py-1 rounded ${
                      value.categoryTree?.[1] === sub
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {value.categoryTree && (
          <p className="text-xs text-gray-500">
            Selected: {categoryTree.find((c) => c.id === value.categoryTree?.[0])?.label} → {value.categoryTree[1]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Shipping Weight (kg)"
          type="number"
          value={value.shippingWeight || ''}
          onChange={(e) => onChange({ ...value, shippingWeight: e.target.value })}
          placeholder="0.0"
        />
        <Input
          label="Days to Ship"
          type="number"
          value={value.daysToShip || '2'}
          onChange={(e) => onChange({ ...value, daysToShip: e.target.value })}
          placeholder="2"
        />
      </div>

      <Select
        label="Condition"
        value={value.condition || 'new'}
        onChange={(e) => onChange({ ...value, condition: e.target.value as any })}
        options={[
          { value: 'new', label: 'Brand New' },
          { value: 'used', label: 'Used' },
        ]}
      />

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isPreOrder || false}
            onChange={(e) => onChange({ ...value, isPreOrder: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Pre-order</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.isFreeShipping || false}
            onChange={(e) => onChange({ ...value, isFreeShipping: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-orange-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Free shipping</span>
        </label>
      </div>
    </div>
  );
}
