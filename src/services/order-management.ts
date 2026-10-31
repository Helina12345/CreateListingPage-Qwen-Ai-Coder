// ============================================================
// ListingDesk Pro — Order Management Service
// Order processing, returns, refunds, and customer service
// ============================================================

export interface Order {
  id: string;
  marketplaceId: string;
  externalOrderId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'disputed';
  customer: {
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
  };
  items: Array<{
    id: string;
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  payment: {
    method: string;
    status: 'pending' | 'captured' | 'refunded' | 'failed';
    transactionId?: string;
  };
  shipping: {
    carrier: string;
    service: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  notes: {
    internal?: string;
    customer?: string;
  };
  timeline: Array<{
    date: Date;
    status: string;
    location?: string;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnAuthorization {
  id: string;
  orderId: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'processed';
  reason: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
    condition: 'new' | 'used' | 'damaged';
  }>;
  refundAmount: number;
  shippingLabel?: string;
  trackingNumber?: string;
  requestedAt: Date;
  processedAt?: Date;
}

export interface Refund {
  id: string;
  orderId: string;
  returnAuthId?: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface Dispute {
  id: string;
  orderId: string;
  type: 'item_not_received' | 'item_not_as_described' | 'unauthorized_transaction' | 'other';
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  reason: string;
  evidence: string[];
  resolution?: string;
  refundAmount?: number;
  createdAt: Date;
  resolvedAt?: Date;
}

export class OrderManagementService {
  private orders: Map<string, Order> = new Map();
  private returnAuthorizations: Map<string, ReturnAuthorization> = new Map();
  private refunds: Map<string, Refund> = new Map();
  private disputes: Map<string, Dispute> = new Map();

  // ============================================================
  // ORDER MANAGEMENT
  // ============================================================

  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>): Order {
    const newOrder: Order = {
      ...order,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timeline: [
        {
          date: new Date(),
          status: 'Order Placed',
          description: 'Your order has been received and is being processed.',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  getOrders(filters?: {
    status?: Order['status'];
    marketplaceId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Order[] {
    let orders = Array.from(this.orders.values());

    if (filters?.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }

    if (filters?.marketplaceId) {
      orders = orders.filter((o) => o.marketplaceId === filters.marketplaceId);
    }

    if (filters?.dateFrom) {
      orders = orders.filter((o) => o.createdAt >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      orders = orders.filter((o) => o.createdAt <= filters.dateTo!);
    }

    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateOrderStatus(orderId: string, status: Order['status']): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date();

    // Add timeline entry
    const statusMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed.',
      processing: 'Your order is being prepared for shipment.',
      shipped: `Your order has been shipped via ${order.shipping.carrier}.`,
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.',
      refunded: 'Your order has been refunded.',
      disputed: 'Your order is under dispute review.',
    };

    order.timeline.push({
      date: new Date(),
      status: status.charAt(0).toUpperCase() + status.slice(1),
      description: statusMessages[status] || `Order status updated to ${status}.`,
    });

    return order;
  }

  addOrderNote(orderId: string, note: { internal?: string; customer?: string }): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.notes = {
      ...order.notes,
      ...note,
    };
    order.updatedAt = new Date();

    return order;
  }

  updateTrackingNumber(orderId: string, trackingNumber: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.shipping.trackingNumber = trackingNumber;
    order.updatedAt = new Date();

    order.timeline.push({
      date: new Date(),
      status: 'Tracking Updated',
      description: `Tracking number updated to ${trackingNumber}.`,
    });

    return order;
  }

  // ============================================================
  // RETURN AUTHORIZATION
  // ============================================================

  createReturnAuthorization(
    orderId: string,
    reason: string,
    items: ReturnAuthorization['items']
  ): ReturnAuthorization {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const refundAmount = items.reduce((sum, item) => {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      return sum + (orderItem ? orderItem.price * item.quantity : 0);
    }, 0);

    const returnAuth: ReturnAuthorization = {
      id: `rma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      status: 'requested',
      reason,
      items,
      refundAmount,
      requestedAt: new Date(),
    };

    this.returnAuthorizations.set(returnAuth.id, returnAuth);
    return returnAuth;
  }

  approveReturnAuthorization(rmaId: string): ReturnAuthorization | null {
    const rma = this.returnAuthorizations.get(rmaId);
    if (!rma) return null;

    rma.status = 'approved';
    return rma;
  }

  rejectReturnAuthorization(rmaId: string, reason: string): ReturnAuthorization | null {
    const rma = this.returnAuthorizations.get(rmaId);
    if (!rma) return null;

    rma.status = 'rejected';
    return rma;
  }

  processReturnAuthorization(rmaId: string, refundAmount: number): ReturnAuthorization | null {
    const rma = this.returnAuthorizations.get(rmaId);
    if (!rma) return null;

    rma.status = 'processed';
    rma.refundAmount = refundAmount;
    rma.processedAt = new Date();

    // Create refund
    this.createRefund(rma.orderId, rmaId, refundAmount, rma.reason);

    return rma;
  }

  getReturnAuthorizations(orderId?: string): ReturnAuthorization[] {
    let rmas = Array.from(this.returnAuthorizations.values());

    if (orderId) {
      rmas = rmas.filter((r) => r.orderId === orderId);
    }

    return rmas.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  // ============================================================
  // REFUND PROCESSING
  // ============================================================

  createRefund(
    orderId: string,
    returnAuthId: string | undefined,
    amount: number,
    reason: string
  ): Refund {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const refund: Refund = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      returnAuthId,
      amount,
      currency: order.totals.currency,
      reason,
      status: 'pending',
      createdAt: new Date(),
    };

    this.refunds.set(refund.id, refund);

    // Update order status
    if (amount >= order.totals.total) {
      order.status = 'refunded';
    } else {
      order.status = 'refunded'; // Could be 'partially_refunded' if we track that
    }

    order.timeline.push({
      date: new Date(),
      status: 'Refund Initiated',
      description: `Refund of ${amount} ${order.totals.currency} initiated. Reason: ${reason}`,
    });

    return refund;
  }

  processRefund(refundId: string, transactionId: string): Refund | null {
    const refund = this.refunds.get(refundId);
    if (!refund) return null;

    refund.status = 'processed';
    refund.transactionId = transactionId;
    refund.processedAt = new Date();

    return refund;
  }

  getRefunds(orderId?: string): Refund[] {
    let refunds = Array.from(this.refunds.values());

    if (orderId) {
      refunds = refunds.filter((r) => r.orderId === orderId);
    }

    return refunds.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================
  // DISPUTE MANAGEMENT
  // ============================================================

  createDispute(
    orderId: string,
    type: Dispute['type'],
    reason: string,
    evidence: string[]
  ): Dispute {
    const dispute: Dispute = {
      id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      type,
      status: 'open',
      reason,
      evidence,
      createdAt: new Date(),
    };

    this.disputes.set(dispute.id, dispute);

    // Update order status
    const order = this.orders.get(orderId);
    if (order) {
      order.status = 'disputed';
      order.timeline.push({
        date: new Date(),
        status: 'Dispute Opened',
        description: `Dispute opened: ${type}. Reason: ${reason}`,
      });
    }

    return dispute;
  }

  updateDisputeStatus(disputeId: string, status: Dispute['status']): Dispute | null {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return null;

    dispute.status = status;
    if (status === 'resolved' || status === 'closed') {
      dispute.resolvedAt = new Date();
    }

    return dispute;
  }

  resolveDispute(
    disputeId: string,
    resolution: string,
    refundAmount?: number
  ): Dispute | null {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return null;

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.refundAmount = refundAmount;
    dispute.resolvedAt = new Date();

    // Create refund if amount provided
    if (refundAmount && refundAmount > 0) {
      this.createRefund(dispute.orderId, undefined, refundAmount, dispute.reason);
    }

    // Update order status
    const order = this.orders.get(dispute.orderId);
    if (order) {
      order.status = refundAmount && refundAmount >= order.totals.total ? 'refunded' : 'confirmed';
      order.timeline.push({
        date: new Date(),
        status: 'Dispute Resolved',
        description: `Dispute resolved: ${resolution}`,
      });
    }

    return dispute;
  }

  getDisputes(orderId?: string, status?: Dispute['status']): Dispute[] {
    let disputes = Array.from(this.disputes.values());

    if (orderId) {
      disputes = disputes.filter((d) => d.orderId === orderId);
    }

    if (status) {
      disputes = disputes.filter((d) => d.status === status);
    }

    return disputes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================
  // CUSTOMER MESSAGING
  // ============================================================

  async sendCustomerMessage(
    orderId: string,
    message: string,
    template?: string
  ): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // In production, integrate with email/SMS service
    console.log(`Sending message to ${order.customer.email}:`, message);

    // Add to order timeline
    order.timeline.push({
      date: new Date(),
      status: 'Message Sent',
      description: `Message sent to customer: ${message.substring(0, 100)}...`,
    });
  }

  getMessageTemplates(): Array<{
    id: string;
    name: string;
    subject: string;
    body: string;
  }> {
    return [
      {
        id: 'order_confirmation',
        name: 'Order Confirmation',
        subject: 'Your Order Confirmation',
        body: 'Thank you for your order! We\'re processing it now.',
      },
      {
        id: 'shipping_notification',
        name: 'Shipping Notification',
        subject: 'Your Order Has Shipped',
        body: 'Great news! Your order has been shipped.',
      },
      {
        id: 'delivery_confirmation',
        name: 'Delivery Confirmation',
        subject: 'Your Order Has Been Delivered',
        body: 'Your order has been delivered. We hope you enjoy it!',
      },
      {
        id: 'return_instructions',
        name: 'Return Instructions',
        subject: 'Return Instructions for Your Order',
        body: 'Here are the instructions for returning your item.',
      },
    ];
  }

  // ============================================================
  // ORDER TRACKING TIMELINE
  // ============================================================

  getOrderTimeline(orderId: string): Order['timeline'] {
    const order = this.orders.get(orderId);
    if (!order) return [];

    return order.timeline;
  }

  // ============================================================
  // DELIVERY CONFIRMATION
  // ============================================================

  confirmDelivery(orderId: string, proofOfDelivery?: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.status = 'delivered';
    order.shipping.actualDelivery = new Date();
    order.updatedAt = new Date();

    order.timeline.push({
      date: new Date(),
      status: 'Delivered',
      description: 'Your order has been delivered.',
    });

    // In production, store proof of delivery
    if (proofOfDelivery) {
      console.log('Proof of delivery stored:', proofOfDelivery);
    }

    return order;
  }

  // ============================================================
  // ORDER STATISTICS
  // ============================================================

  getOrderStatistics(period: 'day' | 'week' | 'month' | 'year' = 'month'): {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<Order['status'], number>;
    ordersByMarketplace: Record<string, number>;
  } {
    const orders = this.getOrders();

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredOrders = orders.filter((o) => o.createdAt >= startDate);

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totals.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus: Record<Order['status'], number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      disputed: 0,
    };

    const ordersByMarketplace: Record<string, number> = {};

    for (const order of filteredOrders) {
      ordersByStatus[order.status]++;
      ordersByMarketplace[order.marketplaceId] = (ordersByMarketplace[order.marketplaceId] || 0) + 1;
    }

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByMarketplace,
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createOrderManagementService(): OrderManagementService {
  return new OrderManagementService();
}
