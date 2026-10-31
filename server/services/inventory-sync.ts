// ============================================================
// ListingDesk Pro — Real Inventory Synchronization Service
// Complete inventory sync across all marketplaces
// ============================================================

import type { ServerInventory, ServerInventoryAllocation, ServerInventoryHistory } from '../types';
import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';

// ============================================================
// TYPES
// ============================================================

export interface InventorySyncResult {
  productId: string;
  marketplaceId: MarketplaceId;
  success: boolean;
  previousQuantity?: number;
  newQuantity?: number;
  error?: string;
}

// ============================================================
// INVENTORY SYNCHRONIZATION SERVICE
// ============================================================

export class InventorySyncService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // SYNC INVENTORY TO MARKETPLACE
  // ============================================================

  async syncInventoryToMarketplace(
    productId: string,
    marketplaceId: MarketplaceId,
    userId: string
  ): Promise<InventorySyncResult> {
    try {
      // Get product
      const product = await this.db.product.findById(productId);
      if (!product || product.userId !== userId) {
        throw new Error('Product not found');
      }

      // Get inventory
      const inventory = await this.db.inventory.findByProductId(productId);
      if (!inventory) {
        throw new Error('Inventory not found');
      }

      // Get allocation for this marketplace
      const allocation = await this.db.inventory.allocation.findByInventoryAndMarketplace(
        inventory.id,
        marketplaceId
      );

      const quantity = allocation?.allocatedQuantity || 0;

      // Get listing
      const listing = await this.db.listing.findByProductIdAndMarketplace(productId, marketplaceId);
      if (!listing || !listing.externalId) {
        throw new Error('Listing not found or not published');
      }

      // Get connection
      const connection = await this.db.marketplaceConnection.findById(listing.connectionId);
      if (!connection) {
        throw new Error('Marketplace connection not found');
      }

      // Get adapter
      const adapter = getAdapter(marketplaceId);
      adapter.setAccessToken(connection.accessToken);

      // Get current inventory from marketplace
      const currentInventory = await adapter.getInventory(listing.externalId);

      // Update inventory on marketplace
      await adapter.updateInventory(listing.externalId, quantity);

      // Record sync
      await this.db.inventory.history.create({
        inventoryId: inventory.id,
        previousQuantity: currentInventory,
        newQuantity: quantity,
        change: quantity - currentInventory,
        reason: 'sync',
        userId,
        notes: `Synced to ${marketplaceId}`,
      });

      return {
        productId,
        marketplaceId,
        success: true,
        previousQuantity: currentInventory,
        newQuantity: quantity,
      };
    } catch (error: any) {
      return {
        productId,
        marketplaceId,
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================
  // SYNC INVENTORY FROM MARKETPLACE
  // ============================================================

  async syncInventoryFromMarketplace(
    listingId: string,
    userId: string
  ): Promise<InventorySyncResult> {
    try {
      // Get listing
      const listing = await this.db.listing.findById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      // Get product
      const product = await this.db.product.findById(listing.productId);
      if (!product || product.userId !== userId) {
        throw new Error('Product not found');
      }

      // Get connection
      const connection = await this.db.marketplaceConnection.findById(listing.connectionId);
      if (!connection) {
        throw new Error('Marketplace connection not found');
      }

      // Get adapter
      const adapter = getAdapter(listing.marketplaceId);
      adapter.setAccessToken(connection.accessToken);

      // Get inventory from marketplace
      const marketplaceInventory = await adapter.getInventory(listing.externalId!);

      // Get current inventory
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (!inventory) {
        throw new Error('Inventory not found');
      }

      const previousQuantity = inventory.totalQuantity;

      // Update inventory
      await this.db.inventory.update(inventory.id, {
        totalQuantity: marketplaceInventory,
        availableQuantity: marketplaceInventory - inventory.allocatedQuantity,
        lastUpdated: new Date(),
      });

      // Record sync
      await this.db.inventory.history.create({
        inventoryId: inventory.id,
        previousQuantity,
        newQuantity: marketplaceInventory,
        change: marketplaceInventory - previousQuantity,
        reason: 'sync',
        userId,
        notes: `Synced from ${listing.marketplaceId}`,
      });

      return {
        productId: product.id,
        marketplaceId: listing.marketplaceId,
        success: true,
        previousQuantity,
        newQuantity: marketplaceInventory,
      };
    } catch (error: any) {
      return {
        productId: '',
        marketplaceId: '' as MarketplaceId,
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================
  // RECONCILE INVENTORY ACROSS MARKETPLACES
  // ============================================================

  async reconcileInventory(productId: string, userId: string): Promise<InventorySyncResult[]> {
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Get all listings for this product
    const listings = await this.db.listing.findByProductId(productId);

    const results: InventorySyncResult[] = [];

    // Get master inventory
    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Sync to each marketplace
    for (const listing of listings) {
      if (listing.status === 'published' && listing.externalId) {
        const result = await this.syncInventoryToMarketplace(productId, listing.marketplaceId, userId);
        results.push(result);
      }
    }

    return results;
  }

  // ============================================================
  // SYNC ALL INVENTORY FOR USER
  // ============================================================

  async syncAllInventoryForUser(userId: string): Promise<InventorySyncResult[]> {
    // Get all products for user
    const products = await this.db.product.findByUserId(userId);

    const results: InventorySyncResult[] = [];

    // Sync inventory for each product
    for (const product of products) {
      const productResults = await this.reconcileInventory(product.id, userId);
      results.push(...productResults);
    }

    return results;
  }

  // ============================================================
  // DETECT INVENTORY DISCREPANCIES
  // ============================================================

  async detectInventoryDiscrepancies(productId: string, userId: string): Promise<Array<{
    marketplaceId: MarketplaceId;
    localQuantity: number;
    marketplaceQuantity: number;
    difference: number;
  }>> {
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const listings = await this.db.listing.findByProductId(productId);
    const discrepancies: Array<{
      marketplaceId: MarketplaceId;
      localQuantity: number;
      marketplaceQuantity: number;
      difference: number;
    }> = [];

    for (const listing of listings) {
      if (listing.status === 'published' && listing.externalId) {
        try {
          const connection = await this.db.marketplaceConnection.findById(listing.connectionId);
          if (!connection) continue;

          const adapter = getAdapter(listing.marketplaceId);
          adapter.setAccessToken(connection.accessToken);

          const marketplaceQuantity = await adapter.getInventory(listing.externalId);
          const allocation = await this.db.inventory.allocation.findByInventoryAndMarketplace(
            inventory.id,
            listing.marketplaceId
          );

          const localQuantity = allocation?.allocatedQuantity || 0;
          const difference = marketplaceQuantity - localQuantity;

          if (Math.abs(difference) > 0) {
            discrepancies.push({
              marketplaceId: listing.marketplaceId,
              localQuantity,
              marketplaceQuantity,
              difference,
            });
          }
        } catch (error) {
          // Skip if we can't get inventory from this marketplace
          continue;
        }
      }
    }

    return discrepancies;
  }

  // ============================================================
  // RESOLVE INVENTORY DISCREPANCY
  // ============================================================

  async resolveInventoryDiscrepancy(
    productId: string,
    marketplaceId: MarketplaceId,
    strategy: 'use_local' | 'use_marketplace',
    userId: string
  ): Promise<InventorySyncResult> {
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const listing = await this.db.listing.findByProductIdAndMarketplace(productId, marketplaceId);
    if (!listing || !listing.externalId) {
      throw new Error('Listing not found');
    }

    const connection = await this.db.marketplaceConnection.findById(listing.connectionId);
    if (!connection) {
      throw new Error('Marketplace connection not found');
    }

    const adapter = getAdapter(marketplaceId);
    adapter.setAccessToken(connection.accessToken);

    if (strategy === 'use_local') {
      // Update marketplace to match local
      const allocation = await this.db.inventory.allocation.findByInventoryAndMarketplace(
        inventory.id,
        marketplaceId
      );
      const localQuantity = allocation?.allocatedQuantity || 0;

      await adapter.updateInventory(listing.externalId, localQuantity);

      return {
        productId,
        marketplaceId,
        success: true,
        newQuantity: localQuantity,
      };
    } else {
      // Update local to match marketplace
      const marketplaceQuantity = await adapter.getInventory(listing.externalId);

      await this.db.inventory.update(inventory.id, {
        totalQuantity: marketplaceQuantity,
        availableQuantity: marketplaceQuantity - inventory.allocatedQuantity,
        lastUpdated: new Date(),
      });

      return {
        productId,
        marketplaceId,
        success: true,
        newQuantity: marketplaceQuantity,
      };
    }
  }
}
