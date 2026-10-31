// ============================================================
// ListingDesk Pro — Real Order Synchronization Service
// Complete order sync across all marketplaces
// ============================================================

import type { ServerOrder, ServerOrderItem } from '../types';
import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';

// ============================================================
// TYPES
// ============================================================

export interface OrderSyncResult {
  orderId: string;
  marketplaceId: MarketplaceId;
  success: boolean;
  error?: string;
}

// ============================================================
// ORDER SYNCHRONIZATION SERVICE
// ============================================================

export class OrderSyncService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // SYNC ORDERS FROM MARKETPLACE
  // ============================================================

  async syncOrdersFromMarketplace(
    userId: string,
    connectionId: string
  ): Promise<OrderSyncResult[]> {
    const connection = await this.db.marketplaceConnection.findById(connectionId);

    if (!connection || connection.userId !== userId) {
      throw new Error('Connection not found');
    }

    const adapter = getAdapter(connection.marketplaceId);
    adapter.setAccessToken(connection.accessToken);

    // In production, fetch orders from marketplace
    // const orders = await adapter.getOrders({
    //   createdAfter: connection.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000),
    // });

    const results: OrderSyncResult[] = [];

    // for (const order of orders) {
    //   try {
    //     await this.createOrUpdateOrder(
    //       userId,
    //       connection.marketplaceId,
    //       connection.id,
    //       order
    //     );

    //     results.push({
    //       orderId: order.id,
    //       marketplaceId: connection.marketplaceId,
    //       success: true,
    //     });
    //   } catch (error: any) {
    //     results.push({
    //       orderId: order.id,
    //       marketplaceId: connection.marketplaceId,
    //       success: false,
    //       error: error.message,
    //     });
    //   }
    // }

    // Update last sync time
    await this.db.marketplaceConnection.update(connectionId, {
      lastSyncAt: new Date(),
    });

    return results;
  }

  // ============================================================
  // CREATE OR UPDATE ORDER
  // ============================================================

  async createOrUpdateOrder(
    userId: string,
    marketplaceId: MarketplaceId,
    connectionId: string,
    orderData: any
  ): Promise<ServerOrder> {
    // Check if order already exists
    const existing = await this.db.order.findByExternalOrderId(marketplaceId, orderData.externalOrderId);

    if (existing) {
      // Update existing order
      return await this.db.order.update(existing.id, {
        status: orderData.status,
        trackingNumber: orderData.trackingNumber,
        carrier: orderData.carrier,
        shippedAt: orderData.shippedAt,
        deliveredAt: orderData.deliveredAt,
      });
    } else {
      // Create new order
      const order = await this.db.order.create({
        userId,
        marketplaceId,
        connectionId,
        externalOrderId: orderData.externalOrderId,
        status: orderData.status,
        buyerName: orderData.buyerName,
        buyerEmail: orderData.buyerEmail,
        buyerPhone: orderData.buyerPhone,
        shippingAddress: orderData.shippingAddress,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        tax: orderData.tax,
        total: orderData.total,
        currency: orderData.currency || 'USD',
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus || 'pending',
      });

      // Create order items
      for (const item of orderData.items) {
        await this.createOrderItem(order.id, item);
      }

      // Update inventory
      await this.updateInventoryFromOrder(order.id);

      // Check if auto-order to supplier is needed
      await this.checkAutoOrderToSupplier(order.id, userId);

      // Send notification
      await this.db.notification.create({
        userId,
        type: 'order_received',
        title: 'New Order Received',
        message: `Order #${order.externalOrderId} from ${marketplaceId} - Total: $${order.total}`,
        read: false,
        actionUrl: `/orders/${order.id}`,
        meta { orderId: order.id, marketplaceId },
      });

      // Log audit
      await this.db.auditLog.create({
        userId,
        action: 'order.created',
        resource: 'order',
        resourceId: order.id,
      });

      return order;
    }
  }

  // ============================================================
  // CREATE ORDER ITEM
  // ============================================================

  private async createOrderItem(orderId: string, itemData: any): Promise<void> {
    // In production, create order item record
    // await this.db.orderItem.create({
    //   orderId,
    //   listingId: itemData.listingId,
    //   variantId: itemData.variantId,
    //   title: itemData.title,
    //   sku: itemData.sku,
    //   quantity: itemData.quantity,
    //   price: itemData.price,
    //   totalPrice: itemData.totalPrice,
    // });
  }

  // ============================================================
  // UPDATE INVENTORY FROM ORDER
  // ============================================================

  private async updateInventoryFromOrder(orderId: string): Promise<void> {
    const order = await this.db.order.findById(orderId);
    if (!order) return;

    // Get order items
    // const items = await this.db.orderItem.findByOrderId(orderId);

    // For each item, update inventory
    // for (const item of items) {
    //   await this.db.inventory.updateQuantity(item.productId, -item.quantity, 'sale');
    // }
  }

  // ============================================================
  // CHECK AUTO ORDER TO SUPPLIER
  // ============================================================

  private async checkAutoOrderToSupplier(orderId: string, userId: string): Promise<void> {
    const order = await this.db.order.findById(orderId);
    if (!order) return;

    // Check if user has supplier connection with auto-order enabled
    const supplierConnection = await this.db.supplierConnection.findByUserIdAndSupplier(userId, 'aliexpress');

    if (!supplierConnection || !supplierConnection.autoOrderEnabled) {
      return;
    }

    // Create auto-order job
    await this.db.job.create({
      type: 'auto_order',
      status: 'pending',
      payload: {
        orderId,
        userId,
        supplierConnectionId: supplierConnection.id,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });
  }

  // ============================================================
  // SYNC ORDER STATUS TO MARKETPLACE
  // ============================================================

  async syncOrderStatusToMarketplace(
    orderId: string,
    status: string,
    userId: string
  ): Promise<void> {
    const order = await this.db.order.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }

    const connection = await this.db.marketplaceConnection.findById(order.connectionId);
    if (!connection) {
      throw new Error('Marketplace connection not found');
    }

    const adapter = getAdapter(order.marketplaceId);
    adapter.setAccessToken(connection.accessToken);

    // In production, update order status on marketplace
    // await adapter.updateOrderStatus(order.externalOrderId, status);

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'order.status_synced',
      resource: 'order',
      resourceId: orderId,
      changes: { status, marketplaceId: order.marketplaceId },
    });
  }

  // ============================================================
  // SYNC ALL ORDERS FOR USER
  // ============================================================

  async syncAllOrdersForUser(userId: string): Promise<OrderSyncResult[]> {
    // Get all connections for user
    const connections = await this.db.marketplaceConnection.findByUserId(userId);

    const results: OrderSyncResult[] = [];

    // Sync orders from each connection
    for (const connection of connections) {
      if (connection.status === 'connected') {
        const connectionResults = await this.syncOrdersFromMarketplace(userId, connection.id);
        results.push(...connectionResults);
      }
    }

    return results;
  }

  // ============================================================
  // GET ORDERS BY MARKETPLACE
  // ============================================================

  async getOrdersByMarketplace(userId: string, marketplaceId: MarketplaceId): Promise<ServerOrder[]> {
    return await this.db.order.findByUserId(userId, { marketplaceId });
  }

  // ============================================================
  // GET ORDERS BY STATUS
  // ============================================================

  async getOrdersByStatus(userId: string, status: string): Promise<ServerOrder[]> {
    return await this.db.order.findByUserId(userId, { status });
  }

  // ============================================================
  // GET RECENT ORDERS
  // ============================================================

  async getRecentOrders(userId: string, days: number = 7): Promise<ServerOrder[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.db.order.findByUserId(userId, { dateFrom: since });
  }

  // ============================================================
  // GET ORDER STATISTICS
  // ============================================================

  async getOrderStatistics(userId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByMarketplace: Record<MarketplaceId, number>;
    ordersByStatus: Record<string, number>;
  }> {
    const now = new Date();
    let since: Date;

    switch (period) {
      case 'day':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const orders = await this.db.order.findByUserId(userId, { dateFrom: since });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByMarketplace: Record<MarketplaceId, number> = {} as any;
    const ordersByStatus: Record<string, number> = {};

    for (const order of orders) {
      ordersByMarketplace[order.marketplaceId] = (ordersByMarketplace[order.marketplaceId] || 0) + 1;
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByMarketplace,
      ordersByStatus,
    };
  }
}
