// ============================================================
// ListingDesk Pro — Stock History & Audit Trail Service
// Tracks all inventory changes with full audit trail
// ============================================================

import type { MarketplaceId } from '../../types';
import { auditLog, AuditEventType } from '../audit';

export interface StockHistoryEntry {
  id: string;
  listingId: string;
  variantId?: string;
  marketplaceId?: MarketplaceId;
  previousQuantity: number;
  newQuantity: number;
  change: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'sync' | 'return' | 'cancel' | 'manual';
  orderId?: string;
  userId?: string;
  timestamp: string;
  notes?: string;
}

// In-memory storage (in production, use database)
const stockHistory: StockHistoryEntry[] = [];

// ============================================================
// Record Stock Changes
// ============================================================

export function recordStockChange(
  listingId: string,
  previousQuantity: number,
  newQuantity: number,
  reason: StockHistoryEntry['reason'],
  options?: {
    variantId?: string;
    marketplaceId?: MarketplaceId;
    orderId?: string;
    userId?: string;
    notes?: string;
  }
): StockHistoryEntry {
  const entry: StockHistoryEntry = {
    id: `stock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    previousQuantity,
    newQuantity,
    change: newQuantity - previousQuantity,
    reason,
    variantId: options?.variantId,
    marketplaceId: options?.marketplaceId,
    orderId: options?.orderId,
    userId: options?.userId,
    timestamp: new Date().toISOString(),
    notes: options?.notes,
  };

  stockHistory.unshift(entry);

  // Keep only last 10000 entries per listing (in production, use database)
  const listingEntries = stockHistory.filter((e) => e.listingId === listingId);
  if (listingEntries.length > 10000) {
    const toRemove = listingEntries.slice(-1000);
    toRemove.forEach((e) => {
      const index = stockHistory.indexOf(e);
      if (index !== -1) stockHistory.splice(index, 1);
    });
  }

  auditLog({
    type: AuditEventType.INVENTORY_UPDATED,
    severity: 'info',
    message: `Stock changed for listing ${listingId}`,
    meta {
      listingId,
      previousQuantity,
      newQuantity,
      change: entry.change,
      reason,
      marketplaceId: options?.marketplaceId,
    },
  });

  return entry;
}

// ============================================================
// Query Stock History
// ============================================================

export function getStockHistory(
  listingId: string,
  options?: {
    variantId?: string;
    marketplaceId?: MarketplaceId;
    from?: string;
    to?: string;
    limit?: number;
  }
): StockHistoryEntry[] {
  let entries = stockHistory.filter((e) => e.listingId === listingId);

  if (options?.variantId) {
    entries = entries.filter((e) => e.variantId === options.variantId);
  }

  if (options?.marketplaceId) {
    entries = entries.filter((e) => e.marketplaceId === options.marketplaceId);
  }

  if (options?.from) {
    entries = entries.filter((e) => e.timestamp >= options.from!);
  }

  if (options?.to) {
    entries = entries.filter((e) => e.timestamp <= options.to!);
  }

  if (options?.limit) {
    entries = entries.slice(0, options.limit);
  }

  return entries;
}

export function getStockHistorySummary(listingId: string): {
  totalChanges: number;
  totalIncrease: number;
  totalDecrease: number;
  lastChange?: string;
  averageDailyChange: number;
} {
  const entries = stockHistory.filter((e) => e.listingId === listingId);

  const totalIncrease = entries
    .filter((e) => e.change > 0)
    .reduce((sum, e) => sum + e.change, 0);

  const totalDecrease = Math.abs(
    entries
      .filter((e) => e.change < 0)
      .reduce((sum, e) => sum + e.change, 0)
  );

  // Calculate average daily change (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentEntries = entries.filter((e) => e.timestamp >= thirtyDaysAgo);
  const recentChange = recentEntries.reduce((sum, e) => sum + e.change, 0);
  const averageDailyChange = recentChange / 30;

  return {
    totalChanges: entries.length,
    totalIncrease,
    totalDecrease,
    lastChange: entries[0]?.timestamp,
    averageDailyChange,
  };
}

// ============================================================
// Stock Forecasting
// ============================================================

export function forecastStockDepletion(
  listingId: string,
  currentStock: number
): {
  daysUntilDepletion: number | null;
  confidence: 'high' | 'medium' | 'low';
  recommendedReorderDate: string | null;
} {
  const summary = getStockHistorySummary(listingId);

  if (summary.averageDailyChange >= 0) {
    // Stock is increasing or stable, no depletion expected
    return {
      daysUntilDepletion: null,
      confidence: 'high',
      recommendedReorderDate: null,
    };
  }

  const dailyDepletion = Math.abs(summary.averageDailyChange);
  const daysUntilDepletion = Math.floor(currentStock / dailyDepletion);

  // Calculate confidence based on data quality
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (summary.totalChanges >= 30) {
    confidence = 'high';
  } else if (summary.totalChanges >= 10) {
    confidence = 'medium';
  }

  // Recommend reorder 7 days before depletion
  const reorderDays = Math.max(0, daysUntilDepletion - 7);
  const recommendedReorderDate = new Date(
    Date.now() + reorderDays * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    daysUntilDepletion,
    confidence,
    recommendedReorderDate,
  };
}

// ============================================================
// Reorder Point Suggestions
// ============================================================

export function calculateReorderPoint(
  listingId: string,
  leadTimeDays: number = 7,
  safetyStockDays: number = 3
): {
  reorderPoint: number;
  averageDailySales: number;
  leadTimeDemand: number;
  safetyStock: number;
} {
  const summary = getStockHistorySummary(listingId);
  const averageDailySales = Math.abs(summary.averageDailyChange);

  const leadTimeDemand = averageDailySales * leadTimeDays;
  const safetyStock = averageDailySales * safetyStockDays;
  const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);

  return {
    reorderPoint,
    averageDailySales,
    leadTimeDemand,
    safetyStock,
  };
}

// ============================================================
// Low Stock Alerts
// ============================================================

export interface LowStockAlert {
  listingId: string;
  currentStock: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export function checkLowStock(
  listingId: string,
  currentStock: number,
  threshold: number
): LowStockAlert | null {
  if (currentStock > threshold) {
    return null;
  }

  let severity: LowStockAlert['severity'] = 'low';
  if (currentStock <= threshold * 0.25) {
    severity = 'critical';
  } else if (currentStock <= threshold * 0.5) {
    severity = 'high';
  } else if (currentStock <= threshold * 0.75) {
    severity = 'medium';
  }

  const forecast = forecastStockDepletion(listingId, currentStock);

  return {
    listingId,
    currentStock,
    threshold,
    severity,
    message: `Low stock alert: ${currentStock} units remaining (threshold: ${threshold}). ${
      forecast.daysUntilDepletion
        ? `Estimated depletion in ${forecast.daysUntilDepletion} days.`
        : ''
    }`,
    timestamp: new Date().toISOString(),
  };
}

export function getAllLowStockAlerts(
  listings: Array<{ id: string; inventory: { totalQuantity: number; lowStockThreshold: number } }>
): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];

  listings.forEach((listing) => {
    const alert = checkLowStock(
      listing.id,
      listing.inventory.totalQuantity,
      listing.inventory.lowStockThreshold
    );
    if (alert) {
      alerts.push(alert);
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ============================================================
// Multi-Warehouse Support
// ============================================================

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isDefault: boolean;
}

export interface WarehouseInventory {
  warehouseId: string;
  listingId: string;
  variantId?: string;
  quantity: number;
  reserved: number;
  available: number;
}

const warehouses: Warehouse[] = [
  {
    id: 'wh_main',
    name: 'Main Warehouse',
    location: 'New York, USA',
    isDefault: true,
  },
];

const warehouseInventory: WarehouseInventory[] = [];

export function createWarehouse(name: string, location: string): Warehouse {
  const warehouse: Warehouse = {
    id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name,
    location,
    isDefault: warehouses.length === 0,
  };

  warehouses.push(warehouse);
  return warehouse;
}

export function getWarehouses(): Warehouse[] {
  return [...warehouses];
}

export function setWarehouseInventory(
  warehouseId: string,
  listingId: string,
  quantity: number,
  variantId?: string
): WarehouseInventory {
  const existing = warehouseInventory.find(
    (w) => w.warehouseId === warehouseId && w.listingId === listingId && w.variantId === variantId
  );

  if (existing) {
    existing.quantity = quantity;
    existing.available = quantity - existing.reserved;
    return existing;
  }

  const inventory: WarehouseInventory = {
    warehouseId,
    listingId,
    variantId,
    quantity,
    reserved: 0,
    available: quantity,
  };

  warehouseInventory.push(inventory);
  return inventory;
}

export function getWarehouseInventory(
  listingId: string,
  variantId?: string
): WarehouseInventory[] {
  return warehouseInventory.filter(
    (w) => w.listingId === listingId && w.variantId === variantId
  );
}

export function getTotalInventoryAcrossWarehouses(
  listingId: string,
  variantId?: string
): number {
  return warehouseInventory
    .filter((w) => w.listingId === listingId && w.variantId === variantId)
    .reduce((sum, w) => sum + w.available, 0);
}
