// ============================================================
// ListingDesk Pro — Marketplace Adapter Registry
// Central registry for all marketplace adapters
// ============================================================

import type { MarketplaceId } from '../../types';
import type { MarketplaceAdapter } from './base';
import { AmazonAdapter } from '../../../server/integrations/marketplaces/amazon';
import { EbayAdapter } from '../../../server/integrations/marketplaces/ebay';
import { EtsyAdapter } from '../../../server/integrations/marketplaces/etsy';
import { KohlsAdapter } from '../../../server/integrations/marketplaces/kohls';
import { LazadaAdapter } from '../../../server/integrations/marketplaces/lazada';
import { ShopeeAdapter } from '../../../server/integrations/marketplaces/shopee';
import { ShopifyAdapter } from './shopify';
import { TikTok-shopAdapter } from '../../../server/integrations/marketplaces/tiktok-shop';
import { WalmartAdapter } from '../../../server/integrations/marketplaces/walmart';

// Adapter registry
const adapters: Record<MarketplaceId, MarketplaceAdapter> = {
  amazon: new AmazonAdapter(),
  ebay: new EbayAdapter(),
  shopify: new ShopifyAdapter(),
  etsy: new EtsyAdapter(),
  walmart: new WalmartAdapter(),
  tiktok_shop: new TikTokShopAdapter(),
  shopee: new ShopeeAdapter(),
  lazada: new LazadaAdapter(),
  kohls: new KohlsAdapter(),
};

/**
 * Get adapter for a specific marketplace
 */
export function getAdapter(marketplaceId: MarketplaceId): MarketplaceAdapter {
  const adapter = adapters[marketplaceId];
  if (!adapter) {
    throw new Error(`No adapter found for marketplace: ${marketplaceId}`);
  }
  return adapter;
}

/**
 * Get all available adapters
 */
export function getAllAdapters(): Record<MarketplaceId, MarketplaceAdapter> {
  return { ...adapters };
}

/**
 * Check if a marketplace integration is available
 */
export function isAdapterAvailable(marketplaceId: MarketplaceId): boolean {
  return marketplaceId in adapters;
}

/**
 * Get list of all supported marketplace IDs
 */
export function getSupportedMarketplaces(): MarketplaceId[] {
  return Object.keys(adapters) as MarketplaceId[];
}

/**
 * Set access token for a specific marketplace adapter
 */
export function setAdapterToken(marketplaceId: MarketplaceId, accessToken: string, refreshToken?: string): void {
  const adapter = getAdapter(marketplaceId);
  (adapter as any).accessToken = accessToken;
  if (refreshToken) {
    (adapter as any).refreshTokenValue = refreshToken;
  }
}

/**
 * Set shop domain for Shopify adapter
 */
export function setShopifyDomain(domain: string): void {
  const adapter = getAdapter('shopify') as ShopifyAdapter;
  adapter.setShopDomain(domain);
}

// Export all adapter classes for direct use
export {
  AmazonAdapter,
  EbayAdapter,
  ShopifyAdapter,
  EtsyAdapter,
  WalmartAdapter,
  KohlsAdapter,
  LazadaAdapter,
  ShopeeAdapter,
  TikTokShopAdapter,
};

// Export base types
export type { MarketplaceAdapter } from './base';
