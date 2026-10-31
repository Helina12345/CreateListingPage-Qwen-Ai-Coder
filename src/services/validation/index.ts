// ============================================================
// ListingDesk Pro — Real Validation Engine
// Per-marketplace field validation with category-specific rules
// ============================================================

import { MARKETPLACE_SCHEMAS, type FieldSchema, type MarketplaceSchema } from '../../config/marketplace-schemas';
import type { MarketplaceId, Listing } from '../../types';

export type ValidationStatus = 'ready' | 'needs_attention' | 'blocked' | 'unknown';

export interface FieldValidationError {
  field: string;
  label: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  marketplaceId: MarketplaceId;
}

export interface MarketplaceValidationResult {
  marketplaceId: MarketplaceId;
  status: ValidationStatus;
  requiredFieldsTotal: number;
  requiredFieldsComplete: number;
  recommendedFieldsTotal: number;
  recommendedFieldsComplete: number;
  errors: FieldValidationError[];
  warnings: FieldValidationError[];
  eligibilityIssues: string[];
  canPublish: boolean;
  blockedReason?: string;
}

export interface OverallValidationResult {
  overallStatus: ValidationStatus;
  readyCount: number;
  needsAttentionCount: number;
  blockedCount: number;
  unknownCount: number;
  totalMarketplaces: number;
  results: MarketplaceValidationResult[];
  canPublishAll: boolean;
}

// ============================================================
// Main Validation Function
// ============================================================
export function validateListingForMarketplace(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId,
  fieldValues: Record<string, any> = {},
  categoryId?: string
): MarketplaceValidationResult {
  const schema = MARKETPLACE_SCHEMAS[marketplaceId];
  if (!schema) {
    return {
      marketplaceId,
      status: 'unknown',
      requiredFieldsTotal: 0,
      requiredFieldsComplete: 0,
      recommendedFieldsTotal: 0,
      recommendedFieldsComplete: 0,
      errors: [],
      warnings: [],
      eligibilityIssues: [],
      canPublish: false,
      blockedReason: 'Marketplace schema not found',
    };
  }

  const errors: FieldValidationError[] = [];
  const warnings: FieldValidationError[] = [];
  const eligibilityIssues: string[] = [];

  // Get applicable fields for this category
  const applicableFields = schema.itemSpecifics.filter((field) => {
    if (!field.category) return true;
    if (!categoryId) return true;
    return field.category.includes(categoryId);
  });

  const requiredFields = applicableFields.filter((f) => f.required || f.group === 'required');
  const recommendedFields = applicableFields.filter((f) => f.group === 'recommended');

  let requiredComplete = 0;
  let recommendedComplete = 0;

  // Validate shared fields (title, description, images, price)
  validateSharedFields(listing, marketplaceId, schema, errors, warnings);

  // Validate marketplace-specific fields
  requiredFields.forEach((field) => {
    const value = fieldValues[field.key] ?? listing[field.key as keyof Listing];
    if (validateFieldValue(field, value, marketplaceId, errors, warnings)) {
      requiredComplete++;
    }
  });

  recommendedFields.forEach((field) => {
    const value = fieldValues[field.key] ?? listing[field.key as keyof Listing];
    if (value !== undefined && value !== null && value !== '') {
      recommendedComplete++;
    }
  });

  // Check product eligibility
  checkProductEligibility(listing, marketplaceId, eligibilityIssues);

  // Determine status
  const hasErrors = errors.length > 0;
  const hasEligibilityIssues = eligibilityIssues.length > 0;

  let status: ValidationStatus;
  let blockedReason: string | undefined;

  if (hasEligibilityIssues) {
    status = 'blocked';
    blockedReason = eligibilityIssues.join('; ');
  } else if (hasErrors) {
    status = 'needs_attention';
  } else if (requiredComplete === requiredFields.length) {
    status = 'ready';
  } else {
    status = 'needs_attention';
  }

  return {
    marketplaceId,
    status,
    requiredFieldsTotal: requiredFields.length,
    requiredFieldsComplete: requiredComplete,
    recommendedFieldsTotal: recommendedFields.length,
    recommendedFieldsComplete: recommendedComplete,
    errors,
    warnings,
    eligibilityIssues,
    canPublish: status === 'ready',
    blockedReason,
  };
}

// ============================================================
// Validate All Selected Marketplaces
// ============================================================
export function validateListingForAllMarketplaces(
  listing: Partial<Listing>,
  marketplaceIds: MarketplaceId[],
  fieldValues: Partial<Record<MarketplaceId, Record<string, any>>> = {},
  categories: Partial<Record<MarketplaceId, string>> = {}
): OverallValidationResult {
  const results = marketplaceIds.map((mpId) =>
    validateListingForMarketplace(listing, mpId, fieldValues[mpId] || {}, categories[mpId])
  );

  const readyCount = results.filter((r) => r.status === 'ready').length;
  const needsAttentionCount = results.filter((r) => r.status === 'needs_attention').length;
  const blockedCount = results.filter((r) => r.status === 'blocked').length;
  const unknownCount = results.filter((r) => r.status === 'unknown').length;

  let overallStatus: ValidationStatus;
  if (blockedCount > 0) overallStatus = 'blocked';
  else if (needsAttentionCount > 0) overallStatus = 'needs_attention';
  else if (readyCount === marketplaceIds.length) overallStatus = 'ready';
  else overallStatus = 'unknown';

  return {
    overallStatus,
    readyCount,
    needsAttentionCount,
    blockedCount,
    unknownCount,
    totalMarketplaces: marketplaceIds.length,
    results,
    canPublishAll: results.every((r) => r.canPublish),
  };
}

// ============================================================
// Shared Field Validation
// ============================================================
function validateSharedFields(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId,
  schema: MarketplaceSchema,
  errors: FieldValidationError[],
  warnings: FieldValidationError[]
): void {
  const mp = schema.name;

  // Title validation
  const title = listing.title || '';
  const maxTitleLength = schema.titleField.maxLength || 255;
  if (!title) {
    errors.push({
      field: 'title',
      label: 'Title',
      message: 'Title is required',
      severity: 'error',
      marketplaceId,
    });
  } else if (title.length > maxTitleLength) {
    errors.push({
      field: 'title',
      label: 'Title',
      message: `Title exceeds ${maxTitleLength} characters (${title.length}/${maxTitleLength})`,
      severity: 'error',
      marketplaceId,
    });
  } else if (title.length < 10) {
    warnings.push({
      field: 'title',
      label: 'Title',
      message: 'Title is too short. Consider adding more descriptive keywords.',
      severity: 'warning',
      marketplaceId,
    });
  }

  // Description validation
  const description = listing.description || '';
  const maxDescLength = schema.descriptionField.maxLength || 50000;
  if (!description) {
    errors.push({
      field: 'description',
      label: 'Description',
      message: 'Description is required',
      severity: 'error',
      marketplaceId,
    });
  } else if (description.length > maxDescLength) {
    errors.push({
      field: 'description',
      label: 'Description',
      message: `Description exceeds ${maxDescLength} characters`,
      severity: 'error',
      marketplaceId,
    });
  } else if (description.length < 50) {
    warnings.push({
      field: 'description',
      label: 'Description',
      message: 'Description is too short. Add more details to help buyers.',
      severity: 'warning',
      marketplaceId,
    });
  }

  // Image validation
  const images = listing.images || [];
  const maxImages = schema.imageFields[0]?.validation?.max || 24;
  const minImages = marketplaceId === 'amazon' ? 1 : 1;
  if (images.length === 0) {
    errors.push({
      field: 'images',
      label: 'Images',
      message: 'At least one image is required',
      severity: 'error',
      marketplaceId,
    });
  } else if (images.length > maxImages) {
    warnings.push({
      field: 'images',
      label: 'Images',
      message: `${mp} allows max ${maxImages} images. Extra images will be ignored.`,
      severity: 'warning',
      marketplaceId,
    });
  }

  // Price validation
  const price = listing.pricing?.basePrice || 0;
  if (price <= 0) {
    errors.push({
      field: 'price',
      label: 'Price',
      message: 'Price must be greater than zero',
      severity: 'error',
      marketplaceId,
    });
  }

  // SKU validation
  if (!listing.sku) {
    errors.push({
      field: 'sku',
      label: 'SKU',
      message: 'SKU is required',
      severity: 'error',
      marketplaceId,
    });
  }

  // Marketplace-specific image requirements
  if (marketplaceId === 'amazon' && images.length > 0) {
    warnings.push({
      field: 'images',
      label: 'Main Image',
      message: 'Amazon requires pure white background (RGB 255,255,255) for main image',
      severity: 'warning',
      marketplaceId,
    });
  }
}

// ============================================================
// Field Value Validation
// ============================================================
function validateFieldValue(
  field: FieldSchema,
  value: any,
  marketplaceId: MarketplaceId,
  errors: FieldValidationError[],
  warnings: FieldValidationError[]
): boolean {
  // Check if value is present
  const isEmpty = value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (field.required && isEmpty) {
    errors.push({
      field: field.key,
      label: field.label,
      message: `${field.label} is required`,
      severity: 'error',
      marketplaceId,
    });
    return false;
  }

  if (isEmpty) return false;

  // Type-specific validation
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'url':
      if (typeof value === 'string') {
        if (field.maxLength && value.length > field.maxLength) {
          errors.push({
            field: field.key,
            label: field.label,
            message: `${field.label} exceeds ${field.maxLength} characters`,
            severity: 'error',
            marketplaceId,
          });
          return false;
        }
        if (field.minLength && value.length < field.minLength) {
          warnings.push({
            field: field.key,
            label: field.label,
            message: `${field.label} should be at least ${field.minLength} characters`,
            severity: 'warning',
            marketplaceId,
          });
        }
        if (field.type === 'url' && value && !isValidUrl(value)) {
          errors.push({
            field: field.key,
            label: field.label,
            message: `${field.label} must be a valid URL`,
            severity: 'error',
            marketplaceId,
          });
          return false;
        }
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: field.key,
              label: field.label,
              message: `${field.label} format is invalid`,
              severity: 'error',
              marketplaceId,
            });
            return false;
          }
        }
      }
      break;

    case 'number':
    case 'currency':
    case 'weight':
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) {
        errors.push({
          field: field.key,
          label: field.label,
          message: `${field.label} must be a number`,
          severity: 'error',
          marketplaceId,
        });
        return false;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        errors.push({
          field: field.key,
          label: field.label,
          message: `${field.label} must be at least ${field.validation.min}`,
          severity: 'error',
          marketplaceId,
        });
        return false;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        errors.push({
          field: field.key,
          label: field.label,
          message: `${field.label} must not exceed ${field.validation.max}`,
          severity: 'error',
          marketplaceId,
        });
        return false;
      }
      break;

    case 'select':
      if (field.options && !field.options.some((opt) => opt.value === value)) {
        errors.push({
          field: field.key,
          label: field.label,
          message: `Please select a valid option for ${field.label}`,
          severity: 'error',
          marketplaceId,
        });
        return false;
      }
      break;

    case 'gtin':
      if (typeof value === 'string' && !isValidGTIN(value)) {
        warnings.push({
          field: field.key,
          label: field.label,
          message: `${field.label} format may be invalid. Please verify.`,
          severity: 'warning',
          marketplaceId,
        });
      }
      break;
  }

  return true;
}

// ============================================================
// Product Eligibility Checks
// ============================================================
function checkProductEligibility(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId,
  eligibilityIssues: string[]
): void {
  switch (marketplaceId) {
    case 'etsy':
      // Etsy requires items to be handmade, vintage, or craft supplies
      // We can't verify this automatically, so we warn the user
      if (!listing.tags || listing.tags.length === 0) {
        eligibilityIssues.push('Etsy requires items to be handmade, vintage (20+ years), or craft supplies. Please verify your item qualifies.');
      }
      break;

    case 'amazon':
      // Amazon requires GTIN for most categories
      if (!listing.upc && !listing.ean) {
        eligibilityIssues.push('Amazon typically requires a GTIN (UPC/EAN/ISBN) for most products. Consider adding one.');
      }
      // Amazon brand registry check
      if (!listing.brand) {
        eligibilityIssues.push('Amazon requires a brand name. Brand Registry may be needed for some categories.');
      }
      break;

    case 'ebay':
      // eBay has restrictions on certain categories
      if (listing.condition === 'refurbished' && !listing.brand) {
        eligibilityIssues.push('eBay refurbished items require brand name and may need certification.');
      }
      break;

    case 'walmart':
      // Walmart requires specific identifiers
      if (!listing.upc && !listing.ean) {
        eligibilityIssues.push('Walmart requires product identifiers (UPC/EAN/GTIN) for most products.');
      }
      break;

    case 'kohls':
      // Kohl's has strict brand requirements
      if (!listing.brand) {
        eligibilityIssues.push("Kohl's requires brand information for all products.");
      }
      // Kohl's may require UPC
      if (!listing.upc) {
        eligibilityIssues.push("Kohl's requires UPC for all products.");
      }
      break;

    case 'tiktok_shop':
      // TikTok Shop has category restrictions
      if (listing.condition !== 'new') {
        eligibilityIssues.push('TikTok Shop primarily accepts new items. Used items may have limited eligibility.');
      }
      break;

    case 'shopee':
    case 'lazada':
      // Southeast Asian marketplaces have specific restrictions
      // No specific checks needed beyond basic validation
      break;

    case 'shopify':
      // Shopify is flexible, no specific eligibility issues
      break;
  }
}

// ============================================================
// Utility Functions
// ============================================================
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidGTIN(value: string): boolean {
  // Basic GTIN validation (UPC-A, EAN-13, ISBN)
  const cleaned = value.replace(/[-\s]/g, '');
  return /^[0-9]{8,14}$/.test(cleaned);
}

// ============================================================
// Category-Specific Validation
// ============================================================
export function validateCategorySpecificFields(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId,
  categoryId: string,
  fieldValues: Record<string, any>
): FieldValidationError[] {
  const schema = MARKETPLACE_SCHEMAS[marketplaceId];
  if (!schema) return [];

  const errors: FieldValidationError[] = [];
  const categoryFields = schema.itemSpecifics.filter(
    (field) => field.category && field.category.includes(categoryId)
  );

  categoryFields.forEach((field) => {
    const value = fieldValues[field.key];
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.key,
        label: field.label,
        message: `${field.label} is required for this category`,
        severity: 'error',
        marketplaceId,
      });
    }
  });

  return errors;
}
