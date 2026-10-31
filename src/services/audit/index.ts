// ============================================================
// ListingDesk Pro — Audit and Logging Service
// Comprehensive audit trail for all publishing events
// ============================================================

export enum AuditEventType {
  // Authentication
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  AUTH_FAILED = 'auth.failed',
  TOKEN_REFRESHED = 'auth.token_refreshed',

  // Marketplace Connections
  MARKETPLACE_CONNECTED = 'marketplace.connected',
  MARKETPLACE_DISCONNECTED = 'marketplace.disconnected',
  MARKETPLACE_SYNC_STARTED = 'marketplace.sync_started',
  MARKETPLACE_SYNC_COMPLETED = 'marketplace.sync_completed',
  MARKETPLACE_SYNC_FAILED = 'marketplace.sync_failed',

  // Listings
  LISTING_CREATED = 'listing.created',
  LISTING_UPDATED = 'listing.updated',
  LISTING_DELETED = 'listing.deleted',
  LISTING_DRAFT_SAVED = 'listing.draft_saved',
  LISTING_PUBLISHED = 'listing.published',
  LISTING_UNPUBLISHED = 'listing.unpublished',

  // Publishing
  PUBLISHING_BATCH_CREATED = 'publishing.batch_created',
  PUBLISHING_BATCH_COMPLETED = 'publishing.batch_completed',
  PUBLISHING_STARTED = 'publishing.started',
  PUBLISHING_COMPLETED = 'publishing.completed',
  PUBLISHING_FAILED = 'publishing.failed',
  PUBLISHING_RETRY = 'publishing.retry',

  // Inventory
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_SYNC = 'inventory.sync',
  LOW_STOCK_ALERT = 'inventory.low_stock',

  // Orders
  ORDER_RECEIVED = 'order.received',
  ORDER_UPDATED = 'order.updated',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_CANCELLED = 'order.cancelled',

  // Suppliers
  SUPPLIER_CONNECTED = 'supplier.connected',
  SUPPLIER_DISCONNECTED = 'supplier.disconnected',
  SUPPLIER_ORDER_PLACED = 'supplier.order_placed',

  // System
  ERROR_OCCURRED = 'system.error',
  API_RATE_LIMITED = 'system.rate_limited',
  VALIDATION_FAILED = 'validation.failed',
}

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  message: string;
  metadata?: Record<string, any>;
  marketplaceId?: string;
  listingId?: string;
  orderId?: string;
}

// In-memory audit log (in production, use database)
const auditEvents: AuditEvent[] = [];
const MAX_EVENTS = 10000;

// ============================================================
// Log Audit Event
// ============================================================
export function auditLog(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  const auditEvent: AuditEvent = {
    ...event,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  auditEvents.unshift(auditEvent); // Add to beginning

  // Trim old events
  if (auditEvents.length > MAX_EVENTS) {
    auditEvents.length = MAX_EVENTS;
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    const color = getSeverityColor(event.severity);
    console.log(
      `%c[AUDIT] ${event.type}%c ${event.message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;'
    );
    if (event.metadata) {
      console.log('  Meta', event.metadata);
    }
  }
}

function getSeverityColor(severity: AuditSeverity): string {
  const colors: Record<AuditSeverity, string> = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    critical: '#dc2626',
  };
  return colors[severity];
}

// ============================================================
// Query Audit Events
// ============================================================
export function getAuditEvents(filters?: {
  type?: AuditEventType;
  severity?: AuditSeverity;
  userId?: string;
  marketplaceId?: string;
  listingId?: string;
  from?: string;
  to?: string;
  limit?: number;
}): AuditEvent[] {
  let events = [...auditEvents];

  if (filters?.type) {
    events = events.filter((e) => e.type === filters.type);
  }

  if (filters?.severity) {
    events = events.filter((e) => e.severity === filters.severity);
  }

  if (filters?.userId) {
    events = events.filter((e) => e.userId === filters.userId);
  }

  if (filters?.marketplaceId) {
    events = events.filter((e) => e.marketplaceId === filters.marketplaceId);
  }

  if (filters?.listingId) {
    events = events.filter((e) => e.listingId === filters.listingId);
  }

  if (filters?.from) {
    events = events.filter((e) => e.timestamp >= filters.from!);
  }

  if (filters?.to) {
    events = events.filter((e) => e.timestamp <= filters.to!);
  }

  if (filters?.limit) {
    events = events.slice(0, filters.limit);
  }

  return events;
}

// ============================================================
// Get Error History
// ============================================================
export function getErrorHistory(limit: number = 100): AuditEvent[] {
  return getAuditEvents({
    severity: 'error',
    limit,
  });
}

// ============================================================
// Get Publishing History
// ============================================================
export function getPublishingHistory(listingId?: string, limit: number = 50): AuditEvent[] {
  const publishingTypes = [
    AuditEventType.PUBLISHING_BATCH_CREATED,
    AuditEventType.PUBLISHING_BATCH_COMPLETED,
    AuditEventType.PUBLISHING_STARTED,
    AuditEventType.PUBLISHING_COMPLETED,
    AuditEventType.PUBLISHING_FAILED,
    AuditEventType.PUBLISHING_RETRY,
    AuditEventType.LISTING_PUBLISHED,
    AuditEventType.LISTING_UNPUBLISHED,
  ];

  const events = auditEvents.filter((e) => publishingTypes.includes(e.type));

  if (listingId) {
    return events.filter((e) => e.listingId === listingId).slice(0, limit);
  }

  return events.slice(0, limit);
}

// ============================================================
// Export Audit Log
// ============================================================
export function exportAuditLog(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(auditEvents, null, 2);
  }

  // CSV format
  const headers = ['timestamp', 'type', 'severity', 'userId', 'message', 'marketplaceId', 'listingId'];
  const rows = auditEvents.map((e) => [
    e.timestamp,
    e.type,
    e.severity,
    e.userId || '',
    `"${e.message.replace(/"/g, '""')}"`,
    e.marketplaceId || '',
    e.listingId || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ============================================================
// Clear Audit Log (for testing)
// ============================================================
export function clearAuditLog(): void {
  auditEvents.length = 0;
}
