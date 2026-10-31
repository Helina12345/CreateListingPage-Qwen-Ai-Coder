// ============================================================
// KOHL'S ADAPTER
// ============================================================
export class KohlsAdapter extends BaseMarketplaceAdapter {
  marketplaceId: MarketplaceId = 'kohls';
  name = "Kohl's";

  constructor() {
    super('https://marketplace.kohls.com/api');
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    // Kohl's integration is not yet verified
    return { connected: false, permissions: [], };
  }

  async refreshToken(): Promise<void> {
    throw new Error("Kohl's integration is not yet verified. API access pending.");
  }

  async createProduct(_listing: Partial<Listing>): Promise<CreateProductResult> {
    return { success: false, errors: ["Kohl's integration is not yet available"] };
  }

  async updateProduct(_id: string, _listing: Partial<Listing>): Promise<UpdateProductResult> {
    return { success: false, errors: ["Kohl's integration is not yet available"] };
  }

  async deleteProduct(_id: string): Promise<void> {
    throw new Error("Kohl's integration is not yet available");
  }

  async getProduct(_id: string): Promise<Partial<Listing> | null> { return null; }

  async publishProduct(_id: string): Promise<PublishResult> {
    return { success: false, status: 'failed', errors: ["Kohl's integration is not yet available"] };
  }

  async unpublishProduct(_id: string): Promise<void> {
    throw new Error("Kohl's integration is not yet available");
  }

  async getProductStatus(_id: string): Promise<ProductStatus> {
    return { status: 'inactive', reason: "Kohl's integration is not yet available" };
  }

  async updateInventory(_id: string, _quantity: number): Promise<void> {
    throw new Error("Kohl's integration is not yet available");
  }

  async getInventory(_id: string): Promise<number> { return 0; }

  async getCategories(): Promise<Category[]> { return []; }

  async getCategoryAttributes(_categoryId: string): Promise<CategoryAttribute[]> { return []; }

  async uploadImage(_image: File | Blob): Promise<ImageUploadResult> {
    return { success: false, error: "Kohl's integration is not yet available" };
  }

  async validateProduct(listing: Partial<Listing>): Promise<ValidationResult> {
    return {
      valid: false,
      errors: [{ field: 'integration', message: "Kohl's integration is not yet verified. Please contact support.", severity: 'error' }],
    };
  }
}