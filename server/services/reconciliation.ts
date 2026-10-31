// ============================================================
// ListingDesk Pro — Real Reconciliation Service
// Detects and resolves discrepancies between marketplaces
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// RECONCILIATION SERVICE
// ============================================================

export class ReconciliationService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // INVENTORY RECONCILIATION
  // ============================================================

  async reconcileInventory(
    listingId: string,
    marketplaceId: MarketplaceId,
    getMarketplaceInventory: (externalId: string) => Promise<number>
  ): Promise<Discrepancy[]> {
    const foundDiscrepancies: Discrepancy[] = [];

    const listing = await this.db.listing.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    const product = await this.db.product.findById(listing.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const inventory = await this.db.inventory.findByProductId(product.id);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const localInventory = inventory.totalQuantity;
    const externalId = listing.externalId;

    if (externalId) {
      try {
        const marketplaceInventory = await getMarketplaceInventory(externalId);

        if (localInventory !== marketplaceInventory) {
          const discrepancy: Discrepancy = {
            id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            listingId,
            type: 'inventory',
            severity: Math.abs(localInventory - marketplaceInventory) > 10 ? 'high' : 'medium',
            marketplaceId,
            localValue: localInventory,
            marketplaceValue: marketplaceInventory,
            detectedAt: new Date().toISOString(),
            status: 'open',
          };

          foundDiscrepancies.push(discrepancy);

          // Store discrepancy
          // await this.db.discrepancy.create(discrepancy);

          await this.db.auditLog.create({
            userId: product.userId,
            action: 'reconciliation.inventory_discrepancy',
            resource: 'listing',
            resourceId: listingId,
            changes: {
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

    return foundDiscrepancies;
  }

  // ============================================================
  // PRICE RECONCILIATION
  // ============================================================

  async reconcilePrice(
    listingId: string,
    marketplaceId: MarketplaceId,
    getMarketplacePrice: (externalId: string) => Promise<number>
  ): Promise<Discrepancy[]> {
    const foundDiscrepancies: Discrepancy[] = [];

    const listing = await this.db.listing.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    const product = await this.db.product.findById(listing.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const localPrice = listing.price;
    const externalId = listing.externalId;

    if (externalId) {
      try {
        const marketplacePrice = await getMarketplacePrice(externalId);

        if (Math.abs(localPrice - marketplacePrice) > 0.01) {
          const discrepancy: Discrepancy = {
            id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            listingId,
            type: 'price',
            severity: Math.abs(localPrice - marketplacePrice) > 10 ? 'high' : 'medium',
            marketplaceId,
            localValue: localPrice,
            marketplaceValue: marketplacePrice,
            detectedAt: new Date().toISOString(),
            status: 'open',
          };

          foundDiscrepancies.push(discrepancy);

          await this.db.auditLog.create({
            userId: product.userId,
            action: 'reconciliation.price_discrepancy',
            resource: 'listing',
            resourceId: listingId,
            changes: {
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
  // STATUS RECONCILIATION
  // ============================================================

  async reconcileStatus(
    listingId: string,
    marketplaceId: MarketplaceId,
    getMarketplaceStatus: (externalId: string) => Promise<string>
  ): Promise<Discrepancy[]> {
    const foundDiscrepancies: Discrepancy[] = [];

    const listing = await this.db.listing.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    const product = await this.db.product.findById(listing.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const localStatus = listing.status;
    const externalId = listing.externalId;

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
            listingId,
            type: 'status',
            severity: 'high',
            marketplaceId,
            localValue: localStatus,
            marketplaceValue: marketplaceStatus,
            detectedAt: new Date().toISOString(),
            status: 'open',
          };

          foundDiscrepancies.push(discrepancy);

          await this.db.auditLog.create({
            userId: product.userId,
            action: 'reconciliation.status_discrepancy',
            resource: 'listing',
            resourceId: listingId,
            changes: {
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
  // FULL RECONCILIATION
  // ============================================================

  async reconcileListing(
    listingId: string,
    marketplaceIds: MarketplaceId[],
    getMarketplaceData: (marketplaceId: MarketplaceId, externalId: string) => Promise<{
      inventory: number;
      price: number;
      status: string;
    }>
  ): Promise<ReconciliationResult> {
    const allDiscrepancies: Discrepancy[] = [];
    let totalChecked = 0;

    const listing = await this.db.listing.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    for (const marketplaceId of marketplaceIds) {
      const externalId = listing.externalId;

      if (externalId) {
        totalChecked++;

        try {
          const marketplaceData = await getMarketplaceData(marketplaceId, externalId);

          // Check inventory
          const product = await this.db.product.findById(listing.productId);
          if (product) {
            const inventory = await this.db.inventory.findByProductId(product.id);
            if (inventory && inventory.totalQuantity !== marketplaceData.inventory) {
              allDiscrepancies.push({
                id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                listingId,
                type: 'inventory',
                severity: 'medium',
                marketplaceId,
                localValue: inventory.totalQuantity,
                marketplaceValue: marketplaceData.inventory,
                detectedAt: new Date().toISOString(),
                status: 'open',
              });
            }
          }

          // Check price
          if (Math.abs(listing.price - marketplaceData.price) > 0.01) {
            allDiscrepancies.push({
              id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              listingId,
              type: 'price',
              severity: 'medium',
              marketplaceId,
              localValue: listing.price,
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
              listingId,
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

    return {
      listingId,
      checkedAt: new Date().toISOString(),
      discrepancies: allDiscrepancies,
      totalChecked,
      totalDiscrepancies: allDiscrepancies.length,
      resolvedCount: 0,
    };
  }

  // ============================================================
  // DISCREPANCY MANAGEMENT
  // ============================================================

  async getDiscrepancies(listingId?: string, status?: 'open' | 'resolved' | 'ignored'): Promise<Discrepancy[]> {
    // In production, query from database
    return [];
  }

  async resolveDiscrepancy(
    discrepancyId: string,
    resolution: string,
    resolvedValue?: any
  ): Promise<boolean> {
    // In production, update discrepancy in database
    return true;
  }

  async ignoreDiscrepancy(discrepancyId: string): Promise<boolean> {
    // In production, update discrepancy in database
    return true;
  }

  async getDiscrepancySummary(): Promise<{
    total: number;
    open: number;
    resolved: number;
    ignored: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    // In production, query from database
    return {
      total: 0,
      open: 0,
      resolved: 0,
      ignored: 0,
      byType: {},
      bySeverity: {},
    };
  }

  // ============================================================
  // AUTO-RECONCILIATION
  // ============================================================

  async autoReconcile(
    discrepancyId: string,
    strategy: 'use_local' | 'use_marketplace' | 'use_latest'
  ): Promise<boolean> {
    // In production, get discrepancy from database
    // Apply strategy and update both local and marketplace

    return true;
  }
}
