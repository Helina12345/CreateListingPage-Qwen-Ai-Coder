// ============================================================
// ListingDesk Pro — API Client (secureFetch with SSRF protection)
// Backend-synced, no localStorage
// ============================================================

import type { ApiResponse } from '../types';
import { useAuthStore } from '../store';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

// SSRF Protection — block internal/private IPs
function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const blocked = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      '169.254.169.254', // AWS metadata
      '10.', '172.16.', '192.168.',
    ];
    return blocked.some(prefix => hostname.startsWith(prefix) || hostname === prefix);
  } catch {
    return true;
  }
}

// Redaction logging — never log tokens/secrets
function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted = { ...headers };
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-access-token'];
  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]';
    }
  }
  return redacted;
}

async function secureFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, timeout = 30000, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // SSRF check
  if (isBlockedUrl(url)) {
    return { success: false, error: 'Request blocked: SSRF protection' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Get token from Zustand store (backend-synced)
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Clear auth state from store
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return { success: false, error: 'Session expired' };
    }

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `HTTP ${response.status}` };
    }

    return { success: true, data: data as T };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout' };
    }
    return { success: false, error: (error as Error).message || 'Network error' };
  }
}

// ============================================================
// API Modules
// ============================================================

export const authApi = {
  login: (email: string, password: string) =>
    secureFetch<{ token: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string }) =>
    secureFetch<{ token: string; user: unknown }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verify2FA: (code: string, token: string) =>
    secureFetch<{ verified: boolean }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code, token }),
    }),

  enable2FA: () =>
    secureFetch<{ secret: string; qrCode: string }>('/auth/2fa/enable', {
      method: 'POST',
    }),

  me: () => secureFetch<unknown>('/auth/me'),
};

export const marketplaceApi = {
  getConnections: () =>
    secureFetch<unknown[]>('/marketplaces/connections'),

  connect: (marketplaceId: string) =>
    secureFetch<{ authUrl: string }>(`/marketplaces/${marketplaceId}/connect`, {
      method: 'POST',
    }),

  handleCallback: (marketplaceId: string, code: string, state: string) =>
    secureFetch<unknown>(`/marketplaces/${marketplaceId}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),

  disconnect: (connectionId: string) =>
    secureFetch<void>(`/marketplaces/connections/${connectionId}`, {
      method: 'DELETE',
    }),

  sync: (connectionId: string) =>
    secureFetch<{ jobId: string }>(`/marketplaces/connections/${connectionId}/sync`, {
      method: 'POST',
    }),

  getStoreInfo: (connectionId: string) =>
    secureFetch<unknown>(`/marketplaces/connections/${connectionId}/store`),
};

export const supplierApi = {
  getConnections: () =>
    secureFetch<unknown[]>('/suppliers/connections'),

  connect: (supplierId: string) =>
    secureFetch<{ authUrl: string }>(`/suppliers/${supplierId}/connect`, {
      method: 'POST',
    }),

  handleCallback: (supplierId: string, code: string) =>
    secureFetch<unknown>(`/suppliers/${supplierId}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  disconnect: (connectionId: string) =>
    secureFetch<void>(`/suppliers/connections/${connectionId}`, {
      method: 'DELETE',
    }),

  searchProducts: (query: string, page?: number) =>
    secureFetch<unknown[]>('/suppliers/aliexpress/products/search', {
      params: { q: query, page: page || 1 },
    }),

  getProduct: (productId: string) =>
    secureFetch<unknown>(`/suppliers/aliexpress/products/${productId}`),

  placeOrder: (productId: string, variantId: string, quantity: number, shippingAddress: unknown) =>
    secureFetch<unknown>('/suppliers/aliexpress/orders', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity, shippingAddress }),
    }),

  sendMessage: (supplierOrderId: string, message: string) =>
    secureFetch<void>(`/suppliers/aliexpress/orders/${supplierOrderId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

export const listingApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    secureFetch<unknown[]>('/listings', { params }),

  getById: (id: string) =>
    secureFetch<unknown>(`/listings/${id}`),

  create: (data: unknown) =>
    secureFetch<unknown>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: unknown) =>
    secureFetch<unknown>(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    secureFetch<void>(`/listings/${id}`, { method: 'DELETE' }),

  publish: (id: string, marketplaceIds: string[]) =>
    secureFetch<{ jobId: string }>(`/listings/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ marketplaceIds }),
    }),

  bulkPublish: (listingIds: string[], marketplaceIds: string[]) =>
    secureFetch<{ bulkOpId: string }>('/listings/bulk/publish', {
      method: 'POST',
      body: JSON.stringify({ listingIds, marketplaceIds }),
    }),

  bulkPause: (listingIds: string[]) =>
    secureFetch<{ bulkOpId: string }>('/listings/bulk/pause', {
      method: 'POST',
      body: JSON.stringify({ listingIds }),
    }),

  bulkDelete: (listingIds: string[]) =>
    secureFetch<{ bulkOpId: string }>('/listings/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ listingIds }),
    }),

  bulkDuplicate: (listingIds: string[]) =>
    secureFetch<{ bulkOpId: string }>('/listings/bulk/duplicate', {
      method: 'POST',
      body: JSON.stringify({ listingIds }),
    }),

  preview: (id: string, marketplaceId: string) =>
    secureFetch<unknown>(`/listings/${id}/preview/${marketplaceId}`),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return secureFetch<{ url: string }>('/listings/images/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

export const orderApi = {
  getAll: (params?: { page?: number; status?: string; marketplaceId?: string }) =>
    secureFetch<unknown[]>('/orders', { params }),

  getById: (id: string) =>
    secureFetch<unknown>(`/orders/${id}`),

  updateStatus: (id: string, status: string) =>
    secureFetch<unknown>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  addTracking: (id: string, trackingNumber: string, carrier: string) =>
    secureFetch<void>(`/orders/${id}/tracking`, {
      method: 'POST',
      body: JSON.stringify({ trackingNumber, carrier }),
    }),

  generateLabel: (id: string) =>
    secureFetch<{ labelUrl: string }>(`/orders/${id}/label`, {
      method: 'POST',
    }),
};

export const inventoryApi = {
  getLevels: (listingId?: string) =>
    secureFetch<unknown[]>('/inventory', { params: listingId ? { listingId } : undefined }),

  updateQuantity: (listingId: string, quantity: number) =>
    secureFetch<unknown>(`/inventory/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  syncAll: () =>
    secureFetch<{ jobId: string }>('/inventory/sync', { method: 'POST' }),

  getHistory: (listingId: string) =>
    secureFetch<unknown[]>(`/inventory/${listingId}/history`),
};

export const analyticsApi = {
  getDashboard: () =>
    secureFetch<unknown>('/analytics/dashboard'),

  getSales: (params?: { from?: string; to?: string }) =>
    secureFetch<unknown>('/analytics/sales', { params }),

  getPerformance: () =>
    secureFetch<unknown>('/analytics/performance'),

  exportReport: (type: string, format: string) =>
    secureFetch<{ downloadUrl: string }>('/analytics/export', {
      method: 'POST',
      body: JSON.stringify({ type, format }),
    }),
};

export const notificationApi = {
  getAll: () =>
    secureFetch<unknown[]>('/notifications'),

  markRead: (id: string) =>
    secureFetch<void>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllRead: () =>
    secureFetch<void>('/notifications/read-all', { method: 'PUT' }),

  getPreferences: () =>
    secureFetch<unknown>('/notifications/preferences'),

  updatePreferences: (prefs: unknown) =>
    secureFetch<unknown>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),
};

export { secureFetch };
