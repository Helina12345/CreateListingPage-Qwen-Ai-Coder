// ============================================================
// ListingDesk Pro — API Documentation Service
// Swagger/OpenAPI documentation generator
// ============================================================

import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      email: string;
      url?: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  security: Array<Record<string, string[]>>;
  tags: Array<{
    name: string;
    description: string;
  }>;
}

// ============================================================
// API DOCUMENTATION SERVICE
// ============================================================

export class APIDocumentationService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // GENERATE OPENAPI SPEC
  // ============================================================

  generateOpenAPISpec(): OpenAPISpec {
    return {
      openapi: '3.0.3',
      info: {
        title: 'ListingDesk Pro API',
        description: 'Multi-marketplace listing management system API',
        version: '1.0.0',
        contact: {
          name: 'ListingDesk Pro Support',
          email: 'support@listingdeskpro.com',
          url: 'https://listingdeskpro.com/support',
        },
        license: {
          name: 'Proprietary',
          url: 'https://listingdeskpro.com/license',
        },
      },
      servers: [
        {
          url: 'https://api.listingdeskpro.com/v1',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.listingdeskpro.com/v1',
          description: 'Staging server',
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Development server',
        },
      ],
      paths: this.generatePaths(),
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT authentication token',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for external integrations',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      tags: this.generateTags(),
    };
  }

  // ============================================================
  // GENERATE PATHS
  // ============================================================

  private generatePaths(): Record<string, any> {
    return {
      // Authentication
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid input',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Current user data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },

      // Products
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'Get all products',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'List of products',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Product',
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Create a new product',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateProductRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Product created',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
          },
        },
      },
      '/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Product data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
            '404': {
              description: 'Product not found',
            },
          },
        },
        put: {
          tags: ['Products'],
          summary: 'Update product',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateProductRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Product updated',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete product',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': {
              description: 'Product deleted',
            },
          },
        },
      },

      // Orders
      '/orders': {
        get: {
          tags: ['Orders'],
          summary: 'Get all orders',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'List of orders',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Order',
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Inventory
      '/inventory': {
        get: {
          tags: ['Inventory'],
          summary: 'Get inventory levels',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Inventory data',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Inventory',
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Marketplaces
      '/marketplaces/connections': {
        get: {
          tags: ['Marketplaces'],
          summary: 'Get marketplace connections',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of connections',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/MarketplaceConnection',
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Analytics
      '/analytics/sales': {
        get: {
          tags: ['Analytics'],
          summary: 'Get sales analytics',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'period',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['day', 'week', 'month', 'quarter', 'year'],
              },
            },
          ],
          responses: {
            '200': {
              description: 'Sales analytics data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SalesAnalytics',
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  // ============================================================
  // GENERATE SCHEMAS
  // ============================================================

  private generateSchemas(): Record<string, any> {
    return {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['seller', 'admin'] },
          twoFactorEnabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          sku: { type: 'string' },
          brand: { type: 'string' },
          condition: { type: 'string', enum: ['new', 'used', 'refurbished'] },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['draft', 'active', 'paused', 'archived'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['title', 'description', 'sku'],
        properties: {
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string' },
          sku: { type: 'string' },
          brand: { type: 'string' },
          condition: { type: 'string', enum: ['new', 'used', 'refurbished'] },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      UpdateProductRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string' },
          brand: { type: 'string' },
          condition: { type: 'string', enum: ['new', 'used', 'refurbished'] },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          marketplaceId: { type: 'string' },
          externalOrderId: { type: 'string' },
          status: { type: 'string' },
          buyerName: { type: 'string' },
          buyerEmail: { type: 'string', format: 'email' },
          total: { type: 'number' },
          currency: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Inventory: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          totalQuantity: { type: 'integer' },
          allocatedQuantity: { type: 'integer' },
          availableQuantity: { type: 'integer' },
          lowStockThreshold: { type: 'integer' },
        },
      },
      MarketplaceConnection: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          marketplaceId: { type: 'string' },
          status: { type: 'string', enum: ['connected', 'disconnected', 'expired'] },
          storeName: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SalesAnalytics: {
        type: 'object',
        properties: {
          period: { type: 'string' },
          totalRevenue: { type: 'number' },
          totalOrders: { type: 'integer' },
          averageOrderValue: { type: 'number' },
          revenueByMarketplace: { type: 'object' },
          ordersByMarketplace: { type: 'object' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: { type: 'string' },
        },
      },
    };
  }

  // ============================================================
  // GENERATE TAGS
  // ============================================================

  private generateTags(): Array<{ name: string; description: string }> {
    return [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Products',
        description: 'Product management operations',
      },
      {
        name: 'Orders',
        description: 'Order management operations',
      },
      {
        name: 'Inventory',
        description: 'Inventory management operations',
      },
      {
        name: 'Marketplaces',
        description: 'Marketplace connection management',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting',
      },
    ];
  }

  // ============================================================
  // GENERATE HTML DOCUMENTATION
  // ============================================================

  generateHTMLDocumentation(): string {
    const spec = this.generateOpenAPISpec();

    return `
<!DOCTYPE html>
<html>
<head>
  <title>${spec.info.title} - API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" >
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"> </script>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js"> </script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(spec, null, 2)},
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    }
  </script>
</body>
</html>
    `;
  }

  // ============================================================
  // GENERATE POSTMAN COLLECTION
  // ============================================================

  generatePostmanCollection(): any {
    const spec = this.generateOpenAPISpec();

    return {
      info: {
        name: spec.info.title,
        description: spec.info.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: Object.entries(spec.paths).map(([path, methods]) => {
        return Object.entries(methods as any).map(([method, details]) => {
          return {
            name: `${method.toUpperCase()} ${path}`,
            request: {
              method: method.toUpperCase(),
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                },
                {
                  key: 'Authorization',
                  value: 'Bearer {{token}}',
                },
              ],
              url: {
                raw: `{{baseUrl}}${path}`,
                host: ['{{baseUrl}}'],
                path: path.split('/').filter(Boolean),
              },
              description: details.summary,
            },
          };
        });
      }).flat(),
      variable: [
        {
          key: 'baseUrl',
          value: spec.servers[0].url,
        },
        {
          key: 'token',
          value: '',
        },
      ],
    };
  }
}
