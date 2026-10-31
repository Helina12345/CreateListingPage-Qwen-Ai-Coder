// ============================================================
// ListingDesk Pro — React Query Hooks (Real-time Data Fetching)
// ============================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  authApi,
  marketplaceApi,
  supplierApi,
  listingApi,
  orderApi,
  inventoryApi,
  analyticsApi,
  notificationApi,
} from '../api/client';
import { useAuthStore, useMarketplaceStore, useSupplierStore, useNotificationStore } from '../store';
import type { MarketplaceId } from '../types';

// ============================================================
// Auth Hooks
// ============================================================
export function useAuth() {
  const { user, token, isAuthenticated, login, logout, setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const result = await authApi.me();
      if (result.success && result.data) {
        setUser(result.data as any);
      }
      return result.data;
    },
    enabled: !!token && !user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authApi.login(email, password);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      if (data) {
        login(data.user as any, data.token);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
  });
}

// ============================================================
// Marketplace Hooks
// ============================================================
export function useMarketplaceConnections() {
  const { setConnections } = useMarketplaceStore();

  return useQuery({
    queryKey: ['marketplaces', 'connections'],
    queryFn: async () => {
      const result = await marketplaceApi.getConnections();
      if (result.success && result.data) {
        setConnections(result.data as any);
      }
      return result.data;
    },
    refetchInterval: 30 * 1000, // Refresh every 30s for real-time sync
    staleTime: 10 * 1000,
  });
}

export function useConnectMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketplaceId: MarketplaceId) => {
      const result = await marketplaceApi.connect(marketplaceId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
    },
  });
}

export function useSyncMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const result = await marketplaceApi.sync(connectionId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ============================================================
// Supplier Hooks
// ============================================================
export function useSupplierConnections() {
  const { setConnections } = useSupplierStore();

  return useQuery({
    queryKey: ['suppliers', 'connections'],
    queryFn: async () => {
      const result = await supplierApi.getConnections();
      if (result.success && result.data) {
        setConnections(result.data as any);
      }
      return result.data;
    },
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });
}

export function useSearchSupplierProducts(query: string) {
  return useQuery({
    queryKey: ['suppliers', 'aliexpress', 'products', 'search', query],
    queryFn: async () => {
      const result = await supplierApi.searchProducts(query);
      return result.data;
    },
    enabled: !!query && query.length > 2,
    staleTime: 60 * 1000,
  });
}

export function usePlaceSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantId, quantity, shippingAddress }: {
      productId: string; variantId: string; quantity: number; shippingAddress: unknown;
    }) => {
      const result = await supplierApi.placeOrder(productId, variantId, quantity, shippingAddress);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ============================================================
// Listing Hooks
// ============================================================
export function useListings(params?: { status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: async () => {
      const result = await listingApi.getAll(params);
      return result.data;
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // Real-time sync
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: async () => {
      const result = await listingApi.getById(id);
      return result.data;
    },
    enabled: !!id,
    staleTime: 10 * 1000,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ( unknown) => {
      const result = await listingApi.create(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function usePublishListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, marketplaceIds }: { listingId: string; marketplaceIds: string[] }) => {
      const result = await listingApi.publish(listingId, marketplaceIds);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useBulkPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingIds, marketplaceIds }: { listingIds: string[]; marketplaceIds: string[] }) => {
      const result = await listingApi.bulkPublish(listingIds, marketplaceIds);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await listingApi.delete(id);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ============================================================
// Order Hooks
// ============================================================
export function useOrders(params?: { status?: string; marketplaceId?: string; page?: number }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const result = await orderApi.getAll(params);
      return result.data;
    },
    refetchInterval: 15 * 1000, // Real-time order sync every 15s
    staleTime: 5 * 1000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const result = await orderApi.updateStatus(orderId, status);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ============================================================
// Inventory Hooks
// ============================================================
export function useInventory(listingId?: string) {
  return useQuery({
    queryKey: ['inventory', listingId],
    queryFn: async () => {
      const result = await inventoryApi.getLevels(listingId);
      return result.data;
    },
    refetchInterval: 20 * 1000, // Real-time inventory sync
    staleTime: 10 * 1000,
  });
}

export function useSyncInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await inventoryApi.syncAll();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ============================================================
// Analytics Hooks
// ============================================================
export function useDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const result = await analyticsApi.getDashboard();
      return result.data;
    },
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

export function useSalesAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['analytics', 'sales', params],
    queryFn: async () => {
      const result = await analyticsApi.getSales(params);
      return result.data;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================
// Notification Hooks
// ============================================================
export function useNotifications() {
  const { setNotifications } = useNotificationStore();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await notificationApi.getAll();
      if (result.success && result.data) {
        setNotifications(result.data as any);
      }
      return result.data;
    },
    refetchInterval: 10 * 1000, // Check for new notifications every 10s
    staleTime: 5 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationApi.markRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================================
// Image Upload Hook
// ============================================================
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) throw new Error('File too large (max 10MB)');

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) throw new Error('Invalid file type');

      const result = await listingApi.uploadImage(file);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
