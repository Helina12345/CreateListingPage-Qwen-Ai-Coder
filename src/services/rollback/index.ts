// ============================================================
// ListingDesk Pro — Rollback Service
// Provides ability to rollback publishing attempts and listing changes
// ============================================================

import type { MarketplaceId, Listing } from '../../types';
import { auditLog, AuditEventType } from '../audit';

export interface RollbackPoint {
  id: string;
  listingId: string;
  timestamp: string;
  snapshot: Partial<Listing>;
  reason: string;
  marketplaceId?: MarketplaceId;
  userId?: string;
}

export interface RollbackResult {
  success: boolean;
  rollbackPointId: string;
  listingId: string;
  rolledBackAt: string;
  changesReverted: number;
  errors?: string[];
}

// In-memory storage (in production, use database)
const rollbackPoints: RollbackPoint[] = [];

// ============================================================
// Create Rollback Point
// ============================================================

export function createRollbackPoint(
  listing: Listing,
  reason: string,
  options?: {
    marketplaceId?: MarketplaceId;
    userId?: string;
  }
): RollbackPoint {
  const point: RollbackPoint = {
    id: `rb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId: listing.id,
    timestamp: new Date().toISOString(),
    snapshot: JSON.parse(JSON.stringify(listing)), // Deep clone
    reason,
    marketplaceId: options?.marketplaceId,
    userId: options?.userId,
  };

  rollbackPoints.unshift(point);

  // Keep only last 50 rollback points per listing
  const listingPoints = rollbackPoints.filter((p) => p.listingId === listing.id);
  if (listingPoints.length > 50) {
    const toRemove = listingPoints.slice(-10);
    toRemove.forEach((p) => {
      const index = rollbackPoints.indexOf(p);
      if (index !== -1) rollbackPoints.splice(index, 1);
    });
  }

  auditLog({
    type: AuditEventType.LISTING_UPDATED,
    severity: 'info',
    message: `Rollback point created for listing ${listing.id}`,
    meta {
      rollbackPointId: point.id,
      listingId: listing.id,
      reason,
      marketplaceId: options?.marketplaceId,
    },
  });

  return point;
}

// ============================================================
// Execute Rollback
// ============================================================

export async function executeRollback(
  rollbackPointId: string,
  updateListing: (listingId: string, updates: Partial<Listing>) => Promise<void>
): Promise<RollbackResult> {
  const point = rollbackPoints.find((p) => p.id === rollbackPointId);

  if (!point) {
    return {
      success: false,
      rollbackPointId,
      listingId: '',
      rolledBackAt: new Date().toISOString(),
      changesReverted: 0,
      errors: ['Rollback point not found'],
    };
  }

  try {
    // Create a new rollback point before rolling back (safety net)
    // In production, would fetch current listing first

    // Restore the snapshot
    await updateListing(point.listingId, point.snapshot);

    const result: RollbackResult = {
      success: true,
      rollbackPointId,
      listingId: point.listingId,
      rolledBackAt: new Date().toISOString(),
      changesReverted: 1,
    };

    auditLog({
      type: AuditEventType.LISTING_UPDATED,
      severity: 'warning',
      message: `Listing rolled back to point ${rollbackPointId}`,
      meta {
        rollbackPointId,
        listingId: point.listingId,
        originalTimestamp: point.timestamp,
      },
    });

    return result;
  } catch (error: any) {
    return {
      success: false,
      rollbackPointId,
      listingId: point.listingId,
      rolledBackAt: new Date().toISOString(),
      changesReverted: 0,
      errors: [error.message],
    };
  }
}

// ============================================================
// Query Rollback Points
// ============================================================

export function getRollbackPoints(
  listingId: string,
  limit: number = 10
): RollbackPoint[] {
  return rollbackPoints
    .filter((p) => p.listingId === listingId)
    .slice(0, limit);
}

export function getRollbackPoint(pointId: string): RollbackPoint | undefined {
  return rollbackPoints.find((p) => p.id === pointId);
}

export function deleteRollbackPoint(pointId: string): boolean {
  const index = rollbackPoints.findIndex((p) => p.id === pointId);
  if (index !== -1) {
    rollbackPoints.splice(index, 1);
    return true;
  }
  return false;
}

// ============================================================
// Automatic Rollback Point Creation
// ============================================================

export function createRollbackPointBeforePublish(
  listing: Listing,
  marketplaceIds: MarketplaceId[],
  userId?: string
): RollbackPoint[] {
  const points: RollbackPoint[] = [];

  // Create one rollback point for the entire publish operation
  const point = createRollbackPoint(
    listing,
    `Before publishing to ${marketplaceIds.length} marketplace(s)`,
    { userId }
  );

  points.push(point);

  return points;
}

export function createRollbackPointBeforeMajorChange(
  listing: Listing,
  changeDescription: string,
  userId?: string
): RollbackPoint {
  return createRollbackPoint(listing, `Before: ${changeDescription}`, { userId });
}

// ============================================================
// Publishing Rollback
// ============================================================

export interface PublishingRollbackResult {
  success: boolean;
  listingId: string;
  marketplaceId: MarketplaceId;
  externalId: string;
  rolledBackAt: string;
  error?: string;
}

export async function rollbackPublishing(
  listingId: string,
  marketplaceId: MarketplaceId,
  externalId: string,
  unpublishFromMarketplace: (marketplaceId: MarketplaceId, externalId: string) => Promise<void>
): Promise<PublishingRollbackResult> {
  try {
    await unpublishFromMarketplace(marketplaceId, externalId);

    auditLog({
      type: AuditEventType.LISTING_UNPUBLISHED,
      severity: 'warning',
      message: `Publishing rolled back for listing ${listingId} on ${marketplaceId}`,
      meta {
        listingId,
        marketplaceId,
        externalId,
      },
    });

    return {
      success: true,
      listingId,
      marketplaceId,
      externalId,
      rolledBackAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      listingId,
      marketplaceId,
      externalId,
      rolledBackAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// ============================================================
// Bulk Rollback
// ============================================================

export async function rollbackMultipleListings(
  rollbackPointIds: string[],
  updateListing: (listingId: string, updates: Partial<Listing>) => Promise<void>
): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: RollbackResult[];
}> {
  const results: RollbackResult[] = [];

  for (const pointId of rollbackPointIds) {
    const result = await executeRollback(pointId, updateListing);
    results.push(result);
  }

  return {
    total: rollbackPointIds.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

// ============================================================
// Rollback Point Comparison
// ============================================================

export function compareRollbackPoints(
  pointId1: string,
  pointId2: string
): {
  differences: Array<{
    field: string;
    value1: any;
    value2: any;
  }>;
} | null {
  const point1 = rollbackPoints.find((p) => p.id === pointId1);
  const point2 = rollbackPoints.find((p) => p.id === pointId2);

  if (!point1 || !point2) {
    return null;
  }

  const differences: Array<{
    field: string;
    value1: any;
    value2: any;
  }> = [];

  // Compare key fields
  const fieldsToCompare = ['title', 'description', 'pricing', 'inventory', 'status'];

  fieldsToCompare.forEach((field) => {
    const value1 = point1.snapshot[field as keyof Listing];
    const value2 = point2.snapshot[field as keyof Listing];

    if (JSON.stringify(value1) !== JSON.stringify(value2)) {
      differences.push({
        field,
        value1,
        value2,
      });
    }
  });

  return { differences };
}
