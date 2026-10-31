// ============================================================
// ListingDesk Pro — Conflict Resolution UI
// Resolve inventory/price conflicts across marketplaces
// ============================================================

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';
import { MARKETPLACES } from '../../config/marketplaces';
import type { MarketplaceId } from '../../types';

export interface InventoryConflict {
  listingId: string;
  listingTitle: string;
  sku: string;
  conflicts: Array<{
    marketplaceId: MarketplaceId;
    externalId: string;
    localQuantity: number;
    marketplaceQuantity: number;
    difference: number;
  }>;
}

export interface PriceConflict {
  listingId: string;
  listingTitle: string;
  sku: string;
  conflicts: Array<{
    marketplaceId: MarketplaceId;
    externalId: string;
    localPrice: number;
    marketplacePrice: number;
    difference: number;
  }>;
}

interface ConflictResolutionProps {
  inventoryConflicts: InventoryConflict[];
  priceConflicts: PriceConflict[];
  onResolveInventory?: (listingId: string, marketplaceId: MarketplaceId, quantity: number) => void;
  onResolvePrice?: (listingId: string, marketplaceId: MarketplaceId, price: number) => void;
  onSyncAll?: () => void;
}

export function ConflictResolution({
  inventoryConflicts,
  priceConflicts,
  onResolveInventory,
  onResolvePrice,
  onSyncAll,
}: ConflictResolutionProps) {
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const handleResolveInventory = async (
    listingId: string,
    marketplaceId: MarketplaceId,
    quantity: number
  ) => {
    const key = `${listingId}-${marketplaceId}`;
    setResolving({ ...resolving, [key]: true });

    try {
      await onResolveInventory?.(listingId, marketplaceId, quantity);
    } finally {
      setResolving({ ...resolving, [key]: false });
    }
  };

  const handleResolvePrice = async (
    listingId: string,
    marketplaceId: MarketplaceId,
    price: number
  ) => {
    const key = `${listingId}-${marketplaceId}`;
    setResolving({ ...resolving, [key]: true });

    try {
      await onResolvePrice?.(listingId, marketplaceId, price);
    } finally {
      setResolving({ ...resolving, [key]: false });
    }
  };

  const totalConflicts = inventoryConflicts.length + priceConflicts.length;

  if (totalConflicts === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No Conflicts Detected
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            All inventory and prices are synchronized across marketplaces.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conflict Resolution
          </h2>
          <p className="text-sm text-gray-500">
            {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} detected
          </p>
        </div>
        {onSyncAll && (
          <Button variant="primary" onClick={onSyncAll} icon={<RefreshCw className="h-4 w-4" />}>
            Sync All
          </Button>
        )}
      </div>

      {/* Inventory Conflicts */}
      {inventoryConflicts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Inventory Conflicts ({inventoryConflicts.length})
          </h3>
          {inventoryConflicts.map((conflict) => (
            <Card key={conflict.listingId}>
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {conflict.listingTitle}
                </h4>
                <p className="text-xs text-gray-500">SKU: {conflict.sku}</p>
              </div>
              <div className="space-y-2">
                {conflict.conflicts.map((c) => {
                  const key = `${conflict.listingId}-${c.marketplaceId}`;
                  const isResolving = resolving[key];

                  return (
                    <div
                      key={c.marketplaceId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{MARKETPLACES[c.marketplaceId].icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {MARKETPLACES[c.marketplaceId].name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Local: {c.localQuantity} | Marketplace: {c.marketplaceQuantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.difference > 0 ? 'warning' : 'danger'}>
                          {c.difference > 0 ? '+' : ''}{c.difference}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={isResolving}
                          onClick={() => handleResolveInventory(conflict.listingId, c.marketplaceId, c.localQuantity)}
                        >
                          Sync to Local
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={isResolving}
                          onClick={() => handleResolveInventory(conflict.listingId, c.marketplaceId, c.marketplaceQuantity)}
                        >
                          Sync to Marketplace
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Price Conflicts */}
      {priceConflicts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Price Conflicts ({priceConflicts.length})
          </h3>
          {priceConflicts.map((conflict) => (
            <Card key={conflict.listingId}>
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {conflict.listingTitle}
                </h4>
                <p className="text-xs text-gray-500">SKU: {conflict.sku}</p>
              </div>
              <div className="space-y-2">
                {conflict.conflicts.map((c) => {
                  const key = `${conflict.listingId}-${c.marketplaceId}`;
                  const isResolving = resolving[key];

                  return (
                    <div
                      key={c.marketplaceId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{MARKETPLACES[c.marketplaceId].icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {MARKETPLACES[c.marketplaceId].name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Local: ${c.localPrice.toFixed(2)} | Marketplace: ${c.marketplacePrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.difference > 0 ? 'warning' : 'danger'}>
                          {c.difference > 0 ? '+' : ''}${c.difference.toFixed(2)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={isResolving}
                          onClick={() => handleResolvePrice(conflict.listingId, c.marketplaceId, c.localPrice)}
                        >
                          Use Local Price
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={isResolving}
                          onClick={() => handleResolvePrice(conflict.listingId, c.marketplaceId, c.marketplacePrice)}
                        >
                          Use Marketplace Price
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
