// ============================================================
// ETSY ADAPTER
// ============================================================
export class EtsyAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'etsy';
  name = 'Etsy';

  constructor() {
    super('https://openapi.etsy.com/v3');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      if (!this.accessToken) return { connected: false, permissions: [] };
      const response = await this.apiRequest<any>('/application/listing-active');
      return {
        connected: true,
        storeName: 'Etsy Shop',
        lastSynced: new Date(),
        permissions: ['listings_r', 'listings_w', 'shops_r'],
      };
    } catch {
      return { connected: false, permissions: [] };
    }
  }

  async refreshToken(): Promise<void> {
    const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshTokenValue || '',
        client_id: import.meta.env.VITE_ETSY_CLIENT_ID || '',
      }),
    });
    if (!response.ok) throw new Error('Failed to refresh Etsy token');
    const data = await response.json();
    this.accessToken = data.access_token;
  }

  async createProduct(listing: Partial<Listing>): Promise<CreateProductResult> {
    try {
      const payload = {
        title: listing.title,
        description: listing.description,
        price: listing.pricing?.basePrice,
        quantity: listing.inventory?.totalQuantity,
        who_made: 'i_did',
        when_made: '2020_2025',
        is_supply: 'false',
        taxonomy_id: 0, // Should be determined from category
      };
      const response = await this.apiRequest<any>('/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, externalId: response.listing_id?.toString() };
    } catch (error: any) {
      return { success: false, errors: [error.message] };
    }
  }

  async updateProduct(externalId: string, listing: Partial<Listing>): Promise<UpdateProductResult> {
    try {
      await this.apiRequest(`/listings/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: listing.title,
          description: listing.description,
          price: listing.pricing?.basePrice,
          quantity: listing.inventory?.totalQuantity,
        }),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, errors: [error.message] };
    }
  }

  async deleteProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/listings/${externalId}`, { method: 'DELETE' });
  }

  async getProduct(externalId: string): Promise<Partial<Listing> | null> {
    try {
      const response = await this.apiRequest<any>(`/listings/${externalId}`);
      return {
        title: response.title,
        description: response.description,
        pricing: { basePrice: response.price, currency: 'USD', marketplacePrices: {} as any, pricingRules: [] },
        inventory: { totalQuantity: response.quantity, allocatedPerMarketplace: {} as any, lowStockThreshold: 0, reorderPoint: 0, lastUpdated: new Date().toISOString() },
      };
    } catch { return null; }
  }

  async publishProduct(externalId: string): Promise<PublishResult> {
    try {
      await this.apiRequest(`/listings/${externalId}`, {
        method: 'PUT',
        body: JSON.stringify({ state: 'active' }),
      });
      return { success: true, status: 'published', externalUrl: `https://www.etsy.com/listing/${externalId}` };
    } catch (error: any) {
      return { success: false, status: 'failed', errors: [error.message] };
    }
  }

  async unpublishProduct(externalId: string): Promise<void> {
    await this.apiRequest(`/listings/${externalId}`, {
      method: 'PUT',
      body: JSON.stringify({ state: 'inactive' }),
    });
  }

  async getProductStatus(externalId: string): Promise<ProductStatus> {
    try {
      const response = await this.apiRequest<any>(`/listings/${externalId}`);
      return { status: response.state === 'active' ? 'active' : 'inactive' };
    } catch { return { status: 'inactive' }; }
  }

  async updateInventory(externalId: string, quantity: number): Promise<void> {
    await this.apiRequest(`/listings/${externalId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async getInventory(externalId: string): Promise<number> {
    try {
      const response = await this.apiRequest<any>(`/listings/${externalId}`);
      return response.quantity || 0;
    } catch { return 0; }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.apiRequest<any>('/taxonomy/seller');
      return response?.map((t: any) => ({ id: t.id.toString(), name: t.name, leaf: !t.children })) || [];
    } catch { return []; }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      const response = await this.apiRequest<any>(`/taxonomy/${categoryId}/properties`);
      return response?.map((p: any) => ({
        id: p.property_id.toString(),
        name: p.display_name,
        type: 'select',
        required: p.required,
        options: p.values?.map((v: any) => ({ value: v.value_id.toString(), label: v.value })),
      })) || [];
    } catch { return []; }
  }

  async uploadImage(image: File | Blob): Promise<ImageUploadResult> {
    const formData = new FormData();
    formData.append('image', image);
    try {
      const response = await fetch('/api/images/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return { success: true, url: data.url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    if (!listing.title || listing.title.length > 140) {
      errors.push({ field: 'title', message: 'Etsy title must be 1-140 characters', severity: 'error' });
    }
    if (!listing.description) {
      errors.push({ field: 'description', message: 'Etsy requires description', severity: 'error' });
    }
    if (!listing.pricing?.basePrice || listing.pricing.basePrice <= 0) {
      errors.push({ field: 'price', message: 'Etsy requires valid price', severity: 'error' });
    }
    // Etsy eligibility: must be handmade, vintage, or supply
    if (!listing.tags || listing.tags.length === 0) {
      errors.push({ field: 'tags', message: 'Etsy requires items to be handmade, vintage (20+ years), or craft supplies', severity: 'warning' });
    }
    return { valid: errors.filter((e) => e.severity === 'error').length === 0, errors };
  }
}