// ============================================================
// ListingDesk Pro — Zustand Stores
// Backend-synced state management (no localStorage)
// ============================================================

import { create } from 'zustand';
import type {
  User,
  MarketplaceConnection,
  SupplierConnection,
  Listing,
  Order,
  Notification,
  MarketplaceId,
} from '../types';

// ============================================================
// Auth Store
// ============================================================
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  twoFactorRequired: boolean;
  twoFactorToken: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setTwoFactorRequired: (required: boolean, token?: string) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  twoFactorRequired: false,
  twoFactorToken: null,
  login: (user: User, token: string) =>
    set({ user, token, isAuthenticated: true, isLoading: false, twoFactorRequired: false }),
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, twoFactorRequired: false });
  },
  setUser: (user: User) => set({ user }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setTwoFactorRequired: (required: boolean, token?: string) =>
    set({ twoFactorRequired: required, twoFactorToken: token || null }),
}));

// ============================================================
// Marketplace Store
// ============================================================
interface MarketplaceState {
  connections: MarketplaceConnection[];
  isLoading: boolean;
  setConnections: (connections: MarketplaceConnection[]) => void;
  addConnection: (connection: MarketplaceConnection) => void;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, updates: Partial<MarketplaceConnection>) => void;
  setLoading: (loading: boolean) => void;
  isConnected: (marketplaceId: MarketplaceId) => boolean;
}

export const useMarketplaceStore = create<MarketplaceState>()((set, get) => ({
  connections: [],
  isLoading: false,
  setConnections: (connections) => set({ connections }),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  removeConnection: (id) =>
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) })),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  isConnected: (marketplaceId) =>
    get().connections.some((c) => c.marketplaceId === marketplaceId && c.status === 'connected'),
}));

// ============================================================
// Supplier Store
// ============================================================
interface SupplierState {
  connections: SupplierConnection[];
  isLoading: boolean;
  setConnections: (connections: SupplierConnection[]) => void;
  addConnection: (connection: SupplierConnection) => void;
  removeConnection: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useSupplierStore = create<SupplierState>()((set) => ({
  connections: [],
  isLoading: false,
  setConnections: (connections) => set({ connections }),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  removeConnection: (id) =>
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============================================================
// Listing Store
// ============================================================
interface ListingState {
  listings: Listing[];
  currentListing: Listing | null;
  isLoading: boolean;
  filters: {
    status: string;
    search: string;
    marketplaceId: string;
    page: number;
    limit: number;
  };
  setListings: (listings: Listing[]) => void;
  setCurrentListing: (listing: Listing | null) => void;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  removeListing: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<ListingState['filters']>) => void;
}

export const useListingStore = create<ListingState>()((set) => ({
  listings: [],
  currentListing: null,
  isLoading: false,
  filters: { status: '', search: '', marketplaceId: '', page: 1, limit: 20 },
  setListings: (listings) => set({ listings }),
  setCurrentListing: (currentListing) => set({ currentListing }),
  addListing: (listing) => set((state) => ({ listings: [listing, ...state.listings] })),
  updateListing: (id, updates) =>
    set((state) => ({
      listings: state.listings.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      currentListing: state.currentListing?.id === id ? { ...state.currentListing, ...updates } : state.currentListing,
    })),
  removeListing: (id) =>
    set((state) => ({ listings: state.listings.filter((l) => l.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// ============================================================
// Order Store
// ============================================================
interface OrderState {
  orders: Order[];
  isLoading: boolean;
  filters: { status: string; marketplaceId: string; page: number };
  setOrders: (orders: Order[]) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<OrderState['filters']>) => void;
}

export const useOrderStore = create<OrderState>()((set) => ({
  orders: [],
  isLoading: false,
  filters: { status: '', marketplaceId: '', page: 1 },
  setOrders: (orders) => set({ orders }),
  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

// ============================================================
// Notification Store
// ============================================================
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
}));

// ============================================================
// UI Store
// ============================================================
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  commandPaletteOpen: boolean;
  globalLoading: boolean;
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string }>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  toggleCommandPalette: () => void;
  setGlobalLoading: (loading: boolean) => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  theme: 'system',
  commandPaletteOpen: false,
  globalLoading: false,
  toasts: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),
  setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setGlobalLoading: (globalLoading: boolean) => set({ globalLoading }),
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), type, message }],
    })),
  removeToast: (id: string) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
