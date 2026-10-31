// ============================================================
// WALMART ADAPTER
// ============================================================
export class WalmartAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'walmart';
  name = 'Walmart';

  constructor() {
    super('https://marketplace.walmartapis.com');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      if (!this.accessToken) return { connected: false, permissions: [] };
      return { connected: true, storeName: 'Walmart Store', lastSynced: new Date(), permissions: ['items', 'inventory', 'orders'] };
    } catch { return { connected: false, permissions: [] }; }
  }

  async refreshToken(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v3/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${import.meta.env.VITE_WALMART_CLIENT_ID}:${import.meta.env.VITE_WALMART_CLIENT_SECRET}`),
        'WM_SVC.NAME': 'Marketplace',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error('Failed to refresh Walmart token');
    const data = await response.json();
    this.accessToken = data.access_token;
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
      const response = await this.apiRequest<any>('/v3/items', { method: 'POST', body: JSON.stringify(payload) });
      return { success: true, externalId: response.itemId };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest(`/v3/items/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify({ ProductName: listing.title, price: listing.pricing?.basePrice }),
      });
      return { success: true };
    } catch (error: any) { return { success: false, errors: [error.message] }; }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/v3/items/${externalId}`, { method: 'DELETE' });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/v3/items/${externalId}`);
      return { title: response.ProductName, description: response.ShortDescription, brand: response.Brand };
    } catch { return null; }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    // Walmart publishes automatically when item is created
    return { success: true, status: 'published', externalUrl: `https://www.walmart.com/ip/${externalId}` };
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.updateInventory(externalId, 0);
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/v3/items/${externalId}`);
      return { status: response.lifecycleStatus === 'ACTIVE' ? 'active' : 'inactive' };
    } catch { return { status: 'inactive' }; }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest('/v3/inventory', {
      method: 'PUT',
      body: JSON.stringify({ sku: externalId, quantity }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/v3/inventory?sku=${externalId}`);
      return response.quantity || 0;
    } catch { return 0; }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/v3/taxonomy');
      return response?.categories?.map((c: any) => ({ id: c.id, name: c.name, leaf: !c.children })) || [];
    } catch { return []; }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/v3/items/specs?category=${categoryId}`);
      return response?.map((s: any) => ({ id: s.name, name: s.name, type: 'text', required: s.required })) || [];
    } catch { return []; }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    // Walmart requires publicly accessible image URLs
    return { success: false, error: 'Walmart requires publicly accessible image URLs' };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    if (!listing.title || listing.title.length > 200) {
      errors.push({ field: 'title', message: 'Walmart title must be 1-200 characters', severity: 'error' });
    }
    if (!listing.brand) {
      errors.push({ field: 'brand', message: 'Walmart requires brand', severity: 'error' });
    }
    if (!listing.upc && !listing.ean) {
      errors.push({ field: 'gtin', message: 'Walmart requires UPC/EAN for most products', severity: 'error' });
    }
    if (!listing.images || listing.images.length === 0) {
      errors.push({ field: 'images', message: 'Walmart requires main image', severity: 'error' });
    }
    return { valid: errors.filter((e) => e.severity === 'error').length === 0, errors };
  }
}