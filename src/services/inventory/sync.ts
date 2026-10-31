// ============================================================
// ListingDesk Pro — Inventory Synchronization Service
// Real-time inventory sync across all marketplaces
// ============================================================

import { getAdapter } from '../marketplace-adapters';
import { auditLog, AuditEventType } from '../audit';
import type { MarketplaceId, Listing } from '../../types';

export interface InventorySyncJob {
  id: string;
  listingId: string;
  marketplaceId: MarketplaceId;
  externalId: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  previousQuantity?: number;
  newQuantity: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface InventorySyncBatch {
  id: string;
  listingId: string;
  jobs: InventorySyncJob[];
  createdAt: string;
  completedAt?: string;
  overallStatus: 'pending' | 'syncing' | 'completed' | 'partial' | 'failed';
}

// In-memory sync history (in production, use database)
const syncHistory: InventorySyncBatch[] = [];

/**
 * Sync inventory across all connected marketplaces
 */
export async function syncInventoryAcrossMarketplaces(
  listing: Partial<Listing>,
  marketplaceIds: MarketplaceId[],
  externalIds: Partial<Record<MarketplaceId, string>>
): Promise<InventorySyncBatch> {
  const batchId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const jobs: InventorySyncJob[] = marketplaceIds.map((mpId) => ({
    id: `job_${Date.now()}_${mpId}`,
    listingId: listing.id || '',
    marketplaceId: mpId,
    externalId: externalIds[mpId] || '',
    status: 'pending',
    newQuantity: listing.inventory?.totalQuantity || 0,
    startedAt: new Date().toISOString(),
  }));

  const batch: InventorySyncBatch = {
    id: batchId,
    listingId: listing.id || '',
    jobs,
    createdAt: new Date().toISOString(),
    overallStatus: 'pending',
  };

  syncHistory.unshift(batch);
  if (syncHistory.length > 1000) syncHistory.length = 1000;

  // Start syncing
  batch.overallStatus = 'syncing';

  const promises = jobs.map(async (job) => {
    if (!job.externalId) {
      job.status = 'failed';
      job.error = 'No external ID found for this marketplace';
      return;
    }

    job.status = 'syncing';

    try {
      const adapter = getAdapter(job.marketplaceId);

      // Get current inventory
      const currentInventory = await adapter.getInventory(job.externalId);
      job.previousQuantity = currentInventory;

      // Update inventory
      await adapter.updateInventory(job.externalId, job.newQuantity);

      job.status = 'completed';
      job.completedAt = new Date().toISOString();

      auditLog({
        type: AuditEventType.INVENTORY_UPDATED,
        severity: 'info',
        message: `Inventory synced for ${listing.title} on ${job.marketplaceId}`,
        metadata: {
          listingId: listing.id,
          marketplaceId: job.marketplaceId,
          previousQuantity: job.previousQuantity,
          newQuantity: job.newQuantity,
        },
        marketplaceId: job.marketplaceId,
        listingId: listing.id,
      });
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();

      auditLog({
        type: AuditEventType.ERROR_OCCURRED,
        severity: 'error',
        message: `Failed to sync inventory for ${listing.title} on ${job.marketplaceId}: ${error.message}`,
        metadata: {
          listingId: listing.id,
          marketplaceId: job.marketplaceId,
          error: error.message,
        },
        marketplaceId: job.marketplaceId,
        listingId: listing.id,
      });
    }
  });

  await Promise.allSettled(promises);

  // Determine overall status
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length;

  if (completedJobs === jobs.length) {
    batch.overallStatus = 'completed';
  } else if (completedJobs === 0) {
    batch.overallStatus = 'failed';
  } else {
    batch.overallStatus = 'partial';
  }

  batch.completedAt = new Date().toISOString();

  return batch;
}

/**
 * Prevent overselling by checking inventory before order
 */
export async function checkInventoryAvailability(
  listingId: string,
  marketplaceId: MarketplaceId,
  externalId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number }> {
  try {
    const adapter = getAdapter(marketplaceId);
    const currentStock = await adapter.getInventory(externalId);

    return {
      available: currentStock >= requestedQuantity,
      currentStock,
    };
  } catch (error: any) {
    auditLog({
      type: AuditEventType.ERROR_OCCURRED,
      severity: 'error',
      message: `Failed to check inventory availability: ${error.message}`,
      metadata: { listingId, marketplaceId, externalId },
    });

    return { available: false, currentStock: 0 };
  }
}

/**
 * Get inventory sync history
 */
export function getInventorySyncHistory(listingId?: string, limit: number = 50): InventorySyncBatch[] {
  if (listingId) {
    return syncHistory.filter((b) => b.listingId === listingId).slice(0, limit);
  }
  return syncHistory.slice(0, limit);
}

/**
 * Get sync batch by ID
 */
export function getSyncBatch(batchId: string): InventorySyncBatch | undefined {
  return syncHistory.find((b) => b.id === batchId);
}
