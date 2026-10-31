// ============================================================
// SHOPEE ADAPTER
// ============================================================
export class ShopeeAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'shopee';
  name = 'Shopee';

  constructor() {
    super('https://partner.shopeemobile.com/api/v2');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      if (!this.accessToken) return { connected: false, permissions: [] };
      return { connected: true, storeName: 'Shopee Shop', lastSynced: new Date(), permissions: ['item', 'order'] };
    } catch { return { connected: false, permissions: [] }; }
  }

  async refreshToken(): Promise<void> {
    const response = await fetch('https://partner.shopeemobile.com/api/v2/auth/access_token/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: this.refreshTokenValue,
        partner_id: import.meta.env.VITE_SHOPEE_PARTNER_ID,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    });
    if (!response.ok) throw new Error('Failed to refresh Shopee token');
    const data = await response.json();
    this.accessToken = data.access_token;
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
      const response = await this.apiRequest<any>('/product/add_item', { method: 'POST', body: JSON.stringify(payload) });
      return { success: true, externalId: response.item_id?.toString() };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest('/product/update_item', {
        method: 'POST',
        body: JSON.stringify({ item_id: externalId, item_name: listing.title, description: listing.description }),
      });
      return { success: true };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/unlist_item', { method: 'POST', body: JSON.stringify({ item_id: externalId }) });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/product/get_item_base_info?item_id=${externalId}`);
      return { title: response.item_name, description: response.description };
    } catch { return null; }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest('/product/model/publish', { method: 'POST', body: JSON.stringify({ item_id: externalId }) });
      return { success: true, status: 'published' };
    } catch (error: any) { return { success: false, status: 'failed', errors: [error.message] }; }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/unlist_item', { method: 'POST', body: JSON.stringify({ item_id: externalId }) });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/product/get_item_base_info?item_id=${externalId}`);
      return { status: response.status === 1 ? 'active' : 'inactive' };
    } catch { return { status: 'inactive' }; }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/product/update_stock', {
      method: 'POST',
      body: JSON.stringify({ item_id: externalId, stock: quantity }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/product/get_item_base_info?item_id=${externalId}`);
      return response.stock || 0;
    } catch { return 0; }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/shop_category/get_shop_category');
      return response?.category_list?.map((c: any) => ({ id: c.shop_category_id.toString(), name: c.category_name, leaf: true })) || [];
    } catch { return []; }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/product/get_attributes?category_id=${categoryId}`);
      return response?.attributes?.map((a: any) => ({
        id: a.attribute_id.toString(),
        name: a.attribute_name,
        type: 'select',
        required: a.is_mandatory,
        options: a.options?.map((o: any) => ({ value: o, label: o })),
      })) || [];
    } catch { return []; }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return { success: false, error: 'Shopee requires publicly accessible image URLs' };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    if (!listing.title || listing.title.length > 120) {
      errors.push({ field: 'title', message: 'Shopee title must be 1-120 characters', severity: 'error' });
    }
    if (!listing.description) errors.push({ field: 'description', message: 'Shopee requires description', severity: 'error' });
    if (!listing.images || listing.images.length === 0) {
      errors.push({ field: 'images', message: 'Shopee requires at least 1 image', severity: 'error' });
    }
    if (listing.images && listing.images.length > 9) {
      errors.push({ field: 'images', message: 'Shopee allows max 9 images', severity: 'error' });
    }
    return { valid: errors.filter((e) => e.severity === 'error').length === 0, errors };
  }
}