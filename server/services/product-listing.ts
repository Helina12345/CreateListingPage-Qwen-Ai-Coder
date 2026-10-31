// ============================================================
// ListingDesk Pro — Product & Listing Service
// Handles product catalog and marketplace listings
// ============================================================

import type { ServerProduct, ServerListing } from '../types';
import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';
import { validateListingForMarketplace } from '../../services/validation';

// ============================================================
// TYPES
// ============================================================

export interface CreateProductRequest {
  userId: string;
  title: string;
  description: string;
  shortDescription?: string;
  sku: string;
  brand?: string;
  condition?: 'new' | 'used' | 'refurbished';
  category?: string;
  subcategory?: string;
  tags?: string[];
  upc?: string;
  ean?: string;
  isbn?: string;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  condition?: 'new' | 'used' | 'refurbished';
  category?: string;
  subcategory?: string;
  tags?: string[];
  upc?: string;
  ean?: string;
  isbn?: string;
}

export interface PublishListingRequest {
  productId: string;
  marketplaceIds: MarketplaceId[];
  userId: string;
}

export interface ListingPublishResult {
  listingId: string;
  marketplaceId: MarketplaceId;
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  errors?: string[];
}

// ============================================================
// PRODUCT & LISTING SERVICE
// ============================================================

export class ProductListingService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // CREATE PRODUCT
  // ============================================================

  async createProduct( CreateProductRequest): Promise<ServerProduct> {
    // Check if SKU already exists for this user
    const existing = await this.db.product.findBySku(data.userId, data.sku);
    if (existing) {
      throw new Error('Product with this SKU already exists');
    }

    // Create product
    const product = await this.db.product.create({
      userId: data.userId,
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      sku: data.sku,
      brand: data.brand,
      condition: data.condition || 'new',
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags || [],
      upc: data.upc,
      ean: data.ean,
      isbn: data.isbn,
      status: 'draft',
    });

    // Create initial inventory
    await this.db.inventory.create({
      productId: product.id,
      totalQuantity: 0,
      allocatedQuantity: 0,
      availableQuantity: 0,
      lowStockThreshold: 5,
      reorderPoint: 10,
    });

    // Log audit
    await this.db.auditLog.create({
      userId: data.userId,
      action: 'product.created',
      resource: 'product',
      resourceId: product.id,
    });

    return product;
  }

  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

  async updateProduct(productId: string, userId: string,  UpdateProductRequest): Promise<ServerProduct> {
    const product = await this.db.product.findById(productId);

    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Update product
    const updated = await this.db.product.update(productId, data);

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'product.updated',
      resource: 'product',
      resourceId: productId,
      changes: data,
    });

    return updated;
  }

  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  async deleteProduct(productId: string, userId: string): Promise<void> {
    const product = await this.db.product.findById(productId);

    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Check if product has active listings
    const listings = await this.db.listing.findByProductId(productId);
    const activeListings = listings.filter((l) => l.status === 'published');

    if (activeListings.length > 0) {
      throw new Error('Cannot delete product with active listings. Unpublish first.');
    }

    // Delete product (cascade will delete listings, variants, images, inventory)
    await this.db.product.delete(productId);

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'product.deleted',
      resource: 'product',
      resourceId: productId,
    });
  }

  // ============================================================
  // PUBLISH LISTING TO MARKETPLACES
  // ============================================================

  async publishListing( PublishListingRequest): Promise<ListingPublishResult[]> {
    const { productId, marketplaceIds, userId } = data;

    const product = await this.db.product.findById(productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    const results: ListingPublishResult[] = [];

    for (const marketplaceId of marketplaceIds) {
      try {
        // Get user's connection for this marketplace
        const connection = await this.db.marketplaceConnection.findByUserIdAndMarketplace(userId, marketplaceId);

        if (!connection || connection.status !== 'connected') {
          results.push({
            listingId: '',
            marketplaceId,
            success: false,
            errors: ['Marketplace not connected'],
          });
          continue;
        }

        // Check if listing already exists
        const existingListing = await this.db.listing.findByProductIdAndMarketplace(productId, marketplaceId);

        if (existingListing) {
          // Update existing listing
          const updated = await this.updateListing(existingListing.id, userId, product, connection.id);
          results.push({
            listingId: updated.id,
            marketplaceId,
            success: true,
            externalId: updated.externalId,
            externalUrl: updated.externalUrl,
          });
        } else {
          // Create new listing
          const listing = await this.createAndPublishListing(userId, product, marketplaceId, connection.id);
          results.push({
            listingId: listing.id,
            marketplaceId,
            success: true,
            externalId: listing.externalId,
            externalUrl: listing.externalUrl,
          });
        }
      } catch (error: any) {
        results.push({
          listingId: '',
          marketplaceId,
          success: false,
          errors: [error.message],
        });
      }
    }

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'listing.published',
      resource: 'product',
      resourceId: productId,
      changes: { marketplaceIds, results },
    });

    return results;
  }

  // ============================================================
  // CREATE AND PUBLISH LISTING
  // ============================================================

  private async createAndPublishListing(
    userId: string,
    product: ServerProduct,
    marketplaceId: MarketplaceId,
    connectionId: string
  ): Promise<ServerListing> {
    // Create listing record
    const listing = await this.db.listing.create({
      productId: product.id,
      marketplaceId,
      connectionId,
      title: product.title,
      description: product.description,
      sku: product.sku,
      status: 'publishing',
    });

    // Create publish job
    await this.db.job.create({
      type: 'publish_listing',
      status: 'pending',
      payload: {
        listingId: listing.id,
        productId: product.id,
        marketplaceId,
        connectionId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });

    return listing;
  }

  // ============================================================
  // UPDATE LISTING
  // ============================================================

  private async updateListing(
    listingId: string,
    userId: string,
    product: ServerProduct,
    connectionId: string
  ): Promise<ServerListing> {
    // Update listing record
    const listing = await this.db.listing.update(listingId, {
      title: product.title,
      description: product.description,
      sku: product.sku,
      status: 'publishing',
    });

    // Create sync job
    await this.db.job.create({
      type: 'sync_listing',
      status: 'pending',
      payload: {
        listingId,
        productId: product.id,
        connectionId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });

    return listing;
  }

  // ============================================================
  // UNPUBLISH LISTING
  // ============================================================

  async unpublishListing(listingId: string, userId: string): Promise<void> {
    const listing = await this.db.listing.findById(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    const product = await this.db.product.findById(listing.productId);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Update listing status
    await this.db.listing.update(listingId, {
      status: 'paused',
    });

    // Create unpublish job
    await this.db.job.create({
      type: 'unpublish_listing',
      status: 'pending',
      payload: {
        listingId,
        marketplaceId: listing.marketplaceId,
        externalId: listing.externalId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'listing.unpublished',
      resource: 'listing',
      resourceId: listingId,
    });
  }

  // ============================================================
  // GET USER PRODUCTS
  // ============================================================

  async getUserProducts(userId: string, filters?: { status?: string; search?: string }): Promise<ServerProduct[]> {
    return await this.db.product.findByUserId(userId, filters);
  }

  // ============================================================
  // GET PRODUCT LISTINGS
  // ============================================================

  async getProductListings(productId: string, userId: string): Promise<ServerListing[]> {
    const product = await this.db.product.findById(productId);

    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    return await this.db.listing.findByProductId(productId);
  }

  // ============================================================
  // VALIDATE LISTING FOR MARKETPLACE
  // ============================================================

  async validateListingForMarketplace(
    productId: string,
    marketplaceId: MarketplaceId,
    userId: string
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const product = await this.db.product.findById(productId);

    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    const validation = validateListingForMarketplace(product, marketplaceId);

    return {
      valid: validation.errors.length === 0,
      errors: validation.errors.map((e) => e.message),
      warnings: validation.warnings.map((w) => w.message),
    };
  }
}
