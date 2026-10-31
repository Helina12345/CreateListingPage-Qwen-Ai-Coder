// ============================================================
// ListingDesk Pro — Core Type Definitions
// ============================================================

export type MarketplaceId =
  | 'ebay'
  | 'amazon'
  | 'shopify'
  | 'etsy'
  | 'walmart'
  | 'tiktok_shop'
  | 'shopee'
  | 'lazada'
  | 'kohls';

export type SupplierId = 'aliexpress';

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  icon: string;
  color: string;
  apiBaseUrl: string;
  oauthUrl: string;
  scopes: string[];
  feePercentage: number;
  currency: string;
  supportedFields: MarketplaceFields;
}

export interface MarketplaceFields {
  title: { maxLength: number; required: boolean };
  description: { maxLength: number; htmlAllowed: boolean };
  images: { maxCount: number; mainRequired: boolean };
  variants: { supportsSize: boolean; supportsColor: boolean };
  categories: { taxonomyUrl: string };
  shipping: { profiles: boolean; international: boolean };
  pricing: { hasSalePrice: boolean; hasMAP: boolean };
}

export interface Supplier {
  id: SupplierId;
  name: string;
  icon: string;
  color: string;
  apiBaseUrl: string;
  features: SupplierFeatures;
}

export interface SupplierFeatures {
  productSearch: boolean;
  autoOrder: boolean;
  autoMessage: boolean;
  trackingSync: boolean;
  inventorySync: boolean;
}

export interface MarketplaceConnection {
  id: string;
  marketplaceId: MarketplaceId;
  status: 'connected' | 'disconnected' | 'expired' | 'pending';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  storeName?: string;
  storeUrl?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  scopes: string[];
}

export interface SupplierConnection {
  id: string;
  supplierId: SupplierId;
  status: 'connected' | 'disconnected' | 'expired' | 'pending';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  sku: string;
  upc?: string;
  ean?: string;
  isbn?: string;
  brand?: string;
  condition: 'new' | 'used' | 'refurbished';
  category?: string;
  subcategory?: string;
  tags: string[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  images: ListingImage[];
  variants: ListingVariant[];
  pricing: ListingPricing;
  inventory: ListingInventory;
  shipping: ListingShipping;
  marketplaceData: MarketplaceListingData[];
  supplierProductId?: string;
  supplierId?: SupplierId;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ListingImage {
  id: string;
  url: string;
  alt: string;
  isMain: boolean;
  position: number;
  variantId?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface ListingVariant {
  id: string;
  sku: string;
  title: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  inventory: number;
  images: string[];
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
}

export interface ListingPricing {
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  profitMargin?: number;
  currency: string;
  marketplacePrices: Record<MarketplaceId, number>;
  pricingRules: PricingRule[];
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'competitor_match' | 'margin_based';
  value: number;
  marketplaceIds: MarketplaceId[];
  active: boolean;
}

export interface ListingInventory {
  totalQuantity: number;
  allocatedPerMarketplace: Record<MarketplaceId, number>;
  lowStockThreshold: number;
  reorderPoint: number;
  warehouseId?: string;
  lastUpdated: string;
}

export interface ListingShipping {
  weight: number;
  dimensions: { length: number; width: number; height: number };
  origin: { country: string; zipCode: string };
  profiles: ShippingProfile[];
  international: boolean;
  hazmat: boolean;
  customsInfo?: CustomsInfo;
}

export interface ShippingProfile {
  id: string;
  name: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: { min: number; max: number };
  freeShippingThreshold?: number;
}

export interface CustomsInfo {
  hsCode?: string;
  countryOfOrigin?: string;
  description?: string;
  value?: number;
}

export interface MarketplaceListingData {
  marketplaceId: MarketplaceId;
  externalId?: string;
  url?: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'paused';
  lastSyncAt?: string;
  error?: string;
  marketplaceSpecificFields?: Record<string, unknown>;
}

export interface Order {
  id: string;
  listingId: string;
  marketplaceId: MarketplaceId;
  externalOrderId: string;
  status: OrderStatus;
  buyer: OrderBuyer;
  items: OrderItem[];
  shipping: OrderShipping;
  payment: OrderPayment;
  supplierOrder?: SupplierOrder;
  createdAt: string;
  updatedAt: string;
}

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

export interface OrderBuyer {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface OrderItem {
  listingId: string;
  variantId?: string;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface OrderShipping {
  carrier: string;
  service: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cost: number;
}

export interface OrderPayment {
  method: string;
  amount: number;
  currency: string;
  status: 'pending' | 'captured' | 'refunded';
  transactionId?: string;
}

export interface SupplierOrder {
  id: string;
  supplierId: SupplierId;
  externalOrderId: string;
  status: 'pending' | 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  autoMessage?: string;
  createdAt: string;
}

export interface SupplierProduct {
  id: string;
  supplierId: SupplierId;
  externalId: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  variants: SupplierProductVariant[];
  shipping: {
    cost: number;
    estimatedDays: { min: number; max: number };
    freeShipping: boolean;
  };
  rating: number;
  orders: number;
  inStock: boolean;
  url: string;
}

export interface SupplierProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  images: string[];
}

export interface InventorySyncEvent {
  listingId: string;
  marketplaceId: MarketplaceId;
  previousQuantity: number;
  newQuantity: number;
  timestamp: string;
  source: 'manual' | 'order' | 'sync' | 'supplier';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'listing_published'
  | 'listing_failed'
  | 'inventory_low'
  | 'order_received'
  | 'price_change'
  | 'compliance_issue'
  | 'sync_complete'
  | 'supplier_update'
  | 'system';

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  marketplaceStats: Record<MarketplaceId, MarketplaceStats>;
}

export interface MarketplaceStats {
  listings: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'seller' | 'admin';
  avatar?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkOperation {
  id: string;
  type: 'publish' | 'pause' | 'delete' | 'duplicate' | 'price_update' | 'inventory_update';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  total: number;
  completed: number;
  failed: number;
  results: BulkOperationResult[];
  createdAt: string;
}

export interface BulkOperationResult {
  listingId: string;
  marketplaceId?: MarketplaceId;
  status: 'success' | 'failed';
  error?: string;
}
