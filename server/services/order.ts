// ============================================================
// ListingDesk Pro — Order Service
// Handles order synchronization and management across marketplaces
// ============================================================

import type { ServerOrder, ServerOrderItem, ServerSupplierOrder } from '../types';
import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';
import { getAdapter } from '../../services/marketplace-adapters';

// ============================================================
// TYPES
// ============================================================

export interface OrderFilters {
  status?: string;
  marketplaceId?: MarketplaceId;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  userId: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
}

// ============================================================
// ORDER SERVICE
// ============================================================

export class OrderService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // SYNC ORDERS FROM MARKETPLACE
  // ============================================================

  async syncOrdersFromMarketplace(userId: string, connectionId: string): Promise<void> {
    const connection = await this.db.marketplaceConnection.findById(connectionId);

    if (!connection || connection.userId !== userId) {
      throw new Error('Connection not found');
    }

    // Create sync job
    await this.db.job.create({
      type: 'sync_orders',
      status: 'pending',
      payload: {
        connectionId,
        marketplaceId: connection.marketplaceId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });
  }

  // ============================================================
  // PROCESS ORDER WEBHOOK
  // ============================================================

  async processOrderWebhook(
    marketplaceId: MarketplaceId,
    eventType: string,
    payload: Record<string, any>
  ): Promise<void> {
    // Store webhook event
    const webhookEvent = await this.db.webhookEvent.create({
      marketplaceId,
      eventType,
      externalId: payload.id || payload.order_id,
      payload,
      processed: false,
    });

    // Create processing job
    await this.db.job.create({
      type: 'process_webhook',
      status: 'pending',
      payload: {
        webhookEventId: webhookEvent.id,
        marketplaceId,
        eventType,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });
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
    // In actual backend, this would create the order item record
    // await this.db.orderItem.create({ ... });
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
  // UPDATE ORDER STATUS
  // ============================================================

  async updateOrderStatus( UpdateOrderStatusRequest): Promise<ServerOrder> {
    const { orderId, userId, status, trackingNumber, carrier } = data;

    const order = await this.db.order.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }

    // Update order
    const updated = await this.db.order.update(orderId, {
      status: status as any,
      trackingNumber,
      carrier,
      shippedAt: status === 'shipped' ? new Date() : order.shippedAt,
      deliveredAt: status === 'delivered' ? new Date() : order.deliveredAt,
    });

    // Sync status to marketplace
    await this.syncOrderStatusToMarketplace(order.id, status);

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'order.status_updated',
      resource: 'order',
      resourceId: orderId,
      changes: { status, trackingNumber, carrier },
    });

    return updated;
  }

  // ============================================================
  // SYNC ORDER STATUS TO MARKETPLACE
  // ============================================================

  private async syncOrderStatusToMarketplace(orderId: string, status: string): Promise<void> {
    const order = await this.db.order.findById(orderId);
    if (!order) return;

    const connection = await this.db.marketplaceConnection.findById(order.connectionId);
    if (!connection) return;

    // Create sync job
    await this.db.job.create({
      type: 'sync_order_status',
      status: 'pending',
      payload: {
        orderId,
        marketplaceId: order.marketplaceId,
        externalOrderId: order.externalOrderId,
        status,
        connectionId: connection.id,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });
  }

  // ============================================================
  // PLACE ORDER WITH SUPPLIER
  // ============================================================

  async placeOrderWithSupplier(
    orderId: string,
    userId: string,
    supplierConnectionId: string
  ): Promise<ServerSupplierOrder> {
    const order = await this.db.order.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }

    const supplierConnection = await this.db.supplierConnection.findById(supplierConnectionId);

    if (!supplierConnection || supplierConnection.userId !== userId) {
      throw new Error('Supplier connection not found');
    }

    // Get order items
    // const items = await this.db.orderItem.findByOrderId(orderId);

    // Calculate total cost
    // const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check user balance
    const balance = await this.db.balance.findByUserId(userId);
    // if (!balance || balance.amount < totalCost) {
    //   throw new Error('Insufficient balance');
    // }

    // Create supplier order
    const supplierOrder = await this.db.supplierOrder.create({
      userId,
      connectionId: supplierConnectionId,
      orderId: order.id,
      supplierId: 'aliexpress',
      productId: '', // Would get from order items
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      shippingCost: 0,
      status: 'pending',
    });

    // Deduct balance
    // await this.db.balance.update(userId, balance.amount - totalCost);

    // Create transaction
    await this.db.transaction.create({
      userId,
      type: 'debit',
      amount: 0, // totalCost
      currency: 'USD',
      description: `Supplier order for marketplace order #${order.externalOrderId}`,
      referenceId: supplierOrder.id,
      status: 'completed',
    });

    // Create job to place order with supplier
    await this.db.job.create({
      type: 'place_supplier_order',
      status: 'pending',
      payload: {
        supplierOrderId: supplierOrder.id,
        supplierConnectionId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });

    // Update marketplace order status
    await this.db.order.update(orderId, {
      status: 'ordered_from_supplier',
      supplierOrderId: supplierOrder.id,
    });

    // Send auto message to supplier
    if (supplierConnection.autoMessageEnabled) {
      await this.sendAutoMessageToSupplier(supplierOrder.id, userId, supplierConnectionId);
    }

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'supplier_order.placed',
      resource: 'supplier_order',
      resourceId: supplierOrder.id,
    });

    return supplierOrder;
  }

  // ============================================================
  // SEND AUTO MESSAGE TO SUPPLIER
  // ============================================================

  private async sendAutoMessageToSupplier(
    supplierOrderId: string,
    userId: string,
    supplierConnectionId: string
  ): Promise<void> {
    // Get message template
    const templates = await this.db.message.findMany({
      where: {
        userId,
        connectionId: supplierConnectionId,
        triggerEvent: 'order_placed',
        isActive: true,
      },
    });

    if (templates.length === 0) {
      return;
    }

    const template = templates[0];

    // Create message
    await this.db.message.create({
      userId,
      templateId: template.id,
      supplierOrderId,
      direction: 'outbound',
      subject: template.subject,
      body: template.body,
      status: 'sent',
    });

    // Create job to send message
    await this.db.job.create({
      type: 'send_supplier_message',
      status: 'pending',
      payload: {
        supplierOrderId,
        supplierConnectionId,
        userId,
      },
      scheduledAt: new Date(),
      maxAttempts: 3,
    });
  }

  // ============================================================
  // GET USER ORDERS
  // ============================================================

  async getUserOrders(userId: string, filters?: OrderFilters): Promise<ServerOrder[]> {
    return await this.db.order.findByUserId(userId, filters);
  }

  // ============================================================
  // GET ORDER BY ID
  // ============================================================

  async getOrderById(orderId: string, userId: string): Promise<ServerOrder | null> {
    const order = await this.db.order.findById(orderId);

    if (!order || order.userId !== userId) {
      return null;
    }

    return order;
  }

  // ============================================================
  // GET ORDERS BY MARKETPLACE
  // ============================================================

  async getOrdersByMarketplace(userId: string, marketplaceId: MarketplaceId): Promise<ServerOrder[]> {
    return await this.db.order.findByUserId(userId, { marketplaceId });
  }
}
