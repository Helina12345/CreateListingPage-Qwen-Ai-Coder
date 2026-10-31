// ============================================================
// ListingDesk Pro — Reconciliation Service
// Detects and resolves discrepancies between marketplaces
// ============================================================

import type { MarketplaceId, Listing, Order } from '../../types';
import { auditLog, AuditEventType } from '../audit';

export interface Discrepancy {
  id: string;
  listingId: string;
  type: 'inventory' | 'price' | 'status' | 'title' | 'description';
  severity: 'low' | 'medium' | 'high' | 'critical';
  marketplaceId: MarketplaceId;
  localValue: any;
  marketplaceValue: any;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: string;
  status: 'open' | 'resolved' | 'ignored';
}

export interface ReconciliationResult {
  listingId: string;
  checkedAt: string;
  discrepancies: Discrepancy[];
  totalChecked: number;
  totalDiscrepancies: number;
  resolvedCount: number;
}

// In-memory storage (in production, use database)
const discrepancies: Discrepancy[] = [];

// ============================================================
// Inventory Reconciliation
// ============================================================

export async function reconcileInventory(
  listing: Listing,
  marketplaceId: MarketplaceId,
  getMarketplaceInventory: (externalId: string) => Promise<number>
): Promise<Discrepancy[]> {
  const foundDiscrepancies: Discrepancy[] = [];

  // Check main product inventory
  const localInventory = listing.inventory.totalQuantity;
  const externalId = listing.marketplaceData.find((d) => d.marketplaceId === marketplaceId)?.externalId;

  if (externalId) {
    try {
      const marketplaceInventory = await getMarketplaceInventory(externalId);

      if (localInventory !== marketplaceInventory) {
        const discrepancy: Discrepancy = {
          id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          listingId: listing.id,
          type: 'inventory',
          severity: Math.abs(localInventory - marketplaceInventory) > 10 ? 'high' : 'medium',
          marketplaceId,
          localValue: localInventory,
          marketplaceValue: marketplaceInventory,
          detectedAt: new Date().toISOString(),
          status: 'open',
        };

        foundDiscrepancies.push(discrepancy);
        discrepancies.push(discrepancy);

        auditLog({
          type: AuditEventType.ERROR_OCCURRED,
          severity: 'warning',
          message: `Inventory discrepancy detected for ${listing.title} on ${marketplaceId}`,
          meta {
            listingId: listing.id,
            marketplaceId,
            localInventory,
            marketplaceInventory,
            difference: Math.abs(localInventory - marketplaceInventory),
          },
        });
      }
    } catch (error: any) {
      console.error(`Failed to reconcile inventory for ${marketplaceId}:`, error);
    }
  }

  // Check variant inventory
  for (const variant of listing.variants) {
    const variantLocalInventory = variant.inventory;
    // In production, fetch variant inventory from marketplace
    // For now, skip variant reconciliation
  }

  return foundDiscrepancies;
}

// ============================================================
// Price Reconciliation
// ============================================================

export async function reconcilePrice(
  listing: Listing,
  marketplaceId: MarketplaceId,
  getMarketplacePrice: (externalId: string) => Promise<number>
): Promise<Discrepancy[]> {
  const foundDiscrepancies: Discrepancy[] = [];

  const localPrice = listing.pricing.basePrice;
  const externalId = listing.marketplaceData.find((d) => d.marketplaceId === marketplaceId)?.externalId;

  if (externalId) {
    try {
      const marketplacePrice = await getMarketplacePrice(externalId);

      if (Math.abs(localPrice - marketplacePrice) > 0.01) {
        const discrepancy: Discrepancy = {
          id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          listingId: listing.id,
          type: 'price',
          severity: Math.abs(localPrice - marketplacePrice) > 10 ? 'high' : 'medium',
          marketplaceId,
          localValue: localPrice,
          marketplaceValue: marketplacePrice,
          detectedAt: new Date().toISOString(),
          status: 'open',
        };

        foundDiscrepancies.push(discrepancy);
        discrepancies.push(discrepancy);

        auditLog({
          type: AuditEventType.ERROR_OCCURRED,
          severity: 'warning',
          message: `Price discrepancy detected for ${listing.title} on ${marketplaceId}`,
          meta {
            listingId: listing.id,
            marketplaceId,
            localPrice,
            marketplacePrice,
            difference: Math.abs(localPrice - marketplacePrice),
          },
        });
      }
    } catch (error: any) {
      console.error(`Failed to reconcile price for ${marketplaceId}:`, error);
    }
  }

  return foundDiscrepancies;
}

// ============================================================
// Status Reconciliation
// ============================================================

export async function reconcileStatus(
  listing: Listing,
  marketplaceId: MarketplaceId,
  getMarketplaceStatus: (externalId: string) => Promise<string>
): Promise<Discrepancy[]> {
  const foundDiscrepancies: Discrepancy[] = [];

  const localStatus = listing.status;
  const externalId = listing.marketplaceData.find((d) => d.marketplaceId === marketplaceId)?.externalId;

  if (externalId) {
    try {
      const marketplaceStatus = await getMarketplaceStatus(externalId);

      // Map statuses
      const statusMap: Record<string, string> = {
        active: 'published',
        draft: 'draft',
        paused: 'inactive',
        archived: 'deleted',
      };

      const expectedMarketplaceStatus = statusMap[localStatus] || localStatus;

      if (marketplaceStatus !== expectedMarketplaceStatus) {
        const discrepancy: Discrepancy = {
          id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          listingId: listing.id,
          type: 'status',
          severity: 'high',
          marketplaceId,
          localValue: localStatus,
          marketplaceValue: marketplaceStatus,
          detectedAt: new Date().toISOString(),
          status: 'open',
        };

        foundDiscrepancies.push(discrepancy);
        discrepancies.push(discrepancy);

        auditLog({
          type: AuditEventType.ERROR_OCCURRED,
          severity: 'error',
          message: `Status discrepancy detected for ${listing.title} on ${marketplaceId}`,
          meta {
            listingId: listing.id,
            marketplaceId,
            localStatus,
            marketplaceStatus,
          },
        });
      }
    } catch (error: any) {
      console.error(`Failed to reconcile status for ${marketplaceId}:`, error);
    }
  }

  return foundDiscrepancies;
}

// ============================================================
// Full Reconciliation
// ============================================================

export async function reconcileListing(
  listing: Listing,
  marketplaceIds: MarketplaceId[],
  getMarketplaceData: (marketplaceId: MarketplaceId, externalId: string) => Promise<{
    inventory: number;
    price: number;
    status: string;
  }>
): Promise<ReconciliationResult> {
  const allDiscrepancies: Discrepancy[] = [];
  let totalChecked = 0;

  for (const marketplaceId of marketplaceIds) {
    const externalId = listing.marketplaceData.find((d) => d.marketplaceId === marketplaceId)?.externalId;

    if (externalId) {
      totalChecked++;

      try {
        const marketplaceData = await getMarketplaceData(marketplaceId, externalId);

        // Check inventory
        if (listing.inventory.totalQuantity !== marketplaceData.inventory) {
          allDiscrepancies.push({
            id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            listingId: listing.id,
            type: 'inventory',
            severity: 'medium',
            marketplaceId,
            localValue: listing.inventory.totalQuantity,
            marketplaceValue: marketplaceData.inventory,
            detectedAt: new Date().toISOString(),
            status: 'open',
          });
        }

        // Check price
        if (Math.abs(listing.pricing.basePrice - marketplaceData.price) > 0.01) {
          allDiscrepancies.push({
            id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            listingId: listing.id,
            type: 'price',
            severity: 'medium',
            marketplaceId,
            localValue: listing.pricing.basePrice,
            marketplaceValue: marketplaceData.price,
            detectedAt: new Date().toISOString(),
            status: 'open',
          });
        }

        // Check status
        const statusMap: Record<string, string> = {
          active: 'published',
          draft: 'draft',
          paused: 'inactive',
          archived: 'deleted',
        };

        if (marketplaceData.status !== statusMap[listing.status]) {
          allDiscrepancies.push({
            id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            listingId: listing.id,
            type: 'status',
            severity: 'high',
            marketplaceId,
            localValue: listing.status,
            marketplaceValue: marketplaceData.status,
            detectedAt: new Date().toISOString(),
            status: 'open',
          });
        }
      } catch (error: any) {
        console.error(`Failed to reconcile listing on ${marketplaceId}:`, error);
      }
    }
  }

  discrepancies.push(...allDiscrepancies);

  return {
    listingId: listing.id,
    checkedAt: new Date().toISOString(),
    discrepancies: allDiscrepancies,
    totalChecked,
    totalDiscrepancies: allDiscrepancies.length,
    resolvedCount: 0,
  };
}

// ============================================================
// Discrepancy Management
// ============================================================

export function getDiscrepancies(listingId?: string, status?: 'open' | 'resolved' | 'ignored'): Discrepancy[] {
  let result = [...discrepancies];

  if (listingId) {
    result = result.filter((d) => d.listingId === listingId);
  }

  if (status) {
    result = result.filter((d) => d.status === status);
  }

  return result.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}

export function resolveDiscrepancy(
  discrepancyId: string,
  resolution: string,
  resolvedValue?: any
): boolean {
  const discrepancy = discrepancies.find((d) => d.id === discrepancyId);

  if (discrepancy) {
    discrepancy.status = 'resolved';
    discrepancy.resolution = resolution;
    discrepancy.resolvedAt = new Date().toISOString();

    if (resolvedValue !== undefined) {
      discrepancy.marketplaceValue = resolvedValue;
    }

    auditLog({
      type: AuditEventType.LISTING_UPDATED,
      severity: 'info',
      message: `Discrepancy resolved for listing ${discrepancy.listingId}`,
      meta {
        discrepancyId,
        type: discrepancy.type,
        marketplaceId: discrepancy.marketplaceId,
        resolution,
      },
    });

    return true;
  }

  return false;
}

export function ignoreDiscrepancy(discrepancyId: string): boolean {
  const discrepancy = discrepancies.find((d) => d.id === discrepancyId);

  if (discrepancy) {
    discrepancy.status = 'ignored';
    discrepancy.resolvedAt = new Date().toISOString();
    return true;
  }

  return false;
}

export function getDiscrepancySummary(): {
  total: number;
  open: number;
  resolved: number;
  ignored: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  const open = discrepancies.filter((d) => d.status === 'open').length;
  const resolved = discrepancies.filter((d) => d.status === 'resolved').length;
  const ignored = discrepancies.filter((d) => d.status === 'ignored').length;

  const byType: Record<string, number> = {};
  discrepancies.forEach((d) => {
    byType[d.type] = (byType[d.type] || 0) + 1;
  });

  const bySeverity: Record<string, number> = {};
  discrepancies.forEach((d) => {
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
  });

  return {
    total: discrepancies.length,
    open,
    resolved,
    ignored,
    byType,
    bySeverity,
  };
}

// ============================================================
// Auto-Reconciliation
// ============================================================

export async function autoReconcile(
  discrepancyId: string,
  strategy: 'use_local' | 'use_marketplace' | 'use_latest'
): Promise<boolean> {
  const discrepancy = discrepancies.find((d) => d.id === discrepancyId);

  if (!discrepancy || discrepancy.status !== 'open') {
    return false;
  }

  let resolution = '';
  let resolvedValue: any;

  switch (strategy) {
    case 'use_local':
      resolution = 'Used local value';
      resolvedValue = discrepancy.localValue;
      break;
    case 'use_marketplace':
      resolution = 'Used marketplace value';
      resolvedValue = discrepancy.marketplaceValue;
      break;
    case 'use_latest':
      // In production, compare timestamps
      resolution = 'Used most recent value';
      resolvedValue = discrepancy.marketplaceValue; // Default to marketplace
      break;
  }

  return resolveDiscrepancy(discrepancyId, resolution, resolvedValue);
}
