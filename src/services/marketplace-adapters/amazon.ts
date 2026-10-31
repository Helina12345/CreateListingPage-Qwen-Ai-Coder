// ============================================================
// ListingDesk Pro — Amazon Marketplace Adapter
// Implements Amazon Selling Partner API integration
// ============================================================

import { BaseMarketplaceAdapter } from '../../../src/services/marketplace-adapters/base';
import type {
  ConnectionStatus,
  CreateProductResult,
  UpdateProductResult,
  PublishResult,
  ProductStatus,
  Category,
  CategoryAttribute,
  ImageUploadResult,
  ValidationResult,
} from '../../../src/services/marketplace-adapters/base';
import type { Listing, MarketplaceId } from '../../../src/types';

export class AmazonAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'amazon';
  name = 'Amazon';

  constructor() {
    super('https://sellingpartner-api.amazon.com');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      // Check if we have valid credentials
      if (!this.accessToken) {
        return {
          connected: false,
          permissions: [],
        };
      }

      // Verify token with Amazon API
      const response = await this.apiRequest<any>('/authorization/v1/authorizationCode', {
        method: 'GET',
      });

      return {
        connected: true,
        storeName: response.sellerId || 'Amazon Store',
        storeId: response.sellerId,
        lastSynced: new Date(),
        permissions: ['product_listing', 'inventory', 'orders'],
      };
    } catch (error) {
      return {
        connected: false,
        permissions: [],
      };
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshTokenValue,
        client_id: import.meta.env.VITE_AMAZON_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_AMAZON_CLIENT_SECRET || '',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Amazon token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      // Amazon requires product type and category first
      const productType = await this.determineProductType(listing);

      // Create listing draft
      const payload = {
        productType: productType,
        requirements: 'LISTING',
        attributes: this.mapListingToAmazonAttributes(listing),
      };

      const response = await this.apiRequest<any>('/listings/2021-08-01/items/{sellerId}/{sku}', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        externalId: response.sku,
        warnings: response.warnings?.map((w: any) => w.message),
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
      const payload = {
        productType: 'PRODUCT',
        requirements: 'LISTING',
        attributes: this.mapListingToAmazonAttributes(listing),
      };

      await this.apiRequest(`/listings/2021-08-01/items/{sellerId}/${externalId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
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
    await this.apiRequest(`/listings/2021-08-01/items/{sellerId}/${externalId}`, {
      method: 'DELETE',
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(
        `/listings/2021-08-01/items/{sellerId}/${externalId}?includedData=attributes,images,pricing`
      );

      return this.mapAmazonToListing(response);
    } catch {
      return null;
    }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      // Amazon doesn't have a separate "publish" step - products are published when created
      // But we need to verify the listing is active
      const status = await this.getProductStatus(externalId);

      return {
        success: status.status === 'active',
        status: status.status === 'active' ? 'published' : 'pending',
        externalUrl: `https://www.amazon.com/dp/${externalId}`,
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
    // Set inventory to 0 to effectively unpublish
    await this.updateInventory(externalId, 0);
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(
        `/listings/2021-08-01/items/{sellerId}/${externalId}?includedData=issues`
      );

      const hasIssues = response.issues && response.issues.length > 0;

      return {
        status: hasIssues ? 'rejected' : 'active',
        lastModified: new Date(response.status?.marketplaceIds?.[0] || Date.now()),
        reason: hasIssues ? response.issues[0].message : undefined,
      };
    } catch {
      return {
        status: 'inactive',
        reason: 'Unable to fetch status',
      };
    }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/inventory/2021-08-01/inventoryItems/{sellerSku}', {
      method: 'PUT',
      body: JSON.stringify({
        totalShipDetails: [
          {
            quantity: { value: quantity },
          },
        ],
      }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(
        `/inventory/2021-08-01/inventoryItems/${externalId}`
      );
      return response.totalShipDetails?.[0]?.quantity?.value || 0;
    } catch {
      return 0;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>(
        '/commerce/catalog/2022-04-01/catalogItems?marketplaceIds=ATVPDKIKX0DER'
      );

      return response.items?.map((item: any) => ({
        id: item.asin,
        name: item.productTitle || item.asin,
        leaf: true,
      })) || [];
    } catch {
      return [];
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      // Amazon's product type definitions
      const response = await this.apiRequest<any>(
        `/definitions/2020-09-01/productTypes/${categoryId}?marketplaceIds=ATVPDKIKX0DER`
      );

      return response.propertyGroups?.flatMap((group: any) =>
        group.properties?.map((prop: any) => ({
          id: prop.name,
          name: prop.title,
          type: this.mapAmazonType(prop.type),
          required: prop.isRequired || false,
          options: prop.enum?.map((val: string) => ({ value: val, label: val })),
          validation: {
            maxLength: prop.maxLength,
            minLength: prop.minLength,
            pattern: prop.pattern,
          },
        }))
      ) || [];
    } catch {
      return [];
    }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    try {
      // Amazon requires images to be hosted on a public URL
      // We need to upload to S3 first, then provide the URL
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();

      return {
        success: true,
        url: data.url,
        externalId: data.imageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];

    // Amazon-specific validations
    if (!listing.title || listing.title.length < 10) {
      errors.push({
        field: 'title',
        message: 'Amazon requires product title to be at least 10 characters',
        severity: 'error',
      });
    }

    if (listing.title && listing.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Amazon product title cannot exceed 200 characters',
        severity: 'error',
      });
    }

    if (!listing.upc && !listing.ean && !listing.isbn) {
      errors.push({
        field: 'gtin',
        message: 'Amazon requires GTIN (UPC/EAN/ISBN) for most products',
        severity: 'error',
      });
    }

    if (!listing.brand) {
      errors.push({
        field: 'brand',
        message: 'Amazon requires brand name',
        severity: 'error',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'Amazon requires at least 1 product image',
        severity: 'error',
      });
    }

    if (listing.images && listing.images.length > 0) {
      errors.push({
        field: 'images',
        message: 'Amazon requires main image to have pure white background (RGB 255,255,255)',
        severity: 'warning',
      });
    }

    if (!listing.description || listing.description.length < 50) {
      errors.push({
        field: 'description',
        message: 'Amazon recommends product description to be at least 50 characters',
        severity: 'warning',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  // Helper methods
  private async determineProductType(listing: Partial<Listing>): Promise<string> {
    // In real implementation, this would query Amazon's product type API
    // based on category and attributes
    return 'PRODUCT';
  }

  private mapListingToAmazonAttributes(listing: Partial<Listing>): any {
    return {
      item_name: [{ value: listing.title, language_tag: 'en_US' }],
      brand: [{ value: listing.brand }],
      manufacturer: [{ value: listing.brand }],
      product_description: [{ value: listing.description, language_tag: 'en_US' }],
      bullet_point: listing.tags?.map((tag) => ({ value: tag, language_tag: 'en_US' })) || [],
      main_product_image_locator: listing.images?.[0]?.url,
      other_product_image_locator: listing.images?.slice(1).map((img) => ({
        value: img.url,
      })),
      list_price: [{ value: listing.pricing?.basePrice, currency: 'USD' }],
      quantity: listing.inventory?.totalQuantity,
      condition_type: [{ value: this.mapCondition(listing.condition) }],
    };
  }

  private mapAmazonToListing(amazonData: any): Partial<Listing> {
    return {
      title: amazonData.attributes?.item_name?.[0]?.value,
      brand: amazonData.attributes?.brand?.[0]?.value,
      description: amazonData.attributes?.product_description?.[0]?.value,
      tags: amazonData.attributes?.bullet_point?.map((bp: any) => bp.value) || [],
      images: [
        { url: amazonData.attributes?.main_product_image_locator, isMain: true },
        ...(amazonData.attributes?.other_product_image_locator?.map((img: any) => ({
          url: img.value,
          isMain: false,
        })) || []),
      ],
      pricing: {
        basePrice: amazonData.attributes?.list_price?.[0]?.value,
        currency: 'USD',
        marketplacePrices: {} as any,
        pricingRules: [],
      },
      inventory: {
        totalQuantity: amazonData.attributes?.quantity,
        allocatedPerMarketplace: {} as any,
        lowStockThreshold: 0,
        reorderPoint: 0,
        lastUpdated: new Date().toISOString(),
      },
      condition: this.unmapCondition(amazonData.attributes?.condition_type?.[0]?.value),
    };
  }

  private mapCondition(condition?: string): string {
    const map: Record<string, string> = {
      new: 'New',
      used: 'Used',
      refurbished: 'Refurbished',
    };
    return map[condition || 'new'] || 'New';
  }

  private unmapCondition(amazonCondition?: string): 'new' | 'used' | 'refurbished' {
    const map: Record<string, 'new' | 'used' | 'refurbished'> = {
      New: 'new',
      Used: 'used',
      Refurbished: 'refurbished',
    };
    return map[amazonCondition || 'New'] || 'new';
  }

  private mapAmazonType(type: string): 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' {
    const map: Record<string, 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date'> = {
      string: 'text',
      number: 'number',
      integer: 'number',
      boolean: 'boolean',
      date: 'date',
    };
    return map[type] || 'text';
  }
}
