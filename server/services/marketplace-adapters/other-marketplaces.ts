// ============================================================
// ListingDesk Pro — Remaining Marketplace Adapters
// Walmart, TikTok Shop, Shopee, Lazada, Kohl's, AliExpress
// ============================================================

import type { Listing, MarketplaceId } from '../../types';
import type {
  CreateProductResult,
  UpdateProductResult,
  PublishResult,
  ProductStatus,
  Category,
  CategoryAttribute,
  ImageUploadResult,
  ValidationResult,
} from './base';

// ============================================================
// WALMART ADAPTER
// ============================================================

export class WalmartAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://marketplace.walmartapis.com/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
        'WM_SVC.NAME': 'Marketplace',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get Walmart access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    return this.accessToken;
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = `https://marketplace.walmartapis.com${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'WM_SVC.NAME': 'Marketplace',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        ProductName: listing.title,
        ShortDescription: listing.description,
        Brand: listing.brand,
        Manufacturer: listing.brand,
        MainImage: { ImageLocation: listing.images?.[0]?.url },
        AdditionalImages: listing.images?.slice(1).map((img) => ({ ImageLocation: img.url })),
        ProductShortDescription: listing.shortDescription,
        price: listing.pricing?.basePrice,
      };

      const response = await this.apiRequest<any>('/v3/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        externalId: response.itemId,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest(`/v3/items/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ProductName: listing.title,
          price: listing.pricing?.basePrice,
        }),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/v3/items/${externalId}`, {
      method: 'DELETE',
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/v3/items/${externalId}`);
      return {
        title: response.ProductName,
        description: response.ShortDescription,
        brand: response.Brand,
      };
    } catch {
      return null;
    }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    // Walmart publishes automatically when item is created
    return {
      success: true,
      status: 'published',
      externalUrl: `https://www.walmart.com/ip/${externalId}`,
    };
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.updateInventory(externalId, 0);
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/v3/items/${externalId}`);
      return {
        status: response.lifecycleStatus === 'ACTIVE' ? 'active' : 'inactive',
      };
    } catch {
      return {
        status: 'inactive',
      };
    }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/v3/inventory', {
      method: 'PUT',
      body: JSON.stringify({
        sku: externalId,
        quantity,
      }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/v3/inventory?sku=${externalId}`);
      return response.quantity || 0;
    } catch {
      return 0;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/v3/taxonomy');
      return response?.categories?.map((c: any) => ({
        id: c.id,
        name: c.name,
        leaf: !c.children,
      })) || [];
    } catch {
      return [];
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/v3/items/specs?category=${categoryId}`);
      return response?.map((s: any) => ({
        id: s.name,
        name: s.name,
        type: 'text',
        required: s.required,
      })) || [];
    } catch {
      return [];
    }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    // Walmart requires publicly accessible image URLs
    return {
      success: false,
      error: 'Walmart requires publicly accessible image URLs',
    };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    if (!listing.title || listing.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Walmart title must be 1-200 characters',
        severity: 'error',
      });
    }

    if (!listing.brand) {
      errors.push({
        field: 'brand',
        message: 'Walmart requires brand',
        severity: 'error',
      });
    }

    if (!listing.upc && !listing.ean) {
      errors.push({
        field: 'gtin',
        message: 'Walmart requires UPC/EAN for most products',
        severity: 'error',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'Walmart requires main image',
        severity: 'error',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }
}

// ============================================================
// TIKTOK SHOP ADAPTER
// ============================================================

export class TikTokShopAPI {
  private appKey: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://auth.tiktok-shops.com/api/v2/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: this.appKey,
        app_secret: this.appSecret,
        refresh_token: this.accessToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh TikTok token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expire_in * 1000) - 60000;

    return this.accessToken;
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = `https://open-api.tiktokglobalshop.com${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Access-Token': token,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        title: listing.title,
        description: listing.description,
        category_id: '0',
        brand_id: '0',
        models: [{
          name: 'Default',
          original_price: listing.pricing?.basePrice,
          stock: listing.inventory?.totalQuantity,
        }],
        main_images: listing.images?.slice(0, 1).map((img) => ({ uri: img.url })) || [],
      };

      const response = await this.apiRequest<any>('/products/202309/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        externalId: response.data?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest(`/products/202309/products/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: listing.title,
          description: listing.description,
        }),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/products/202309/products/${externalId}`, {
      method: 'DELETE',
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/products/${externalId}`);
      return {
        title: response.data?.title,
        description: response.data?.description,
      };
    } catch {
      return null;
    }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest(`/products/202309/products/${externalId}/activate`, {
        method: 'POST',
      });

      return {
        success: true,
        status: 'published',
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        errors: [error.message],
      };
    }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/products/202309/products/${externalId}/deactivate`, {
      method: 'POST',
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/products/${externalId}`);
      return {
        status: response.data?.status === 1 ? 'active' : 'inactive',
      };
    } catch {
      return {
        status: 'inactive',
      };
    }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/products/202309/inventory', {
      method: 'POST',
      body: JSON.stringify({
        product_id: externalId,
        stock: quantity,
      }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/products/${externalId}`);
      return response.data?.models?.[0]?.stock || 0;
    } catch {
      return 0;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/products/202309/categories');
      return response.data?.map((c: any) => ({
        id: c.id,
        name: c.local_name,
        leaf: c.is_leaf,
      })) || [];
    } catch {
      return [];
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/categories/${categoryId}/attributes`);
      return response.data?.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.value_type === 'INT' ? 'number' : 'select',
        required: a.is_required,
        options: a.values?.map((v: any) => ({
          value: v.id,
          label: v.name,
        })),
      })) || [];
    } catch {
      return [];
    }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return {
      success: false,
      error: 'TikTok Shop requires publicly accessible image URLs',
    };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    if (!listing.title || listing.title.length > 255) {
      errors.push({
        field: 'title',
        message: 'TikTok Shop title must be 1-255 characters',
        severity: 'error',
      });
    }

    if (!listing.description) {
      errors.push({
        field: 'description',
        message: 'TikTok Shop requires description',
        severity: 'error',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'TikTok Shop requires at least 1 image',
        severity: 'error',
      });
    }

    if (listing.condition !== 'new') {
      errors.push({
        field: 'condition',
        message: 'TikTok Shop primarily accepts new items',
        severity: 'warning',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }
}

// ============================================================
// SHOPEE ADAPTER
// ============================================================

export class ShopeeAPI {
  private partnerId: string;
  private partnerKey: string;
  private accessToken: string | null = null;
  private shopId: string = '';

  constructor(partnerId: string, partnerKey: string) {
    this.partnerId = partnerId;
    this.partnerKey = partnerKey;
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${this.partnerId}${endpoint}${timestamp}${this.accessToken || ''}${this.shopId}`;

    // Generate signature (simplified - in production use proper HMAC)
    const encoder = new TextEncoder();
    const data = encoder.encode(baseString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const url = `https://partner.shopeemobile.com/api/v2${endpoint}?partner_id=${this.partnerId}&timestamp=${timestamp}&access_token=${this.accessToken}&shop_id=${this.shopId}&sign=${hashHex}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        item_name: listing.title,
        description: listing.description,
        brand: listing.brand,
        category_id: 0,
        price: listing.pricing?.basePrice,
        stock: listing.inventory?.totalQuantity,
        images: listing.images?.map((img) => img.url) || [],
        item_sku: listing.sku,
      };

      const response = await this.apiRequest<any>('/product/add_item', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        externalId: response.item_id?.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest('/product/update_item', {
        method: 'POST',
        body: JSON.stringify({
          item_id: externalId,
          item_name: listing.title,
          description: listing.description,
        }),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/unlist_item', {
      method: 'POST',
      body: JSON.stringify({ item_id: externalId }),
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/product/get_item_base_info?item_id=${externalId}`);
      return {
        title: response.item_name,
        description: response.description,
      };
    } catch {
      return null;
    }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest('/product/model/publish', {
        method: 'POST',
        body: JSON.stringify({ item_id: externalId }),
      });

      return {
        success: true,
        status: 'published',
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        errors: [error.message],
      };
    }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/unlist_item', {
      method: 'POST',
      body: JSON.stringify({ item_id: externalId }),
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/product/get_item_base_info?item_id=${externalId}`);
      return {
        status: response.status === 1 ? 'active' : 'inactive',
      };
    } catch {
      return {
        status: 'inactive',
      };
    }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/product/update_stock', {
      method: 'POST',
      body: JSON.stringify({
        item_id: externalId,
        stock: quantity,
      }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/product/get_item_base_info?item_id=${externalId}`);
      return response.stock || 0;
    } catch {
      return 0;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/shop_category/get_shop_category');
      return response?.category_list?.map((c: any) => ({
        id: c.shop_category_id.toString(),
        name: c.category_name,
        leaf: true,
      })) || [];
    } catch {
      return [];
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/product/get_attributes?category_id=${categoryId}`);
      return response?.attributes?.map((a: any) => ({
        id: a.attribute_id.toString(),
        name: a.attribute_name,
        type: 'select',
        required: a.is_mandatory,
        options: a.options?.map((o: any) => ({
          value: o,
          label: o,
        })),
      })) || [];
    } catch {
      return [];
    }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return {
      success: false,
      error: 'Shopee requires publicly accessible image URLs',
    };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    if (!listing.title || listing.title.length > 120) {
      errors.push({
        field: 'title',
        message: 'Shopee title must be 1-120 characters',
        severity: 'error',
      });
    }

    if (!listing.description) {
      errors.push({
        field: 'description',
        message: 'Shopee requires description',
        severity: 'error',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'Shopee requires at least 1 image',
        severity: 'error',
      });
    }

    if (listing.images && listing.images.length > 9) {
      errors.push({
        field: 'images',
        message: 'Shopee allows max 9 images',
        severity: 'error',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }
}

// ============================================================
// LAZADA ADAPTER
// ============================================================

export class LazadaAPI {
  private appKey: string;
  private appSecret: string;
  private accessToken: string | null = null;

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://api.lazada.com/rest${endpoint}?app_key=${this.appKey}&timestamp=${timestamp}&access_token=${this.accessToken}&sign=${this.generateSign(endpoint, timestamp)}`;

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

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        attributes: {
          name: listing.title,
          description: listing.description,
          brand_name: listing.brand,
        },
        category_id: 0,
        skus: [{
          SellerSku: listing.sku,
          price: listing.pricing?.basePrice,
          quantity: listing.inventory?.totalQuantity,
          Images: listing.images?.map((img) => img.url) || [],
        }],
      };

      const response = await this.apiRequest<any>('/product/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        externalId: response.item_id?.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest('/product/update', {
        method: 'POST',
        body: JSON.stringify({
          item_id: externalId,
          attributes: {
            name: listing.title,
            description: listing.description,
          },
        }),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/remove', {
      method: 'POST',
      body: JSON.stringify({ item_id: externalId }),
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/product/get?item_id=${externalId}`);
      return {
        title: response.data?.name,
        description: response.data?.description,
      };
    } catch {
      return null;
    }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest('/product/update', {
        method: 'POST',
        body: JSON.stringify({
          item_id: externalId,
          status: 'active',
        }),
      });

      return {
        success: true,
        status: 'published',
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        errors: [error.message],
      };
    }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/update', {
      method: 'POST',
      body: JSON.stringify({
        item_id: externalId,
        status: 'inactive',
      }),
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/product/get?item_id=${externalId}`);
      return {
        status: response.data?.status === 'active' ? 'active' : 'inactive',
      };
    } catch {
      return {
        status: 'inactive',
      };
    }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/product/price_quantity/update', {
      method: 'POST',
      body: JSON.stringify({
        item_id: externalId,
        quantity,
      }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/product/get?item_id=${externalId}`);
      return response.data?.quantity || 0;
    } catch {
      return 0;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/category/tree/get');
      return this.flattenCategories(response.data?.categories || []);
    } catch {
      return [];
    }
  }

  private flattenCategories(categories: any[]): Category[] {
    const result: Category[] = [];
    for (const cat of categories) {
      result.push({
        id: cat.category_id.toString(),
        name: cat.name,
        leaf: !cat.children,
      });
      if (cat.children) {
        result.push(...this.flattenCategories(cat.children));
      }
    }
    return result;
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/category/attributes/get?category_id=${categoryId}`);
      return response.data?.map((a: any) => ({
        id: a.id.toString(),
        name: a.name,
        type: 'select',
        required: a.is_required,
        options: a.options?.map((o: any) => ({
          value: o.id.toString(),
          label: o.name,
        })),
      })) || [];
    } catch {
      return [];
    }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return {
      success: false,
      error: 'Lazada requires publicly accessible image URLs',
    };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    if (!listing.title) {
      errors.push({
        field: 'title',
        message: 'Lazada requires product name',
        severity: 'error',
      });
    }

    if (!listing.description) {
      errors.push({
        field: 'description',
        message: 'Lazada requires description',
        severity: 'error',
      });
    }

    if (!listing.brand) {
      errors.push({
        field: 'brand',
        message: 'Lazada requires brand',
        severity: 'error',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'Lazada requires at least 1 image',
        severity: 'error',
      });
    }

    if (listing.images && listing.images.length > 8) {
      errors.push({
        field: 'images',
        message: 'Lazada allows max 8 images',
        severity: 'error',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }
}

// ============================================================
// KOHL'S ADAPTER
// ============================================================

export class KohlsAPI {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    return {
      success: false,
      errors: ["Kohl's integration is not yet available"],
    };
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    return {
      success: false,
      errors: ["Kohl's integration is not yet available"],
    };
  }

  async deleteProduct(externalId: string): Promise<void> {
    throw new Error("Kohl's integration is not yet available");
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    return null;
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    return {
      success: false,
      status: 'failed',
      errors: ["Kohl's integration is not yet available"],
    };
  }

  async unpublishProduct(externalId: string): Promise<void> {
    throw new Error("Kohl's integration is not yet available");
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    return {
      status: 'inactive',
      reason: "Kohl's integration is not yet available",
    };
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    throw new Error("Kohl's integration is not yet available");
  }

  async getInventory(externalId: string): Promise<number> {
    return 0;
  }

  async getCategories(): Promise<Category[]> {
    return [];
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    return [];
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return {
      success: false,
      error: "Kohl's integration is not yet available",
    };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    return {
      valid: false,
      errors: [{
        field: 'integration',
        message: "Kohl's integration is not yet verified. Please contact support.",
        severity: 'error',
      }],
    };
  }
}

// ============================================================
// ALIEXPRESS ADAPTER (Supplier)
// ============================================================

export class AliExpressAPI {
  private appKey: string;
  private appSecret: string;
  private accessToken: string | null = null;

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

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

  async getProductDetails(productId: string): Promise<any> {
    try {
      const response = await this.apiRequest<any>(`/product/${productId}`);
      return response;
    } catch {
      return null;
    }
  }

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

  async sendMessage(orderId: string, message: string): Promise<void> {
    await this.apiRequest(`/order/${orderId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}
