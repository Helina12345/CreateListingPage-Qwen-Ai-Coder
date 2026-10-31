// ============================================================
// ListingDesk Pro — Import/Export Service
// Complete data import/export functionality
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';

// ============================================================
// TYPES
// ============================================================

export interface ImportResult {
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeImages?: boolean;
  includeVariants?: boolean;
  marketplaceIds?: MarketplaceId[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ImportOptions {
  format: 'csv' | 'json';
  updateExisting?: boolean;
  skipValidation?: boolean;
  marketplaceId?: MarketplaceId;
}

// ============================================================
// IMPORT/EXPORT SERVICE
// ============================================================

export class ImportExportService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // EXPORT PRODUCTS
  // ============================================================

  async exportProducts(userId: string, options: ExportOptions): Promise<string> {
    const products = await this.db.product.findByUserId(userId);

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(products, options);
      case 'json':
        return this.exportToJSON(products, options);
      case 'xlsx':
        return this.exportToXLSX(products, options);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToCSV(products: any[], options: ExportOptions): string {
    const headers = [
      'ID', 'Title', 'Description', 'SKU', 'Brand', 'Condition',
      'Price', 'Quantity', 'Category', 'Tags', 'Status'
    ];

    const rows = products.map((product) => [
      product.id,
      `"${product.title.replace(/"/g, '""')}"`,
      `"${product.description.replace(/"/g, '""')}"`,
      product.sku,
      product.brand || '',
      product.condition,
      product.pricing?.basePrice || 0,
      product.inventory?.totalQuantity || 0,
      product.category || '',
      `"${(product.tags || []).join(', ')}"`,
      product.status,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private exportToJSON(products: any[], options: ExportOptions): string {
    return JSON.stringify(products, null, 2);
  }

  private exportToXLSX(products: any[], options: ExportOptions): string {
    // In production, use a library like exceljs or xlsx
    // For now, return CSV as placeholder
    return this.exportToCSV(products, options);
  }

  // ============================================================
  // EXPORT ORDERS
  // ============================================================

  async exportOrders(userId: string, options: ExportOptions): Promise<string> {
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
    });

    switch (options.format) {
      case 'csv':
        return this.exportOrdersToCSV(orders);
      case 'json':
        return JSON.stringify(orders, null, 2);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportOrdersToCSV(orders: any[]): string {
    const headers = [
      'Order ID', 'Marketplace', 'External Order ID', 'Status',
      'Buyer Name', 'Buyer Email', 'Total', 'Currency', 'Created At'
    ];

    const rows = orders.map((order) => [
      order.id,
      order.marketplaceId,
      order.externalOrderId,
      order.status,
      `"${order.buyerName}"`,
      order.buyerEmail,
      order.total,
      order.currency,
      order.createdAt.toISOString(),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  // ============================================================
  // EXPORT INVENTORY
  // ============================================================

  async exportInventory(userId: string, options: ExportOptions): Promise<string> {
    const products = await this.db.product.findByUserId(userId);
    const inventoryData = [];

    for (const product of products) {
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (inventory) {
        inventoryData.push({
          productId: product.id,
          productTitle: product.title,
          sku: product.sku,
          totalQuantity: inventory.totalQuantity,
          allocatedQuantity: inventory.allocatedQuantity,
          availableQuantity: inventory.availableQuantity,
          lowStockThreshold: inventory.lowStockThreshold,
        });
      }
    }

    switch (options.format) {
      case 'csv':
        return this.exportInventoryToCSV(inventoryData);
      case 'json':
        return JSON.stringify(inventoryData, null, 2);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportInventoryToCSV(inventoryData: any[]): string {
    const headers = [
      'Product ID', 'Product Title', 'SKU', 'Total Quantity',
      'Allocated Quantity', 'Available Quantity', 'Low Stock Threshold'
    ];

    const rows = inventoryData.map((item) => [
      item.productId,
      `"${item.productTitle.replace(/"/g, '""')}"`,
      item.sku,
      item.totalQuantity,
      item.allocatedQuantity,
      item.availableQuantity,
      item.lowStockThreshold,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  // ============================================================
  // IMPORT PRODUCTS
  // ============================================================

  async importProducts(userId: string, data: string, options: ImportOptions): Promise<ImportResult> {
    let products: any[];

    switch (options.format) {
      case 'csv':
        products = this.parseCSV(data);
        break;
      case 'json':
        products = JSON.parse(data);
        break;
      default:
        throw new Error('Unsupported import format');
    }

    const result: ImportResult = {
      totalRecords: products.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];

        // Validate product data
        if (!options.skipValidation) {
          this.validateProductData(productData, i + 1, result.errors);
        }

        // Check if product already exists
        const existingProduct = await this.db.product.findBySku(userId, productData.sku);

        if (existingProduct) {
          if (options.updateExisting) {
            // Update existing product
            await this.db.product.update(existingProduct.id, {
              title: productData.title,
              description: productData.description,
              brand: productData.brand,
              // ... other fields
            });
          } else {
            result.errors.push({
              row: i + 1,
              field: 'sku',
              message: `Product with SKU ${productData.sku} already exists`,
            });
            result.failedImports++;
            continue;
          }
        } else {
          // Create new product
          await this.db.product.create({
            userId,
            title: productData.title,
            description: productData.description,
            sku: productData.sku,
            brand: productData.brand,
            condition: productData.condition || 'new',
            category: productData.category,
            tags: productData.tags || [],
            status: 'draft',
          });
        }

        result.successfulImports++;
      } catch (error: any) {
        result.failedImports++;
        result.errors.push({
          row: i + 1,
          field: 'general',
          message: error.message,
        });
      }
    }

    // Log audit
    await this.db.auditLog.create({
      userId,
      action: 'products.imported',
      resource: 'product',
      changes: {
        totalRecords: result.totalRecords,
        successfulImports: result.successfulImports,
        failedImports: result.failedImports,
      },
    });

    return result;
  }

  private parseCSV(data: string): any[] {
    const lines = data.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const product: any = {};

      headers.forEach((header, index) => {
        product[header] = values[index];
      });

      products.push(product);
    }

    return products;
  }

  private validateProductData(data: any, row: number, errors: any[]): void {
    if (!data.title) {
      errors.push({ row, field: 'title', message: 'Title is required' });
    }

    if (!data.sku) {
      errors.push({ row, field: 'sku', message: 'SKU is required' });
    }

    if (data.title && data.title.length > 200) {
      errors.push({ row, field: 'title', message: 'Title must be 200 characters or less' });
    }
  }

  // ============================================================
  // IMPORT ORDERS
  // ============================================================

  async importOrders(userId: string, data: string, options: ImportOptions): Promise<ImportResult> {
    let orders: any[];

    switch (options.format) {
      case 'csv':
        orders = this.parseCSV(data);
        break;
      case 'json':
        orders = JSON.parse(data);
        break;
      default:
        throw new Error('Unsupported import format');
    }

    const result: ImportResult = {
      totalRecords: orders.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
    };

    for (let i = 0; i < orders.length; i++) {
      try {
        const orderData = orders[i];

        // Validate order data
        if (!options.skipValidation) {
          this.validateOrderData(orderData, i + 1, result.errors);
        }

        // Create order
        await this.db.order.create({
          userId,
          marketplaceId: orderData.marketplaceId,
          connectionId: orderData.connectionId,
          externalOrderId: orderData.externalOrderId,
          status: orderData.status || 'pending',
          buyerName: orderData.buyerName,
          buyerEmail: orderData.buyerEmail,
          shippingAddress: JSON.parse(orderData.shippingAddress || '{}'),
          subtotal: parseFloat(orderData.subtotal || '0'),
          shippingCost: parseFloat(orderData.shippingCost || '0'),
          tax: parseFloat(orderData.tax || '0'),
          total: parseFloat(orderData.total || '0'),
          currency: orderData.currency || 'USD',
        });

        result.successfulImports++;
      } catch (error: any) {
        result.failedImports++;
        result.errors.push({
          row: i + 1,
          field: 'general',
          message: error.message,
        });
      }
    }

    return result;
  }

  private validateOrderData(data: any, row: number, errors: any[]): void {
    if (!data.externalOrderId) {
      errors.push({ row, field: 'externalOrderId', message: 'External Order ID is required' });
    }

    if (!data.marketplaceId) {
      errors.push({ row, field: 'marketplaceId', message: 'Marketplace ID is required' });
    }

    if (!data.buyerName) {
      errors.push({ row, field: 'buyerName', message: 'Buyer name is required' });
    }
  }

  // ============================================================
  // EXPORT ANALYTICS
  // ============================================================

  async exportAnalytics(userId: string, options: ExportOptions): Promise<string> {
    const analytics = {
      sales: await this.getSalesData(userId, options),
      inventory: await this.getInventoryData(userId),
      performance: await this.getPerformanceData(userId, options),
    };

    switch (options.format) {
      case 'json':
        return JSON.stringify(analytics, null, 2);
      case 'csv':
        return this.exportAnalyticsToCSV(analytics);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async getSalesData(userId: string, options: ExportOptions): Promise<any> {
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
    });

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
        : 0,
    };
  }

  private async getInventoryData(userId: string): Promise<any> {
    const products = await this.db.product.findByUserId(userId);
    let totalInventory = 0;
    let lowStockCount = 0;

    for (const product of products) {
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (inventory) {
        totalInventory += inventory.totalQuantity;
        if (inventory.totalQuantity <= inventory.lowStockThreshold) {
          lowStockCount++;
        }
      }
    }

    return {
      totalProducts: products.length,
      totalInventory,
      lowStockCount,
    };
  }

  private async getPerformanceData(userId: string, options: ExportOptions): Promise<any> {
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
    });

    const marketplacePerformance: Record<string, any> = {};

    for (const order of orders) {
      if (!marketplacePerformance[order.marketplaceId]) {
        marketplacePerformance[order.marketplaceId] = {
          orders: 0,
          revenue: 0,
        };
      }
      marketplacePerformance[order.marketplaceId].orders++;
      marketplacePerformance[order.marketplaceId].revenue += order.total;
    }

    return marketplacePerformance;
  }

  private exportAnalyticsToCSV(analytics: any): string {
    const rows = [
      ['Metric', 'Value'],
      ['Total Orders', analytics.sales.totalOrders],
      ['Total Revenue', analytics.sales.totalRevenue],
      ['Average Order Value', analytics.sales.averageOrderValue],
      ['Total Products', analytics.inventory.totalProducts],
      ['Total Inventory', analytics.inventory.totalInventory],
      ['Low Stock Count', analytics.inventory.lowStockCount],
    ];

    return rows.map((row) => row.join(',')).join('\n');
  }

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  async bulkExport(userId: string, options: ExportOptions): Promise<{
    products?: string;
    orders?: string;
    inventory?: string;
    analytics?: string;
  }> {
    const result: any = {};

    if (options.includeProducts !== false) {
      result.products = await this.exportProducts(userId, options);
    }

    if (options.includeOrders !== false) {
      result.orders = await this.exportOrders(userId, options);
    }

    if (options.includeInventory !== false) {
      result.inventory = await this.exportInventory(userId, options);
    }

    if (options.includeAnalytics !== false) {
      result.analytics = await this.exportAnalytics(userId, options);
    }

    return result;
  }
}
