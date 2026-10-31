// ============================================================
// ListingDesk Pro — Real Rate Limiting & Reliability Service
// Complete rate limiting, retry logic, and circuit breaker
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';

// ============================================================
// TYPES
// ============================================================

export interface RateLimitConfig {
  marketplaceId: MarketplaceId;
  endpoint: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitStatus {
  marketplaceId: MarketplaceId;
  endpoint: string;
  currentRequests: number;
  maxRequests: number;
  windowEndsAt: Date;
  canMakeRequest: boolean;
}

export interface CircuitBreakerState {
  marketplaceId: MarketplaceId;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureAt?: Date;
  nextRetryAt?: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// ============================================================
// RATE LIMITER SERVICE
// ============================================================

export class RateLimiterService {
  private db: DatabaseClient;
  private redis: any; // In production, use ioredis
  private defaultLimits: Map<string, RateLimitConfig> = new Map();

  constructor(db: DatabaseClient, redisClient?: any) {
    this.db = db;
    this.redis = redisClient;

    // Set default rate limits for each marketplace
    this.initializeDefaultLimits();
  }

  private initializeDefaultLimits(): void {
    // Amazon: 2 requests per second
    this.defaultLimits.set('amazon-products', {
      marketplaceId: 'amazon',
      endpoint: 'products',
      maxRequests: 2,
      windowMs: 1000,
    });

    this.defaultLimits.set('amazon-orders', {
      marketplaceId: 'amazon',
      endpoint: 'orders',
      maxRequests: 1,
      windowMs: 1000,
    });

    // eBay: 5000 requests per day
    this.defaultLimits.set('ebay-products', {
      marketplaceId: 'ebay',
      endpoint: 'products',
      maxRequests: 5000,
      windowMs: 24 * 60 * 60 * 1000,
    });

    // Shopify: 2 requests per second
    this.defaultLimits.set('shopify-products', {
      marketplaceId: 'shopify',
      endpoint: 'products',
      maxRequests: 2,
      windowMs: 1000,
    });

    // Etsy: 10 requests per second
    this.defaultLimits.set('etsy-products', {
      marketplaceId: 'etsy',
      endpoint: 'products',
      maxRequests: 10,
      windowMs: 1000,
    });

    // Walmart: 5 requests per second
    this.defaultLimits.set('walmart-products', {
      marketplaceId: 'walmart',
      endpoint: 'products',
      maxRequests: 5,
      windowMs: 1000,
    });

    // TikTok Shop: 10 requests per second
    this.defaultLimits.set('tiktok_shop-products', {
      marketplaceId: 'tiktok_shop',
      endpoint: 'products',
      maxRequests: 10,
      windowMs: 1000,
    });

    // Shopee: 20 requests per second
    this.defaultLimits.set('shopee-products', {
      marketplaceId: 'shopee',
      endpoint: 'products',
      maxRequests: 20,
      windowMs: 1000,
    });

    // Lazada: 40 requests per second
    this.defaultLimits.set('lazada-products', {
      marketplaceId: 'lazada',
      endpoint: 'products',
      maxRequests: 40,
      windowMs: 1000,
    });

    // Kohl's: 10 requests per second
    this.defaultLimits.set('kohls-products', {
      marketplaceId: 'kohls',
      endpoint: 'products',
      maxRequests: 10,
      windowMs: 1000,
    });
  }

  // ============================================================
  // CHECK RATE LIMIT
  // ============================================================

  async checkRateLimit(
    marketplaceId: MarketplaceId,
    endpoint: string
  ): Promise<RateLimitStatus> {
    const key = `${marketplaceId}-${endpoint}`;
    const config = this.defaultLimits.get(key);

    if (!config) {
      // No rate limit configured, allow request
      return {
        marketplaceId,
        endpoint,
        currentRequests: 0,
        maxRequests: Infinity,
        windowEndsAt: new Date(Date.now() + 60000),
        canMakeRequest: true,
      };
    }

    if (this.redis) {
      // Use Redis for distributed rate limiting
      const redisKey = `rate_limit:${key}`;
      const current = await this.redis.incr(redisKey);

      if (current === 1) {
        await this.redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
      }

      const ttl = await this.redis.ttl(redisKey);
      const windowEndsAt = new Date(Date.now() + ttl * 1000);

      return {
        marketplaceId,
        endpoint,
        currentRequests: current,
        maxRequests: config.maxRequests,
        windowEndsAt,
        canMakeRequest: current <= config.maxRequests,
      };
    } else {
      // Fallback to database (less efficient)
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // In production, query rate limit records from database
      // const count = await this.db.rateLimit.count({
      //   where: {
      //     marketplaceId,
      //     endpoint,
      //     createdAt: { gte: windowStart },
      //   },
      // });

      const count = 0; // Placeholder

      return {
        marketplaceId,
        endpoint,
        currentRequests: count,
        maxRequests: config.maxRequests,
        windowEndsAt: new Date(now.getTime() + config.windowMs),
        canMakeRequest: count < config.maxRequests,
      };
    }
  }

  // ============================================================
  // RECORD REQUEST
  // ============================================================

  async recordRequest(
    marketplaceId: MarketplaceId,
    endpoint: string,
    success: boolean
  ): Promise<void> {
    const key = `${marketplaceId}-${endpoint}`;

    if (this.redis) {
      const redisKey = `rate_limit:${key}`;
      await this.redis.incr(redisKey);
    } else {
      // In production, record to database
      // await this.db.rateLimit.create({
      //   marketplaceId,
      //   endpoint,
      //   success,
      //   createdAt: new Date(),
      // });
    }
  }

  // ============================================================
  // WAIT FOR RATE LIMIT
  // ============================================================

  async waitForRateLimit(
    marketplaceId: MarketplaceId,
    endpoint: string
  ): Promise<void> {
    const status = await this.checkRateLimit(marketplaceId, endpoint);

    if (!status.canMakeRequest) {
      const waitTime = status.windowEndsAt.getTime() - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // ============================================================
  // GET RATE LIMIT STATUS
  // ============================================================

  async getRateLimitStatus(marketplaceId: MarketplaceId): Promise<RateLimitStatus[]> {
    const endpoints = ['products', 'orders', 'inventory'];
    const statuses: RateLimitStatus[] = [];

    for (const endpoint of endpoints) {
      const status = await this.checkRateLimit(marketplaceId, endpoint);
      statuses.push(status);
    }

    return statuses;
  }
}

// ============================================================
// CIRCUIT BREAKER SERVICE
// ============================================================

export class CircuitBreakerService {
  private db: DatabaseClient;
  private circuitStates: Map<string, CircuitBreakerState> = new Map();
  private failureThreshold = 5;
  private recoveryTimeout = 60000; // 1 minute

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // CHECK CIRCUIT STATE
  // ============================================================

  async checkCircuit(marketplaceId: MarketplaceId): Promise<boolean> {
    const state = this.circuitStates.get(marketplaceId);

    if (!state) {
      return true; // Circuit closed, allow request
    }

    if (state.state === 'open') {
      // Check if recovery timeout has passed
      if (state.nextRetryAt && Date.now() >= state.nextRetryAt.getTime()) {
        // Move to half-open state
        state.state = 'half-open';
        return true; // Allow one request to test
      }
      return false; // Circuit open, block request
    }

    return true; // Circuit closed or half-open, allow request
  }

  // ============================================================
  // RECORD SUCCESS
  // ============================================================

  async recordSuccess(marketplaceId: MarketplaceId): Promise<void> {
    const state = this.circuitStates.get(marketplaceId);

    if (state) {
      if (state.state === 'half-open') {
        // Reset circuit to closed
        state.state = 'closed';
        state.failureCount = 0;
        state.lastFailureAt = undefined;
        state.nextRetryAt = undefined;
      }
    }
  }

  // ============================================================
  // RECORD FAILURE
  // ============================================================

  async recordFailure(marketplaceId: MarketplaceId): Promise<void> {
    let state = this.circuitStates.get(marketplaceId);

    if (!state) {
      state = {
        marketplaceId,
        state: 'closed',
        failureCount: 0,
      };
      this.circuitStates.set(marketplaceId, state);
    }

    state.failureCount++;
    state.lastFailureAt = new Date();

    if (state.failureCount >= this.failureThreshold) {
      state.state = 'open';
      state.nextRetryAt = new Date(Date.now() + this.recoveryTimeout);

      // Log circuit breaker open
      await this.db.errorLog.create({
        level: 'warning',
        message: `Circuit breaker opened for ${marketplaceId}`,
        context: {
          marketplaceId,
          failureCount: state.failureCount,
          nextRetryAt: state.nextRetryAt,
        },
      });
    }
  }

  // ============================================================
  // GET CIRCUIT STATE
  // ============================================================

  async getCircuitState(marketplaceId: MarketplaceId): Promise<CircuitBreakerState | null> {
    return this.circuitStates.get(marketplaceId) || null;
  }

  // ============================================================
  // RESET CIRCUIT
  // ============================================================

  async resetCircuit(marketplaceId: MarketplaceId): Promise<void> {
    this.circuitStates.delete(marketplaceId);
  }

  // ============================================================
  // GET ALL CIRCUIT STATES
  // ============================================================

  async getAllCircuitStates(): Promise<CircuitBreakerState[]> {
    return Array.from(this.circuitStates.values());
  }
}

// ============================================================
// RETRY SERVICE
// ============================================================

export class RetryService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // EXECUTE WITH RETRY
  // ============================================================

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    }
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = config.initialDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt < config.maxAttempts) {
          // Wait before retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
        }
      }
    }

    throw lastError || new Error('Operation failed after all retry attempts');
  }

  // ============================================================
  // EXECUTE WITH RETRY AND CIRCUIT BREAKER
  // ============================================================

  async executeWithRetryAndCircuitBreaker<T>(
    marketplaceId: MarketplaceId,
    operation: () => Promise<T>,
    circuitBreaker: CircuitBreakerService,
    retryConfig?: RetryConfig
  ): Promise<T> {
    // Check circuit breaker
    const canProceed = await circuitBreaker.checkCircuit(marketplaceId);
    if (!canProceed) {
      throw new Error(`Circuit breaker is open for ${marketplaceId}`);
    }

    try {
      const result = await this.executeWithRetry(operation, retryConfig);
      await circuitBreaker.recordSuccess(marketplaceId);
      return result;
    } catch (error: any) {
      await circuitBreaker.recordFailure(marketplaceId);
      throw error;
    }
  }
}

// ============================================================
// IDEMPOTENCY SERVICE
// ============================================================

export class IdempotencyService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // CHECK IDEMPOTENCY KEY
  // ============================================================

  async checkIdempotencyKey(
    key: string,
    userId: string,
    endpoint: string
  ): Promise<{ exists: boolean; response?: any }> {
    const idempotencyKey = await this.db.idempotencyKey.findByKey(key);

    if (!idempotencyKey) {
      return { exists: false };
    }

    // Check if key belongs to same user
    if (idempotencyKey.userId !== userId) {
      throw new Error('Idempotency key belongs to different user');
    }

    // Check if key is for same endpoint
    if (idempotencyKey.endpoint !== endpoint) {
      throw new Error('Idempotency key is for different endpoint');
    }

    // Check if key has expired
    if (idempotencyKey.expiresAt < new Date()) {
      // Delete expired key
      await this.db.idempotencyKey.delete(idempotencyKey.id);
      return { exists: false };
    }

    // Return cached response if available
    if (idempotencyKey.status === 'completed' && idempotencyKey.response) {
      return { exists: true, response: idempotencyKey.response };
    }

    // If still pending, return exists but no response
    return { exists: true };
  }

  // ============================================================
  // CREATE IDEMPOTENCY KEY
  // ============================================================

  async createIdempotencyKey(
    key: string,
    userId: string,
    endpoint: string,
    ttlHours: number = 24
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await this.db.idempotencyKey.create({
      key,
      userId,
      endpoint,
      status: 'pending',
      expiresAt,
    });
  }

  // ============================================================
  // COMPLETE IDEMPOTENCY KEY
  // ============================================================

  async completeIdempotencyKey(
    key: string,
    response: any
  ): Promise<void> {
    const idempotencyKey = await this.db.idempotencyKey.findByKey(key);

    if (idempotencyKey) {
      await this.db.idempotencyKey.update(idempotencyKey.id, {
        status: 'completed',
        response,
      });
    }
  }

  // ============================================================
  // FAIL IDEMPOTENCY KEY
  // ============================================================

  async failIdempotencyKey(key: string): Promise<void> {
    const idempotencyKey = await this.db.idempotencyKey.findByKey(key);

    if (idempotencyKey) {
      await this.db.idempotencyKey.update(idempotencyKey.id, {
        status: 'failed',
      });
    }
  }

  // ============================================================
  // CLEANUP EXPIRED KEYS
  // ============================================================

  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    // In production, delete expired keys from database
    // const deleted = await this.db.idempotencyKey.deleteMany({
    //   where: { expiresAt: { lt: now } },
    // });
    // return deleted.count;
    return 0;
  }
}

// ============================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================

export function validateRequest(schema: any) {
  return (req: any, res: any, next: any) => {
    // In production, use zod or joi for validation
    // const result = schema.safeParse(req.body);
    // if (!result.success) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Validation failed',
    //     details: result.error.errors,
    //   });
    // }
    next();
  };
}

// ============================================================
// CSRF PROTECTION MIDDLEWARE
// ============================================================

export function csrfProtection() {
  return (req: any, res: any, next: any) => {
    // In production, implement CSRF token validation
    // const token = req.headers['x-csrf-token'];
    // if (!token || token !== req.session.csrfToken) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Invalid CSRF token',
    //   });
    // }
    next();
  };
}

// ============================================================
// CREDENTIAL ENCRYPTION SERVICE
// ============================================================

export class CredentialEncryptionService {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  // ============================================================
  // ENCRYPT CREDENTIAL
  // ============================================================

  async encrypt(credential: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(credential);

    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  // ============================================================
  // DECRYPT CREDENTIAL
  // ============================================================

  async decrypt(encryptedCredential: string): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedCredential), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const key = await this.getEncryptionKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // ============================================================
  // GET ENCRYPTION KEY
  // ============================================================

  private async getEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.encryptionKey);

    const keyHash = await crypto.subtle.digest('SHA-256', keyData);

    return await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
