// ============================================================
// ListingDesk Pro — Marketplace Adapter Base Interface
// Defines the contract for all marketplace integrations
// ============================================================

import type { MarketplaceId, Listing, ListingImage, ListingVariant } from '../../types';

export interface MarketplaceAdapter {
  marketplaceId: MarketplaceId;
  name: string;

  // Connection & Auth
  getConnectionStatus(): Promise<ConnectionStatus>;
  refreshToken(): Promise<void>;

  // Product Operations
  createProduct(listing: Partial<Listing>): Promise<CreateProductResult>;
  updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult>;
  deleteProduct(externalId: string): Promise<void>;
  getProduct(externalId: string): Promise<Partial<Listing> | null>;

  // Publishing
  publishProduct(externalId: string): Promise<PublishResult>;
  unpublishProduct(externalId: string): Promise<void>;
  getProductStatus(externalId: string): Promise<ProductStatus>;

  // Inventory
  updateInventory(externalId: string, quantity: number): Promise<void>;
  getInventory(externalId: string): Promise<number>;

  // Categories & Attributes
  getCategories(): Promise<Category[]>;
  getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]>;

  // Images
  uploadImage(image: File | Blob): Promise<ImageUploadResult>;

  // Validation
  validateProduct(listing: Partial<Listing>): Promise<ValidationResult>;
}

export interface ConnectionStatus {
  connected: boolean;
  storeName?: string;
  storeId?: string;
  lastSynced?: Date;
  permissions: string[];
}

export interface CreateProductResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  errors?: string[];
  warnings?: string[];
}

export interface UpdateProductResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PublishResult {
  success: boolean;
  status: 'published' | 'pending' | 'failed';
  externalUrl?: string;
  processingTime?: number;
  errors?: string[];
}

export interface ProductStatus {
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'deleted';
  lastModified?: Date;
  reason?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  leaf: boolean;
  requiredAttributes?: string[];
}

export interface CategoryAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  externalId?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

// ============================================================
// Base Adapter Implementation
// ============================================================
export abstract class BaseMarketplaceAdapter implements MarketplaceAdapter {
  abstract marketplaceId: MarketplaceId;
  abstract name: string;

  protected baseUrl: string;
  protected accessToken?: string;
  protected refreshTokenValue?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Abstract methods that must be implemented by each adapter
  abstract getConnectionStatus(): Promise<ConnectionStatus>;
  abstract refreshToken(): Promise<void>;
  abstract createProduct(listing: Partial<Listing>): Promise<CreateProductResult>;
  abstract updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult>;
  abstract deleteProduct(externalId: string): Promise<void>;
  abstract getProduct(externalId: string): Promise<Partial<Listing> | null>;
  abstract publishProduct(externalId: string): Promise<PublishResult>;
  abstract unpublishProduct(externalId: string): Promise<void>;
  abstract getProductStatus(externalId: string): Promise<ProductStatus>;
  abstract updateInventory(externalId: string, quantity: number): Promise<void>;
  abstract getInventory(externalId: string): Promise<number>;
  abstract getCategories(): Promise<Category[]>;
  abstract getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]>;
  abstract uploadImage(image: File | Blob): Promise<ImageUploadResult>;
  abstract validateProduct(listing: Partial<Listing>): Promise<ValidationResult>;

  // Helper method for making authenticated API requests
  protected async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }
}
