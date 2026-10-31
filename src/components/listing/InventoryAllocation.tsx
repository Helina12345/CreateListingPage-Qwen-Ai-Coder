// ============================================================
// ListingDesk Pro — Inventory Allocation Component
// Handles per-marketplace inventory allocation
// ============================================================

import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { Input, Badge } from '../ui';
import { MARKETPLACES } from '../../config/marketplaces';
import type { MarketplaceId } from '../../types';

interface InventoryAllocationProps {
  selectedMarketplaces: MarketplaceId[];
  totalQuantity: number;
  value: Record<MarketplaceId, number>;
  onChange: (value: Record<MarketplaceId, number>) => void;
}

export function InventoryAllocation({
  selectedMarketplaces,
  totalQuantity,
  value,
  onChange,
}: InventoryAllocationProps) {
  if (selectedMarketplaces.length === 0) {
    return null;
  }

  const allocatedTotal = Object.values(value).reduce((sum, qty) => sum + qty, 0);
  const unallocated = totalQuantity - allocatedTotal;
  const isOverAllocated = allocatedTotal > totalQuantity;

  const handleAllocationChange = (marketplaceId: MarketplaceId, quantity: number) => {
    onChange({
      ...value,
      [marketplaceId]: Math.max(0, quantity),
    });
  };

  const handleAutoDistribute = () => {
    if (selectedMarketplaces.length === 0 || totalQuantity <= 0) return;

    const perMarketplace = Math.floor(totalQuantity / selectedMarketplaces.length);
    const remainder = totalQuantity % selectedMarketplaces.length;

    const newAllocation = {} as Record<MarketplaceId, number>;
    selectedMarketplaces.forEach((mpId, index) => {
      newAllocation[mpId] = perMarketplace + (index < remainder ? 1 : 0);
    });

    onChange(newAllocation);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Inventory Allocation
          </h3>
        </div>
        <Badge variant={isOverAllocated ? 'danger' : unallocated > 0 ? 'warning' : 'success'}>
          {allocatedTotal} / {totalQuantity} allocated
        </Badge>
      </div>

      <p className="text-xs text-gray-500">
        Allocate inventory across marketplaces to prevent overselling.
        Unallocated inventory will not be available for sale.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Quantity</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalQuantity}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500">Allocated</p>
          <p className={`text-lg font-bold ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}>
            {allocatedTotal}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500">Unallocated</p>
          <p className={`text-lg font-bold ${unallocated < 0 ? 'text-red-600' : 'text-blue-600'}`}>
            {unallocated}
          </p>
        </div>
      </div>

      {/* Auto Distribute Button */}
      <button
        onClick={handleAutoDistribute}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        Auto-Distribute Evenly
      </button>

      {/* Per-Marketplace Allocation */}
      <div className="space-y-3">
        {selectedMarketplaces.map((mpId) => {
          const mp = MARKETPLACES[mpId];
          const allocated = value[mpId] || 0;

          return (
            <div
              key={mpId}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="text-2xl">{mp.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {mp.name}
                </p>
                <p className="text-xs text-gray-500">
                  {allocated} units allocated
                </p>
              </div>
              <Input
                type="number"
                value={allocated.toString()}
                onChange={(e) => handleAllocationChange(mpId, parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-24"
                min={0}
                max={totalQuantity}
              />
            </div>
          );
        })}
      </div>

      {/* Warnings */}
      {isOverAllocated && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-400">
              <p className="font-medium">Over-allocated!</p>
              <p className="mt-1">
                You've allocated more inventory than available. Please reduce allocations
                to match your total quantity.
              </p>
            </div>
          </div>
        </div>
      )}

      {unallocated > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              <p className="font-medium">Unallocated Inventory</p>
              <p className="mt-1">
                You have {unallocated} units unallocated. These units will not be available
                for sale on any marketplace.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Tip:</strong> Allocate inventory based on expected sales volume per marketplace.
          You can adjust allocations at any time, and the system will sync across all marketplaces
          in real-time to prevent overselling.
        </p>
      </div>
    </div>
  );
}
