// ============================================================
// ListingDesk Pro — Bulk Operations Service
// Bulk price updates, bulk publishing, etc.
// ============================================================

import { getAdapter } from '../marketplace-adapters';
import { auditLog, AuditEventType } from '../audit';
import type { MarketplaceId, Listing } from '../../types';

export interface BulkOperation {
  id: string;
  type: 'price_update' | 'publish' | 'unpublish' | 'delete' | 'inventory_update';
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  total: number;
  completed: number;
  failed: number;
  results: BulkOperationResult[];
  createdAt: string;
  completedAt?: string;
}

export interface BulkOperationResult {
  listingId: string;
  marketplaceId: MarketplaceId;
  status: 'success' | 'failed';
  error?: string;
  externalId?: string;
}

// In-memory operation history
const operationHistory: BulkOperation[] = [];

/**
 * Bulk update prices across multiple listings and marketplaces
 */
export async function bulkUpdatePrices(
  listings: Array<{ listing: Partial<Listing>; marketplaceId: MarketplaceId; externalId: string; newPrice: number }>,
  percentageChange?: number
): Promise<BulkOperation> {
  const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const operation: BulkOperation = {
    id: operationId,
    type: 'price_update',
    status: 'processing',
    total: listings.length,
    completed: 0,
    failed: 0,
    results: [],
    createdAt: new Date().toISOString(),
  };

  operationHistory.unshift(operation);
  if (operationHistory.length > 500) operationHistory.length = 500;

  const promises = listings.map(async (item) => {
    try {
      const adapter = getAdapter(item.marketplaceId);
      const finalPrice = percentageChange
        ? item.newPrice * (1 + percentageChange / 100)
        : item.newPrice;

      await adapter.updateProduct(item.externalId, {
        ...item.listing,
        pricing: { ...item.listing.pricing!, basePrice: finalPrice },
      } as any);

      operation.results.push({
        listingId: item.listing.id || '',
        marketplaceId: item.marketplaceId,
        status: 'success',
        externalId: item.externalId,
      });
      operation.completed++;

      auditLog({
        type: AuditEventType.LISTING_UPDATED,
        severity: 'info',
        message: `Price updated for listing on ${item.marketplaceId}`,
        metadata: { listingId: item.listing.id, newPrice: finalPrice, marketplaceId: item.marketplaceId },
        marketplaceId: item.marketplaceId,
        listingId: item.listing.id,
      });
    } catch (error: any) {
      operation.results.push({
        listingId: item.listing.id || '',
        marketplaceId: item.marketplaceId,
        status: 'failed',
        error: error.message,
      });
      operation.failed++;

      auditLog({
        type: AuditEventType.ERROR_OCCURRED,
        severity: 'error',
        message: `Bulk price update failed: ${error.message}`,
        metadata: { listingId: item.listing.id, marketplaceId: item.marketplaceId },
      });
    }
  });

  await Promise.allSettled(promises);

  operation.status = operation.failed === 0 ? 'completed' : operation.completed === 0 ? 'failed' : 'partial';
  operation.completedAt = new Date().toISOString();

  return operation;
}

/**
 * Bulk publish listings to multiple marketplaces
 */
export async function bulkPublish(
  listings: Array<{ listing: Partial<Listing>; marketplaceIds: MarketplaceId[] }>
): Promise<BulkOperation> {
  const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const totalJobs = listings.reduce((sum, l) => sum + l.marketplaceIds.length, 0);

  const operation: BulkOperation = {
    id: operationId,
    type: 'publish',
    status: 'processing',
    total: totalJobs,
    completed: 0,
    failed: 0,
    results: [],
    createdAt: new Date().toISOString(),
  };

  operationHistory.unshift(operation);
  if (operationHistory.length > 500) operationHistory.length = 500;

  const promises = listings.flatMap((item) =>
    item.marketplaceIds.map(async (marketplaceId) => {
      try {
        const adapter = getAdapter(marketplaceId);
        const createResult = await adapter.createProduct(item.listing);

        if (createResult.success && createResult.externalId) {
          const publishResult = await adapter.publishProduct(createResult.externalId);

          operation.results.push({
            listingId: item.listing.id || '',
            marketplaceId,
            status: publishResult.success ? 'success' : 'failed',
            externalId: createResult.externalId,
            error: publishResult.errors?.[0],
          });

          if (publishResult.success) {
            operation.completed++;
          } else {
            operation.failed++;
          }
        } else {
          operation.results.push({
            listingId: item.listing.id || '',
            marketplaceId,
            status: 'failed',
            error: createResult.errors?.[0] || 'Failed to create product',
          });
          operation.failed++;
        }
      } catch (error: any) {
        operation.results.push({
          listingId: item.listing.id || '',
          marketplaceId,
          status: 'failed',
          error: error.message,
        });
        operation.failed++;
      }
    })
  );

  await Promise.allSettled(promises);

  operation.status = operation.failed === 0 ? 'completed' : operation.completed === 0 ? 'failed' : 'partial';
  operation.completedAt = new Date().toISOString();

  return operation;
}

/**
 * Get bulk operation history
 */
export function getBulkOperationHistory(limit: number = 50): BulkOperation[] {
  return operationHistory.slice(0, limit);
}

/**
 * Get bulk operation by ID
 */
export function getBulkOperation(operationId: string): BulkOperation | undefined {
  return operationHistory.find((op) => op.id === operationId);
}
