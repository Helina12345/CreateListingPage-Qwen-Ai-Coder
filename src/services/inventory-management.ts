// ============================================================
// ListingDesk Pro — Inventory Management Service
// Multi-location inventory, safety stock, reorder points
// ============================================================

export interface Warehouse {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  type: 'primary' | 'secondary' | '3pl' | 'dropship';
  capacity?: number;
  manager?: string;
}

export interface InventoryLevel {
  productId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: Date;
}

export interface SafetyStockConfig {
  productId: string;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  autoReorder: boolean;
}

export interface BackorderConfig {
  productId: string;
  allowBackorders: boolean;
  maxBackorderQuantity?: number;
  estimatedRestockDate?: Date;
  notifyCustomer: boolean;
}

export class InventoryManagementService {
  private warehouses: Warehouse[] = [];
  private inventoryLevels: Map<string, InventoryLevel> = new Map();
  private safetyStockConfigs: Map<string, SafetyStockConfig> = new Map();
  private backorderConfigs: Map<string, BackorderConfig> = new Map();

  // ============================================================
  // WAREHOUSE MANAGEMENT
  // ============================================================

  addWarehouse(warehouse: Omit<Warehouse, 'id'>): Warehouse {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.warehouses.push(newWarehouse);
    return newWarehouse;
  }

  getWarehouses(): Warehouse[] {
    return this.warehouses;
  }

  getWarehouseById(warehouseId: string): Warehouse | undefined {
    return this.warehouses.find((w) => w.id === warehouseId);
  }

  updateWarehouse(warehouseId: string, updates: Partial<Warehouse>): Warehouse | null {
    const warehouse = this.warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) return null;

    Object.assign(warehouse, updates);
    return warehouse;
  }

  deleteWarehouse(warehouseId: string): boolean {
    const index = this.warehouses.findIndex((w) => w.id === warehouseId);
    if (index === -1) return false;

    this.warehouses.splice(index, 1);

    // Remove all inventory levels for this warehouse
    for (const [key, level] of this.inventoryLevels.entries()) {
      if (level.warehouseId === warehouseId) {
        this.inventoryLevels.delete(key);
      }
    }

    return true;
  }

  // ============================================================
  // INVENTORY LEVELS
  // ============================================================

  setInventoryLevel(
    productId: string,
    warehouseId: string,
    quantity: number,
    reserved: number = 0
  ): InventoryLevel {
    const key = `${productId}_${warehouseId}`;
    const level: InventoryLevel = {
      productId,
      warehouseId,
      quantity,
      reserved,
      available: quantity - reserved,
      lastUpdated: new Date(),
    };

    this.inventoryLevels.set(key, level);
    return level;
  }

  getInventoryLevel(productId: string, warehouseId: string): InventoryLevel | undefined {
    const key = `${productId}_${warehouseId}`;
    return this.inventoryLevels.get(key);
  }

  getProductInventory(productId: string): InventoryLevel[] {
    const levels: InventoryLevel[] = [];
    for (const [key, level] of this.inventoryLevels.entries()) {
      if (level.productId === productId) {
        levels.push(level);
      }
    }
    return levels;
  }

  getWarehouseInventory(warehouseId: string): InventoryLevel[] {
    const levels: InventoryLevel[] = [];
    for (const [key, level] of this.inventoryLevels.entries()) {
      if (level.warehouseId === warehouseId) {
        levels.push(level);
      }
    }
    return levels;
  }

  getTotalProductQuantity(productId: string): number {
    const levels = this.getProductInventory(productId);
    return levels.reduce((sum, level) => sum + level.available, 0);
  }

  adjustInventory(
    productId: string,
    warehouseId: string,
    adjustment: number,
    reason: string
  ): InventoryLevel | null {
    const level = this.getInventoryLevel(productId, warehouseId);
    if (!level) return null;

    level.quantity += adjustment;
    level.available = level.quantity - level.reserved;
    level.lastUpdated = new Date();

    return level;
  }

  reserveInventory(productId: string, warehouseId: string, quantity: number): boolean {
    const level = this.getInventoryLevel(productId, warehouseId);
    if (!level || level.available < quantity) return false;

    level.reserved += quantity;
    level.available = level.quantity - level.reserved;
    level.lastUpdated = new Date();

    return true;
  }

  releaseReservation(productId: string, warehouseId: string, quantity: number): boolean {
    const level = this.getInventoryLevel(productId, warehouseId);
    if (!level || level.reserved < quantity) return false;

    level.reserved -= quantity;
    level.available = level.quantity - level.reserved;
    level.lastUpdated = new Date();

    return true;
  }

  // ============================================================
  // SAFETY STOCK CONFIGURATION
  // ============================================================

  setSafetyStockConfig(config: SafetyStockConfig): void {
    this.safetyStockConfigs.set(config.productId, config);
  }

  getSafetyStockConfig(productId: string): SafetyStockConfig | undefined {
    return this.safetyStockConfigs.get(productId);
  }

  checkLowStock(productId: string): {
    isLow: boolean;
    currentQuantity: number;
    safetyStock: number;
    reorderPoint: number;
  } {
    const config = this.getSafetyStockConfig(productId);
    if (!config) {
      return {
        isLow: false,
        currentQuantity: this.getTotalProductQuantity(productId),
        safetyStock: 0,
        reorderPoint: 0,
      };
    }

    const currentQuantity = this.getTotalProductQuantity(productId);
    const isLow = currentQuantity <= config.reorderPoint;

    return {
      isLow,
      currentQuantity,
      safetyStock: config.safetyStock,
      reorderPoint: config.reorderPoint,
    };
  }

  getLowStockProducts(): Array<{
    productId: string;
    currentQuantity: number;
    safetyStock: number;
    reorderPoint: number;
  }> {
    const lowStockProducts: Array<{
      productId: string;
      currentQuantity: number;
      safetyStock: number;
      reorderPoint: number;
    }> = [];

    for (const [productId, config] of this.safetyStockConfigs.entries()) {
      const check = this.checkLowStock(productId);
      if (check.isLow) {
        lowStockProducts.push({
          productId,
          currentQuantity: check.currentQuantity,
          safetyStock: config.safetyStock,
          reorderPoint: config.reorderPoint,
        });
      }
    }

    return lowStockProducts;
  }

  // ============================================================
  // REORDER POINTS
  // ============================================================

  calculateReorderPoint(
    productId: string,
    averageDailySales: number,
    leadTimeDays: number,
    safetyStock: number
  ): number {
    return (averageDailySales * leadTimeDays) + safetyStock;
  }

  calculateEconomicOrderQuantity(
    annualDemand: number,
    orderCost: number,
    holdingCostPerUnit: number
  ): number {
    // EOQ = sqrt((2 * D * S) / H)
    // D = annual demand
    // S = order cost
    // H = holding cost per unit per year
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
  }

  getProductsNeedingReorder(): Array<{
    productId: string;
    currentQuantity: number;
    reorderPoint: number;
    reorderQuantity: number;
    leadTimeDays: number;
  }> {
    const productsNeedingReorder: Array<{
      productId: string;
      currentQuantity: number;
      reorderPoint: number;
      reorderQuantity: number;
      leadTimeDays: number;
    }> = [];

    for (const [productId, config] of this.safetyStockConfigs.entries()) {
      if (config.autoReorder) {
        const check = this.checkLowStock(productId);
        if (check.isLow) {
          productsNeedingReorder.push({
            productId,
            currentQuantity: check.currentQuantity,
            reorderPoint: config.reorderPoint,
            reorderQuantity: config.reorderQuantity,
            leadTimeDays: config.leadTimeDays,
          });
        }
      }
    }

    return productsNeedingReorder;
  }

  // ============================================================
  // BACKORDER MANAGEMENT
  // ============================================================

  setBackorderConfig(config: BackorderConfig): void {
    this.backorderConfigs.set(config.productId, config);
  }

  getBackorderConfig(productId: string): BackorderConfig | undefined {
    return this.backorderConfigs.get(productId);
  }

  canBackorder(productId: string, quantity: number): {
    allowed: boolean;
    reason?: string;
    estimatedRestockDate?: Date;
  } {
    const config = this.getBackorderConfig(productId);
    if (!config || !config.allowBackorders) {
      return {
        allowed: false,
        reason: 'Backorders not allowed for this product',
      };
    }

    if (config.maxBackorderQuantity && quantity > config.maxBackorderQuantity) {
      return {
        allowed: false,
        reason: `Maximum backorder quantity is ${config.maxBackorderQuantity}`,
      };
    }

    return {
      allowed: true,
      estimatedRestockDate: config.estimatedRestockDate,
    };
  }

  // ============================================================
  // DROPSHIP CONFIGURATION
  // ============================================================

  configureDropship(
    productId: string,
    supplierId: string,
    options: {
      autoOrder: boolean;
      notifySupplier: boolean;
      trackingSync: boolean;
    }
  ): void {
    // In production, save to database
    console.log(`Configured dropship for product ${productId} with supplier ${supplierId}`, options);
  }

  // ============================================================
  // FULFILLMENT METHOD
  // ============================================================

  getFulfillmentMethod(productId: string): 'self' | '3pl' | 'fba' | 'wfs' | 'dropship' {
    // In production, determine based on product configuration
    // For now, return default
    return 'self';
  }

  // ============================================================
  // INVENTORY TRANSFERS
  // ============================================================

  async transferInventory(
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number
  ): Promise<{
    success: boolean;
    transferId: string;
    message: string;
  }> {
    const fromLevel = this.getInventoryLevel(productId, fromWarehouseId);
    if (!fromLevel || fromLevel.available < quantity) {
      return {
        success: false,
        transferId: '',
        message: 'Insufficient inventory in source warehouse',
      };
    }

    // Adjust source warehouse
    this.adjustInventory(productId, fromWarehouseId, -quantity, 'transfer_out');

    // Adjust destination warehouse
    const toLevel = this.getInventoryLevel(productId, toWarehouseId);
    if (toLevel) {
      this.adjustInventory(productId, toWarehouseId, quantity, 'transfer_in');
    } else {
      this.setInventoryLevel(productId, toWarehouseId, quantity, 0);
    }

    return {
      success: true,
      transferId: `transfer_${Date.now()}`,
      message: `Transferred ${quantity} units from ${fromWarehouseId} to ${toWarehouseId}`,
    };
  }

  // ============================================================
  // INVENTORY VALUATION
  // ============================================================

  calculateInventoryValue(
    productId: string,
    costPerUnit: number
  ): {
    totalQuantity: number;
    totalValue: number;
    byWarehouse: Array<{
      warehouseId: string;
      warehouseName: string;
      quantity: number;
      value: number;
    }>;
  } {
    const levels = this.getProductInventory(productId);
    const totalQuantity = levels.reduce((sum, level) => sum + level.available, 0);
    const totalValue = totalQuantity * costPerUnit;

    const byWarehouse = levels.map((level) => {
      const warehouse = this.getWarehouseById(level.warehouseId);
      return {
        warehouseId: level.warehouseId,
        warehouseName: warehouse?.name || 'Unknown',
        quantity: level.available,
        value: level.available * costPerUnit,
      };
    });

    return {
      totalQuantity,
      totalValue,
      byWarehouse,
    };
  }

  // ============================================================
  // INVENTORY TURNOVER
  // ============================================================

  calculateInventoryTurnover(
    productId: string,
    costOfGoodsSold: number,
    period: 'month' | 'quarter' | 'year' = 'year'
  ): number {
    const levels = this.getProductInventory(productId);
    const averageInventory = levels.reduce((sum, level) => sum + level.quantity, 0) / levels.length;

    if (averageInventory === 0) return 0;

    return costOfGoodsSold / averageInventory;
  }

  // ============================================================
  // STOCK ALERTS
  // ============================================================

  getStockAlerts(): Array<{
    type: 'low_stock' | 'out_of_stock' | 'overstock' | 'slow_moving';
    productId: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const alerts: Array<{
      type: 'low_stock' | 'out_of_stock' | 'overstock' | 'slow_moving';
      productId: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Check for low stock
    const lowStockProducts = this.getLowStockProducts();
    for (const product of lowStockProducts) {
      alerts.push({
        type: 'low_stock',
        productId: product.productId,
        message: `Product ${product.productId} is low on stock (${product.currentQuantity} units)`,
        severity: product.currentQuantity === 0 ? 'high' : 'medium',
      });
    }

    // Check for out of stock
    for (const [productId] of this.safetyStockConfigs.entries()) {
      const totalQuantity = this.getTotalProductQuantity(productId);
      if (totalQuantity === 0) {
        alerts.push({
          type: 'out_of_stock',
          productId,
          message: `Product ${productId} is out of stock`,
          severity: 'high',
        });
      }
    }

    return alerts;
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createInventoryManagementService(): InventoryManagementService {
  return new InventoryManagementService();
}
