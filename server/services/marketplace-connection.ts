// ============================================================
// ListingDesk Pro — Marketplace Connection Service
// Handles OAuth flows, token management, and marketplace API calls
// ============================================================

import type { ServerMarketplaceConnection } from '../types';
import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';

// ============================================================
// TYPES
// ============================================================

export interface ConnectMarketplaceRequest {
  userId: string;
  marketplaceId: MarketplaceId;
}

export interface OAuthCallbackRequest {
  userId: string;
  marketplaceId: MarketplaceId;
  code: string;
  state: string;
}

export interface ConnectionStatus {
  connected: boolean;
  storeName?: string;
  storeId?: string;
  lastSyncAt?: Date;
  permissions: string[];
}

// ============================================================
// MARKETPLACE CONNECTION SERVICE
// ============================================================

export class MarketplaceConnectionService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // GET AUTHORIZATION URL
  // ============================================================

  async getAuthorizationUrl(userId: string, marketplaceId: MarketplaceId): Promise<string> {
    const adapter = getAdapter(marketplaceId);

    // Generate state for CSRF protection
    const state = this.generateState(userId, marketplaceId);

    // Build OAuth URL based on marketplace
    const authUrl = this.buildOAuthUrl(marketplaceId, state);

    return authUrl;
  }

  // ============================================================
  // HANDLE OAUTH CALLBACK
  // ============================================================

  async handleOAuthCallback( OAuthCallbackRequest): Promise<ServerMarketplaceConnection> {
    const { userId, marketplaceId, code, state } = data;

    // Verify state
    this.verifyState(state, userId, marketplaceId);

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(marketplaceId, code);

    // Check if connection already exists
    const existing = await this.db.marketplaceConnection.findByUserIdAndMarketplace(userId, marketplaceId);

    if (existing) {
      // Update existing connection
      return await this.db.marketplaceConnection.update(existing.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.tokenExpiry,
        status: 'connected',
      });
    } else {
      // Create new connection
      return await this.db.marketplaceConnection.create({
        userId,
        marketplaceId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.tokenExpiry,
        status: 'connected',
        scopes: [],
      });
    }
  }

  // ============================================================
  // GET CONNECTION STATUS
  // ============================================================

  async getConnectionStatus(userId: string, marketplaceId: MarketplaceId): Promise<ConnectionStatus> {
    const connection = await this.db.marketplaceConnection.findByUserIdAndMarketplace(userId, marketplaceId);

    if (!connection || connection.status !== 'connected') {
      return {
        connected: false,
        permissions: [],
      };
    }

    // Check if token is expired
    if (new Date() > connection.tokenExpiry) {
      // Try to refresh token
      try {
        await this.refreshToken(connection.id);
      } catch (error) {
        return {
          connected: false,
          permissions: [],
        };
      }
    }

    // Get store info from adapter
    const adapter = getAdapter(marketplaceId);
    adapter.setAccessToken(connection.accessToken);

    const status = await adapter.getConnectionStatus();

    return {
      connected: status.connected,
      storeName: status.storeName,
      storeId: status.storeId,
      lastSyncAt: connection.lastSyncAt || undefined,
      permissions: status.permissions,
    };
  }

  // ============================================================
  // DISCONNECT MARKETPLACE
  // ============================================================

  async disconnect(userId: string, connectionId: string): Promise<void> {
    const connection = await this.db.marketplaceConnection.findById(connectionId);

    if (!connection || connection.userId !== userId) {
      throw new Error('Connection not found');
    }

    await this.db.marketplaceConnection.update(connectionId, {
      status: 'disconnected',
    });

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'marketplace.disconnected',
      resource: 'marketplace_connection',
      resourceId: connectionId,
    });
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refreshToken(connectionId: string): Promise<void> {
    const connection = await this.db.marketplaceConnection.findById(connectionId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    const adapter = getAdapter(connection.marketplaceId);
    adapter.setRefreshToken(connection.refreshToken);

    await adapter.refreshToken();

    // Update connection with new tokens
    await this.db.marketplaceConnection.update(connectionId, {
      accessToken: (adapter as any).accessToken,
      tokenExpiry: new Date(Date.now() + 7200 * 1000), // 2 hours
    });
  }

  // ============================================================
  // SYNC MARKETPLACE DATA
  // ============================================================

  async syncMarketplaceData(userId: string, connectionId: string): Promise<void> {
    const connection = await this.db.marketplaceConnection.findById(connectionId);

    if (!connection || connection.userId !== userId) {
      throw new Error('Connection not found');
    }

    // Create sync job
    await this.db.job.create({
      type: 'sync_marketplace',
      status: 'pending',
      payload: {
        connectionId,
        marketplaceId: connection.marketplaceId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });

    // Update last sync time
    await this.db.marketplaceConnection.update(connectionId, {
      lastSyncAt: new Date(),
    });
  }

  // ============================================================
  // GET ALL CONNECTIONS FOR USER
  // ============================================================

  async getUserConnections(userId: string): Promise<ServerMarketplaceConnection[]> {
    return await this.db.marketplaceConnection.findByUserId(userId);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateState(userId: string, marketplaceId: MarketplaceId): string {
    // In actual backend, use crypto library
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${marketplaceId}_${userId}_${timestamp}_${random}`;
  }

  private verifyState(state: string, userId: string, marketplaceId: MarketplaceId): void {
    const parts = state.split('_');
    if (parts.length < 4) {
      throw new Error('Invalid state parameter');
    }

    const [stateMarketplaceId, stateUserId] = parts;
    if (stateMarketplaceId !== marketplaceId || stateUserId !== userId) {
      throw new Error('State parameter mismatch');
    }
  }

  private buildOAuthUrl(marketplaceId: MarketplaceId, state: string): string {
    // In actual backend, get client ID and redirect URI from environment
    const clientId = process.env[`VITE_${marketplaceId.toUpperCase()}_CLIENT_ID`];
    const redirectUri = `${process.env.API_BASE_URL}/api/marketplaces/${marketplaceId}/callback`;

    // Build OAuth URL based on marketplace
    const urls: Record<MarketplaceId, string> = {
      amazon: `https://sellercentral.amazon.com/apps/authorize/consent?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`,
      ebay: `https://auth.ebay.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      shopify: `https://accounts.shopify.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      etsy: `https://www.etsy.com/oauth/connect?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      walmart: `https://marketplace.walmartapis.com/v3/token?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      tiktok_shop: `https://auth.tiktok-shops.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      shopee: `https://partner.shopeemobile.com/i/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      lazada: `https://auth.lazada.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      kohls: `https://marketplace.kohls.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
    };

    return urls[marketplaceId];
  }

  private async exchangeCodeForTokens(
    marketplaceId: MarketplaceId,
    code: string
  ): Promise<{ accessToken: string; refreshToken: string; tokenExpiry: Date }> {
    const adapter = getAdapter(marketplaceId);

    // In actual backend, call marketplace token endpoint
    // This is a placeholder - implement with actual API call
    throw new Error('Token exchange must be implemented for each marketplace');
  }
}
