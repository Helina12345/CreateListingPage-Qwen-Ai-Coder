// ============================================================
// ListingDesk Pro — Server Types
// Complete type definitions for all server-side data models
// ============================================================

import type { MarketplaceId } from '../../types';

// ============================================================
// USER & AUTHENTICATION
// ============================================================

export interface ServerUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'seller' | 'admin';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// MARKETPLACE CONNECTIONS
// ============================================================

export interface ServerMarketplaceConnection {
  id: string;
  userId: string;
  marketplaceId: MarketplaceId;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  storeName?: string;
  storeId?: string;
  storeUrl?: string;
  status: 'connected' | 'disconnected' | 'expired';
  scopes: string[];
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// SUPPLIER CONNECTIONS
// ============================================================

export interface ServerSupplierConnection {
  id: string;
  userId: string;
  supplierId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry?: Date;
  status: 'connected' | 'disconnected' | 'expired';
  autoOrderEnabled: boolean;
  autoMessageEnabled: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PRODUCT CATALOG
// ============================================================

export interface ServerProduct {
  id: string;
  userId: string;
  title: string;
  description: string;
  shortDescription?: string;
  sku: string;
  brand?: string;
  condition: 'new' | 'used' | 'refurbished';
  category?: string;
  subcategory?: string;
  tags: string[];
  upc?: string;
  ean?: string;
  isbn?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  inventory: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string;
  isMain: boolean;
  position: number;
  variantId?: string;
  width?: number;
  height?: number;
  size?: number;
  createdAt: Date;
}

// ============================================================
// MARKETPLACE LISTINGS
// ============================================================

export interface ServerListing {
  id: string;
  productId: string;
  marketplaceId: MarketplaceId;
  connectionId: string;
  externalId?: string;
  externalUrl?: string;
  title: string;
  description: string;
  sku: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'paused';
  marketplaceData?: Record<string, any>;
  publishedAt?: Date;
  lastSyncAt?: Date;
  errors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// ORDERS
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ordered_from_supplier'
  | 'shipped_by_supplier'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned';

export interface ServerOrder {
  id: string;
  userId: string;
  marketplaceId: MarketplaceId;
  connectionId: string;
  externalOrderId: string;
  status: OrderStatus;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'captured' | 'refunded';
  trackingNumber?: string;
  carrier?: string;
  supplierOrderId?: string;
  orderedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerOrderItem {
  id: string;
  orderId: string;
  listingId: string;
  variantId?: string;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

// ============================================================
// INVENTORY
// ============================================================

export interface ServerInventory {
  id: string;
  productId: string;
  totalQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  lastUpdated: Date;
}

export interface ServerInventoryAllocation {
  id: string;
  inventoryId: string;
  marketplaceId: MarketplaceId;
  allocatedQuantity: number;
  updatedAt: Date;
}

export interface ServerInventoryHistory {
  id: string;
  inventoryId: string;
  previousQuantity: number;
  newQuantity: number;
  change: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'sync' | 'return' | 'cancel' | 'manual';
  orderId?: string;
  userId?: string;
  notes?: string;
  createdAt: Date;
}

// ============================================================
// SUPPLIER ORDERS
// ============================================================

export interface ServerSupplierOrder {
  id: string;
  userId: string;
  connectionId: string;
  orderId?: string;
  supplierId: string;
  externalOrderId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  shippingCost: number;
  status: 'pending' | 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  autoMessage?: string;
  orderedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// MESSAGING
// ============================================================

export interface ServerMessageTemplate {
  id: string;
  userId: string;
  connectionId: string;
  name: string;
  subject?: string;
  body: string;
  language: string;
  isActive: boolean;
  triggerEvent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerMessage {
  id: string;
  userId: string;
  templateId?: string;
  supplierOrderId?: string;
  direction: 'outbound' | 'inbound';
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: Date;
}

// ============================================================
// PAYMENTS & BALANCE
// ============================================================

export interface ServerBalance {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  lastUpdated: Date;
}

export interface ServerTransaction {
  id: string;
  userId: string;
  type: 'charge' | 'refund' | 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  stripePaymentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

// ============================================================
// WEBHOOKS
// ============================================================

export interface ServerWebhookEvent {
  id: string;
  marketplaceId: MarketplaceId;
  eventType: string;
  externalId: string;
  payload: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  errors?: string[];
  createdAt: Date;
}

// ============================================================
// BACKGROUND JOBS
// ============================================================

export type JobType =
  | 'publish_listing'
  | 'sync_inventory'
  | 'sync_orders'
  | 'auto_order'
  | 'auto_message'
  | 'sync_listing_status'
  | 'reconcile_inventory'
  | 'process_webhook';

export interface ServerJob {
  id: string;
  type: JobType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, any>;
  result?: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============================================================
// AUDIT & LOGGING
// ============================================================

export interface ServerAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ServerErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  marketplaceId?: MarketplaceId;
  userId?: string;
  createdAt: Date;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export type NotificationType =
  | 'listing_published'
  | 'listing_failed'
  | 'order_received'
  | 'order_shipped'
  | 'inventory_low'
  | 'price_change'
  | 'supplier_order_placed'
  | 'supplier_order_shipped'
  | 'balance_low'
  | 'system_alert';

export interface ServerNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================================
// RATE LIMITING
// ============================================================

export interface ServerRateLimit {
  id: string;
  marketplaceId: MarketplaceId;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
}

// ============================================================
// IDEMPOTENCY
// ============================================================

export interface ServerIdempotencyKey {
  id: string;
  key: string;
  userId: string;
  endpoint: string;
  response?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
