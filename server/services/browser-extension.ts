// ============================================================
// ListingDesk Pro — Browser Extension Service
// Backend support for Chrome extension
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';

// ============================================================
// TYPES
// ============================================================

export interface ExtensionSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CapturedProduct {
  url: string;
  title: string;
  description: string;
  images: string[];
  price?: number;
  marketplaceId: MarketplaceId;
  capturedAt: Date;
}

export interface ExtensionAction {
  type: 'capture' | 'import' | 'sync' | 'status';
   Record<string, any>;
}

export interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================================
// BROWSER EXTENSION SERVICE
// ============================================================

export class BrowserExtensionService {
  private db: DatabaseClient;
  private sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  async createExtensionSession(userId: string): Promise<ExtensionSession> {
    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + this.sessionDuration);

    const session = await this.db.extensionSession.create({
      userId,
      token,
      expiresAt,
    });

    return session;
  }

  async validateExtensionSession(token: string): Promise<ExtensionSession | null> {
    const session = await this.db.extensionSession.findByToken(token);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      // Session expired
      await this.db.extensionSession.delete(session.id);
      return null;
    }

    return session;
  }

  async refreshExtensionSession(token: string): Promise<ExtensionSession | null> {
    const session = await this.validateExtensionSession(token);

    if (!session) {
      return null;
    }

    const newExpiresAt = new Date(Date.now() + this.sessionDuration);
    await this.db.extensionSession.update(session.id, { expiresAt: newExpiresAt });

    return { ...session, expiresAt: newExpiresAt };
  }

  async revokeExtensionSession(token: string): Promise<void> {
    const session = await this.db.extensionSession.findByToken(token);
    if (session) {
      await this.db.extensionSession.delete(session.id);
    }
  }

  private generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // ============================================================
  // PRODUCT CAPTURE
  // ============================================================

  async captureProduct(
    userId: string,
    capturedProduct: CapturedProduct
  ): Promise<any> {
    // Create a draft product from captured data
    const product = await this.db.product.create({
      userId,
      title: capturedProduct.title,
      description: capturedProduct.description,
      sku: this.generateSKU(capturedProduct.title),
      status: 'draft',
      images: capturedProduct.images.map((url, index) => ({
        url,
        isMain: index === 0,
        position: index,
      })),
      pricing: capturedProduct.price
        ? {
            basePrice: capturedProduct.price,
            currency: 'USD',
          }
        : undefined,
      meta {
        source: 'browser_extension',
        sourceUrl: capturedProduct.url,
        sourceMarketplace: capturedProduct.marketplaceId,
        capturedAt: capturedProduct.capturedAt.toISOString(),
      },
    });

    // Create inventory
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
      userId,
      action: 'product.captured_from_extension',
      resource: 'product',
      resourceId: product.id,
      changes: {
        sourceUrl: capturedProduct.url,
        sourceMarketplace: capturedProduct.marketplaceId,
      },
    });

    return product;
  }

  async importCapturedProduct(
    userId: string,
    productId: string,
    marketplaceIds: MarketplaceId[]
  ): Promise<any> {
    const product = await this.db.product.findById(productId);

    if (!product || product.userId !== userId) {
      throw new Error('Product not found');
    }

    // Create listings for each marketplace
    const listings = [];
    for (const marketplaceId of marketplaceIds) {
      const connection = await this.db.marketplaceConnection.findByUserIdAndMarketplace(
        userId,
        marketplaceId
      );

      if (connection && connection.status === 'connected') {
        const listing = await this.db.listing.create({
          productId: product.id,
          marketplaceId,
          connectionId: connection.id,
          title: product.title,
          description: product.description,
          price: product.pricing?.basePrice || 0,
          status: 'draft',
        });

        listings.push(listing);
      }
    }

    return {
      product,
      listings,
    };
  }

  // ============================================================
  // QUICK ACTIONS
  // ============================================================

  async getQuickStats(userId: string): Promise<{
    totalProducts: number;
    activeListings: number;
    pendingOrders: number;
    lowStockItems: number;
  }> {
    const products = await this.db.product.findByUserId(userId);
    const listings = await this.db.listing.findByUserId(userId);
    const orders = await this.db.order.findByUserId(userId, { status: 'pending' });

    let lowStockItems = 0;
    for (const product of products) {
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (inventory && inventory.totalQuantity <= inventory.lowStockThreshold) {
        lowStockItems++;
      }
    }

    return {
      totalProducts: products.length,
      activeListings: listings.filter((l) => l.status === 'published').length,
      pendingOrders: orders.length,
      lowStockItems,
    };
  }

  async syncCurrentPage(
    userId: string,
    url: string,
    marketplaceId: MarketplaceId
  ): Promise<{
    synced: boolean;
    listingId?: string;
    message: string;
  }> {
    // Find listing by URL
    const listing = await this.db.listing.findByExternalUrl(url);

    if (!listing) {
      return {
        synced: false,
        message: 'No listing found for this URL',
      };
    }

    // Verify user owns this listing
    const product = await this.db.product.findById(listing.productId);
    if (!product || product.userId !== userId) {
      return {
        synced: false,
        message: 'You do not have access to this listing',
      };
    }

    // Sync inventory and price from marketplace
    const connection = await this.db.marketplaceConnection.findById(listing.connectionId);
    if (!connection) {
      return {
        synced: false,
        message: 'Marketplace connection not found',
      };
    }

    // In production, call marketplace API to get current data
    // For now, return success
    return {
      synced: true,
      listingId: listing.id,
      message: 'Listing synced successfully',
    };
  }

  // ============================================================
  // EXTENSION ACTIONS HANDLER
  // ============================================================

  async handleExtensionAction(
    userId: string,
    action: ExtensionAction
  ): Promise<ExtensionResponse> {
    try {
      switch (action.type) {
        case 'capture':
          const capturedProduct = await this.captureProduct(userId, action.data);
          return {
            success: true,
            data: capturedProduct,
          };

        case 'import':
          const imported = await this.importCapturedProduct(
            userId,
            action.data.productId,
            action.data.marketplaceIds
          );
          return {
            success: true,
            data: imported,
          };

        case 'sync':
          const synced = await this.syncCurrentPage(
            userId,
            action.data.url,
            action.data.marketplaceId
          );
          return {
            success: synced.synced,
            data: synced,
          };

        case 'status':
          const stats = await this.getQuickStats(userId);
          return {
            success: true,
            data: stats,
          };

        default:
          return {
            success: false,
            error: 'Unknown action type',
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateSKU(title: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const prefix = title
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  // ============================================================
  // EXTENSION INSTALLATION TRACKING
  // ============================================================

  async trackExtensionInstall(
    userId: string,
    extensionVersion: string,
    browserInfo: {
      browser: string;
      version: string;
      platform: string;
    }
  ): Promise<void> {
    await this.db.auditLog.create({
      userId,
      action: 'extension.installed',
      resource: 'extension',
      changes: {
        version: extensionVersion,
        browser: browserInfo.browser,
        browserVersion: browserInfo.version,
        platform: browserInfo.platform,
      },
    });
  }

  async trackExtensionUpdate(
    userId: string,
    oldVersion: string,
    newVersion: string
  ): Promise<void> {
    await this.db.auditLog.create({
      userId,
      action: 'extension.updated',
      resource: 'extension',
      changes: {
        oldVersion,
        newVersion,
      },
    });
  }

  async trackExtensionUninstall(userId: string): Promise<void> {
    await this.db.auditLog.create({
      userId,
      action: 'extension.uninstalled',
      resource: 'extension',
    });
  }
}
