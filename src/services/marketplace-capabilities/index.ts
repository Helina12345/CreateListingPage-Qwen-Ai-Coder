// ============================================================
// ListingDesk Pro — Marketplace Capabilities Service
// Identifies which operations are supported by each marketplace integration
// ============================================================

import type { MarketplaceId } from '../../types';

export interface MarketplaceCapabilities {
  marketplaceId: MarketplaceId;
  name: string;
  supported: {
    // Product Operations
    createProduct: boolean;
    updateProduct: boolean;
    deleteProduct: boolean;
    getProduct: boolean;

    // Publishing
    publishProduct: boolean;
    unpublishProduct: boolean;

    // Inventory
    updateInventory: boolean;
    getInventory: boolean;
    bulkInventoryUpdate: boolean;

    // Categories & Attributes
    getCategories: boolean;
    getCategoryAttributes: boolean;
    dynamicCategoryRules: boolean;

    // Images
    uploadImages: boolean;
    maxImages: number;
    imageRequirements: {
      minWidth: number;
      minHeight: number;
      formats: string[];
      maxSizeMB: number;
    };

    // Variants
    supportsVariants: boolean;
    maxVariants: number;
    variantOptions: string[];

    // Pricing
    supportsSalePrice: boolean;
    supportsMAP: boolean;
    currency: string;

    // Shipping
    calculateShipping: boolean;
    generateLabels: boolean;

    // Orders
    getOrders: boolean;
    updateOrderStatus: boolean;

    // Webhooks
    supportsWebhooks: boolean;
    webhookEvents: string[];

    // Special Features
    requiresGTIN: boolean;
    requiresBrand: boolean;
    hazmatRequired: boolean;
    countryOfOriginRequired: boolean;
  };

  limitations: {
    titleMaxLength: number;
    descriptionMaxLength: number;
    maxSkuLength: number;
    restrictedCategories: string[];
    prohibitedItems: string[];
  };

  apiVersion: string;
  lastUpdated: string;
}

// ============================================================
// Marketplace Capabilities Registry
// ============================================================
const capabilitiesRegistry: Record<MarketplaceId, MarketplaceCapabilities> = {
  amazon: {
    marketplaceId: 'amazon',
    name: 'Amazon',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: true,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: false,
      uploadImages: true,
      maxImages: 9,
      imageRequirements: {
        minWidth: 1000,
        minHeight: 1000,
        formats: ['JPEG', 'PNG'],
        maxSizeMB: 10,
      },
      supportsVariants: true,
      maxVariants: 2000,
      variantOptions: ['size', 'color', 'style', 'pattern'],
      supportsSalePrice: true,
      supportsMAP: true,
      currency: 'USD',
      calculateShipping: false,
      generateLabels: false,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: true,
      webhookEvents: ['order.created', 'order.updated', 'inventory.changed'],
      requiresGTIN: true,
      requiresBrand: true,
      hazmatRequired: true,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 200,
      descriptionMaxLength: 2000,
      maxSkuLength: 50,
      restrictedCategories: ['weapons', 'drugs', 'tobacco'],
      prohibitedItems: ['counterfeit', 'illegal', 'hazardous'],
    },
    apiVersion: '2024-01',
    lastUpdated: new Date().toISOString(),
  },

  ebay: {
    marketplaceId: 'ebay',
    name: 'eBay',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: true,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: true,
      uploadImages: true,
      maxImages: 24,
      imageRequirements: {
        minWidth: 500,
        minHeight: 500,
        formats: ['JPEG', 'PNG', 'GIF'],
        maxSizeMB: 7,
      },
      supportsVariants: true,
      maxVariants: 250,
      variantOptions: ['size', 'color', 'style', 'material'],
      supportsSalePrice: true,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: true,
      generateLabels: true,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: true,
      webhookEvents: ['order.created', 'order.updated', 'listing.sold'],
      requiresGTIN: false,
      requiresBrand: false,
      hazmatRequired: false,
      countryOfOriginRequired: true,
    },
    limitations: {
      titleMaxLength: 80,
      descriptionMaxLength: 50000,
      maxSkuLength: 50,
      restrictedCategories: ['weapons', 'drugs', 'tobacco', 'alcohol'],
      prohibitedItems: ['counterfeit', 'illegal', 'recalled'],
    },
    apiVersion: 'v1',
    lastUpdated: new Date().toISOString(),
  },

  shopify: {
    marketplaceId: 'shopify',
    name: 'Shopify',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: true,
      getCategories: true,
      getCategoryAttributes: false,
      dynamicCategoryRules: false,
      uploadImages: true,
      maxImages: 250,
      imageRequirements: {
        minWidth: 2048,
        minHeight: 2048,
        formats: ['JPEG', 'PNG', 'GIF', 'WebP'],
        maxSizeMB: 20,
      },
      supportsVariants: true,
      maxVariants: 2048,
      variantOptions: ['size', 'color', 'material', 'title'],
      supportsSalePrice: true,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: true,
      generateLabels: true,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: true,
      webhookEvents: ['order.created', 'order.updated', 'product.created', 'product.updated'],
      requiresGTIN: false,
      requiresBrand: false,
      hazmatRequired: false,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 255,
      descriptionMaxLength: 50000,
      maxSkuLength: 255,
      restrictedCategories: [],
      prohibitedItems: ['illegal', 'hazardous'],
    },
    apiVersion: '2024-01',
    lastUpdated: new Date().toISOString(),
  },

  etsy: {
    marketplaceId: 'etsy',
    name: 'Etsy',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: false,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: false,
      uploadImages: true,
      maxImages: 10,
      imageRequirements: {
        minWidth: 2000,
        minHeight: 2000,
        formats: ['JPEG', 'PNG'],
        maxSizeMB: 20,
      },
      supportsVariants: true,
      maxVariants: 50,
      variantOptions: ['size', 'color', 'material', 'style'],
      supportsSalePrice: true,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: true,
      generateLabels: false,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: false,
      webhookEvents: [],
      requiresGTIN: false,
      requiresBrand: false,
      hazmatRequired: false,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 140,
      descriptionMaxLength: 50000,
      maxSkuLength: 40,
      restrictedCategories: ['weapons', 'drugs', 'tobacco'],
      prohibitedItems: ['counterfeit', 'mass-produced', 'dropshipped'],
    },
    apiVersion: 'v3',
    lastUpdated: new Date().toISOString(),
  },

  walmart: {
    marketplaceId: 'walmart',
    name: 'Walmart',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: true,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: false,
      uploadImages: true,
      maxImages: 7,
      imageRequirements: {
        minWidth: 1000,
        minHeight: 1000,
        formats: ['JPEG', 'PNG'],
        maxSizeMB: 10,
      },
      supportsVariants: true,
      maxVariants: 500,
      variantOptions: ['size', 'color', 'style'],
      supportsSalePrice: true,
      supportsMAP: true,
      currency: 'USD',
      calculateShipping: false,
      generateLabels: false,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: false,
      webhookEvents: [],
      requiresGTIN: true,
      requiresBrand: true,
      hazmatRequired: true,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 200,
      descriptionMaxLength: 4000,
      maxSkuLength: 50,
      restrictedCategories: ['weapons', 'drugs', 'tobacco', 'alcohol'],
      prohibitedItems: ['counterfeit', 'illegal', 'hazardous'],
    },
    apiVersion: 'v3',
    lastUpdated: new Date().toISOString(),
  },

  tiktok_shop: {
    marketplaceId: 'tiktok_shop',
    name: 'TikTok Shop',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: false,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: true,
      uploadImages: true,
      maxImages: 9,
      imageRequirements: {
        minWidth: 600,
        minHeight: 600,
        formats: ['JPEG', 'PNG'],
        maxSizeMB: 5,
      },
      supportsVariants: true,
      maxVariants: 100,
      variantOptions: ['size', 'color', 'style'],
      supportsSalePrice: true,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: false,
      generateLabels: false,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: true,
      webhookEvents: ['order.created', 'order.updated'],
      requiresGTIN: false,
      requiresBrand: true,
      hazmatRequired: true,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 255,
      descriptionMaxLength: 10000,
      maxSkuLength: 50,
      restrictedCategories: ['weapons', 'drugs', 'tobacco', 'alcohol'],
      prohibitedItems: ['counterfeit', 'illegal', 'hazardous'],
    },
    apiVersion: '202309',
    lastUpdated: new Date().toISOString(),
  },

  shopee: {
    marketplaceId: 'shopee',
    name: 'Shopee',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: false,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: false,
      uploadImages: true,
      maxImages: 9,
      imageRequirements: {
        minWidth: 800,
        minHeight: 800,
        formats: ['JPEG', 'PNG'],
        maxSizeMB: 5,
      },
      supportsVariants: true,
      maxVariants: 50,
      variantOptions: ['size', 'color', 'style'],
      supportsSalePrice: true,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: false,
      generateLabels: false,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: false,
      webhookEvents: [],
      requiresGTIN: false,
      requiresBrand: false,
      hazmatRequired: false,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 120,
      descriptionMaxLength: 5000,
      maxSkuLength: 50,
      restrictedCategories: ['weapons', 'drugs', 'tobacco'],
      prohibitedItems: ['counterfeit', 'illegal'],
    },
    apiVersion: 'v2',
    lastUpdated: new Date().toISOString(),
  },

  lazada: {
    marketplaceId: 'lazada',
    name: 'Lazada',
    supported: {
      createProduct: true,
      updateProduct: true,
      deleteProduct: true,
      getProduct: true,
      publishProduct: true,
      unpublishProduct: true,
      updateInventory: true,
      getInventory: true,
      bulkInventoryUpdate: false,
      getCategories: true,
      getCategoryAttributes: true,
      dynamicCategoryRules: false,
      uploadImages: true,
      maxImages: 8,
      imageRequirements: {
        minWidth: 330,
        minHeight: 330,
        formats: ['JPEG', 'PNG'],
        maxSizeMB: 5,
      },
      supportsVariants: true,
      maxVariants: 50,
      variantOptions: ['size', 'color', 'style'],
      supportsSalePrice: true,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: false,
      generateLabels: false,
      getOrders: true,
      updateOrderStatus: true,
      supportsWebhooks: false,
      webhookEvents: [],
      requiresGTIN: false,
      requiresBrand: true,
      hazmatRequired: false,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 255,
      descriptionMaxLength: 50000,
      maxSkuLength: 50,
      restrictedCategories: ['weapons', 'drugs', 'tobacco'],
      prohibitedItems: ['counterfeit', 'illegal'],
    },
    apiVersion: 'v1',
    lastUpdated: new Date().toISOString(),
  },

  kohls: {
    marketplaceId: 'kohls',
    name: "Kohl's",
    supported: {
      createProduct: false,
      updateProduct: false,
      deleteProduct: false,
      getProduct: false,
      publishProduct: false,
      unpublishProduct: false,
      updateInventory: false,
      getInventory: false,
      bulkInventoryUpdate: false,
      getCategories: false,
      getCategoryAttributes: false,
      dynamicCategoryRules: false,
      uploadImages: false,
      maxImages: 0,
      imageRequirements: {
        minWidth: 0,
        minHeight: 0,
        formats: [],
        maxSizeMB: 0,
      },
      supportsVariants: false,
      maxVariants: 0,
      variantOptions: [],
      supportsSalePrice: false,
      supportsMAP: false,
      currency: 'USD',
      calculateShipping: false,
      generateLabels: false,
      getOrders: false,
      updateOrderStatus: false,
      supportsWebhooks: false,
      webhookEvents: [],
      requiresGTIN: false,
      requiresBrand: false,
      hazmatRequired: false,
      countryOfOriginRequired: false,
    },
    limitations: {
      titleMaxLength: 0,
      descriptionMaxLength: 0,
      maxSkuLength: 0,
      restrictedCategories: [],
      prohibitedItems: [],
    },
    apiVersion: 'N/A',
    lastUpdated: new Date().toISOString(),
  },
};

// ============================================================
// Service Functions
// ============================================================

export function getMarketplaceCapabilities(marketplaceId: MarketplaceId): MarketplaceCapabilities {
  return capabilitiesRegistry[marketplaceId];
}

export function isOperationSupported(marketplaceId: MarketplaceId, operation: string): boolean {
  const capabilities = capabilitiesRegistry[marketplaceId];
  if (!capabilities) return false;
  const value = capabilities.supported[operation as keyof typeof capabilities.supported];
  return typeof value === 'boolean' ? value : false;
}

export function getSupportedMarketplaces(operation: keyof MarketplaceCapabilities['supported']): MarketplaceId[] {
  return (Object.keys(capabilitiesRegistry) as MarketplaceId[]).filter((mpId) =>
    capabilitiesRegistry[mpId].supported[operation]
  );
}

export function getImageRequirements(marketplaceId: MarketplaceId): MarketplaceCapabilities['supported']['imageRequirements'] | null {
  return capabilitiesRegistry[marketplaceId]?.supported.imageRequirements || null;
}

export function getVariantLimits(marketplaceId: MarketplaceId): { maxVariants: number; variantOptions: string[] } | null {
  const caps = capabilitiesRegistry[marketplaceId];
  if (!caps) return null;
  return {
    maxVariants: caps.supported.maxVariants,
    variantOptions: caps.supported.variantOptions,
  };
}

export function checkRequirements(marketplaceId: MarketplaceId): {
  requiresGTIN: boolean;
  requiresBrand: boolean;
  hazmatRequired: boolean;
  countryOfOriginRequired: boolean;
} {
  const caps = capabilitiesRegistry[marketplaceId];
  if (!caps) {
    return {
      requiresGTIN: false,
      requiresBrand: false,
      hazmatRequired: false,
      countryOfOriginRequired: false,
    };
  }
  return {
    requiresGTIN: caps.supported.requiresGTIN,
    requiresBrand: caps.supported.requiresBrand,
    hazmatRequired: caps.supported.hazmatRequired,
    countryOfOriginRequired: caps.supported.countryOfOriginRequired,
  };
}

export function getAllCapabilities(): Record<MarketplaceId, MarketplaceCapabilities> {
  return { ...capabilitiesRegistry };
}
