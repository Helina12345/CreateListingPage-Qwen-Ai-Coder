// ============================================================
// ListingDesk Pro — SKU & Variant Mapping Service
// Maps internal variants to marketplace-specific SKUs
// ============================================================

import type { MarketplaceId, Listing } from '../../types';

export interface SKUMapping {
  id: string;
  listingId: string;
  internalSku: string;
  marketplaceId: MarketplaceId;
  marketplaceSku: string;
  externalId?: string;
  variantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VariantMapping {
  id: string;
  listingId: string;
  internalVariantId: string;
  marketplaceId: MarketplaceId;
  marketplaceVariantId: string;
  marketplaceSku: string;
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage (in production, use database)
const skuMappings: SKUMapping[] = [];
const variantMappings: VariantMapping[] = [];

// ============================================================
// SKU Mapping Functions
// ============================================================

export function createSKUMapping(
  listingId: string,
  internalSku: string,
  marketplaceId: MarketplaceId,
  marketplaceSku: string,
  externalId?: string
): SKUMapping {
  const mapping: SKUMapping = {
    id: `sku_map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    internalSku,
    marketplaceId,
    marketplaceSku,
    externalId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  skuMappings.push(mapping);
  return mapping;
}

export function getSKUMapping(
  listingId: string,
  marketplaceId: MarketplaceId,
  internalSku: string
): SKUMapping | undefined {
  return skuMappings.find(
    (m) => m.listingId === listingId && m.marketplaceId === marketplaceId && m.internalSku === internalSku
  );
}

export function getMarketplaceSKU(
  listingId: string,
  marketplaceId: MarketplaceId,
  internalSku: string
): string | undefined {
  const mapping = getSKUMapping(listingId, marketplaceId, internalSku);
  return mapping?.marketplaceSku;
}

export function getInternalSKU(
  listingId: string,
  marketplaceId: MarketplaceId,
  marketplaceSku: string
): string | undefined {
  const mapping = skuMappings.find(
    (m) => m.listingId === listingId && m.marketplaceId === marketplaceId && m.marketplaceSku === marketplaceSku
  );
  return mapping?.internalSku;
}

export function getAllSKUMappings(listingId: string): SKUMapping[] {
  return skuMappings.filter((m) => m.listingId === listingId);
}

export function updateSKUMapping(
  mappingId: string,
  updates: Partial<Pick<SKUMapping, 'marketplaceSku' | 'externalId'>>
): SKUMapping | undefined {
  const mapping = skuMappings.find((m) => m.id === mappingId);
  if (mapping) {
    Object.assign(mapping, updates, { updatedAt: new Date().toISOString() });
  }
  return mapping;
}

export function deleteSKUMapping(mappingId: string): boolean {
  const index = skuMappings.findIndex((m) => m.id === mappingId);
  if (index !== -1) {
    skuMappings.splice(index, 1);
    return true;
  }
  return false;
}

// ============================================================
// Variant Mapping Functions
// ============================================================

export function createVariantMapping(
  listingId: string,
  internalVariantId: string,
  marketplaceId: MarketplaceId,
  marketplaceVariantId: string,
  marketplaceSku: string,
  attributes: Record<string, string>
): VariantMapping {
  const mapping: VariantMapping = {
    id: `var_map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    internalVariantId,
    marketplaceId,
    marketplaceVariantId,
    marketplaceSku,
    attributes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  variantMappings.push(mapping);
  return mapping;
}

export function getVariantMapping(
  listingId: string,
  marketplaceId: MarketplaceId,
  internalVariantId: string
): VariantMapping | undefined {
  return variantMappings.find(
    (m) => m.listingId === listingId && m.marketplaceId === marketplaceId && m.internalVariantId === internalVariantId
  );
}

export function getMarketplaceVariantId(
  listingId: string,
  marketplaceId: MarketplaceId,
  internalVariantId: string
): string | undefined {
  const mapping = getVariantMapping(listingId, marketplaceId, internalVariantId);
  return mapping?.marketplaceVariantId;
}

export function getInternalVariantId(
  listingId: string,
  marketplaceId: MarketplaceId,
  marketplaceVariantId: string
): string | undefined {
  const mapping = variantMappings.find(
    (m) => m.listingId === listingId && m.marketplaceId === marketplaceId && m.marketplaceVariantId === marketplaceVariantId
  );
  return mapping?.internalVariantId;
}

export function getAllVariantMappings(listingId: string): VariantMapping[] {
  return variantMappings.filter((m) => m.listingId === listingId);
}

export function updateVariantMapping(
  mappingId: string,
  updates: Partial<Pick<VariantMapping, 'marketplaceVariantId' | 'marketplaceSku' | 'attributes'>>
): VariantMapping | undefined {
  const mapping = variantMappings.find((m) => m.id === mappingId);
  if (mapping) {
    Object.assign(mapping, updates, { updatedAt: new Date().toISOString() });
  }
  return mapping;
}

export function deleteVariantMapping(mappingId: string): boolean {
  const index = variantMappings.findIndex((m) => m.id === mappingId);
  if (index !== -1) {
    variantMappings.splice(index, 1);
    return true;
  }
  return false;
}

// ============================================================
// Bulk Operations
// ============================================================

export function createMappingsForListing(
  listing: Listing,
  marketplaceIds: MarketplaceId[]
): { skuMappings: SKUMapping[]; variantMappings: VariantMapping[] } {
  const createdSKUMappings: SKUMapping[] = [];
  const createdVariantMappings: VariantMapping[] = [];

  marketplaceIds.forEach((marketplaceId) => {
    // Create SKU mapping for main product
    const skuMapping = createSKUMapping(
      listing.id,
      listing.sku,
      marketplaceId,
      `${listing.sku}-${marketplaceId.toUpperCase()}`
    );
    createdSKUMappings.push(skuMapping);

    // Create variant mappings
    listing.variants.forEach((variant) => {
      const variantMapping = createVariantMapping(
        listing.id,
        variant.id,
        marketplaceId,
        `${variant.id}-${marketplaceId.toUpperCase()}`,
        `${variant.sku}-${marketplaceId.toUpperCase()}`,
        variant.attributes
      );
      createdVariantMappings.push(variantMapping);
    });
  });

  return {
    skuMappings: createdSKUMappings,
    variantMappings: createdVariantMappings,
  };
}

export function deleteMappingsForListing(listingId: string): void {
  // Delete SKU mappings
  const skuIndices: number[] = [];
  skuMappings.forEach((m, i) => {
    if (m.listingId === listingId) skuIndices.push(i);
  });
  skuIndices.reverse().forEach((i) => skuMappings.splice(i, 1));

  // Delete variant mappings
  const variantIndices: number[] = [];
  variantMappings.forEach((m, i) => {
    if (m.listingId === listingId) variantIndices.push(i);
  });
  variantIndices.reverse().forEach((i) => variantMappings.splice(i, 1));
}

// ============================================================
// Utility Functions
// ============================================================

export function generateMarketplaceSKU(
  baseSKU: string,
  marketplaceId: MarketplaceId,
  variantSuffix?: string
): string {
  const parts = [baseSKU, marketplaceId.toUpperCase()];
  if (variantSuffix) parts.push(variantSuffix);
  return parts.join('-');
}

export function parseMarketplaceSKU(marketplaceSKU: string): {
  baseSKU: string;
  marketplaceId: string;
  variantSuffix?: string;
} | null {
  const parts = marketplaceSKU.split('-');
  if (parts.length < 2) return null;

  return {
    baseSKU: parts[0],
    marketplaceId: parts[1],
    variantSuffix: parts.length > 2 ? parts.slice(2).join('-') : undefined,
  };
}

export function getMappingsSummary(listingId: string): {
  totalSKUMappings: number;
  totalVariantMappings: number;
  marketplaces: MarketplaceId[];
} {
  const skuMappingsForListing = skuMappings.filter((m) => m.listingId === listingId);
  const variantMappingsForListing = variantMappings.filter((m) => m.listingId === listingId);

  const marketplaces = Array.from(
    new Set([
      ...skuMappingsForListing.map((m) => m.marketplaceId),
      ...variantMappingsForListing.map((m) => m.marketplaceId),
    ])
  ) as MarketplaceId[];

  return {
    totalSKUMappings: skuMappingsForListing.length,
    totalVariantMappings: variantMappingsForListing.length,
    marketplaces,
  };
}
