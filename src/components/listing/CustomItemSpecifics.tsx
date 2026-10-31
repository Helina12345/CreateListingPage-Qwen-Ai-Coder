// ============================================================
// ListingDesk Pro — Custom Item Specifics Component
// Allows sellers to add custom attributes to their listings
// ============================================================

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Select } from '../ui';
import type { MarketplaceId } from '../../types';

interface CustomItemSpecificsProps {
  selectedMarketplaces: MarketplaceId[];
  value: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  onChange: (value: CustomItemSpecificsProps['value']) => void;
}

export function CustomItemSpecifics({ selectedMarketplaces, value, onChange }: CustomItemSpecificsProps) {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  if (selectedMarketplaces.length === 0) {
    return null;
  }

  const handleAdd = () => {
    if (!newName.trim() || !newValue.trim()) {
      alert('Please enter both name and value');
      return;
    }

    // Check for duplicate names
    if (value.some(item => item.name.toLowerCase() === newName.trim().toLowerCase())) {
      alert('A custom field with this name already exists');
      return;
    }

    const newField = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      value: newValue.trim(),
    };

    onChange([...value, newField]);
    setNewName('');
    setNewValue('');
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'name' | 'value', newValue: string) => {
    onChange(value.map(item =>
      item.id === id ? { ...item, [field]: newValue } : item
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Custom Item Specifics
        </h3>
        <span className="text-xs text-gray-500">
          {value.length} custom field{value.length !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Add custom attributes that are specific to your product. These will be displayed
        to buyers and can help with search visibility.
      </p>

      {/* Existing Custom Fields */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => handleUpdate(item.id, 'name', e.target.value)}
                  placeholder="Field name"
                  className="text-sm"
                />
                <Input
                  value={item.value}
                  onChange={(e) => handleUpdate(item.id, 'value', e.target.value)}
                  placeholder="Field value"
                  className="text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
                icon={<X className="h-4 w-4" />}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add New Custom Field */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Add New Custom Field
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Field Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Material, Style, Feature"
          />
          <Input
            label="Field Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="e.g., Cotton, Modern, Waterproof"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAdd}
          icon={<Plus className="h-4 w-4" />}
          disabled={!newName.trim() || !newValue.trim()}
        >
          Add Custom Field
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Tip:</strong> Custom item specifics help buyers find your product and can improve
          search rankings. Use descriptive names and values that buyers might search for.
          Some marketplaces (like eBay) display these in the listing details.
        </p>
      </div>
    </div>
  );
}
