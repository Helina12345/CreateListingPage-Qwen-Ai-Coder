// ============================================================
// ListingDesk Pro — Per-User Rate Limiting Service
// Rate limiting based on user ID, not just IP
// ============================================================

import Redis from 'ioredis';

// ============================================================
// TYPES
// ============================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export interface UserRateLimitConfig {
  default: RateLimitConfig;
  authenticated: RateLimitConfig;
  premium: RateLimitConfig;
  admin: RateLimitConfig;
}

// ============================================================
// USER RATE LIMITER SERVICE
// ============================================================

export class UserRateLimiterService {
  private redis: Redis;
  private configs: UserRateLimitConfig;

  constructor(redis: Redis, configs?: Partial<UserRateLimitConfig>) {
    this.redis = redis;
    this.configs = {
      default: configs?.default || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        message: 'Too many requests, please try again later',
      },
      authenticated: configs?.authenticated || {
        windowMs: 15 * 60 * 1000,
        maxRequests: 500,
        message: 'Too many requests, please try again later',
      },
      premium: configs?.premium || {
        windowMs: 15 * 60 * 1000,
        maxRequests: 2000,
        message: 'Too many requests, please try again later',
      },
      admin: configs?.admin || {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10000,
        message: 'Too many requests, please try again later',
      },
    };
  }

  // ============================================================
  // CHECK RATE LIMIT
  // ============================================================

  async checkLimit(
    userId: string,
    userRole: 'default' | 'authenticated' | 'premium' | 'admin' = 'authenticated',
    endpoint?: string
  ): Promise<RateLimitResult> {
    const config = this.configs[userRole];
    const key = this.buildKey(userId, endpoint);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis sorted set for sliding window
    const pipeline = this.redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current entries
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}:${Math.random()}`);

    // Set expiry
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const currentCount = results[1][1] as number;
    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0));
    const resetAt = new Date(now + config.windowMs);

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  }

  // ============================================================
  // BUILD KEY
  // ============================================================

  private buildKey(userId: string, endpoint?: string): string {
    if (endpoint) {
      return `rate_limit:user:${userId}:${endpoint}`;
    }
    return `rate_limit:user:${userId}`;
  }

  // ============================================================
  // MIDDLEWARE
  // ============================================================

  middleware(endpoint?: string) {
    return async (req: any, res: any, next: any) => {
      try {
        // Get user info
        const userId = req.user?.id;
        const userRole = req.user?.role || 'authenticated';

        if (!userId) {
          // No user, use IP-based rate limiting
          return next();
        }

        // Check rate limit
        const result = await this.checkLimit(userId, userRole, endpoint);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', result.limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.resetAt.getTime());

        if (!result.allowed) {
          const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
          res.setHeader('Retry-After', retryAfter);

          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: this.configs[userRole].message,
            retryAfter,
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        next(); // Allow request if rate limiter fails
      }
    };
  }

  // ============================================================
  // ENDPOINT-SPECIFIC LIMITS
  // ============================================================

  async checkEndpointLimit(
    userId: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `rate_limit:endpoint:${userId}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}:${Math.random()}`);
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const currentCount = results[1][1] as number;
    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0));
    const resetAt = new Date(now + config.windowMs);

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  }

  // ============================================================
  // RESET LIMIT
  // ============================================================

  async resetLimit(userId: string, endpoint?: string): Promise<void> {
    const key = this.buildKey(userId, endpoint);
    await this.redis.del(key);
  }

  // ============================================================
  // GET USAGE STATS
  // ============================================================

  async getUsageStats(userId: string, endpoint?: string): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetAt: Date;
  }> {
    const config = this.configs.authenticated;
    const key = this.buildKey(userId, endpoint);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const current = results[1][1] as number;
    const remaining = Math.max(0, config.maxRequests - current);
    const resetAt = new Date(now + config.windowMs);

    return {
      current,
      limit: config.maxRequests,
      remaining,
      resetAt,
    };
  }

  // ============================================================
  // BULK CHECK
  // ============================================================

  async checkMultipleLimits(
    userId: string,
    endpoints: string[]
  ): Promise<Map<string, RateLimitResult>> {
    const results = new Map<string, RateLimitResult>();

    const promises = endpoints.map(async (endpoint) => {
      const result = await this.checkLimit(userId, 'authenticated', endpoint);
      results.set(endpoint, result);
    });

    await Promise.all(promises);

    return results;
  }

  // ============================================================
  // CLEANUP OLD ENTRIES
  // ============================================================

  async cleanup(): Promise<void> {
    // This would be called periodically to clean up old rate limit entries
    // In production, Redis TTL handles this automatically
    console.log('Rate limit cleanup completed');
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createUserRateLimiter(redis: Redis): UserRateLimiterService {
  return new UserRateLimiterService(redis);
}
