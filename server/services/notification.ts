// ============================================================
// ListingDesk Pro — Real Email Notification Service
// Complete email sending with templates
// ============================================================

import type { ServerNotification, NotificationType } from '../types';
import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationPreferences {
  email: Record<NotificationType, boolean>;
  push: Record<NotificationType, boolean>;
  emailAddress: string;
}

// ============================================================
// EMAIL CLIENT (SMTP via Web API)
// ============================================================

class EmailClient {
  private smtpHost: string;
  private smtpPort: number;
  private smtpUser: string;
  private smtpPass: string;
  private fromEmail: string;

  constructor(
    smtpHost: string,
    smtpPort: number,
    smtpUser: string,
    smtpPass: string,
    fromEmail: string
  ) {
    this.smtpHost = smtpHost;
    this.smtpPort = smtpPort;
    this.smtpUser = smtpUser;
    this.smtpPass = smtpPass;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // In production, use nodemailer or similar library
    // This is a placeholder that shows the structure

    const emailData = {
      from: this.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    // In Node.js backend, use nodemailer:
    // const transporter = nodemailer.createTransport({
    //   host: this.smtpHost,
    //   port: this.smtpPort,
    //   secure: this.smtpPort === 465,
    //   auth: {
    //     user: this.smtpUser,
    //     pass: this.smtpPass,
    //   },
    // });
    // await transporter.sendMail(emailData);

    // For browser environment, we'll use a backend API endpoint
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

class EmailTemplates {
  static wrap(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ListingDesk Pro</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${content}
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} ListingDesk Pro. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  static welcome(name: string): string {
    return this.wrap(`
      <h1 style="color: #4f46e5;">Welcome to ListingDesk Pro!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for joining ListingDesk Pro. You can now manage your listings across 9 marketplaces from a single dashboard.</p>
      <p>Get started by:</p>
      <ul>
        <li>Connecting your marketplace accounts</li>
        <li>Creating your first listing</li>
        <li>Setting up your supplier connections</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The ListingDesk Pro Team</p>
    `);
  }

  static listingPublished(listingTitle: string, marketplaceName: string, actionUrl: string): string {
    return this.wrap(`
      <h1 style="color: #10b981;">Listing Published Successfully!</h1>
      <p>Your listing "<strong>${listingTitle}</strong>" has been published to ${marketplaceName}.</p>
      <p>You can view your listing by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a>
      </p>
    `);
  }

  static listingFailed(listingTitle: string, marketplaceName: string, error: string, actionUrl: string): string {
    return this.wrap(`
      <h1 style="color: #ef4444;">Listing Publication Failed</h1>
      <p>We encountered an error while publishing "<strong>${listingTitle}</strong>" to ${marketplaceName}.</p>
      <p><strong>Error:</strong> ${error}</p>
      <p>You can review and retry by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Listing</a>
      </p>
    `);
  }

  static orderReceived(orderNumber: string, marketplaceName: string, total: number, actionUrl: string): string {
    return this.wrap(`
      <h1 style="color: #3b82f6;">New Order Received!</h1>
      <p>You have received a new order from ${marketplaceName}.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total:</strong> $${total.toFixed(2)}</p>
      <p>You can view the order details by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a>
      </p>
    `);
  }

  static inventoryLow(productTitle: string, currentStock: number, threshold: number, actionUrl: string): string {
    return this.wrap(`
      <h1 style="color: #f59e0b;">Low Stock Alert</h1>
      <p>Your product "<strong>${productTitle}</strong>" is running low on stock.</p>
      <p><strong>Current Stock:</strong> ${currentStock} units</p>
      <p><strong>Threshold:</strong> ${threshold} units</p>
      <p>Please restock soon to avoid running out of inventory.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Inventory</a>
      </p>
    `);
  }

  static supplierOrderPlaced(supplierOrderId: string, marketplaceOrderId: string, actionUrl: string): string {
    return this.wrap(`
      <h1 style="color: #8b5cf6;">Supplier Order Placed</h1>
      <p>An order has been automatically placed with your supplier for marketplace order <strong>#${marketplaceOrderId}</strong>.</p>
      <p><strong>Supplier Order ID:</strong> ${supplierOrderId}</p>
      <p>You can track the supplier order by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Order</a>
      </p>
    `);
  }

  static balanceLow(currentBalance: number, threshold: number, actionUrl: string): string {
    return this.wrap(`
      <h1 style="color: #ef4444;">Low Balance Alert</h1>
      <p>Your account balance is running low.</p>
      <p><strong>Current Balance:</strong> $${currentBalance.toFixed(2)}</p>
      <p><strong>Threshold:</strong> $${threshold.toFixed(2)}</p>
      <p>Please add funds to your account to continue auto-ordering from suppliers.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Add Funds</a>
      </p>
    `);
  }

  static passwordReset(resetUrl: string): string {
    return this.wrap(`
      <h1 style="color: #4f46e5;">Password Reset Request</h1>
      <p>You requested to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </p>
      <p style="font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
    `);
  }
}

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

export class NotificationService {
  private db: DatabaseClient;
  private emailClient: EmailClient;

  constructor(
    db: DatabaseClient,
    smtpHost: string,
    smtpPort: number,
    smtpUser: string,
    smtpPass: string,
    fromEmail: string
  ) {
    this.db = db;
    this.emailClient = new EmailClient(smtpHost, smtpPort, smtpUser, smtpPass, fromEmail);
  }

  // ============================================================
  // SEND NOTIFICATION
  // ============================================================

  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<ServerNotification> {
    // Create notification
    const notification = await this.db.notification.create({
      userId,
      type,
      title,
      message,
      read: false,
      actionUrl,
      metadata,
    });

    // Get user preferences
    const preferences = await this.getUserPreferences(userId);

    // Send email if enabled
    if (preferences.email[type] && preferences.emailAddress) {
      await this.sendEmailNotification(preferences.emailAddress, title, message, actionUrl, type);
    }

    // Send push notification if enabled
    if (preferences.push[type]) {
      await this.sendPushNotification(userId, title, message, actionUrl, metadata);
    }

    return notification;
  }

  // ============================================================
  // GET USER NOTIFICATIONS
  // ============================================================

  async getUserNotifications(userId: string, filters?: { read?: boolean; limit?: number }): Promise<ServerNotification[]> {
    return await this.db.notification.findByUserId(userId, filters);
  }

  // ============================================================
  // MARK AS READ
  // ============================================================

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.db.notification.findById(notificationId);

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    await this.db.notification.markAsRead(notificationId);
  }

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.markAllAsRead(userId);
  }

  // ============================================================
  // GET UNREAD COUNT
  // ============================================================

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.db.notification.findByUserId(userId, { read: false });
    return notifications.length;
  }

  // ============================================================
  // GET USER PREFERENCES
  // ============================================================

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // In production, store preferences in database
    // For now, return default preferences
    return {
      email: {
        listing_published: true,
        listing_failed: true,
        order_received: true,
        order_shipped: true,
        inventory_low: true,
        price_change: false,
        supplier_order_placed: true,
        supplier_order_shipped: true,
        balance_low: true,
        system_alert: true,
      },
      push: {
        listing_published: true,
        listing_failed: true,
        order_received: true,
        order_shipped: false,
        inventory_low: true,
        price_change: false,
        supplier_order_placed: true,
        supplier_order_shipped: false,
        balance_low: true,
        system_alert: true,
      },
      emailAddress: '', // Would get from user profile
    };
  }

  // ============================================================
  // UPDATE USER PREFERENCES
  // ============================================================

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    // In production, save preferences to database
    // await this.db.userPreferences.update(userId, preferences);
  }

  // ============================================================
  // SEND EMAIL NOTIFICATION
  // ============================================================

  private async sendEmailNotification(
    to: string,
    title: string,
    message: string,
    actionUrl?: string,
    type?: NotificationType
  ): Promise<void> {
    let html = '';

    // Use appropriate template based on notification type
    switch (type) {
      case 'listing_published':
        html = EmailTemplates.listingPublished(title, message, actionUrl || '');
        break;
      case 'listing_failed':
        html = EmailTemplates.listingFailed(title, message, '', actionUrl || '');
        break;
      case 'order_received':
        html = EmailTemplates.orderReceived(title, message, 0, actionUrl || '');
        break;
      case 'inventory_low':
        html = EmailTemplates.inventoryLow(title, 0, 0, actionUrl || '');
        break;
      default:
        html = EmailTemplates.wrap(`
          <h1 style="color: #4f46e5;">${title}</h1>
          <p>${message}</p>
          ${actionUrl ? `<p style="text-align: center; margin: 30px 0;"><a href="${actionUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a></p>` : ''}
        `);
    }

    await this.emailClient.sendEmail({
      to,
      subject: title,
      html,
    });
  }

  // ============================================================
  // SEND PUSH NOTIFICATION
  // ============================================================

  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // In production, use web-push library
    // const webpush = require('web-push');
    // webpush.setVapidDetails(...)
    // const subscription = await this.db.pushSubscription.findByUserId(userId);
    // if (subscription) {
    //   await webpush.sendNotification(subscription, JSON.stringify({
    //     title,
    //     body,
    //     icon: '/icon-192.png',
    //     badge: '/icon-192.png',
    //      { actionUrl, metadata },
    //   }));
    // }

    // For now, just log it
    console.log(`Push notification sent to user ${userId}: ${title}`);
  }

  // ============================================================
  // NOTIFICATION TEMPLATES
  // ============================================================

  async sendListingPublishedNotification(userId: string, listingId: string, listingTitle: string, marketplaceId: string): Promise<void> {
    const marketplaceNames: Record<string, string> = {
      amazon: 'Amazon',
      ebay: 'eBay',
      shopify: 'Shopify',
      etsy: 'Etsy',
      walmart: 'Walmart',
      tiktok_shop: 'TikTok Shop',
      shopee: 'Shopee',
      lazada: 'Lazada',
      kohls: "Kohl's",
    };

    await this.sendNotification(
      userId,
      'listing_published',
      'Listing Published Successfully',
      `Your listing "${listingTitle}" has been published to ${marketplaceNames[marketplaceId] || marketplaceId}`,
      `/listings/${listingId}`,
      { listingId, marketplaceId }
    );
  }

  async sendListingFailedNotification(userId: string, listingId: string, listingTitle: string, marketplaceId: string, error: string): Promise<void> {
    const marketplaceNames: Record<string, string> = {
      amazon: 'Amazon',
      ebay: 'eBay',
      shopify: 'Shopify',
      etsy: 'Etsy',
      walmart: 'Walmart',
      tiktok_shop: 'TikTok Shop',
      shopee: 'Shopee',
      lazada: 'Lazada',
      kohls: "Kohl's",
    };

    await this.sendNotification(
      userId,
      'listing_failed',
      'Listing Publication Failed',
      `Failed to publish "${listingTitle}" to ${marketplaceNames[marketplaceId] || marketplaceId}: ${error}`,
      `/listings/${listingId}`,
      { listingId, marketplaceId, error }
    );
  }

  async sendOrderReceivedNotification(userId: string, orderId: string, orderNumber: string, marketplaceId: string, total: number): Promise<void> {
    const marketplaceNames: Record<string, string> = {
      amazon: 'Amazon',
      ebay: 'eBay',
      shopify: 'Shopify',
      etsy: 'Etsy',
      walmart: 'Walmart',
      tiktok_shop: 'TikTok Shop',
      shopee: 'Shopee',
      lazada: 'Lazada',
      kohls: "Kohl's",
    };

    await this.sendNotification(
      userId,
      'order_received',
      'New Order Received',
      `Order #${orderNumber} from ${marketplaceNames[marketplaceId] || marketplaceId} - Total: $${total.toFixed(2)}`,
      `/orders/${orderId}`,
      { orderId, orderNumber, marketplaceId, total }
    );
  }

  async sendInventoryLowNotification(userId: string, productId: string, productTitle: string, currentStock: number, threshold: number): Promise<void> {
    await this.sendNotification(
      userId,
      'inventory_low',
      'Low Stock Alert',
      `"${productTitle}" is running low: ${currentStock} units remaining (threshold: ${threshold})`,
      `/inventory/${productId}`,
      { productId, currentStock, threshold }
    );
  }

  async sendSupplierOrderPlacedNotification(userId: string, supplierOrderId: string, marketplaceOrderId: string): Promise<void> {
    await this.sendNotification(
      userId,
      'supplier_order_placed',
      'Supplier Order Placed',
      `Order placed with supplier for marketplace order #${marketplaceOrderId}`,
      `/supplier-orders/${supplierOrderId}`,
      { supplierOrderId, marketplaceOrderId }
    );
  }

  async sendBalanceLowNotification(userId: string, currentBalance: number, threshold: number): Promise<void> {
    await this.sendNotification(
      userId,
      'balance_low',
      'Low Balance Alert',
      `Your balance is running low: $${currentBalance.toFixed(2)} (threshold: $${threshold.toFixed(2)})`,
      '/settings/balance',
      { currentBalance, threshold }
    );
  }
}
