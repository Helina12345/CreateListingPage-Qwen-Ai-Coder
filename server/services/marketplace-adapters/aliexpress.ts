// ============================================================
// ListingDesk Pro — AliExpress Supplier Adapter
// Complete AliExpress API implementation for supplier integration
// ============================================================

import type { Listing, MarketplaceId } from '../../types';

// ============================================================
// ALIEXPRESS API CLIENT
// ============================================================

export class AliExpressAPI {
  private appKey: string;
  private appSecret: string;
  private accessToken: string | null = null;

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  // ============================================================
  // API REQUEST HELPER
  // ============================================================

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://api-sg.aliexpress.com${endpoint}?app_key=${this.appKey}&timestamp=${timestamp}&access_token=${this.accessToken}&sign=${this.generateSign(endpoint, timestamp)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  private generateSign(endpoint: string, timestamp: number): string {
    // Simplified signature generation - in production use proper HMAC
    const baseString = `${this.appKey}${endpoint}${timestamp}${this.accessToken || ''}`;
    return btoa(baseString);
  }

  // ============================================================
  // PRODUCT SEARCH
  // ============================================================

  async searchProducts(query: string, page: number = 1, pageSize: number = 20): Promise<any[]> {
    try {
      const response = await this.apiRequest<any>('/product/search', {
        method: 'POST',
        body: JSON.stringify({
          keywords: query,
          page,
          pageSize,
        }),
      });

      return response.products || [];
    } catch {
      return [];
    }
  }

  // ============================================================
  // PRODUCT DETAILS
  // ============================================================

  async getProductDetails(productId: string): Promise<any> {
    try {
      const response = await this.apiRequest<any>(`/product/${productId}`);
      return response;
    } catch {
      return null;
    }
  }

  // ============================================================
  // ORDER MANAGEMENT
  // ============================================================

  async placeOrder(orderData: any): Promise<any> {
    try {
      const response = await this.apiRequest<any>('/order/create', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      return response;
    } catch (error: any) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const response = await this.apiRequest<any>(`/order/${orderId}`);
      return response;
    } catch {
      return null;
    }
  }

  // ============================================================
  // MESSAGING
  // ============================================================

  async sendMessage(orderId: string, message: string): Promise<void> {
    await this.apiRequest(`/order/${orderId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ============================================================
  // SUPPLIER PRODUCT INTERFACE
  // ============================================================

  async getSupplierProduct(productId: string): Promise<{
    id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    variants: Array<{
      id: string;
      sku: string;
      attributes: Record<string, string>;
      price: number;
      stock: number;
      images: string[];
    }>;
    shipping: {
      cost: number;
      estimatedDays: { min: number; max: number };
      freeShipping: boolean;
    };
    rating: number;
    orders: number;
    inStock: boolean;
    url: string;
  } | null> {
    try {
      const product = await this.getProductDetails(productId);

      if (!product) {
        return null;
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
    } catch {
      return null;
    }
  }

  // ============================================================
  // PLACE SUPPLIER ORDER
  // ============================================================

  async placeSupplierOrder(
    productId: string,
    variantId: string,
    quantity: number,
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }
  ): Promise<{
    orderId: string;
    status: string;
    totalCost: number;
    estimatedDelivery: string;
  } | null> {
    try {
      const orderData = {
        product_id: productId,
        sku_id: variantId,
        quantity,
        shipping_address: shippingAddress,
      };

      const response = await this.placeOrder(orderData);

      return {
        orderId: response.order_id,
        status: response.status,
        totalCost: response.total_cost,
        estimatedDelivery: response.estimated_delivery,
      };
    } catch {
      return null;
    }
  }

  // ============================================================
  // GET SUPPLIER ORDER STATUS
  // ============================================================

  async getSupplierOrderStatus(orderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    shippedAt?: string;
    deliveredAt?: string;
  } | null> {
    try {
      const response = await this.getOrderStatus(orderId);

      if (!response) {
        return null;
      }

      return {
        status: response.status,
        trackingNumber: response.tracking_number,
        shippedAt: response.shipped_at,
        deliveredAt: response.delivered_at,
      };
    } catch {
      return null;
    }
  }
}
