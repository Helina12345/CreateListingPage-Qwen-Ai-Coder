// ============================================================
// ListingDesk Pro — Input Validation Service
// Complete validation with Zod schemas
// ============================================================

import { z } from 'zod';

// ============================================================
// COMMON SCHEMAS
// ============================================================

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const idSchema = z.string().cuid('Invalid ID format');
export const urlSchema = z.string().url('Invalid URL');
export const uuidSchema = z.string().uuid('Invalid UUID');

// ============================================================
// AUTHENTICATION SCHEMAS
// ============================================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  avatar: urlSchema.optional(),
});

// ============================================================
// PRODUCT SCHEMAS
// ============================================================

export const createProductSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  brand: z.string().max(100).optional(),
  condition: z.enum(['new', 'used', 'refurbished']).default('new'),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  upc: z.string().max(20).optional(),
  ean: z.string().max(20).optional(),
  isbn: z.string().max(20).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  search: z.string().max(100).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================================
// LISTING SCHEMAS
// ============================================================

export const createListingSchema = z.object({
  productId: idSchema,
  marketplaceId: z.string(),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
});

export const publishListingSchema = z.object({
  marketplaceIds: z.array(z.string()).min(1, 'At least one marketplace is required'),
});

// ============================================================
// ORDER SCHEMAS
// ============================================================

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'ordered_from_supplier',
    'shipped_by_supplier',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  marketplaceId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
});

// ============================================================
// INVENTORY SCHEMAS
// ============================================================

export const updateInventorySchema = z.object({
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
  reason: z.enum(['restock', 'adjustment', 'sync', 'sale', 'return', 'cancel']),
  notes: z.string().max(500).optional(),
});

export const allocateInventorySchema = z.object({
  allocations: z.array(
    z.object({
      marketplaceId: z.string(),
      quantity: z.number().int().nonnegative(),
    })
  ),
});

// ============================================================
// MARKETPLACE CONNECTION SCHEMAS
// ============================================================

export const connectMarketplaceSchema = z.object({
  marketplaceId: z.string(),
  credentials: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    redirectUri: urlSchema.optional(),
  }),
});

export const oauthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// ============================================================
// SUPPLIER SCHEMAS
// ============================================================

export const searchSupplierProductsSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const placeSupplierOrderSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  shippingAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(2),
  }),
});

export const sendMessageToSupplierSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000),
});

// ============================================================
// PAYMENT SCHEMAS
// ============================================================

export const addBalanceSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  paymentMethodId: z.string(),
});

export const chargeBalanceSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1).max(500),
  referenceId: z.string().optional(),
});

export const refundSchema = z.object({
  transactionId: idSchema,
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

export const createNotificationSchema = z.object({
  type: z.enum([
    'listing_published',
    'listing_failed',
    'order_received',
    'order_shipped',
    'inventory_low',
    'price_change',
    'supplier_order_placed',
    'supplier_order_shipped',
    'balance_low',
    'system_alert',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  actionUrl: urlSchema.optional(),
  meta z.record(z.any()).optional(),
});

export const notificationFilterSchema = z.object({
  read: z.boolean().optional(),
  type: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
});

// ============================================================
// ANALYTICS SCHEMAS
// ============================================================

export const analyticsFilterSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).default('week'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  marketplaceId: z.string().optional(),
});

// ============================================================
// IMPORT/EXPORT SCHEMAS
// ============================================================

export const importSchema = z.object({
  format: z.enum(['csv', 'json']),
   z.string().min(1, 'Data is required'),
  updateExisting: z.boolean().default(false),
  skipValidation: z.boolean().default(false),
});

export const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  includeImages: z.boolean().default(false),
  includeVariants: z.boolean().default(false),
  marketplaceIds: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================================
// WEBHOOK SCHEMAS
// ============================================================

export const webhookPayloadSchema = z.object({
  marketplaceId: z.string(),
  eventType: z.string(),
   z.record(z.any()),
  signature: z.string().optional(),
  timestamp: z.string().optional(),
});

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

export function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      req.validatedData = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      req.validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      req.validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeObject(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }

  return sanitized;
}

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validateUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

export function validateId(id: string): boolean {
  return idSchema.safeParse(id).success;
}

// ============================================================
// CUSTOM VALIDATORS
// ============================================================

export const marketplaceIdSchema = z.enum([
  'amazon',
  'ebay',
  'shopify',
  'etsy',
  'walmart',
  'tiktok_shop',
  'shopee',
  'lazada',
  'kohls',
]);

export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY']);

export const conditionSchema = z.enum(['new', 'used', 'refurbished']);

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'ordered_from_supplier',
  'shipped_by_supplier',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'returned',
]);

export const listingStatusSchema = z.enum([
  'pending',
  'publishing',
  'published',
  'failed',
  'paused',
]);

export const productStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'archived',
]);
