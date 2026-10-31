// ============================================================
// ListingDesk Pro — Main Application (BrowserRouter + React Query)
// ============================================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary, ToastContainer, Skeleton } from './components/ui';
import { useAuthStore } from './store';
import { useDataSync, useVisibilitySync } from './hooks/useDataSync';

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ListingsPage = lazy(() => import('./pages/listings/ListingsPage'));
const CreateListingPage = lazy(() => import('./pages/listings/CreateListingPage'));
const DraftsPage = lazy(() => import('./pages/drafts/DraftsPage'));
const MarketplacesPage = lazy(() => import('./pages/marketplaces/MarketplacesPage'));
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'));

// Non-lazy pages (combined in single file)
import {
  InventoryPage,
  AnalyticsPage,
  ShippingPage,
  SettingsPage,
  AdminDashboardPage,
  AdminMarketplacesPage,
  AdminSuppliersPage,
  AdminUsersPage,
  LoginPage,
} from './pages/other';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import PublishingResultsPage from './pages/publishing/PublishingResultsPage';

// ============================================================
// React Query Client
// ============================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: true,
      retry: 2,
      refetchInterval: 60 * 1000, // Auto-refresh every 60s for real-time sync
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================================
// Loading Fallback (Skeleton)
// ============================================================
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Protected Route
// ============================================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();

  // Sync data from backend when authenticated
  useDataSync();

  // Sync data when window becomes visible
  useVisibilitySync();

  // If no token or not authenticated, redirect to login
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
// ============================================================
// Admin Route
// ============================================================
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// Legacy Hash Redirect (for old bookmarks)
// ============================================================
function LegacyHashRedirect() {
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      const path = hash.slice(1);
      window.history.replaceState(null, '', path);
    }
  }, []);
  return null;
}

// ============================================================
// App Component
// ============================================================
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LegacyHashRedirect />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

              {/* Protected User Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/create-listing" element={<CreateListingPage />} />
                <Route path="/listings/:id/edit" element={<CreateListingPage />} />
                <Route path="/drafts" element={<DraftsPage />} />
                <Route path="/publishing-results" element={<PublishingResultsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/marketplaces" element={<MarketplacesPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/shipping" element={<ShippingPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/marketplaces"
                  element={
                    <AdminRoute>
                      <AdminMarketplacesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/suppliers"
                  element={
                    <AdminRoute>
                      <AdminSuppliersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
