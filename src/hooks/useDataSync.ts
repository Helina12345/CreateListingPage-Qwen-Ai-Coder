// ============================================================
// ListingDesk Pro — Data Sync Hooks
// React hooks for automatic backend synchronization
// ============================================================

import { useEffect, useCallback } from 'react';
import { dataSync } from '../services/backend-sync';
import { useAuthStore } from '../store';

/**
 * Hook to sync all data from backend on mount
 * Use this in your main App component or layout
 */
export function useDataSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dataSync.syncAll().catch((error) => {
        console.error('Failed to sync data:', error);
      });
    }
  }, [isAuthenticated]);
}

/**
 * Hook to sync listings from backend
 */
export function useListingsSync() {
  const syncListings = useCallback(async () => {
    try {
      await dataSync.syncListings();
    } catch (error) {
      console.error('Failed to sync listings:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    syncListings();
  }, [syncListings]);

  return { syncListings };
}

/**
 * Hook to sync orders from backend
 */
export function useOrdersSync() {
  const syncOrders = useCallback(async () => {
    try {
      await dataSync.syncOrders();
    } catch (error) {
      console.error('Failed to sync orders:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  return { syncOrders };
}

/**
 * Hook to sync marketplace connections from backend
 */
export function useMarketplaceConnectionsSync() {
  const syncConnections = useCallback(async () => {
    try {
      await dataSync.syncMarketplaceConnections();
    } catch (error) {
      console.error('Failed to sync marketplace connections:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    syncConnections();
  }, [syncConnections]);

  return { syncConnections };
}

/**
 * Hook to sync supplier connections from backend
 */
export function useSupplierConnectionsSync() {
  const syncConnections = useCallback(async () => {
    try {
      await dataSync.syncSupplierConnections();
    } catch (error) {
      console.error('Failed to sync supplier connections:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    syncConnections();
  }, [syncConnections]);

  return { syncConnections };
}

/**
 * Hook to sync notifications from backend
 */
export function useNotificationsSync() {
  const syncNotifications = useCallback(async () => {
    try {
      await dataSync.syncNotifications();
    } catch (error) {
      console.error('Failed to sync notifications:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  return { syncNotifications };
}

/**
 * Hook to sync a specific listing from backend
 */
export function useListingSync(listingId: string | null) {
  const syncListing = useCallback(async () => {
    if (!listingId) return;

    try {
      const { listingsSync } = await import('../services/backend-sync');
      const listing = await listingsSync.getById(listingId);
      const { setCurrentListing } = await import('../store').then(
        (m) => m.useListingStore.getState()
      );
      setCurrentListing(listing);
    } catch (error) {
      console.error('Failed to sync listing:', error);
      throw error;
    }
  }, [listingId]);

  useEffect(() => {
    syncListing();
  }, [syncListing]);

  return { syncListing };
}

/**
 * Hook to sync a specific order from backend
 */
export function useOrderSync(orderId: string | null) {
  const syncOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const { ordersSync } = await import('../services/backend-sync');
      const order = await ordersSync.getById(orderId);
      // Update order in store if needed
    } catch (error) {
      console.error('Failed to sync order:', error);
      throw error;
    }
  }, [orderId]);

  useEffect(() => {
    syncOrder();
  }, [syncOrder]);

  return { syncOrder };
}

/**
 * Hook to refresh data periodically
 */
export function usePeriodicSync(intervalMs: number = 60000) {
  useEffect(() => {
    const interval = setInterval(() => {
      dataSync.syncAll().catch((error) => {
        console.error('Periodic sync failed:', error);
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
}

/**
 * Hook to sync data when window becomes visible
 */
export function useVisibilitySync() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        dataSync.syncAll().catch((error) => {
          console.error('Visibility sync failed:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
