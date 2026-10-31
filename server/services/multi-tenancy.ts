// ============================================================
// ListingDesk Pro — Multi-Tenancy Service
// Support for multiple sellers/tenants with data isolation
// ============================================================

import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  maxUsers: number;
  maxListings: number;
  maxMarketplaces: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  permissions: string[];
  createdAt: Date;
}

export interface TenantQuota {
  tenantId: string;
  currentUsers: number;
  currentListings: number;
  currentMarketplaces: number;
  storageUsed: number;
  apiCallsThisMonth: number;
}

// ============================================================
// MULTI-TENANCY SERVICE
// ============================================================

export class MultiTenancyService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // TENANT MANAGEMENT
  // ============================================================

  async createTenant(
    name: string,
    ownerId: string,
    plan: Tenant['plan'] = 'free'
  ): Promise<Tenant> {
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existingTenant = await this.getTenantBySlug(slug);
    if (existingTenant) {
      throw new Error(`Tenant with slug "${slug}" already exists`);
    }

    const tenant = await this.db.tenant.create({
      name,
      slug,
      plan,
      maxUsers: this.getPlanLimits(plan).maxUsers,
      maxListings: this.getPlanLimits(plan).maxListings,
      maxMarketplaces: this.getPlanLimits(plan).maxMarketplaces,
      features: this.getPlanFeatures(plan),
    });

    // Add owner as tenant user
    await this.addTenantUser(tenant.id, ownerId, 'owner', ['*']);

    // Create default balance for tenant
    await this.db.balance.create({
      tenantId: tenant.id,
      amount: 0,
      currency: 'USD',
    });

    return tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return await this.db.tenant.findById(tenantId);
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return await this.db.tenant.findBySlug(slug);
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    return await this.db.tenant.update(tenantId, updates);
  }

  async deleteTenant(tenantId: string): Promise<void> {
    // In production, implement soft delete or cascade delete
    await this.db.tenant.delete(tenantId);
  }

  // ============================================================
  // TENANT USER MANAGEMENT
  // ============================================================

  async addTenantUser(
    tenantId: string,
    userId: string,
    role: TenantUser['role'],
    permissions: string[]
  ): Promise<TenantUser> {
    // Check quota
    const quota = await this.getTenantQuota(tenantId);
    const tenant = await this.getTenant(tenantId);

    if (tenant && quota.currentUsers >= tenant.maxUsers) {
      throw new Error('Tenant user limit reached');
    }

    return await this.db.tenantUser.create({
      tenantId,
      userId,
      role,
      permissions,
    });
  }

  async removeTenantUser(tenantId: string, userId: string): Promise<void> {
    await this.db.tenantUser.delete(tenantId, userId);
  }

  async updateTenantUserRole(
    tenantId: string,
    userId: string,
    role: TenantUser['role']
  ): Promise<void> {
    await this.db.tenantUser.update(tenantId, userId, { role });
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return await this.db.tenantUser.findByTenantId(tenantId);
  }

  async getUserTenants(userId: string): Promise<Tenant[]> {
    const tenantUsers = await this.db.tenantUser.findByUserId(userId);
    const tenants = [];

    for (const tenantUser of tenantUsers) {
      const tenant = await this.getTenant(tenantUser.tenantId);
      if (tenant) {
        tenants.push(tenant);
      }
    }

    return tenants;
  }

  // ============================================================
  // TENANT QUOTA MANAGEMENT
  // ============================================================

  async getTenantQuota(tenantId: string): Promise<TenantQuota> {
    const users = await this.getTenantUsers(tenantId);
    const products = await this.db.product.findByTenantId(tenantId);
    const connections = await this.db.marketplaceConnection.findByTenantId(tenantId);

    return {
      tenantId,
      currentUsers: users.length,
      currentListings: products.length,
      currentMarketplaces: connections.length,
      storageUsed: 0, // In production, calculate actual storage
      apiCallsThisMonth: 0, // In production, track API calls
    };
  }

  async checkQuota(tenantId: string, resource: 'users' | 'listings' | 'marketplaces'): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
  }> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const quota = await this.getTenantQuota(tenantId);

    const limits: Record<string, { current: number; limit: number }> = {
      users: { current: quota.currentUsers, limit: tenant.maxUsers },
      listings: { current: quota.currentListings, limit: tenant.maxListings },
      marketplaces: { current: quota.currentMarketplaces, limit: tenant.maxMarketplaces },
    };

    const { current, limit } = limits[resource];

    return {
      allowed: current < limit,
      current,
      limit,
    };
  }

  // ============================================================
  // TENANT ISOLATION
  // ============================================================

  async getTenantScopedProducts(tenantId: string, userId: string): Promise<any[]> {
    // Verify user belongs to tenant
    const tenantUser = await this.db.tenantUser.findByTenantAndUser(tenantId, userId);
    if (!tenantUser) {
      throw new Error('User does not belong to this tenant');
    }

    return await this.db.product.findByTenantId(tenantId);
  }

  async getTenantScopedOrders(tenantId: string, userId: string): Promise<any[]> {
    // Verify user belongs to tenant
    const tenantUser = await this.db.tenantUser.findByTenantAndUser(tenantId, userId);
    if (!tenantUser) {
      throw new Error('User does not belong to this tenant');
    }

    return await this.db.order.findByTenantId(tenantId);
  }

  // ============================================================
  // PLAN MANAGEMENT
  // ============================================================

  async upgradeTenantPlan(tenantId: string, newPlan: Tenant['plan']): Promise<Tenant> {
    const limits = this.getPlanLimits(newPlan);
    const features = this.getPlanFeatures(newPlan);

    return await this.db.tenant.update(tenantId, {
      plan: newPlan,
      maxUsers: limits.maxUsers,
      maxListings: limits.maxListings,
      maxMarketplaces: limits.maxMarketplaces,
      features,
    });
  }

  private getPlanLimits(plan: Tenant['plan']): {
    maxUsers: number;
    maxListings: number;
    maxMarketplaces: number;
  } {
    const limits: Record<Tenant['plan'], any> = {
      free: { maxUsers: 1, maxListings: 10, maxMarketplaces: 2 },
      starter: { maxUsers: 3, maxListings: 100, maxMarketplaces: 5 },
      professional: { maxUsers: 10, maxListings: 1000, maxMarketplaces: 9 },
      enterprise: { maxUsers: -1, maxListings: -1, maxMarketplaces: 9 }, // -1 = unlimited
    };

    return limits[plan];
  }

  private getPlanFeatures(plan: Tenant['plan']): string[] {
    const features: Record<Tenant['plan'], string[]> = {
      free: ['basic-listing', 'basic-analytics'],
      starter: ['basic-listing', 'basic-analytics', 'inventory-sync', 'order-sync'],
      professional: [
        'basic-listing',
        'basic-analytics',
        'inventory-sync',
        'order-sync',
        'auto-order',
        'advanced-analytics',
        'bulk-operations',
      ],
      enterprise: [
        'basic-listing',
        'basic-analytics',
        'inventory-sync',
        'order-sync',
        'auto-order',
        'advanced-analytics',
        'bulk-operations',
        'ai-features',
        'priority-support',
        'custom-integrations',
      ],
    };

    return features[plan];
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ============================================================
  // TENANT MIDDLEWARE
  // ============================================================

  async tenantMiddleware(tenantId: string, userId: string): Promise<TenantUser> {
    const tenantUser = await this.db.tenantUser.findByTenantAndUser(tenantId, userId);

    if (!tenantUser) {
      throw new Error('User does not belong to this tenant');
    }

    return tenantUser;
  }

  async checkPermission(
    tenantId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    const tenantUser = await this.tenantMiddleware(tenantId, userId);

    // Owner has all permissions
    if (tenantUser.role === 'owner') {
      return true;
    }

    // Check if user has specific permission or wildcard
    return tenantUser.permissions.includes(permission) || tenantUser.permissions.includes('*');
  }
}
