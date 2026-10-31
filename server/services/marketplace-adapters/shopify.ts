// ============================================================
// ListingDesk Pro — Real Shopify Marketplace Integration
// Complete Shopify Admin API implementation
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
// SHOPIFY API CLIENT
// ============================================================

export class ShopifyAPI {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion = '2024-01';

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
  }

  // ============================================================
  // API REQUEST HELPER
  // ============================================================

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `https://${this.shopDomain}.myshopify.com/admin/api/${this.apiVersion}${endpoint}`;
    const headers: Record<string, string> = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ errors: 'Unknown error' }));
      throw new Error(error.errors || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  // ============================================================
  // PRODUCT OPERATIONS
  // ============================================================

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const productPayload = {
        product: {
          title: listing.title,
          body_html: listing.description,
          vendor: listing.brand,
          product_type: listing.category || 'General',
          tags: listing.tags?.join(', ') || '',
          variants: this.mapListingToShopifyVariants(listing),
          images: listing.images?.map((img) => ({ src: img.url })) || [],
          status: 'draft', // Created as draft, not published yet
        },
      };

      const response = await this.apiRequest<any>('/products.json', {
        method: 'POST',
        body: JSON.stringify(productPayload),
      });

      return {
        success: true,
        externalId: response.product?.id?.toString(),
        externalUrl: response.product?.admin_graphql_api_id,
        warnings: ['Product created as draft. Use publishProduct() to publish.'],
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
      const productPayload = {
        product: {
          id: externalId,
          title: listing.title,
          body_html: listing.description,
          vendor: listing.brand,
          product_type: listing.category || 'General',
          tags: listing.tags?.join(', ') || '',
          variants: this.mapListingToShopifyVariants(listing),
        },
      };

      await this.apiRequest(`/products/${externalId}.json`, {
        method: 'PUT',
        body: JSON.stringify(productPayload),
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
    await this.apiRequest(`/products/${externalId}.json`, {
      method: 'DELETE',
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/products/${externalId}.json`);

      return {
        title: response.product?.title,
        description: response.product?.body_html,
        brand: response.product?.vendor,
        category: response.product?.product_type,
        tags: response.product?.tags?.split(', ').filter(Boolean) || [],
        status: response.product?.status === 'active' ? 'active' : 'draft',
      };
    } catch {
      return null;
    }
  }

  // ============================================================
  // PUBLISHING (Separate Step)
  // ============================================================

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      const publishPayload = {
        published: true,
        published_scope: 'global', // Publish to all sales channels
      };

      await this.apiRequest(`/products/${externalId}.json`, {
        method: 'PUT',
        body: JSON.stringify(publishPayload),
      });

      // Get product to retrieve handle for URL
      const product = await this.getProduct(externalId);

      return {
        success: true,
        status: 'published',
        externalUrl: `https://${this.shopDomain}.myshopify.com/products/${product?.title?.toLowerCase().replace(/\s+/g, '-')}`,
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
    const unpublishPayload = {
      published: false,
    };

    await this.apiRequest(`/products/${externalId}.json`, {
      method: 'PUT',
      body: JSON.stringify(unpublishPayload),
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/products/${externalId}.json`);

      return {
        status: response.product?.status === 'active' ? 'active' : 'inactive',
        lastModified: new Date(response.product?.updated_at),
      };
    } catch {
      return {
        status: 'inactive',
        reason: 'Unable to fetch status',
      };
    }
  }

  // ============================================================
  // INVENTORY
  // ============================================================

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    // Get product to find variant IDs
    const product = await this.apiRequest<any>(`/products/${externalId}.json`);
    const variantId = product.product?.variants?.[0]?.id;

    if (variantId) {
      await this.apiRequest(`/variants/${variantId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          variant: {
            id: variantId,
            inventory_quantity: quantity,
          },
        }),
      });
    }
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/products/${externalId}.json`);
      return response.product?.variants?.[0]?.inventory_quantity || 0;
    } catch {
      return 0;
    }
  }

  // ============================================================
  // CATEGORIES & ATTRIBUTES
  // ============================================================

  async getCategories(): Promise<Category[]> {
    // Shopify doesn't have a traditional category system
    // Instead, it uses product types and collections
    try {
      const response = await this.apiRequest<any>('/custom_collections.json');

      return response.custom_collections?.map((collection: any) => ({
        id: collection.id.toString(),
        name: collection.title,
        leaf: true,
      })) || [];
    } catch {
      return [];
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    // Shopify uses metafields for custom attributes
    // Return common product attributes
    return [
      {
        id: 'vendor',
        name: 'Vendor',
        type: 'text',
        required: false,
      },
      {
        id: 'product_type',
        name: 'Product Type',
        type: 'text',
        required: false,
      },
      {
        id: 'tags',
        name: 'Tags',
        type: 'multiselect',
        required: false,
      },
    ];
  }

  // ============================================================
  // IMAGES
  // ============================================================

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    try {
      // Shopify can accept base64 encoded images
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      return {
        success: true,
        url: base64,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    if (!listing.title) {
      errors.push({
        field: 'title',
        message: 'Shopify requires product title',
        severity: 'error',
      });
    }

    if (listing.title && listing.title.length > 255) {
      errors.push({
        field: 'title',
        message: 'Shopify product title cannot exceed 255 characters',
        severity: 'error',
      });
    }

    if (!listing.description) {
      errors.push({
        field: 'description',
        message: 'Shopify requires product description',
        severity: 'error',
      });
    }

    if (!listing.brand) {
      errors.push({
        field: 'brand',
        message: 'Shopify requires vendor/brand name',
        severity: 'warning',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'Shopify recommends at least 1 product image',
        severity: 'warning',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private mapListingToShopifyVariants(listing: Partial<Listing>): any[] {
    if (listing.variants && listing.variants.length > 0) {
      return listing.variants.map((variant) => ({
        title: variant.title,
        price: variant.price.toString(),
        sku: variant.sku,
        inventory_quantity: variant.inventory,
        option1: variant.attributes?.['Color'] || variant.title,
        option2: variant.attributes?.['Size'],
      }));
    }

    // Single variant product
    return [
      {
        title: 'Default Title',
        price: listing.pricing?.basePrice?.toString() || '0.00',
        sku: listing.sku,
        inventory_quantity: listing.inventory?.totalQuantity || 0,
      },
    ];
  }
}
