// ============================================================
// ListingDesk Pro — Server Entry Point
// Complete Express server with all routes and middleware
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createDatabaseClient } from './services/database';
import { AuthenticationService } from './services/auth';
import { MarketplaceConnectionService } from './services/marketplace-connection';
import { ProductListingService } from './services/product-listing';
import { OrderService } from './services/order';
import { InventoryService } from './services/inventory';
import { SupplierIntegrationService } from './services/supplier-integration';
import { PaymentBalanceService } from './services/payment-balance';
import { WebhookHandlerService } from './services/webhook-handler';
import { JobQueueService, createJobProcessors } from './services/job-queue';
import { NotificationService } from './services/notification';

// ============================================================
// INITIALIZE SERVICES
// ============================================================

const db = createDatabaseClient();

const authService = new AuthenticationService(
  db,
  process.env.JWT_SECRET || 'your-secret-key',
  process.env.JWT_EXPIRY || '7d'
);

const marketplaceConnectionService = new MarketplaceConnectionService(db);
const productListingService = new ProductListingService(db);
const orderService = new OrderService(db);
const inventoryService = new InventoryService(db);
const supplierIntegrationService = new SupplierIntegrationService(db);
const paymentBalanceService = new PaymentBalanceService(
  db,
  process.env.STRIPE_SECRET_KEY || ''
);
const webhookHandlerService = new WebhookHandlerService(db);
const jobQueueService = new JobQueueService(db);
const notificationService = new NotificationService(
  db,
  process.env.SMTP_HOST || '',
  parseInt(process.env.SMTP_PORT || '587'),
  process.env.SMTP_USER || '',
  process.env.SMTP_PASS || '',
  process.env.SMTP_FROM || ''
);

// Register job processors
const processors = createJobProcessors(db, {
  productListing: productListingService,
  order: orderService,
  inventory: inventoryService,
  supplierIntegration: supplierIntegrationService,
  webhookHandler: webhookHandlerService,
});

processors.forEach((processor, type) => {
  jobQueueService.registerProcessor(type, processor);
});

// Start job worker
jobQueueService.startWorker();

// ============================================================
// EXPRESS APP SETUP
// ============================================================

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

async function authMiddleware(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = await authService.verifyToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
}

function adminMiddleware(req: any, res: any, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json({ success: true,  result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true,  result });
  } catch (error: any) {
    if (error.message === '2FA_REQUIRED') {
      res.json({ success: true,  { requires2FA: true, userId: req.body.userId } });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});

app.post('/api/auth/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const result = await authService.verifyTwoFactor(req.user.id, req.body.code);
    res.json({ success: true,  result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/2fa/enable', authMiddleware, async (req, res) => {
  try {
    const result = await authService.enableTwoFactor(req.user.id);
    res.json({ success: true,  result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/2fa/confirm', authMiddleware, async (req, res) => {
  try {
    await authService.confirmTwoFactor(req.user.id, req.body.code);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.user.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true,  user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// MARKETPLACE ROUTES
// ============================================================

app.get('/api/marketplaces/connections', authMiddleware, async (req, res) => {
  try {
    const connections = await marketplaceConnectionService.getUserConnections(req.user.id);
    res.json({ success: true,  connections });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/marketplaces/:marketplaceId/connect', authMiddleware, async (req, res) => {
  try {
    const authUrl = await marketplaceConnectionService.getAuthorizationUrl(
      req.user.id,
      req.params.marketplaceId as any
    );
    res.json({ success: true,  { authUrl } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/marketplaces/:marketplaceId/callback', authMiddleware, async (req, res) => {
  try {
    const connection = await marketplaceConnectionService.handleOAuthCallback({
      userId: req.user.id,
      marketplaceId: req.params.marketplaceId as any,
      code: req.body.code,
      state: req.body.state,
    });
    res.json({ success: true,  connection });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/marketplaces/connections/:connectionId', authMiddleware, async (req, res) => {
  try {
    await marketplaceConnectionService.disconnect(req.user.id, req.params.connectionId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/marketplaces/connections/:connectionId/sync', authMiddleware, async (req, res) => {
  try {
    await marketplaceConnectionService.syncMarketplaceData(req.user.id, req.params.connectionId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// PRODUCT & LISTING ROUTES
// ============================================================

app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const products = await productListingService.getUserProducts(req.user.id, req.query as any);
    res.json({ success: true,  products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const product = await productListingService.createProduct({
      ...req.body,
      userId: req.user.id,
    });
    res.json({ success: true,  product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await productListingService.updateProduct(req.params.id, req.user.id, req.body);
    res.json({ success: true,  product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    await productListingService.deleteProduct(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/products/:id/publish', authMiddleware, async (req, res) => {
  try {
    const results = await productListingService.publishListing({
      productId: req.params.id,
      marketplaceIds: req.body.marketplaceIds,
      userId: req.user.id,
    });
    res.json({ success: true,  results });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// ORDER ROUTES
// ============================================================

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id, req.query as any);
    res.json({ success: true,  orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true,  order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus({
      orderId: req.params.id,
      userId: req.user.id,
      status: req.body.status,
      trackingNumber: req.body.trackingNumber,
      carrier: req.body.carrier,
    });
    res.json({ success: true,  order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// INVENTORY ROUTES
// ============================================================

app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const inventory = await inventoryService.getInventoryByProduct(req.query.productId as string, req.user.id);
    res.json({ success: true,  inventory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/inventory/:productId', authMiddleware, async (req, res) => {
  try {
    const inventory = await inventoryService.updateInventory({
      productId: req.params.productId,
      userId: req.user.id,
      quantity: req.body.quantity,
      reason: req.body.reason,
      notes: req.body.notes,
    });
    res.json({ success: true,  inventory });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/inventory/allocate', authMiddleware, async (req, res) => {
  try {
    await inventoryService.allocateInventory({
      productId: req.body.productId,
      userId: req.user.id,
      allocations: req.body.allocations,
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/inventory/sync', authMiddleware, async (req, res) => {
  try {
    const results = await inventoryService.reconcileInventory(req.body.productId, req.user.id);
    res.json({ success: true,  results });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// PAYMENT & BALANCE ROUTES
// ============================================================

app.get('/api/balance', authMiddleware, async (req, res) => {
  try {
    const balance = await paymentBalanceService.getUserBalance(req.user.id);
    res.json({ success: true,  balance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/balance/add', authMiddleware, async (req, res) => {
  try {
    const result = await paymentBalanceService.addBalance({
      ...req.body,
      userId: req.user.id,
    });
    res.json({ success: true,  result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await paymentBalanceService.getTransactionHistory(req.user.id, req.query as any);
    res.json({ success: true,  transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/balance/refund', authMiddleware, async (req, res) => {
  try {
    const result = await paymentBalanceService.refund({
      ...req.body,
      userId: req.user.id,
    });
    res.json({ success: true,  result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id, req.query as any);
    res.json({ success: true,  notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true,  { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// WEBHOOK ROUTES
// ============================================================

app.post('/api/webhooks/amazon', async (req, res) => {
  try {
    const signature = req.headers['x-amz-sns-signature'] as string;
    const payload = JSON.stringify(req.body);

    const verification = await webhookHandlerService.verifyWebhookSignature(
      'amazon',
      payload,
      signature,
      process.env.AMAZON_WEBHOOK_SECRET || ''
    );

    if (!verification.valid) {
      return res.status(401).json({ success: false, error: verification.error });
    }

    await webhookHandlerService.processWebhookEvent({
      marketplaceId: 'amazon',
      eventType: req.body.Type || req.body.eventType,
       req.body,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhooks/ebay', async (req, res) => {
  try {
    const signature = req.headers['x-ebay-signature'] as string;
    const payload = JSON.stringify(req.body);

    const verification = await webhookHandlerService.verifyWebhookSignature(
      'ebay',
      payload,
      signature,
      process.env.EBAY_WEBHOOK_SECRET || ''
    );

    if (!verification.valid) {
      return res.status(401).json({ success: false, error: verification.error });
    }

    await webhookHandlerService.processWebhookEvent({
      marketplaceId: 'ebay',
      eventType: req.body.notificationType,
       req.body,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/webhooks/shopify', async (req, res) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'] as string;
    const payload = JSON.stringify(req.body);

    const verification = await webhookHandlerService.verifyWebhookSignature(
      'shopify',
      payload,
      signature,
      process.env.SHOPIFY_WEBHOOK_SECRET || ''
    );

    if (!verification.valid) {
      return res.status(401).json({ success: false, error: verification.error });
    }

    await webhookHandlerService.processWebhookEvent({
      marketplaceId: 'shopify',
      eventType: req.headers['x-shopify-topic'],
       req.body,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add similar webhook routes for other marketplaces...

// ============================================================
// STRIPE WEBHOOK
// ============================================================

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body.toString();

    await paymentBalanceService.handleStripeWebhook(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);

  // Log error
  db.errorLog.create({
    level: 'error',
    message: err.message,
    stack: err.stack,
    context: {
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    },
  }).catch(console.error);

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ListingDesk Pro server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
