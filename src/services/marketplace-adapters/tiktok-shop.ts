// ============================================================
// TIKTOK SHOP ADAPTER
// ============================================================
export class TikTokShopAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'tiktok_shop';
  name = 'TikTok Shop';

  constructor() {
    super('https://open-api.tiktokglobalshop.com');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      if (!this.accessToken) return { connected: false, permissions: [] };
      return { connected: true, storeName: 'TikTok Shop', lastSynced: new Date(), permissions: ['product.read', 'product.write'] };
    } catch { return { connected: false, permissions: [] }; }
  }

  async refreshToken(): Promise<void> {
    const response = await fetch('https://auth.tiktok-shops.com/api/v2/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: import.meta.env.VITE_TIKTOK_APP_KEY,
        app_secret: import.meta.env.VITE_TIKTOK_APP_SECRET,
        refresh_token: this.refreshTokenValue,
        grant_type: 'refresh_token',
      }),
    });
    if (!response.ok) throw new Error('Failed to refresh TikTok token');
    const data = await response.json();
    this.accessToken = data.access_token;
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        title: listing.title,
        description: listing.description,
        category_id: '0',
        brand_id: '0',
        models: [{ name: 'Default', original_price: listing.pricing?.basePrice, stock: listing.inventory?.totalQuantity }],
        main_images: listing.images?.slice(0, 1).map((img) => ({ uri: img.url })) || [],
      };
      const response = await this.apiRequest<any>('/products/202309/products', { method: 'POST', body: JSON.stringify(payload) });
      return { success: true, externalId: response.data?.id };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest(`/products/202309/products/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: listing.title, description: listing.description }),
      });
      return { success: true };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/products/202309/products/${externalId}`, { method: 'DELETE' });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/products/${externalId}`);
      return { title: response.data?.title, description: response.data?.description };
    } catch { return null; }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest(`/products/202309/products/${externalId}/activate`, { method: 'POST' });
      return { success: true, status: 'published' };
    } catch (error: any) { return { success: false, status: 'failed', errors: [error.message] }; }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/products/202309/products/${externalId}/deactivate`, { method: 'POST' });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/products/${externalId}`);
      return { status: response.data?.status === 1 ? 'active' : 'inactive' };
    } catch { return { status: 'inactive' }; }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/products/202309/inventory', {
      method: 'POST',
      body: JSON.stringify({ product_id: externalId, stock: quantity }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/products/${externalId}`);
      return response.data?.models?.[0]?.stock || 0;
    } catch { return 0; }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/products/202309/categories');
      return response.data?.map((c: any) => ({ id: c.id, name: c.local_name, leaf: c.is_leaf })) || [];
    } catch { return []; }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/products/202309/categories/${categoryId}/attributes`);
      return response.data?.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.value_type === 'INT' ? 'number' : 'select',
        required: a.is_required,
        options: a.values?.map((v: any) => ({ value: v.id, label: v.name })),
      })) || [];
    } catch { return []; }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return { success: false, error: 'TikTok Shop requires publicly accessible image URLs' };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    if (!listing.title || listing.title.length > 255) {
      errors.push({ field: 'title', message: 'TikTok Shop title must be 1-255 characters', severity: 'error' });
    }
    if (!listing.description) errors.push({ field: 'description', message: 'TikTok Shop requires description', severity: 'error' });
    if (!listing.images || listing.images.length === 0) {
      errors.push({ field: 'images', message: 'TikTok Shop requires at least 1 image', severity: 'error' });
    }
    if (listing.condition !== 'new') {
      errors.push({ field: 'condition', message: 'TikTok Shop primarily accepts new items', severity: 'warning' });
    }
    return { valid: errors.filter((e) => e.severity === 'error').length === 0, errors };
  }
}
