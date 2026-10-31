// ============================================================
// ListingDesk Pro — Backend Sync Service
// Handles all communication with the real backend server
// ============================================================

import { useAuthStore } from '../store';
import type {
  Listing,
  Order,
  MarketplaceConnection,
  SupplierConnection,
  Notification,
  MarketplaceId,
} from '../types';

// Backend API base URL - configure this to point to your real backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================
// API Client Helper
// ============================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// ============================================================
// Auth Sync
// ============================================================

export const authSync = {
  async login(email: string, password: string) {
    const response = await apiClient.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    });
    return response;
  },

  async register(email: string, password: string, name: string) {
    const response = await apiClient.post<{ token: string; user: any }>('/auth/register', {
      email,
      password,
      name,
    });
    return response;
  },

  async getCurrentUser() {
    const response = await apiClient.get<any>('/auth/me');
    return response;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },
};

// ============================================================
// Listings Sync
// ============================================================

export const listingsSync = {
  async getAll(filters?: { status?: string; search?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{ listings: Listing[] }>(`/listings?${params}`);
    return response.listings;
  },

  async getById(id: string) {
    const response = await apiClient.get<{ listing: Listing }>(`/listings/${id}`);
    return response.listing;
  },

  async create(listing: Partial<Listing>) {
    const response = await apiClient.post<{ listing: Listing }>('/listings', listing);
    return response.listing;
  },

  async update(id: string, updates: Partial<Listing>) {
    const response = await apiClient.put<{ listing: Listing }>(`/listings/${id}`, updates);
    return response.listing;
  },

  async delete(id: string) {
    await apiClient.delete(`/listings/${id}`);
  },

  async publish(id: string, marketplaceIds: MarketplaceId[]) {
    const response = await apiClient.post<{ results: any[] }>(`/listings/${id}/publish`, {
      marketplaceIds,
    });
    return response.results;
  },

  async unpublish(id: string, marketplaceId: MarketplaceId) {
    await apiClient.post(`/listings/${id}/unpublish`, { marketplaceId });
  },
};

// ============================================================
// Orders Sync
// ============================================================

export const ordersSync = {
  async getAll(filters?: { status?: string; marketplaceId?: string; page?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.marketplaceId) params.append('marketplaceId', filters.marketplaceId);
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await apiClient.get<{ orders: Order[] }>(`/orders?${params}`);
    return response.orders;
  },

  async getById(id: string) {
    const response = await apiClient.get<{ order: Order }>(`/orders/${id}`);
    return response.order;
  },

  async updateStatus(id: string, status: string, trackingNumber?: string, carrier?: string) {
    const response = await apiClient.put<{ order: Order }>(`/orders/${id}/status`, {
      status,
      trackingNumber,
      carrier,
    });
    return response.order;
  },

  async syncFromMarketplace(marketplaceId: MarketplaceId) {
    await apiClient.post('/orders/sync', { marketplaceId });
  },
};

// ============================================================
// Marketplace Connections Sync
// ============================================================

export const marketplaceSync = {
  async getAll() {
    const response = await apiClient.get<{ connections: MarketplaceConnection[] }>(
      '/marketplaces/connections'
    );
    return response.connections;
  },

  async connect(marketplaceId: MarketplaceId) {
    const response = await apiClient.post<{ authUrl: string }>(
      `/marketplaces/${marketplaceId}/connect`
    );
    return response.authUrl;
  },

  async handleCallback(marketplaceId: MarketplaceId, code: string, state: string) {
    const response = await apiClient.post<{ connection: MarketplaceConnection }>(
      `/marketplaces/${marketplaceId}/callback`,
      { code, state }
    );
    return response.connection;
  },

  async disconnect(connectionId: string) {
    await apiClient.delete(`/marketplaces/connections/${connectionId}`);
  },

  async sync(connectionId: string) {
    await apiClient.post(`/marketplaces/connections/${connectionId}/sync`);
  },
};

// ============================================================
// Supplier Connections Sync
// ============================================================

export const supplierSync = {
  async getAll() {
    const response = await apiClient.get<{ connections: SupplierConnection[] }>(
      '/suppliers/connections'
    );
    return response.connections;
  },

  async connect(supplierId: string) {
    const response = await apiClient.post<{ authUrl: string }>(
      `/suppliers/${supplierId}/connect`
    );
    return response.authUrl;
  },

  async handleCallback(supplierId: string, code: string) {
    const response = await apiClient.post<{ connection: SupplierConnection }>(
      `/suppliers/${supplierId}/callback`,
      { code }
    );
    return response.connection;
  },

  async disconnect(connectionId: string) {
    await apiClient.delete(`/suppliers/connections/${connectionId}`);
  },

  async searchProducts(query: string, page?: number) {
    const params = new URLSearchParams({ q: query });
    if (page) params.append('page', page.toString());

    const response = await apiClient.get<{ products: any[] }>(
      `/suppliers/aliexpress/products/search?${params}`
    );
    return response.products;
  },

  async placeOrder(productId: string, variantId: string, quantity: number, shippingAddress: any) {
    const response = await apiClient.post<{ order: any }>('/suppliers/aliexpress/orders', {
      productId,
      variantId,
      quantity,
      shippingAddress,
    });
    return response.order;
  },

  async sendMessage(supplierOrderId: string, message: string) {
    await apiClient.post(`/suppliers/aliexpress/orders/${supplierOrderId}/message`, {
      message,
    });
  },
};

// ============================================================
// Inventory Sync
// ============================================================

export const inventorySync = {
  async get(listingId?: string) {
    const params = listingId ? `?listingId=${listingId}` : '';
    const response = await apiClient.get<{ inventory: any[] }>(`/inventory${params}`);
    return response.inventory;
  },

  async update(listingId: string, quantity: number, reason?: string, notes?: string) {
    const response = await apiClient.put<{ inventory: any }>(`/inventory/${listingId}`, {
      quantity,
      reason,
      notes,
    });
    return response.inventory;
  },

  async allocate(listingId: string, allocations: Array<{ marketplaceId: string; quantity: number }>) {
    await apiClient.post('/inventory/allocate', {
      productId: listingId,
      allocations,
    });
  },

  async sync(listingId: string) {
    const response = await apiClient.post<{ results: any[] }>('/inventory/sync', {
      productId: listingId,
    });
    return response.results;
  },

  async syncAll() {
    await apiClient.post('/inventory/sync-all');
  },
};

// ============================================================
// Notifications Sync
// ============================================================

export const notificationsSync = {
  async getAll(filters?: { read?: boolean; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.read !== undefined) params.append('read', filters.read.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{ notifications: Notification[] }>(
      `/notifications?${params}`
    );
    return response.notifications;
  },

  async markAsRead(id: string) {
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    await apiClient.put('/notifications/read-all');
  },

  async getUnreadCount() {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.count;
  },
};

// ============================================================
// Analytics Sync
// ============================================================

export const analyticsSync = {
  async getDashboard() {
    const response = await apiClient.get<any>('/analytics/dashboard');
    return response;
  },

  async getSales(period?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<any>(`/analytics/sales?${params}`);
    return response;
  },

  async getPerformance(period?: string) {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<any>(`/analytics/performance${params}`);
    return response;
  },

  async export(format: 'csv' | 'json' | 'xlsx', type: string) {
    const response = await apiClient.post<Blob>('/analytics/export', {
      format,
      type,
    });
    return response;
  },
};

// ============================================================
// Webhooks Sync
// ============================================================

export const webhooksSync = {
  async register(marketplaceId: MarketplaceId, url: string, events: string[]) {
    await apiClient.post('/webhooks/register', {
      marketplaceId,
      url,
      events,
    });
  },

  async unregister(webhookId: string) {
    await apiClient.delete(`/webhooks/${webhookId}`);
  },

  async getAll() {
    const response = await apiClient.get<{ webhooks: any[] }>('/webhooks');
    return response.webhooks;
  },
};

// ============================================================
// Data Sync Service
// ============================================================

export const dataSync = {
  /**
   * Sync all data from backend to frontend stores
   * Call this on app initialization
   */
  async syncAll() {
    try {
      // Sync marketplace connections
      const connections = await marketplaceSync.getAll();
      const { setConnections: setMarketplaceConnections } = await import('../store').then(
        (m) => m.useMarketplaceStore.getState()
      );
      setMarketplaceConnections(connections);

      // Sync supplier connections
      const supplierConnections = await supplierSync.getAll();
      const { setConnections: setSupplierConnections } = await import('../store').then(
        (m) => m.useSupplierStore.getState()
      );
      setSupplierConnections(supplierConnections);

      // Sync listings
      const listings = await listingsSync.getAll();
      const { setListings } = await import('../store').then((m) => m.useListingStore.getState());
      setListings(listings);

      // Sync orders
      const orders = await ordersSync.getAll();
      const { setOrders } = await import('../store').then((m) => m.useOrderStore.getState());
      setOrders(orders);

      // Sync notifications
      const notifications = await notificationsSync.getAll();
      const { setNotifications } = await import('../store').then(
        (m) => m.useNotificationStore.getState()
      );
      setNotifications(notifications);

      console.log('✅ All data synced from backend');
    } catch (error) {
      console.error('❌ Failed to sync data from backend:', error);
      throw error;
    }
  },

  /**
   * Sync specific data type
   */
  async syncListings() {
    const listings = await listingsSync.getAll();
    const { setListings } = await import('../store').then((m) => m.useListingStore.getState());
    setListings(listings);
  },

  async syncOrders() {
    const orders = await ordersSync.getAll();
    const { setOrders } = await import('../store').then((m) => m.useOrderStore.getState());
    setOrders(orders);
  },

  async syncMarketplaceConnections() {
    const connections = await marketplaceSync.getAll();
    const { setConnections } = await import('../store').then(
      (m) => m.useMarketplaceStore.getState()
    );
    setConnections(connections);
  },

  async syncSupplierConnections() {
    const connections = await supplierSync.getAll();
    const { setConnections } = await import('../store').then(
      (m) => m.useSupplierStore.getState()
    );
    setConnections(connections);
  },

  async syncNotifications() {
    const notifications = await notificationsSync.getAll();
    const { setNotifications } = await import('../store').then(
      (m) => m.useNotificationStore.getState()
    );
    setNotifications(notifications);
  },
};
