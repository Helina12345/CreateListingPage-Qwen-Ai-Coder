// ============================================================
// ListingDesk Pro — Real Prisma Database Client
// Complete database implementation with connection pooling
// ============================================================

import { PrismaClient } from '@prisma/client';
import type { DatabaseClient } from './database';

// ============================================================
// PRISMA CLIENT INITIALIZATION
// ============================================================

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================================
// DATABASE CLIENT IMPLEMENTATION
// ============================================================

export function createDatabaseClient(): DatabaseClient {
  return {
    // Users
    user: {
      findById: async (id: string) => {
        return await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            twoFactorEnabled: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      findByEmail: async (email: string) => {
        return await prisma.user.findUnique({
          where: { email },
        });
      },
      create: async (data) => {
        return await prisma.user.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.user.update({
          where: { id },
          data,
        });
      },
    },

    // Marketplace Connections
    marketplaceConnection: {
      findByUserId: async (userId: string) => {
        return await prisma.marketplaceConnection.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      },
      findByUserIdAndMarketplace: async (userId: string, marketplaceId: string) => {
        return await prisma.marketplaceConnection.findUnique({
          where: {
            userId_marketplaceId: { userId, marketplaceId },
          },
        });
      },
      findById: async (id: string) => {
        return await prisma.marketplaceConnection.findUnique({
          where: { id },
        });
      },
      create: async (data) => {
        return await prisma.marketplaceConnection.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.marketplaceConnection.update({
          where: { id },
          data,
        });
      },
      delete: async (id: string) => {
        await prisma.marketplaceConnection.delete({
          where: { id },
        });
      },
    },

    // Supplier Connections
    supplierConnection: {
      findByUserId: async (userId: string) => {
        return await prisma.supplierConnection.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      },
      findByUserIdAndSupplier: async (userId: string, supplierId: string) => {
        return await prisma.supplierConnection.findUnique({
          where: {
            userId_supplierId: { userId, supplierId },
          },
        });
      },
      findById: async (id: string) => {
        return await prisma.supplierConnection.findUnique({
          where: { id },
        });
      },
      create: async (data) => {
        return await prisma.supplierConnection.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.supplierConnection.update({
          where: { id },
          data,
        });
      },
    },

    // Products
    product: {
      findById: async (id: string) => {
        return await prisma.product.findUnique({
          where: { id },
          include: {
            inventory: true,
            variants: true,
            images: {
              orderBy: { position: 'asc' },
            },
          },
        });
      },
      findByUserId: async (userId: string, filters?: { status?: string; search?: string }) => {
        const where: any = { userId };

        if (filters?.status) {
          where.status = filters.status;
        }

        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
            { brand: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        return await prisma.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            sku: true,
            brand: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      findBySku: async (userId: string, sku: string) => {
        return await prisma.product.findFirst({
          where: { userId, sku },
        });
      },
      create: async (data) => {
        return await prisma.product.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.product.update({
          where: { id },
          data,
        });
      },
      delete: async (id: string) => {
        await prisma.product.delete({
          where: { id },
        });
      },
    },

    // Listings
    listing: {
      findById: async (id: string) => {
        return await prisma.listing.findUnique({
          where: { id },
          include: {
            product: true,
          },
        });
      },
      findByProductId: async (productId: string) => {
        return await prisma.listing.findMany({
          where: { productId },
          orderBy: { createdAt: 'desc' },
        });
      },
      findByProductIdAndMarketplace: async (productId: string, marketplaceId: string) => {
        return await prisma.listing.findUnique({
          where: {
            productId_marketplaceId: { productId, marketplaceId },
          },
        });
      },
      findByExternalId: async (marketplaceId: string, externalId: string) => {
        return await prisma.listing.findFirst({
          where: { marketplaceId, externalId },
        });
      },
      create: async (data) => {
        return await prisma.listing.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.listing.update({
          where: { id },
          data,
        });
      },
      delete: async (id: string) => {
        await prisma.listing.delete({
          where: { id },
        });
      },
    },

    // Orders
    order: {
      findById: async (id: string) => {
        return await prisma.order.findUnique({
          where: { id },
          include: {
            items: true,
            supplierOrder: true,
          },
        });
      },
      findByUserId: async (userId: string, filters?: { status?: string; marketplaceId?: string; dateFrom?: Date; dateTo?: Date }) => {
        const where: any = { userId };

        if (filters?.status) {
          where.status = filters.status;
        }

        if (filters?.marketplaceId) {
          where.marketplaceId = filters.marketplaceId;
        }

        if (filters?.dateFrom || filters?.dateTo) {
          where.createdAt = {};
          if (filters.dateFrom) {
            where.createdAt.gte = filters.dateFrom;
          }
          if (filters.dateTo) {
            where.createdAt.lte = filters.dateTo;
          }
        }

        return await prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              select: {
                id: true,
                title: true,
                sku: true,
                quantity: true,
                price: true,
                totalPrice: true,
              },
            },
          },
        });
      },
      findByExternalOrderId: async (marketplaceId: string, externalOrderId: string) => {
        return await prisma.order.findUnique({
          where: {
            marketplaceId_externalOrderId: { marketplaceId, externalOrderId },
          },
        });
      },
      create: async (data) => {
        return await prisma.order.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.order.update({
          where: { id },
          data,
        });
      },
    },

    // Inventory
    inventory: {
      findByProductId: async (productId: string) => {
        return await prisma.inventory.findUnique({
          where: { productId },
          include: {
            allocations: true,
          },
        });
      },
      create: async (data) => {
        return await prisma.inventory.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.inventory.update({
          where: { id },
          data,
        });
      },
      updateQuantity: async (productId: string, change: number, reason: string) => {
        return await prisma.$transaction(async (tx) => {
          const inventory = await tx.inventory.findUnique({
            where: { productId },
          });

          if (!inventory) {
            throw new Error('Inventory not found');
          }

          const newQuantity = inventory.totalQuantity + change;

          const updated = await tx.inventory.update({
            where: { productId },
             {
              totalQuantity: newQuantity,
              availableQuantity: newQuantity - inventory.allocatedQuantity,
              lastUpdated: new Date(),
            },
          });

          // Record history
          await tx.inventoryHistory.create({
             {
              inventoryId: inventory.id,
              previousQuantity: inventory.totalQuantity,
              newQuantity,
              change,
              reason,
            },
          });

          return updated;
        });
      },
      allocation: {
        findByInventoryAndMarketplace: async (inventoryId: string, marketplaceId: string) => {
          return await prisma.inventoryAllocation.findUnique({
            where: {
              inventoryId_marketplaceId: { inventoryId, marketplaceId },
            },
          });
        },
        create: async (data) => {
          return await prisma.inventoryAllocation.create({ data });
        },
        update: async (id: string, data) => {
          return await prisma.inventoryAllocation.update({
            where: { id },
            data,
          });
        },
      },
      history: {
        create: async (data) => {
          return await prisma.inventoryHistory.create({ data });
        },
        findByInventoryId: async (inventoryId: string, limit = 50) => {
          return await prisma.inventoryHistory.findMany({
            where: { inventoryId },
            orderBy: { createdAt: 'desc' },
            take: limit,
          });
        },
      },
    },

    // Supplier Orders
    supplierOrder: {
      findById: async (id: string) => {
        return await prisma.supplierOrder.findUnique({
          where: { id },
        });
      },
      findByOrderId: async (orderId: string) => {
        return await prisma.supplierOrder.findFirst({
          where: { orderId },
        });
      },
      findByUserId: async (userId: string) => {
        return await prisma.supplierOrder.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      },
      create: async (data) => {
        return await prisma.supplierOrder.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.supplierOrder.update({
          where: { id },
          data,
        });
      },
    },

    // Balance
    balance: {
      findByUserId: async (userId: string) => {
        return await prisma.balance.findUnique({
          where: { userId },
        });
      },
      create: async (data) => {
        return await prisma.balance.create({ data });
      },
      update: async (userId: string, amount: number) => {
        return await prisma.balance.update({
          where: { userId },
           {
            amount,
            lastUpdated: new Date(),
          },
        });
      },
    },

    // Transactions
    transaction: {
      findByUserId: async (userId: string, filters?: { type?: string }) => {
        const where: any = { userId };

        if (filters?.type) {
          where.type = filters.type;
        }

        return await prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
      },
      create: async (data) => {
        return await prisma.transaction.create({ data });
      },
      findById: async (id: string) => {
        return await prisma.transaction.findUnique({
          where: { id },
        });
      },
      update: async (id: string, data) => {
        return await prisma.transaction.update({
          where: { id },
          data,
        });
      },
      findByStripePaymentId: async (stripePaymentId: string) => {
        return await prisma.transaction.findFirst({
          where: { stripePaymentId },
        });
      },
    },

    // Jobs
    job: {
      findById: async (id: string) => {
        return await prisma.job.findUnique({
          where: { id },
        });
      },
      findPending: async (type?: string) => {
        const where: any = {
          status: 'pending',
          scheduledAt: { lte: new Date() },
        };

        if (type) {
          where.type = type;
        }

        return await prisma.job.findMany({
          where,
          orderBy: { scheduledAt: 'asc' },
          take: 10,
        });
      },
      create: async (data) => {
        return await prisma.job.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.job.update({
          where: { id },
          data,
        });
      },
    },

    // Notifications
    notification: {
      findByUserId: async (userId: string, filters?: { read?: boolean; limit?: number }) => {
        const where: any = { userId };

        if (filters?.read !== undefined) {
          where.read = filters.read;
        }

        return await prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 50,
        });
      },
      create: async (data) => {
        return await prisma.notification.create({ data });
      },
      findById: async (id: string) => {
        return await prisma.notification.findUnique({
          where: { id },
        });
      },
      markAsRead: async (id: string) => {
        await prisma.notification.update({
          where: { id },
           { read: true },
        });
      },
      markAllAsRead: async (userId: string) => {
        await prisma.notification.updateMany({
          where: { userId, read: false },
           { read: true },
        });
      },
    },

    // Webhooks
    webhookEvent: {
      findById: async (id: string) => {
        return await prisma.webhookEvent.findUnique({
          where: { id },
        });
      },
      findUnprocessed: async (marketplaceId?: string) => {
        const where: any = { processed: false };

        if (marketplaceId) {
          where.marketplaceId = marketplaceId;
        }

        return await prisma.webhookEvent.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          take: 50,
        });
      },
      create: async (data) => {
        return await prisma.webhookEvent.create({ data });
      },
      markAsProcessed: async (id: string, errors?: string[]) => {
        await prisma.webhookEvent.update({
          where: { id },
           {
            processed: true,
            processedAt: new Date(),
            errors: errors || undefined,
          },
        });
      },
    },

    // Audit Logs
    auditLog: {
      create: async (data) => {
        return await prisma.auditLog.create({ data });
      },
      findByUserId: async (userId: string, limit = 50) => {
        return await prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      },
    },

    // Error Logs
    errorLog: {
      create: async (data) => {
        return await prisma.errorLog.create({ data });
      },
    },

    // Idempotency Keys
    idempotencyKey: {
      findByKey: async (key: string) => {
        return await prisma.idempotencyKey.findUnique({
          where: { key },
        });
      },
      create: async (data) => {
        return await prisma.idempotencyKey.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.idempotencyKey.update({
          where: { id },
          data,
        });
      },
      cleanup: async () => {
        const now = new Date();
        await prisma.idempotencyKey.deleteMany({
          where: { expiresAt: { lt: now } },
        });
      },
    },

    // Rate Limits
    rateLimit: {
      findByMarketplaceAndEndpoint: async (marketplaceId: string, endpoint: string) => {
        return await prisma.rateLimit.findUnique({
          where: {
            marketplaceId_endpoint: { marketplaceId, endpoint },
          },
        });
      },
      create: async (data) => {
        return await prisma.rateLimit.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.rateLimit.update({
          where: { id },
          data,
        });
      },
      increment: async (marketplaceId: string, endpoint: string) => {
        return await prisma.rateLimit.upsert({
          where: {
            marketplaceId_endpoint: { marketplaceId, endpoint },
          },
          update: {
            requestCount: { increment: 1 },
          },
          create: {
            marketplaceId,
            endpoint,
            requestCount: 1,
            windowStart: new Date(),
            windowEnd: new Date(Date.now() + 60000),
          },
        });
      },
    },

    // Message Templates
    messageTemplate: {
      findById: async (id: string) => {
        return await prisma.messageTemplate.findUnique({
          where: { id },
        });
      },
      findByConnectionId: async (connectionId: string) => {
        return await prisma.messageTemplate.findMany({
          where: { connectionId, isActive: true },
          orderBy: { createdAt: 'desc' },
        });
      },
      findByConnectionAndTrigger: async (connectionId: string, triggerEvent: string) => {
        return await prisma.messageTemplate.findMany({
          where: { connectionId, triggerEvent, isActive: true },
        });
      },
      create: async (data) => {
        return await prisma.messageTemplate.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.messageTemplate.update({
          where: { id },
          data,
        });
      },
      delete: async (id: string) => {
        await prisma.messageTemplate.delete({
          where: { id },
        });
      },
    },

    // Messages
    message: {
      findById: async (id: string) => {
        return await prisma.message.findUnique({
          where: { id },
        });
      },
      findByUserId: async (userId: string, limit = 50) => {
        return await prisma.message.findMany({
          where: { userId },
          orderBy: { sentAt: 'desc' },
          take: limit,
        });
      },
      create: async (data) => {
        return await prisma.message.create({ data });
      },
      update: async (id: string, data) => {
        return await prisma.message.update({
          where: { id },
          data,
        });
      },
    },

    // Transactions (Database transactions)
    transaction: {
      execute: async <T>(fn: (tx: any) => Promise<T>) => {
        return await prisma.$transaction(fn);
      },
    },
  };
}

// ============================================================
// DATABASE UTILITIES
// ============================================================

export async function withTransaction<T>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(fn);
}

export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export async function encryptCredential(credential: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(credential);

  const keyData = encoder.encode(encryptionKey);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptCredential(encrypted: string, encryptionKey: string): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKey);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================================
// CURSOR-BASED PAGINATION
// ============================================================

export async function paginate<T>(
  model: any,
  args: {
    where?: any;
    orderBy?: any;
    cursor?: string;
    limit?: number;
    select?: any;
    include?: any;
  }
): Promise<{
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const limit = args.limit || 20;

  const items = await model.findMany({
    where: args.where,
    orderBy: args.orderBy || { id: 'asc' },
    cursor: args.cursor ? { id: args.cursor } : undefined,
    take: limit + 1,
    select: args.select,
    include: args.include,
  });

  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? resultItems[resultItems.length - 1].id : null;

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}
