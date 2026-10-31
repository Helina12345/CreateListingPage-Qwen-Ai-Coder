// ============================================================
// ListingDesk Pro — Database Service Layer
// Repository pattern for all database operations
// ============================================================

import type {
  ServerUser,
  ServerMarketplaceConnection,
  ServerSupplierConnection,
  ServerProduct,
  ServerListing,
  ServerOrder,
  ServerInventory,
  ServerSupplierOrder,
  ServerBalance,
  ServerTransaction,
  ServerJob,
  ServerNotification,
  ServerWebhookEvent,
  ServerAuditLog,
  ServerIdempotencyKey,
} from '../types';
import type { MarketplaceId } from '../../types';

// ============================================================
// DATABASE INTERFACE
// This would be implemented with Prisma in the actual backend
// ============================================================

export interface DatabaseClient {
  // Users
  user: {
    findById: (id: string) => Promise<ServerUser | null>;
    findByEmail: (email: string) => Promise<ServerUser | null>;
    create: ( Omit<ServerUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerUser>;
    update: (id: string,  Partial<ServerUser>) => Promise<ServerUser>;
  };

  // Marketplace Connections
  marketplaceConnection: {
    findByUserId: (userId: string) => Promise<ServerMarketplaceConnection[]>;
    findByUserIdAndMarketplace: (userId: string, marketplaceId: MarketplaceId) => Promise<ServerMarketplaceConnection | null>;
    findById: (id: string) => Promise<ServerMarketplaceConnection | null>;
    create: ( Omit<ServerMarketplaceConnection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerMarketplaceConnection>;
    update: (id: string,  Partial<ServerMarketplaceConnection>) => Promise<ServerMarketplaceConnection>;
    delete: (id: string) => Promise<void>;
  };

  // Supplier Connections
  supplierConnection: {
    findByUserId: (userId: string) => Promise<ServerSupplierConnection[]>;
    findByUserIdAndSupplier: (userId: string, supplierId: string) => Promise<ServerSupplierConnection | null>;
    findById: (id: string) => Promise<ServerSupplierConnection | null>;
    create: ( Omit<ServerSupplierConnection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerSupplierConnection>;
    update: (id: string,  Partial<ServerSupplierConnection>) => Promise<ServerSupplierConnection>;
  };

  // Products
  product: {
    findById: (id: string) => Promise<ServerProduct | null>;
    findByUserId: (userId: string, filters?: { status?: string; search?: string }) => Promise<ServerProduct[]>;
    findBySku: (userId: string, sku: string) => Promise<ServerProduct | null>;
    create: ( Omit<ServerProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerProduct>;
    update: (id: string,  Partial<ServerProduct>) => Promise<ServerProduct>;
    delete: (id: string) => Promise<void>;
  };

  // Listings
  listing: {
    findById: (id: string) => Promise<ServerListing | null>;
    findByProductId: (productId: string) => Promise<ServerListing[]>;
    findByProductIdAndMarketplace: (productId: string, marketplaceId: MarketplaceId) => Promise<ServerListing | null>;
    findByExternalId: (marketplaceId: MarketplaceId, externalId: string) => Promise<ServerListing | null>;
    create: ( Omit<ServerListing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerListing>;
    update: (id: string,  Partial<ServerListing>) => Promise<ServerListing>;
    delete: (id: string) => Promise<void>;
  };

  // Orders
  order: {
    findById: (id: string) => Promise<ServerOrder | null>;
    findByUserId: (userId: string, filters?: { status?: string; marketplaceId?: MarketplaceId }) => Promise<ServerOrder[]>;
    findByExternalOrderId: (marketplaceId: MarketplaceId, externalOrderId: string) => Promise<ServerOrder | null>;
    create: ( Omit<ServerOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerOrder>;
    update: (id: string,  Partial<ServerOrder>) => Promise<ServerOrder>;
  };

  // Inventory
  inventory: {
    findByProductId: (productId: string) => Promise<ServerInventory | null>;
    create: ( Omit<ServerInventory, 'id' | 'lastUpdated'>) => Promise<ServerInventory>;
    update: (id: string,  Partial<ServerInventory>) => Promise<ServerInventory>;
    updateQuantity: (productId: string, change: number, reason: string) => Promise<ServerInventory>;
  };

  // Supplier Orders
  supplierOrder: {
    findById: (id: string) => Promise<ServerSupplierOrder | null>;
    findByOrderId: (orderId: string) => Promise<ServerSupplierOrder | null>;
    findByUserId: (userId: string) => Promise<ServerSupplierOrder[]>;
    create: ( Omit<ServerSupplierOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServerSupplierOrder>;
    update: (id: string,  Partial<ServerSupplierOrder>) => Promise<ServerSupplierOrder>;
  };

  // Balance
  balance: {
    findByUserId: (userId: string) => Promise<ServerBalance | null>;
    create: ( Omit<ServerBalance, 'id' | 'lastUpdated'>) => Promise<ServerBalance>;
    update: (userId: string, amount: number) => Promise<ServerBalance>;
  };

  // Transactions
  transaction: {
    findByUserId: (userId: string, filters?: { type?: string }) => Promise<ServerTransaction[]>;
    create: ( Omit<ServerTransaction, 'id' | 'createdAt'>) => Promise<ServerTransaction>;
  };

  // Jobs
  job: {
    findById: (id: string) => Promise<ServerJob | null>;
    findPending: (type?: string) => Promise<ServerJob[]>;
    create: ( Omit<ServerJob, 'id' | 'createdAt' | 'attempts'>) => Promise<ServerJob>;
    update: (id: string,  Partial<ServerJob>) => Promise<ServerJob>;
  };

  // Notifications
  notification: {
    findByUserId: (userId: string, filters?: { read?: boolean }) => Promise<ServerNotification[]>;
    create: ( Omit<ServerNotification, 'id' | 'createdAt'>) => Promise<ServerNotification>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
  };

  // Webhooks
  webhookEvent: {
    findById: (id: string) => Promise<ServerWebhookEvent | null>;
    findUnprocessed: (marketplaceId?: MarketplaceId) => Promise<ServerWebhookEvent[]>;
    create: ( Omit<ServerWebhookEvent, 'id' | 'createdAt'>) => Promise<ServerWebhookEvent>;
    markAsProcessed: (id: string, errors?: string[]) => Promise<void>;
  };

  // Audit Logs
  auditLog: {
    create: ( Omit<ServerAuditLog, 'id' | 'createdAt'>) => Promise<ServerAuditLog>;
    findByUserId: (userId: string, limit?: number) => Promise<ServerAuditLog[]>;
  };

  // Idempotency
  idempotencyKey: {
    findByKey: (key: string) => Promise<ServerIdempotencyKey | null>;
    create: ( Omit<ServerIdempotencyKey, 'id' | 'createdAt'>) => Promise<ServerIdempotencyKey>;
    update: (id: string,  Partial<ServerIdempotencyKey>) => Promise<ServerIdempotencyKey>;
    cleanup: () => Promise<void>;
  };

  // Transactions (Database transactions)
  transaction: {
    execute: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
  };
}

// ============================================================
// DATABASE CLIENT IMPLEMENTATION
// This would use Prisma in the actual backend
// ============================================================

export function createDatabaseClient(): DatabaseClient {
  // In actual backend, this would be:
  // const prisma = new PrismaClient();
  // return { ... prisma-based implementation ... }

  throw new Error('Database client must be implemented in backend with Prisma');
}

// ============================================================
// DATABASE UTILITIES
// ============================================================

export async function withTransaction<T>(
  db: DatabaseClient,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction.execute(fn);
}

export function generateId(): string {
  // In actual backend, use cuid() or uuid
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function encryptCredential(credential: string, encryptionKey: string): string {
  // In actual backend, use crypto library
  // This is a placeholder - implement with AES-256-GCM
  throw new Error('Credential encryption must be implemented in backend');
}

export function decryptCredential(encrypted: string, encryptionKey: string): string {
  // In actual backend, use crypto library
  throw new Error('Credential decryption must be implemented in backend');
}
