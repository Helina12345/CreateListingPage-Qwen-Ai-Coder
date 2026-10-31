// ============================================================
// ListingDesk Pro — Main Layout (Sidebar + Header + Content)
// ============================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Package, ShoppingBag, Store, Truck,
  BarChart3, Settings, LogOut, Menu, X, ChevronRight,
  Boxes, Globe, Zap, Users, Shield, Bell, Search, FileText, CheckCircle,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { NotificationBell, ThemeToggle, Button } from '../ui';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/listings', icon: Package, label: 'Listings' },
  { path: '/create-listing', icon: Zap, label: 'Create Listing' },
  { path: '/drafts', icon: FileText, label: 'Drafts' },
  { path: '/publishing-results', icon: CheckCircle, label: 'Publishing Results' },
  { path: '/orders', icon: Truck, label: 'Orders' },
  { path: '/inventory', icon: Boxes, label: 'Inventory' },
  { path: '/marketplaces', icon: Store, label: 'Marketplaces' },
  { path: '/suppliers', icon: Globe, label: 'Suppliers' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/shipping', icon: ShoppingBag, label: 'Shipping' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const ADMIN_NAV_ITEMS = [
  { path: '/admin', icon: Shield, label: 'Admin Dashboard', end: true },
  { path: '/admin/marketplaces', icon: Store, label: 'Manage Marketplaces' },
  { path: '/admin/suppliers', icon: Globe, label: 'Manage Suppliers' },
  { path: '/admin/users', icon: Users, label: 'Users' },
];

export function AppLayout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
          LD
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">ListingDesk Pro</h1>
          <p className="text-[10px] text-gray-500">Multi-Marketplace Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
            <p className={clsx('mb-2 px-3 text-xs font-semibold uppercase text-gray-400', !sidebarOpen && 'hidden')}>
              Admin
            </p>
            <div className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={handleLogout} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-700 dark:bg-gray-800',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen(!mobileOpen);
                else toggleSidebar();
              }}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings, orders, products..."
                  className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 lg:w-80"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#FAFAFA] dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
