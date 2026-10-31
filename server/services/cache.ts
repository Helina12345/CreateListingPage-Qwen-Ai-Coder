// ============================================================
// ListingDesk Pro — Redis Caching Service
// Complete caching implementation with multi-level cache
// ============================================================

import Redis from 'ioredis';

// ============================================================
// TYPES
// ============================================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

// ============================================================
// REDIS CLIENT INITIALIZATION
// ============================================================

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Handle Redis events
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (error) => {
  console.error('Redis error:', error);
});

// ============================================================
// CACHE SERVICE
// ============================================================

export class CacheService {
  private stats = {
    hits: 0,
    misses: 0,
  };

  // ============================================================
  // GET
  // ============================================================

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);

      if (data) {
        this.stats.hits++;
        return JSON.parse(data) as T;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // ============================================================
  // SET
  // ============================================================

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await redis.setex(key, options.ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }

      // Add tags if provided
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key);
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // ============================================================
  // DELETE BY TAG
  // ============================================================

  async deleteByTag(tag: string): Promise<void> {
    try {
      const keys = await redis.smembers(`tag:${tag}`);

      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`tag:${tag}`);
      }
    } catch (error) {
      console.error('Cache delete by tag error:', error);
    }
  }

  // ============================================================
  // GET OR SET (Cache-Aside Pattern)
  // ============================================================

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch data
    const data = await fetcher();

    // Set in cache
    await this.set(key, data, options);

    return data;
  }

  // ============================================================
  // INCREMENT
  // ============================================================

  async increment(key: string, by = 1): Promise<number> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // ============================================================
  // DECREMENT
  // ============================================================

  async decrement(key: string, by = 1): Promise<number> {
    try {
      return await redis.decrby(key, by);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return 0;
    }
  }

  // ============================================================
  // EXISTS
  // ============================================================

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // ============================================================
  // EXPIRE
  // ============================================================

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  }

  // ============================================================
  // TTL
  // ============================================================

  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  }

  // ============================================================
  // FLUSH
  // ============================================================

  async flush(): Promise<void> {
    try {
      await redis.flushdb();
      this.stats = { hits: 0, misses: 0 };
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // ============================================================
  // GET STATS
  // ============================================================

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: 0, // Redis doesn't provide easy size info
    };
  }

  // ============================================================
  // MULTI-LEVEL CACHE
  // ============================================================

  private l1Cache = new Map<string, {  any; expiry: number }>();
  private l1TTL = 60; // 1 minute for L1 cache

  async getMultiLevel<T>(key: string): Promise<T | null> {
    // Check L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && l1Entry.expiry > Date.now()) {
      this.stats.hits++;
      return l1Entry.data as T;
    }

    // Check L2 cache (Redis)
    const l2Data = await this.get<T>(key);
    if (l2Data !== null) {
      // Promote to L1
      this.l1Cache.set(key, {
         l2Data,
        expiry: Date.now() + this.l1TTL * 1000,
      });
      return l2Data;
    }

    this.stats.misses++;
    return null;
  }

  async setMultiLevel<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    // Set in L1
    this.l1Cache.set(key, {
       value,
      expiry: Date.now() + this.l1TTL * 1000,
    });

    // Set in L2 (Redis)
    await this.set(key, value, options);
  }

  async deleteMultiLevel(key: string): Promise<void> {
    // Delete from L1
    this.l1Cache.delete(key);

    // Delete from L2
    await this.delete(key);
  }

  // ============================================================
  // CACHE WARMING
  // ============================================================

  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>, ttl = 3600): Promise<void> {
    const promises = keys.map(async (key) => {
      const exists = await this.exists(key);
      if (!exists) {
        const data = await fetcher(key);
        await this.set(key, data, { ttl });
      }
    });

    await Promise.all(promises);
  }

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    try {
      const values = await redis.mget(...keys);

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          this.stats.hits++;
          result.set(key, JSON.parse(value) as T);
        } else {
          this.stats.misses++;
          result.set(key, null);
        }
      });
    } catch (error) {
      console.error('Cache getMany error:', error);
      keys.forEach((key) => {
        this.stats.misses++;
        result.set(key, null);
      });
    }

    return result;
  }

  async setMany<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    try {
      const pipeline = redis.pipeline();

      entries.forEach(({ key, value, options }) => {
        const serialized = JSON.stringify(value);

        if (options?.ttl) {
          pipeline.setex(key, options.ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.error('Cache setMany error:', error);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache deleteMany error:', error);
    }
  }
}

// ============================================================
// CACHE DECORATORS
// ============================================================

export function Cached(ttl = 3600, tags: string[] = []) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new CacheService();

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return await cache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        { ttl, tags }
      );
    };

    return descriptor;
  };
}

// ============================================================
// CACHE INVALIDATION
// ============================================================

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCache(`user:${userId}:*`);
  await invalidateCache(`products:${userId}:*`);
  await invalidateCache(`orders:${userId}:*`);
}

export async function invalidateProductCache(productId: string): Promise<void> {
  await invalidateCache(`product:${productId}:*`);
  await invalidateCache(`products:*:${productId}:*`);
}

export async function invalidateOrderCache(orderId: string): Promise<void> {
  await invalidateCache(`order:${orderId}:*`);
}

// ============================================================
// EXPORT SINGLETON
// ============================================================

export const cacheService = new CacheService();
