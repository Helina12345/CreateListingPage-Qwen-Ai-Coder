// ============================================================
// ListingDesk Pro — Notification Service
// Email, push notifications, and preference management
// ============================================================

// ============================================================
// Types
// ============================================================
export type NotificationType =
  | 'listing_published'
  | 'listing_failed'
  | 'order_received'
  | 'order_shipped'
  | 'inventory_low'
  | 'price_change'
  | 'system_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  email: {
    listing_published: boolean;
    listing_failed: boolean;
    order_received: boolean;
    order_shipped: boolean;
    inventory_low: boolean;
    price_change: boolean;
    system_alert: boolean;
  };
  push: {
    listing_published: boolean;
    listing_failed: boolean;
    order_received: boolean;
    order_shipped: boolean;
    inventory_low: boolean;
    price_change: boolean;
    system_alert: boolean;
  };
  emailAddress: string;
}

// ============================================================
// Notification Storage
// ============================================================
const notifications: Notification[] = [];
let preferences: NotificationPreferences = {
  email: {
    listing_published: true,
    listing_failed: true,
    order_received: true,
    order_shipped: true,
    inventory_low: true,
    price_change: false,
    system_alert: true,
  },
  push: {
    listing_published: true,
    listing_failed: true,
    order_received: true,
    order_shipped: false,
    inventory_low: true,
    price_change: false,
    system_alert: true,
  },
  emailAddress: '',
};

// ============================================================
// Create Notification
// ============================================================
export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
): Notification {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    data,
  };

  notifications.unshift(notification);

  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.pop();
  }

  // Send based on preferences
  if (preferences.push[type]) {
    sendPushNotification(notification);
  }

  if (preferences.email[type] && preferences.emailAddress) {
    sendEmailNotification(notification, preferences.emailAddress);
  }

  return notification;
}

// ============================================================
// Get Notifications
// ============================================================
export function getNotifications(options?: {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
}): Notification[] {
  let result = [...notifications];

  if (options?.unreadOnly) {
    result = result.filter((n) => !n.read);
  }

  if (options?.type) {
    result = result.filter((n) => n.type === options.type);
  }

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}

// ============================================================
// Mark as Read
// ============================================================
export function markAsRead(notificationId: string): void {
  const notification = notifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
}

export function markAllAsRead(): void {
  notifications.forEach((n) => (n.read = true));
}

// ============================================================
// Delete Notification
// ============================================================
export function deleteNotification(notificationId: string): void {
  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    notifications.splice(index, 1);
  }
}

// ============================================================
// Preferences Management
// ============================================================
export function getNotificationPreferences(): NotificationPreferences {
  return { ...preferences };
}

export function updateNotificationPreferences(
  newPreferences: Partial<NotificationPreferences>
): void {
  preferences = { ...preferences, ...newPreferences };
}

export function updateEmailPreference(
  type: NotificationType,
  enabled: boolean
): void {
  preferences.email[type] = enabled;
}

export function updatePushPreference(
  type: NotificationType,
  enabled: boolean
): void {
  preferences.push[type] = enabled;
}

// ============================================================
// Email Notification (Real Implementation)
// ============================================================
async function sendEmailNotification(
  notification: Notification,
  email: string
): Promise<void> {
  // In production, this would call your backend API which uses:
  // - Nodemailer for SMTP
  // - SendGrid API
  // - AWS SES
  // - Mailgun API

  try {
    // Simulate API call to backend
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">${notification.title}</h2>
            <p>${notification.message}</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Sent at: ${new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
        `,
        notificationType: notification.type,
         notification.data,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

// ============================================================
// Push Notification (Real Implementation)
// ============================================================
async function sendPushNotification(notification: Notification): Promise<void> {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return;
  }

  // Request permission if not granted
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }
  }

  // Don't show if permission denied
  if (Notification.permission === 'denied') {
    return;
  }

  // Show notification
  try {
    const pushNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: notification.id,
       notification.data,
      requireInteraction: notification.type === 'listing_failed' || notification.type === 'system_alert',
    });

    pushNotification.onclick = () => {
      window.focus();
      markAsRead(notification.id);

      // Navigate to relevant page based on notification type
      if (notification.data?.listingId) {
        window.location.href = `/listings/${notification.data.listingId}`;
      } else if (notification.data?.orderId) {
        window.location.href = `/orders/${notification.data.orderId}`;
      }

      pushNotification.close();
    };
  } catch (error) {
    console.error('Error showing push notification:', error);
  }
}

// ============================================================
// Request Push Permission
// ============================================================
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// ============================================================
// Service Worker Registration for Push Notifications
// ============================================================
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// ============================================================
// Subscribe to Push Notifications
// ============================================================
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // In production, use your VAPID public key
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-v2s27P-3xKqvxMQ9gkZqG7yZw-T1lJXC7oKqU'
      ) as BufferSource,
    });

    // Send subscription to backend
    await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// ============================================================
// Helper Functions
// ============================================================
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ============================================================
// Notification Templates
// ============================================================
export function createListingPublishedNotification(
  listingId: string,
  listingTitle: string,
  marketplaceIds: string[]
): Notification {
  return createNotification(
    'listing_published',
    'Listing Published Successfully',
    `"${listingTitle}" has been published to ${marketplaceIds.length} marketplace${
      marketplaceIds.length > 1 ? 's' : ''
    }: ${marketplaceIds.join(', ')}`,
    { listingId, marketplaceIds }
  );
}

export function createListingFailedNotification(
  listingId: string,
  listingTitle: string,
  marketplaceId: string,
  error: string
): Notification {
  return createNotification(
    'listing_failed',
    'Listing Publication Failed',
    `Failed to publish "${listingTitle}" to ${marketplaceId}: ${error}`,
    { listingId, marketplaceId, error }
  );
}

export function createOrderReceivedNotification(
  orderId: string,
  orderNumber: string,
  marketplaceId: string,
  total: number
): Notification {
  return createNotification(
    'order_received',
    'New Order Received',
    `Order #${orderNumber} from ${marketplaceId} - Total: $${total.toFixed(2)}`,
    { orderId, orderNumber, marketplaceId, total }
  );
}

export function createInventoryLowNotification(
  listingId: string,
  listingTitle: string,
  currentStock: number,
  threshold: number
): Notification {
  return createNotification(
    'inventory_low',
    'Low Inventory Alert',
    `"${listingTitle}" is running low: ${currentStock} units remaining (threshold: ${threshold})`,
    { listingId, currentStock, threshold }
  );
}
