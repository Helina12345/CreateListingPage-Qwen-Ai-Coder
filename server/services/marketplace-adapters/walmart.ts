// ============================================================
// ListingDesk Pro — Walmart Marketplace Adapter
// Complete Walmart Marketplace API implementation
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
// WALMART API CLIENT
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

  // ============================================================
  // AUTHENTICATION
  // ============================================================

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

  // ============================================================
  // API REQUEST HELPER
  // ============================================================

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

  // ============================================================
  // PRODUCT OPERATIONS
  // ============================================================

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

  // ============================================================
  // PUBLISHING
  // ============================================================

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

  // ============================================================
  // INVENTORY
  // ============================================================

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

  // ============================================================
  // CATEGORIES & ATTRIBUTES
  // ============================================================

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

  // ============================================================
  // IMAGES
  // ============================================================

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    // Walmart requires publicly accessible image URLs
    return {
      success: false,
      error: 'Walmart requires publicly accessible image URLs',
    };
  }

  // ============================================================
  // VALIDATION
  // ============================================================

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
