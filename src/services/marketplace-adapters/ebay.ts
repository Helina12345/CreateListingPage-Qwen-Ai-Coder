// ============================================================
// ListingDesk Pro — eBay Marketplace Adapter
// Implements eBay Inventory API + Offer workflow
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

export class EbayAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'ebay';
  name = 'eBay';

  constructor() {
    super('https://api.ebay.com');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      if (!this.accessToken) {
        return { connected: false, permissions: [] };
      }

      const response = await this.apiRequest<any>('/sell/account/v1/fulfillment_policy', {
        method: 'GET',
      });

      return {
        connected: true,
        storeName: 'eBay Store',
        storeId: response.accountId,
        lastSynced: new Date(),
        permissions: ['sell.inventory', 'sell.fulfillment', 'sell.account'],
      };
    } catch {
      return { connected: false, permissions: [] };
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${import.meta.env.VITE_EBAY_CLIENT_ID}:${import.meta.env.VITE_EBAY_CLIENT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshTokenValue,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh eBay token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  // eBay uses a 3-step process: Inventory Item → Offer → Publish
  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      // Step 1: Create or update inventory item
      const inventoryItemPayload = {
        product: {
          title: listing.title,
          description: listing.description,
          brand: listing.brand,
          mpn: listing.sku,
          imageUrl: listing.images?.[0]?.url,
          aspects: this.mapListingToEbayAspects(listing),
        },
        condition: this.mapCondition(listing.condition),
        availability: {
          shipToLocationAvailability: {
            quantity: listing.inventory?.totalQuantity || 0,
          },
        },
      };

      await this.apiRequest(`/sell/inventory/v1/inventory_item/${listing.sku}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryItemPayload),
      });

      return {
        success: true,
        externalId: listing.sku,
        warnings: ['Inventory item created. Use publishProduct() to create offer.'],
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
      const inventoryItemPayload = {
        product: {
          title: listing.title,
          description: listing.description,
          brand: listing.brand,
        },
        availability: {
          shipToLocationAvailability: {
            quantity: listing.inventory?.totalQuantity || 0,
          },
        },
      };

      await this.apiRequest(`/sell/inventory/v1/inventory_item/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryItemPayload),
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
    await this.apiRequest(`/sell/inventory/v1/inventory_item/${externalId}`, {
      method: 'DELETE',
    });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(
        `/sell/inventory/v1/inventory_item/${externalId}`
      );

      return {
        title: response.product?.title,
        description: response.product?.description,
        brand: response.product?.brand,
        sku: externalId,
        condition: this.unmapCondition(response.condition),
        inventory: {
          totalQuantity: response.availability?.shipToLocationAvailability?.quantity || 0,
          allocatedPerMarketplace: {} as any,
          lowStockThreshold: 0,
          reorderPoint: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch {
      return null;
    }
  }

  // Step 2: Create offer (this is eBay's "publish" step)
  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      // Create offer
      const offerPayload = {
        availableQuantity: 1,
        categoryId: '1', // Should be determined from product category
        marketplaceId: 'EBAY_US',
        sku: externalId,
        format: 'FIXED_PRICE',
        includeCatalogProductDetails: true,
      };

      const response = await this.apiRequest<any>('/sell/inventory/v1/offer', {
        method: 'POST',
        body: JSON.stringify(offerPayload),
      });

      const offerId = response.offerId;

      // Step 3: Publish the offer
      await this.apiRequest(`/sell/inventory/v1/offer/${offerId}/publish`, {
        method: 'POST',
      });

      return {
        success: true,
        status: 'published',
        externalUrl: `https://www.ebay.com/itm/${offerId}`,
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
    await this.apiRequest(`/sell/inventory/v1/offer/${externalId}/withdraw`, {
      method: 'POST',
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(
        `/sell/inventory/v1/offer/${externalId}`
      );

      return {
        status: response.status === 'PUBLISHED' ? 'active' : 'inactive',
        lastModified: new Date(response.lastModifiedDate),
      };
    } catch {
      return {
        status: 'inactive',
        reason: 'Unable to fetch status',
      };
    }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest(`/sell/inventory/v1/inventory_item/${externalId}`, {
      method: 'PUT',
      body: JSON.stringify({
        availability: {
          shipToLocationAvailability: {
            quantity,
          },
        },
      }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(
        `/sell/inventory/v1/inventory_item/${externalId}`
      );
      return response.availability?.shipToLocationAvailability?.quantity || 0;
    } catch {
      return 0;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>(
        '/sell/taxonomy/v1/category_tree?category_tree_id=0'
      );

      return this.flattenCategoryTree(response.rootCategoryNode);
    } catch {
      return [];
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(
        `/sell/taxonomy/v1/category_tree/0/get_item_aspects_for_category?category_id=${categoryId}`
      );

      return response.aspects?.map((aspect: any) => ({
        id: aspect.localizedAspectName || aspect.aspectId,
        name: aspect.localizedAspectName,
        type: aspect.aspectDataType === 'STRING' ? 'text' : 'select',
        required: aspect.aspectRequired || false,
        options: aspect.aspectValues?.map((val: any) => ({
          value: val.localizedValue,
          label: val.localizedValue,
        })),
      })) || [];
    } catch {
      return [];
    }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    try {
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

    if (!listing.title || listing.title.length < 5) {
      errors.push({
        field: 'title',
        message: 'eBay requires product title to be at least 5 characters',
        severity: 'error',
      });
    }

    if (listing.title && listing.title.length > 80) {
      errors.push({
        field: 'title',
        message: 'eBay product title cannot exceed 80 characters',
        severity: 'error',
      });
    }

    if (!listing.sku) {
      errors.push({
        field: 'sku',
        message: 'eBay requires SKU for inventory tracking',
        severity: 'error',
      });
    }

    if (!listing.images || listing.images.length === 0) {
      errors.push({
        field: 'images',
        message: 'eBay requires at least 1 product image',
        severity: 'error',
      });
    }

    if (listing.images && listing.images.length > 24) {
      errors.push({
        field: 'images',
        message: 'eBay allows maximum 24 images',
        severity: 'error',
      });
    }

    if (!listing.description) {
      errors.push({
        field: 'description',
        message: 'eBay requires product description',
        severity: 'error',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  // Helper methods
  private mapListingToEbayAspects(listing: Partial<Listing>): Record<string, string[]> {
    const aspects: Record<string, string[]> = {};

    if (listing.brand) {
      aspects['Brand'] = [listing.brand];
    }

    if (listing.tags) {
      listing.tags.forEach((tag) => {
        const [key, value] = tag.split(':');
        if (key && value) {
          aspects[key] = [value];
        }
      });
    }

    return aspects;
  }

  private mapCondition(condition?: string): string {
    const map: Record<string, string> = {
      new: 'NEW',
      used: 'USED',
      refurbished: 'MANUFACTURER_REFURBISHED',
    };
    return map[condition || 'new'] || 'NEW';
  }

  private unmapCondition(ebayCondition?: string): 'new' | 'used' | 'refurbished' {
    const map: Record<string, 'new' | 'used' | 'refurbished'> = {
      NEW: 'new',
      USED: 'used',
      MANUFACTURER_REFURBISHED: 'refurbished',
      SELLER_REFURBISHED: 'refurbished',
    };
    return map[ebayCondition || 'NEW'] || 'new';
  }

  private flattenCategoryTree(node: any, parentId?: string): Category[] {
    const categories: Category[] = [];

    if (node) {
      categories.push({
        id: node.categoryId,
        name: node.categoryName,
        parentId,
        leaf: !node.childCategoryTreeNodes || node.childCategoryTreeNodes.length === 0,
      });

      if (node.childCategoryTreeNodes) {
        node.childCategoryTreeNodes.forEach((child: any) => {
          categories.push(...this.flattenCategoryTree(child, node.categoryId));
        });
      }
    }

    return categories;
  }
}
