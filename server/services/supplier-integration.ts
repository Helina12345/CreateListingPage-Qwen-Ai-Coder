// ============================================================
// ListingDesk Pro — Real Supplier Integration Service
// Complete AliExpress integration with auto-ordering and messaging
// ============================================================

import type { ServerSupplierOrder, ServerMessage, ServerMessageTemplate } from '../types';
import type { DatabaseClient } from './database';
import { AliExpressAPI } from './marketplace-adapters/aliexpress';

// ============================================================
// TYPES
// ============================================================

export interface SupplierProduct {
  id: string;
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

export interface SearchSupplierProductsRequest {
  query: string;
  page?: number;
  limit?: number;
}

export interface PlaceSupplierOrderRequest {
  userId: string;
  supplierConnectionId: string;
  productId: string;
  variantId: string;
  quantity: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface SendMessageToSupplierRequest {
  userId: string;
  supplierConnectionId: string;
  supplierOrderId: string;
  message: string;
}

// ============================================================
// SUPPLIER INTEGRATION SERVICE
// ============================================================

export class SupplierIntegrationService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // SEARCH PRODUCTS ON ALIEXPRESS
  // ============================================================

  async searchProducts(userId: string, request: SearchSupplierProductsRequest): Promise<SupplierProduct[]> {
    const { query, page = 1, limit = 20 } = request;

    // Get supplier connection
    const connection = await this.db.supplierConnection.findByUserIdAndSupplier(userId, 'aliexpress');
    if (!connection || connection.status !== 'connected') {
      throw new Error('AliExpress not connected');
    }

    const api = new AliExpressAPI(
      process.env.ALIEXPRESS_APP_KEY || '',
      process.env.ALIEXPRESS_APP_SECRET || ''
    );

    const products = await api.searchProducts(query, page, limit);

    return products.map((p: any) => ({
      id: p.product_id,
      title: p.product_title,
      description: p.product_description,
      images: p.image_urls || [],
      price: p.min_price || p.price,
      currency: 'USD',
      variants: p.variants?.map((v: any) => ({
        id: v.sku_id,
        sku: v.sku_code,
        attributes: v.sku_attributes || {},
        price: v.sku_price,
        stock: v.sku_stock,
        images: v.sku_images || [],
      })) || [],
      shipping: {
        cost: p.shipping_fee || 0,
        estimatedDays: {
          min: p.shipping_time_min || 7,
          max: p.shipping_time_max || 30,
        },
        freeShipping: p.free_shipping || false,
      },
      rating: p.rating || 0,
      orders: p.orders || 0,
      inStock: p.in_stock !== false,
      url: p.product_url,
    }));
  }

  // ============================================================
  // GET PRODUCT DETAILS
  // ============================================================

  async getProductDetails(userId: string, productId: string): Promise<SupplierProduct> {
    // Get supplier connection
    const connection = await this.db.supplierConnection.findByUserIdAndSupplier(userId, 'aliexpress');
    if (!connection || connection.status !== 'connected') {
      throw new Error('AliExpress not connected');
    }

    const api = new AliExpressAPI(
      process.env.ALIEXPRESS_APP_KEY || '',
      process.env.ALIEXPRESS_APP_SECRET || ''
    );

    const product = await api.getProductDetails(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      id: product.product_id,
      title: product.product_title,
      description: product.product_description,
      images: product.image_urls || [],
      price: product.min_price || product.price,
      currency: 'USD',
      variants: product.variants?.map((v: any) => ({
        id: v.sku_id,
        sku: v.sku_code,
        attributes: v.sku_attributes || {},
        price: v.sku_price,
        stock: v.sku_stock,
        images: v.sku_images || [],
      })) || [],
      shipping: {
        cost: product.shipping_fee || 0,
        estimatedDays: {
          min: product.shipping_time_min || 7,
          max: product.shipping_time_max || 30,
        },
        freeShipping: product.free_shipping || false,
      },
      rating: product.rating || 0,
      orders: product.orders || 0,
      inStock: product.in_stock !== false,
      url: product.product_url,
    };
  }

  // ============================================================
  // PLACE ORDER WITH SUPPLIER
  // ============================================================

  async placeOrder(userId: string, request: PlaceSupplierOrderRequest): Promise<ServerSupplierOrder> {
    const { supplierConnectionId, productId, variantId, quantity, shippingAddress } = request;

    // Get supplier connection
    const connection = await this.db.supplierConnection.findById(supplierConnectionId);
    if (!connection || connection.userId !== userId) {
      throw new Error('Supplier connection not found');
    }

    // Get product details
    const product = await this.getProductDetails(userId, productId);
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Calculate costs
    const unitCost = variant.price;
    const totalCost = unitCost * quantity;
    const shippingCost = product.shipping.cost;

    // Check user balance
    const balance = await this.db.balance.findByUserId(userId);
    if (!balance || balance.amount < totalCost + shippingCost) {
      throw new Error('Insufficient balance');
    }

    // Create supplier order
    const supplierOrder = await this.db.supplierOrder.create({
      userId,
      connectionId: supplierConnectionId,
      supplierId: 'aliexpress',
      productId,
      variantId,
      quantity,
      unitCost,
      totalCost,
      shippingCost,
      status: 'pending',
    });

    // Deduct balance
    const totalAmount = totalCost + shippingCost;
    await this.db.balance.update(userId, balance.amount - totalAmount);

    // Create transaction
    await this.db.transaction.create({
      userId,
      type: 'debit',
      amount: totalAmount,
      currency: 'USD',
      description: `AliExpress order for product ${product.title}`,
      referenceId: supplierOrder.id,
      status: 'completed',
    });

    // Place order with AliExpress
    try {
      await this.placeOrderWithAliExpress(connection, supplierOrder, shippingAddress);

      await this.db.supplierOrder.update(supplierOrder.id, {
        status: 'placed',
        orderedAt: new Date(),
      });
    } catch (error: any) {
      // Refund balance on failure
      await this.db.balance.update(userId, balance.amount);

      await this.db.transaction.create({
        userId,
        type: 'credit',
        amount: totalAmount,
        currency: 'USD',
        description: `Refund for failed AliExpress order`,
        referenceId: supplierOrder.id,
        status: 'completed',
      });

      await this.db.supplierOrder.update(supplierOrder.id, {
        status: 'cancelled',
      });

      throw error;
    }

    // Send auto message if enabled
    if (connection.autoMessageEnabled) {
      await this.sendAutoMessage(userId, supplierOrder.id, supplierConnectionId);
    }

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'supplier_order.placed',
      resource: 'supplier_order',
      resourceId: supplierOrder.id,
      changes: { productId, variantId, quantity, totalCost },
    });

    return supplierOrder;
  }

  // ============================================================
  // PLACE ORDER WITH ALIEXPRESS API
  // ============================================================

  private async placeOrderWithAliExpress(
    connection: any,
    supplierOrder: ServerSupplierOrder,
    shippingAddress: any
  ): Promise<void> {
    const api = new AliExpressAPI(
      process.env.ALIEXPRESS_APP_KEY || '',
      process.env.ALIEXPRESS_APP_SECRET || ''
    );

    const orderData = {
      product_id: supplierOrder.productId,
      sku_id: supplierOrder.variantId,
      quantity: supplierOrder.quantity,
      shipping_address: shippingAddress,
    };

    const result = await api.placeOrder(orderData);

    await this.db.supplierOrder.update(supplierOrder.id, {
      externalOrderId: result.order_id,
    });
  }

  // ============================================================
  // SEND AUTO MESSAGE TO SUPPLIER
  // ============================================================

  private async sendAutoMessage(
    userId: string,
    supplierOrderId: string,
    supplierConnectionId: string
  ): Promise<void> {
    // Get message template
    const templates = await this.db.messageTemplate.findByConnectionAndTrigger(
      supplierConnectionId,
      'order_placed'
    );

    if (templates.length === 0) {
      return;
    }

    const template = templates[0];

    // Create message
    const message = await this.db.message.create({
      userId,
      templateId: template.id,
      supplierOrderId,
      direction: 'outbound',
      subject: template.subject || 'Order Confirmation',
      body: template.body,
      status: 'sent',
    });

    // Send message to supplier
    try {
      await this.sendMessageToAliExpress(supplierConnectionId, supplierOrderId, template.body);

      await this.db.message.update(message.id, {
        status: 'delivered',
      });
    } catch (error: any) {
      await this.db.message.update(message.id, {
        status: 'failed',
      });
    }
  }

  // ============================================================
  // SEND MESSAGE TO SUPPLIER
  // ============================================================

  async sendMessage(userId: string, request: SendMessageToSupplierRequest): Promise<ServerMessage> {
    const { supplierConnectionId, supplierOrderId, message } = request;

    // Get supplier connection
    const connection = await this.db.supplierConnection.findById(supplierConnectionId);
    if (!connection || connection.userId !== userId) {
      throw new Error('Supplier connection not found');
    }

    // Create message
    const msg = await this.db.message.create({
      userId,
      supplierOrderId,
      direction: 'outbound',
      body: message,
      status: 'sent',
    });

    // Send message to AliExpress
    try {
      await this.sendMessageToAliExpress(supplierConnectionId, supplierOrderId, message);

      await this.db.message.update(msg.id, {
        status: 'delivered',
      });
    } catch (error: any) {
      await this.db.message.update(msg.id, {
        status: 'failed',
      });

      throw error;
    }

    return msg;
  }

  // ============================================================
  // SEND MESSAGE TO ALIEXPRESS API
  // ============================================================

  private async sendMessageToAliExpress(
    supplierConnectionId: string,
    supplierOrderId: string,
    message: string
  ): Promise<void> {
    const api = new AliExpressAPI(
      process.env.ALIEXPRESS_APP_KEY || '',
      process.env.ALIEXPRESS_APP_SECRET || ''
    );

    await api.sendMessage(supplierOrderId, message);
  }

  // ============================================================
  // SYNC SUPPLIER ORDER STATUS
  // ============================================================

  async syncSupplierOrderStatus(supplierOrderId: string): Promise<void> {
    const supplierOrder = await this.db.supplierOrder.findById(supplierOrderId);
    if (!supplierOrder) {
      throw new Error('Supplier order not found');
    }

    // Get supplier connection
    const connection = await this.db.supplierConnection.findById(supplierOrder.connectionId);
    if (!connection) {
      throw new Error('Supplier connection not found');
    }

    const api = new AliExpressAPI(
      process.env.ALIEXPRESS_APP_KEY || '',
      process.env.ALIEXPRESS_APP_SECRET || ''
    );

    const orderStatus = await api.getOrderStatus(supplierOrder.externalOrderId!);

    await this.db.supplierOrder.update(supplierOrderId, {
      status: orderStatus.status,
      trackingNumber: orderStatus.tracking_number,
      shippedAt: orderStatus.shipped_at,
      deliveredAt: orderStatus.delivered_at,
    });

    // Update marketplace order if linked
    if (supplierOrder.orderId) {
      const marketplaceOrder = await this.db.order.findById(supplierOrder.orderId);
      if (marketplaceOrder) {
        await this.db.order.update(marketplaceOrder.id, {
          status: this.mapSupplierStatusToOrderStatus(orderStatus.status),
          trackingNumber: orderStatus.tracking_number,
          carrier: orderStatus.carrier,
          shippedAt: orderStatus.shipped_at,
        });
      }
    }
  }

  // ============================================================
  // MAP SUPPLIER STATUS TO ORDER STATUS
  // ============================================================

  private mapSupplierStatusToOrderStatus(supplierStatus: string): string {
    const mapping: Record<string, string> = {
      pending: 'ordered_from_supplier',
      placed: 'ordered_from_supplier',
      confirmed: 'ordered_from_supplier',
      shipped: 'shipped_by_supplier',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };

    return mapping[supplierStatus] || 'ordered_from_supplier';
  }

  // ============================================================
  // GET USER SUPPLIER ORDERS
  // ============================================================

  async getUserSupplierOrders(userId: string): Promise<ServerSupplierOrder[]> {
    return await this.db.supplierOrder.findByUserId(userId);
  }

  // ============================================================
  // GET SUPPLIER ORDER BY ID
  // ============================================================

  async getSupplierOrderById(supplierOrderId: string, userId: string): Promise<ServerSupplierOrder | null> {
    const order = await this.db.supplierOrder.findById(supplierOrderId);

    if (!order || order.userId !== userId) {
      return null;
    }

    return order;
  }

  // ============================================================
  // MESSAGE TEMPLATE MANAGEMENT
  // ============================================================

  async createMessageTemplate(
    userId: string,
    supplierConnectionId: string,
     {
      name: string;
      subject?: string;
      body: string;
      language?: string;
      triggerEvent?: string;
    }
  ): Promise<ServerMessageTemplate> {
    const connection = await this.db.supplierConnection.findById(supplierConnectionId);
    if (!connection || connection.userId !== userId) {
      throw new Error('Supplier connection not found');
    }

    return await this.db.messageTemplate.create({
      userId,
      connectionId: supplierConnectionId,
      name: data.name,
      subject: data.subject,
      body: data.body,
      language: data.language || 'en',
      isActive: true,
      triggerEvent: data.triggerEvent,
    });
  }

  async updateMessageTemplate(
    templateId: string,
    userId: string,
     Partial<ServerMessageTemplate>
  ): Promise<ServerMessageTemplate> {
    const template = await this.db.messageTemplate.findById(templateId);
    if (!template || template.userId !== userId) {
      throw new Error('Template not found');
    }

    return await this.db.messageTemplate.update(templateId, data);
  }

  async deleteMessageTemplate(templateId: string, userId: string): Promise<void> {
    const template = await this.db.messageTemplate.findById(templateId);
    if (!template || template.userId !== userId) {
      throw new Error('Template not found');
    }

    await this.db.messageTemplate.delete(templateId);
  }

  async getMessageTemplates(userId: string, supplierConnectionId: string): Promise<ServerMessageTemplate[]> {
    return await this.db.messageTemplate.findByConnectionId(supplierConnectionId);
  }

  // ============================================================
  // GET MESSAGE HISTORY
  // ============================================================

  async getMessageHistory(userId: string, supplierOrderId?: string): Promise<ServerMessage[]> {
    // In production, implement message retrieval
    return [];
  }
}
