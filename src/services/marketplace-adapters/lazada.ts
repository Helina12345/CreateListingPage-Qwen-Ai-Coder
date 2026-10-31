// ============================================================
// LAZADA ADAPTER
// ============================================================
export class LazadaAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'lazada';
  name = 'Lazada';

  constructor() {
    super('https://api.lazada.com/rest');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      if (!this.accessToken) return { connected: false, permissions: [] };
      return { connected: true, storeName: 'Lazada Store', lastSynced: new Date(), permissions: ['product', 'order'] };
    } catch { return { connected: false, permissions: [] }; }
  }

  async refreshToken(): Promise<void> {
    const response = await fetch('https://auth.lazada.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshTokenValue || '',
        client_id: import.meta.env.VITE_LAZADA_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_LAZADA_CLIENT_SECRET || '',
      }),
    });
    if (!response.ok) throw new Error('Failed to refresh Lazada token');
    const data = await response.json();
    this.accessToken = data.access_token;
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        attributes: { name: listing.title, description: listing.description, brand_name: listing.brand },
        category_id: 0, // Should be determined from category
        skus: [{
          SellerSku: listing.sku,
          price: listing.pricing?.basePrice,
          quantity: listing.inventory?.totalQuantity,
          Images: listing.images?.map((img) => img.url) || [],
        }],
      };
      const response = await this.apiRequest<any>('/product/create', { method: 'POST', body: JSON.stringify(payload) });
      return { success: true, externalId: response.item_id?.toString() };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest('/product/update', {
        method: 'POST',
        body: JSON.stringify({ item_id: externalId, attributes: { name: listing.title, description: listing.description } }),
      });
      return { success: true };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/remove', { method: 'POST', body: JSON.stringify({ item_id: externalId }) });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/product/get?item_id=${externalId}`);
      return { title: response.data?.name, description: response.data?.description };
    } catch { return null; }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest('/product/update', {
        method: 'POST',
        body: JSON.stringify({ item_id: externalId, status: 'active' }),
      });
      return { success: true, status: 'published' };
    } catch (error: any) { return { success: false, status: 'failed', errors: [error.message] }; }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest('/product/update', {
      method: 'POST',
      body: JSON.stringify({ item_id: externalId, status: 'inactive' }),
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/product/get?item_id=${externalId}`);
      return { status: response.data?.status === 'active' ? 'active' : 'inactive' };
    } catch { return { status: 'inactive' }; }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/product/price_quantity/update', {
      method: 'POST',
      body: JSON.stringify({ item_id: externalId, quantity }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/product/get?item_id=${externalId}`);
      return response.data?.quantity || 0;
    } catch { return 0; }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/category/tree/get');
      return this.flattenCategories(response.data?.categories || []);
    } catch { return []; }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/category/attributes/get?category_id=${categoryId}`);
      return response.data?.map((a: any) => ({
        id: a.id.toString(),
        name: a.name,
        type: 'select',
        required: a.is_required,
        options: a.options?.map((o: any) => ({ value: o.id.toString(), label: o.name })),
      })) || [];
    } catch { return []; }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    return { success: false, error: 'Lazada requires publicly accessible image URLs' };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    if (!listing.title) errors.push({ field: 'title', message: 'Lazada requires product name', severity: 'error' });
    if (!listing.description) errors.push({ field: 'description', message: 'Lazada requires description', severity: 'error' });
    if (!listing.brand) errors.push({ field: 'brand', message: 'Lazada requires brand', severity: 'error' });
    if (!listing.images || listing.images.length === 0) {
      errors.push({ field: 'images', message: 'Lazada requires at least 1 image', severity: 'error' });
    }
    if (listing.images && listing.images.length > 8) {
      errors.push({ field: 'images', message: 'Lazada allows max 8 images', severity: 'error' });
    }
    return { valid: errors.filter((e) => e.severity === 'error').length === 0, errors };
  }

  private flattenCategories(categories: any[]): Category[] {
    const result: Category[] = [];
    for (const cat of categories) {
      result.push({ id: cat.category_id.toString(), name: cat.name, leaf: !cat.children });
      if (cat.children) result.push(...this.flattenCategories(cat.children));
    }
    return result;
  }
}