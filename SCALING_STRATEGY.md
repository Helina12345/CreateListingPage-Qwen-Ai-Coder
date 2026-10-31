# ListingDesk Pro - Scaling Strategy

## 📊 Current Architecture

The current architecture is designed for horizontal scaling with the following components:

### Application Layer
- **Node.js/Express Server** - Stateless API server
- **TypeScript** - Type-safe codebase
- **Modular Services** - Separation of concerns

### Data Layer
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **S3-compatible Storage** - File storage (images, documents)

### Integration Layer
- **Marketplace APIs** - 9 marketplace integrations
- **Webhook Handlers** - Real-time event processing
- **Job Queue** - Background task processing

---

## 🚀 Horizontal Scaling Strategy

### 1. Application Server Scaling

#### Load Balancer Setup
```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │  (NGINX/HAProxy)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  App Server │   │  App Server │   │  App Server │
    │    Node 1   │   │    Node 2   │   │    Node 3   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

#### Configuration
```nginx
# NGINX Load Balancer Configuration
upstream listingdesk_api {
    least_conn;
    server app1.listingdeskpro.com:3000;
    server app2.listingdeskpro.com:3000;
    server app3.listingdeskpro.com:3000;

    # Health checks
    keepalive 32;
}

server {
    listen 80;
    server_name api.listingdeskpro.com;

    location / {
        proxy_pass http://listingdesk_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Auto-Scaling Rules
```yaml
# Kubernetes HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: listingdesk-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: listingdesk-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: 1000
```

### 2. Database Scaling

#### Read Replicas
```
         ┌──────────────────┐
         │  Primary DB      │
         │  (Read/Write)    │
         └────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐  ┌────▼───┐  ┌─────▼──┐
│Replica 1│  │Replica 2│  │Replica 3│
│ (Read)  │  │ (Read)  │  │ (Read)  │
└─────────┘  └─────────┘  └─────────┘
```

#### Connection Pooling
```typescript
// Prisma configuration for connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Configure connection pool
// In prisma/schema.prisma:
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
//   connectionLimit = 20
// }
```

#### Database Sharding Strategy
```typescript
// Shard by userId for multi-tenancy
class DatabaseShardingService {
  private shards: Map<string, PrismaClient> = new Map();

  getShardForUser(userId: string): PrismaClient {
    // Hash userId to determine shard
    const shardId = this.calculateShard(userId);

    if (!this.shards.has(shardId)) {
      this.shards.set(shardId, new PrismaClient({
        datasources: {
          db: {
            url: process.env[`DATABASE_URL_SHARD_${shardId}`],
          },
        },
      }));
    }

    return this.shards.get(shardId)!;
  }

  private calculateShard(userId: string): string {
    // Simple hash-based sharding
    const hash = this.hashCode(userId);
    const shardCount = parseInt(process.env.SHARD_COUNT || '4');
    return `shard_${hash % shardCount}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

### 3. Redis Scaling

#### Redis Cluster
```
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Redis Node 1│   │ Redis Node 2│   │ Redis Node 3│
    │  (Master)   │   │  (Master)   │   │  (Master)   │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ Redis Node 4│   │ Redis Node 5│   │ Redis Node 6│
    │  (Replica)  │   │  (Replica)  │   │  (Replica)  │
    └─────────────┘   └─────────────┘   └─────────────┘
```

#### Configuration
```typescript
import Redis from 'ioredis';

const cluster = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
  scaleReads: 'slave', // Read from replicas
});
```

### 4. Job Queue Scaling

#### BullMQ Cluster
```typescript
import { Queue, Worker, QueueScheduler } from 'bullmq';

// Create queue with cluster support
const queue = new Queue('listingdesk-jobs', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

// Create multiple workers for parallel processing
const workers: Worker[] = [];
const workerCount = parseInt(process.env.WORKER_COUNT || '5');

for (let i = 0; i < workerCount; i++) {
  const worker = new Worker('listingdesk-jobs', async (job) => {
    // Process job
    await processJob(job);
  }, {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 10, // Process 10 jobs concurrently per worker
  });

  workers.push(worker);
}

// Queue scheduler for delayed jobs
const scheduler = new QueueScheduler('listingdesk-jobs', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});
```

### 5. Caching Strategy

#### Multi-Level Caching
```typescript
class CacheService {
  private l1Cache: Map<string, { data: any; expiry: number }> = new Map();
  private l2Cache: Redis;

  constructor(redis: Redis) {
    this.l2Cache = redis;
  }

  async get<T>(key: string): Promise<T | null> {
    // L1: In-memory cache (fastest)
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && l1Entry.expiry > Date.now()) {
      return l1Entry.data as T;
    }

    // L2: Redis cache
    const l2Data = await this.l2Cache.get(key);
    if (l2Data) {
      const data = JSON.parse(l2Data) as T;
      // Promote to L1
      this.l1Cache.set(key, {
        data,
        expiry: Date.now() + 60000, // 1 minute in L1
      });
      return data;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttlSeconds: number = 3600): Promise<void> {
    // Set in L1
    this.l1Cache.set(key, {
      data,
      expiry: Date.now() + 60000, // 1 minute in L1
    });

    // Set in L2
    await this.l2Cache.setex(key, ttlSeconds, JSON.stringify(data));
  }

  async invalidate(key: string): Promise<void> {
    this.l1Cache.delete(key);
    await this.l2Cache.del(key);
  }
}
```

#### Cache Invalidation Strategy
```typescript
// Invalidate cache on data changes
class CacheInvalidationService {
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  async onProductUpdate(productId: string): Promise<void> {
    await Promise.all([
      this.cache.invalidate(`product:${productId}`),
      this.cache.invalidate(`user:${productId}:products`),
      this.cache.invalidate(`analytics:products`),
    ]);
  }

  async onOrderCreate(orderId: string, userId: string): Promise<void> {
    await Promise.all([
      this.cache.invalidate(`user:${userId}:orders`),
      this.cache.invalidate(`analytics:orders`),
      this.cache.invalidate(`analytics:sales`),
    ]);
  }
}
```

---

## 📈 Performance Optimization

### 1. Database Query Optimization

#### Indexing Strategy
```prisma
// prisma/schema.prisma

model Product {
  id        String   @id @default(cuid())
  userId    String
  title     String
  sku       String
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([sku])
  @@index([status])
  @@index([createdAt])
  @@index([userId, status])
  @@index([userId, createdAt])
}

model Order {
  id              String   @id @default(cuid())
  userId          String
  marketplaceId   String
  externalOrderId String
  status          String
  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([marketplaceId])
  @@index([status])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@index([marketplaceId, status])
  @@unique([marketplaceId, externalOrderId])
}
```

#### Query Optimization
```typescript
// Use select to fetch only needed fields
const products = await prisma.product.findMany({
  where: { userId },
  select: {
    id: true,
    title: true,
    sku: true,
    status: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// Use include for relations
const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    items: {
      select: {
        id: true,
        quantity: true,
        price: true,
      },
    },
  },
});

// Use aggregate for calculations
const stats = await prisma.order.aggregate({
  where: {
    userId,
    createdAt: { gte: startDate },
  },
  _sum: {
    total: true,
  },
  _count: true,
  _avg: {
    total: true,
  },
});
```

### 2. API Response Optimization

#### Pagination
```typescript
// Cursor-based pagination
async function getProducts(
  userId: string,
  cursor?: string,
  limit: number = 20
) {
  const products = await prisma.product.findMany({
    where: { userId },
    take: limit + 1, // Fetch one extra to check if there are more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' },
  });

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
```

#### Response Compression
```typescript
import compression from 'compression';

app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));
```

### 3. Marketplace API Optimization

#### Request Batching
```typescript
class MarketplaceAPIBatcher {
  private queues: Map<string, any[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private batchSize = 10;
  private batchDelay = 100; // ms

  async batchRequest<T>(
    marketplaceId: string,
    request: () => Promise<T>
  ): Promise<T> {
    if (!this.queues.has(marketplaceId)) {
      this.queues.set(marketplaceId, []);
    }

    return new Promise((resolve, reject) => {
      this.queues.get(marketplaceId)!.push({ request, resolve, reject });

      if (!this.timers.has(marketplaceId)) {
        this.timers.set(marketplaceId, setTimeout(() => {
          this.processBatch(marketplaceId);
        }, this.batchDelay));
      }

      if (this.queues.get(marketplaceId)!.length >= this.batchSize) {
        this.processBatch(marketplaceId);
      }
    });
  }

  private async processBatch(marketplaceId: string): Promise<void> {
    const queue = this.queues.get(marketplaceId) || [];
    this.queues.set(marketplaceId, []);

    if (this.timers.has(marketplaceId)) {
      clearTimeout(this.timers.get(marketplaceId)!);
      this.timers.delete(marketplaceId);
    }

    // Process requests in parallel
    await Promise.all(
      queue.map(async ({ request, resolve, reject }) => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
    );
  }
}
```

#### API Response Caching
```typescript
class MarketplaceAPICache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async getCached<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTTL,
    });

    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

## 🔧 Infrastructure as Code

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server/index.js"]
```

### Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: listingdesk-api
  labels:
    app: listingdesk-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: listingdesk-api
  template:
    metadata:
      labels:
        app: listingdesk-api
    spec:
      containers:
      - name: api
        image: listingdeskpro/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: listingdesk-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: listingdesk-secrets
              key: redis-url
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Kubernetes Service
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: listingdesk-api
spec:
  selector:
    app: listingdesk-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

### Kubernetes Ingress
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: listingdesk-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.listingdeskpro.com
    secretName: listingdesk-tls
  rules:
  - host: api.listingdeskpro.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: listingdesk-api
            port:
              number: 80
```

---

## 📊 Monitoring & Metrics

### Application Metrics
```typescript
import prometheus from 'prom-client';

// Create metrics
const requestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const requestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

// Middleware to track requests
app.use((req, res, next) => {
  const end = requestDuration.startTimer();

  res.on('finish', () => {
    end({ method: req.method, path: req.path, status: res.statusCode });
    requestCounter.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });

  next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Health Checks
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      marketplaceAPIs: await checkMarketplaceAPIs(),
    },
  };

  const isHealthy = Object.values(health.checks).every(
    (check) => check.status === 'healthy'
  );

  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', latency: Date.now() - start };
  }
}

async function checkRedis(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', latency: Date.now() - start };
  }
}
```

---

## 🎯 Scaling Milestones

### Phase 1: 0-1,000 Users
- Single application server
- Single database instance
- Single Redis instance
- Basic monitoring

### Phase 2: 1,000-10,000 Users
- 3 application servers with load balancer
- Database read replicas (2)
- Redis cluster (3 nodes)
- Enhanced monitoring and alerting

### Phase 3: 10,000-100,000 Users
- Auto-scaling application servers (3-20)
- Database sharding (4 shards)
- Redis cluster (6 nodes)
- CDN for static assets
- Advanced caching strategy

### Phase 4: 100,000+ Users
- Global deployment (multiple regions)
- Database sharding (10+ shards)
- Redis cluster (9+ nodes)
- Multi-region load balancing
- Advanced observability stack

---

## 📝 Implementation Checklist

- [ ] Set up load balancer (NGINX/HAProxy)
- [ ] Configure auto-scaling rules
- [ ] Set up database read replicas
- [ ] Implement connection pooling
- [ ] Configure Redis cluster
- [ ] Set up job queue workers
- [ ] Implement multi-level caching
- [ ] Add database indexes
- [ ] Optimize queries
- [ ] Implement cursor-based pagination
- [ ] Add response compression
- [ ] Set up request batching
- [ ] Configure API response caching
- [ ] Set up Docker containers
- [ ] Configure Kubernetes deployment
- [ ] Set up monitoring and metrics
- [ ] Configure health checks
- [ ] Set up alerting rules
- [ ] Document scaling procedures
- [ ] Load testing and benchmarking
