// ============================================================
// ListingDesk Pro — Webhook Handlers
// Receive and process notifications from marketplaces
// ============================================================

import { auditLog, AuditEventType } from '../audit';
import type { MarketplaceId } from '../../types';

export interface WebhookEvent {
  id: string;
  marketplaceId: MarketplaceId;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

export type WebhookHandler = (event: WebhookEvent) => Promise<void>;

// Webhook handler registry
const handlers: Map<string, WebhookHandler[]> = new Map();

/**
 * Register a webhook handler for a specific event type
 */
export function registerWebhookHandler(eventType: string, handler: WebhookHandler): void {
  if (!handlers.has(eventType)) {
    handlers.set(eventType, []);
  }
  handlers.get(eventType)!.push(handler);
}

/**
 * Process incoming webhook event
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  auditLog({
    type: AuditEventType.ORDER_RECEIVED,
    severity: 'info',
    message: `Webhook received: ${event.eventType} from ${event.marketplaceId}`,
    metadata: {
      eventId: event.id,
      marketplaceId: event.marketplaceId,
      eventType: event.eventType,
    },
    marketplaceId: event.marketplaceId,
  });

  const eventHandlers = handlers.get(event.eventType) || [];
  const wildcardHandlers = handlers.get('*') || [];
  const allHandlers = [...eventHandlers, ...wildcardHandlers];

  if (allHandlers.length === 0) {
    auditLog({
      type: AuditEventType.ERROR_OCCURRED,
      severity: 'warning',
      message: `No handlers registered for webhook event: ${event.eventType}`,
      metadata: { eventId: event.id, eventType: event.eventType },
    });
    return;
  }

  const promises = allHandlers.map(async (handler) => {
    try {
      await handler(event);
    } catch (error: any) {
      auditLog({
        type: AuditEventType.ERROR_OCCURRED,
        severity: 'error',
        message: `Webhook handler failed: ${error.message}`,
        metadata: {
          eventId: event.id,
          eventType: event.eventType,
          error: error.message,
        },
      });
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Verify webhook signature (marketplace-specific)
 */
export function verifyWebhookSignature(
  marketplaceId: MarketplaceId,
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, implement proper signature verification for each marketplace
  // This is a placeholder that would use HMAC-SHA256 or similar
  switch (marketplaceId) {
    case 'amazon':
      // Amazon uses SNS signature verification
      return verifyAmazonSignature(payload, signature, secret);
    case 'ebay':
      // eBay uses HMAC-SHA256
      return verifyEbaySignature(payload, signature, secret);
    case 'shopify':
      // Shopify uses HMAC-SHA256
      return verifyShopifySignature(payload, signature, secret);
    default:
      // For other marketplaces, implement their specific verification
      return true; // Placeholder - implement proper verification
  }
}

function verifyAmazonSignature(payload: string, signature: string, secret: string): boolean {
  // Implement Amazon SNS signature verification
  // https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
  return true; // Placeholder
}

function verifyEbaySignature(payload: string, signature: string, secret: string): boolean {
  // Implement eBay webhook signature verification
  // https://developer.ebay.com/api-docs/commerce/notification/resources/destination/methods/createDestination
  return true; // Placeholder
}

function verifyShopifySignature(payload: string, signature: string, secret: string): boolean {
  // Implement Shopify webhook signature verification
  // https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook
  return true; // Placeholder
}

/**
 * Get webhook endpoint URL for a marketplace
 */
export function getWebhookEndpoint(marketplaceId: MarketplaceId): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return `${baseUrl}/api/webhooks/${marketplaceId}`;
}

/**
 * Register webhooks with marketplace (to be called during connection setup)
 */
export async function registerWebhooksWithMarketplace(
  marketplaceId: MarketplaceId,
  accessToken: string
): Promise<void> {
  const endpoint = getWebhookEndpoint(marketplaceId);

  auditLog({
    type: AuditEventType.MARKETPLACE_CONNECTED,
    severity: 'info',
    message: `Registering webhooks with ${marketplaceId}`,
    metadata: { marketplaceId, endpoint },
    marketplaceId,
  });

  // In production, call each marketplace's API to register webhooks
  // Example for Shopify:
  // await fetch(`https://${shopDomain}.myshopify.com/admin/api/2024-01/webhooks.json`, {
  //   method: 'POST',
  //   headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ webhook: { topic: 'orders/create', address: endpoint } }),
  // });
}

// ============================================================
// Built-in Webhook Handlers
// ============================================================

// Order created handler
registerWebhookHandler('order.created', async (event) => {
  auditLog({
    type: AuditEventType.ORDER_RECEIVED,
    severity: 'info',
    message: `New order received from ${event.marketplaceId}`,
    metadata: { orderId: event.data.orderId, marketplaceId: event.marketplaceId },
    marketplaceId: event.marketplaceId,
  });

  // In production:
  // 1. Parse order data
  // 2. Create order in database
  // 3. Trigger inventory sync
  // 4. Send notification to seller
  // 5. If dropshipping, place order with supplier
});

// Order updated handler
registerWebhookHandler('order.updated', async (event) => {
  auditLog({
    type: AuditEventType.ORDER_UPDATED,
    severity: 'info',
    message: `Order updated on ${event.marketplaceId}`,
    metadata: { orderId: event.data.orderId, status: event.data.status },
    marketplaceId: event.marketplaceId,
  });
});

// Inventory changed handler
registerWebhookHandler('inventory.changed', async (event) => {
  auditLog({
    type: AuditEventType.INVENTORY_SYNC,
    severity: 'info',
    message: `Inventory changed on ${event.marketplaceId}`,
    metadata: {
      listingId: event.data.listingId,
      newQuantity: event.data.quantity,
      marketplaceId: event.marketplaceId,
    },
    marketplaceId: event.marketplaceId,
  });

  // In production:
  // 1. Update local inventory
  // 2. Sync to other marketplaces
  // 3. Check for overselling
});

// Listing status changed handler
registerWebhookHandler('listing.status_changed', async (event) => {
  auditLog({
    type: AuditEventType.LISTING_UPDATED,
    severity: 'info',
    message: `Listing status changed on ${event.marketplaceId}`,
    metadata: {
      listingId: event.data.listingId,
      newStatus: event.data.status,
      marketplaceId: event.marketplaceId,
    },
    marketplaceId: event.marketplaceId,
  });
});
