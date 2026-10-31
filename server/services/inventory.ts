// ============================================================
// ListingDesk Pro — Inventory Service
// Handles inventory synchronization across marketplaces
// ============================================================

import type { ServerInventory, ServerInventoryAllocation, ServerInventoryHistory } from '../types';
import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';

// ============================================================
// TYPES
// ============================================================

export interface UpdateInventoryRequest {
  productId: string;
  userId: string;
  quantity: number;
  reason: 'restock' | 'adjustment' | 'sync';
  notes?: string;
}

export interface AllocateInventoryRequest {
  productId: string;
  userId: string;
  allocations: Array<{
    marketplaceId: MarketplaceId;
    quantity: number;
  }>;
}

export interface InventorySyncResult {
  productId: string;
  marketplaceId: MarketplaceId;
  success: boolean;
  previousQuantity?: number;
  newQuantity?: number;
  error?: string;
}

// ============================================================
// INVENTORY SERVICE
// ============================================================

export class InventoryService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // UPDATE INVENTORY
  // ============================================================

  async updateInventory( UpdateInventoryRequest): Promise<ServerInventory> {
    const { productId, userId, quantity, reason, notes } = data;

    // Get product to verify ownership
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Get current inventory
    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const previousQuantity = inventory.totalQuantity;
    const change = quantity - previousQuantity;

    // Update inventory
    const updated = await this.db.inventory.update(inventory.id, {
      totalQuantity: quantity,
      availableQuantity: quantity - inventory.allocatedQuantity,
      lastUpdated: new Date(),
    });

    // Record history
    await this.db.inventory.history.create({
      inventoryId: inventory.id,
      previousQuantity,
      newQuantity: quantity,
      change,
      reason,
      userId,
      notes,
    });

    // Check for low stock
    if (quantity <= inventory.lowStockThreshold) {
      await this.sendLowStockNotification(userId, product.title, quantity, inventory.lowStockThreshold);
    }

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'inventory.updated',
      resource: 'inventory',
      resourceId: inventory.id,
      changes: { previousQuantity, newQuantity: quantity, reason },
    });

    return updated;
  }

  // ============================================================
  // ALLOCATE INVENTORY PER MARKETPLACE
  // ============================================================

  async allocateInventory( AllocateInventoryRequest): Promise<void> {
    const { productId, userId, allocations } = data;

    // Get product to verify ownership
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Get inventory
    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Calculate total allocation
    const totalAllocation = allocations.reduce((sum, a) => sum + a.quantity, 0);

    if (totalAllocation > inventory.totalQuantity) {
      throw new Error('Total allocation exceeds available inventory');
    }

    // Update allocations
    for (const allocation of allocations) {
      const existing = await this.db.inventory.allocation.findByInventoryAndMarketplace(
        inventory.id,
        allocation.marketplaceId
      );

      if (existing) {
        await this.db.inventory.allocation.update(existing.id, {
          allocatedQuantity: allocation.quantity,
          updatedAt: new Date(),
        });
      } else {
        await this.db.inventory.allocation.create({
          inventoryId: inventory.id,
          marketplaceId: allocation.marketplaceId,
          allocatedQuantity: allocation.quantity,
        });
      }
    }

    // Update total allocated quantity
    await this.db.inventory.update(inventory.id, {
      allocatedQuantity: totalAllocation,
      availableQuantity: inventory.totalQuantity - totalAllocation,
      lastUpdated: new Date(),
    });

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'inventory.allocated',
      resource: 'inventory',
      resourceId: inventory.id,
      changes: { allocations },
    });
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
  // GET INVENTORY HISTORY
  // ============================================================

  async getInventoryHistory(productId: string, userId: string, limit = 50): Promise<ServerInventoryHistory[]> {
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      return [];
    }

    // In actual backend, implement history retrieval
    // return await this.db.inventory.history.findByInventoryId(inventory.id, limit);
    return [];
  }

  // ============================================================
  // GET LOW STOCK PRODUCTS
  // ============================================================

  async getLowStockProducts(userId: string): Promise<Array<{ product: any; inventory: ServerInventory }>> {
    // In actual backend, query products where inventory.totalQuantity <= inventory.lowStockThreshold
    return [];
  }

  // ============================================================
  // SEND LOW STOCK NOTIFICATION
  // ============================================================

  private async sendLowStockNotification(
    userId: string,
    productTitle: string,
    currentStock: number,
    threshold: number
  ): Promise<void> {
    await this.db.notification.create({
      userId,
      type: 'inventory_low',
      title: 'Low Stock Alert',
      message: `"${productTitle}" is running low: ${currentStock} units remaining (threshold: ${threshold})`,
      read: false,
      meta { currentStock, threshold },
    });
  }

  // ============================================================
  // GET INVENTORY BY PRODUCT
  // ============================================================

  async getInventoryByProduct(productId: string, userId: string): Promise<ServerInventory | null> {
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    return await this.db.inventory.findByProductId(productId);
  }

  // ============================================================
  // GET INVENTORY ALLOCATIONS
  // ============================================================

  async getInventoryAllocations(productId: string, userId: string): Promise<ServerInventoryAllocation[]> {
    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      return [];
    }

    // In actual backend, retrieve allocations
    // return await this.db.inventory.allocation.findByInventoryId(inventory.id);
    return [];
  }
}
