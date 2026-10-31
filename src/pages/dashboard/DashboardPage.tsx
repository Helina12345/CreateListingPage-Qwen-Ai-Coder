// ============================================================
// ListingDesk Pro — Dashboard Page
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingBag, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, Zap,
} from 'lucide-react';
import { Card, Badge, Skeleton } from '../../components/ui';
import { MARKETPLACES } from '../../config/marketplaces';
import type { MarketplaceId } from '../../types';

import { useListingStore, useOrderStore } from '../../store';

export default function DashboardPage() {
  const { listings } = useListingStore();
  const { orders } = useOrderStore();

  // Calculate real stats from store data
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.payment.amount, 0);
  const lowStockItems = listings.filter(l => l.inventory.totalQuantity <= l.inventory.lowStockThreshold).length;

  const STAT_CARDS = [
    { label: 'Total Listings', value: totalListings.toString(), change: '+0%', up: true, icon: Package, color: 'indigo' },
    { label: 'Active Orders', value: pendingOrders.toString(), change: '+0%', up: true, icon: ShoppingBag, color: 'green' },
    { label: 'Revenue (30d)', value: `$${totalRevenue.toFixed(2)}`, change: '+0%', up: true, icon: TrendingUp, color: 'blue' },
    { label: 'Low Stock Items', value: lowStockItems.toString(), change: '0', up: false, icon: AlertTriangle, color: 'yellow' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back! Here's your store overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/create-listing">
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Zap className="h-4 w-4" />
              New Listing
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${
                stat.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <stat.icon className={`h-5 w-5 ${
                  stat.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                  stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                  stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {stat.up ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Marketplace Performance + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Marketplace Performance */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Marketplace Performance</h2>
            <Link to="/marketplaces" className="text-sm text-indigo-600 hover:text-indigo-700">View all</Link>
          </div>
          {listings.length === 0 && orders.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No marketplace data yet. Connect marketplaces and create listings to see performance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400">Marketplace</th>
                    <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Listings</th>
                    <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Orders</th>
                    <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Revenue</th>
                    <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MARKETPLACES).map(([mpId, marketplace]) => {
                    const mpListings = listings.filter(l =>
                      l.marketplaceData.some(md => md.marketplaceId === mpId)
                    ).length;
                    const mpOrders = orders.filter(o => o.marketplaceId === mpId);
                    const mpRevenue = mpOrders.reduce((sum, o) => sum + o.payment.amount, 0);

                    return (
                      <tr key={mpId} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{marketplace.icon}</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{marketplace.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{mpListings}</td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{mpOrders.length}</td>
                        <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">${mpRevenue.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <Badge variant="default">No data</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          {listings.length === 0 && orders.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No recent activity. Start by creating listings and connecting marketplaces.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...listings.slice(0, 3).map(l => ({ type: 'listing', action: 'Created', target: l.title, time: l.createdAt })),
                ...orders.slice(0, 3).map(o => ({ type: 'order', action: 'Order received', target: o.externalOrderId, time: o.createdAt }))]
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .slice(0, 5)
                .map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    activity.type === 'listing' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {activity.type === 'listing' && <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                    {activity.type === 'order' && <ShoppingBag className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">{activity.action}</span>{' '}
                      <span className="text-gray-500 dark:text-gray-400 truncate">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500">{new Date(activity.time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Create Listing', icon: Zap, to: '/create-listing', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
            { label: 'Import from AliExpress', icon: Package, to: '/suppliers', color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
            { label: 'Bulk Publish', icon: Zap, to: '/listings', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
            { label: 'Sync Inventory', icon: TrendingUp, to: '/inventory', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
            { label: 'View Orders', icon: ShoppingBag, to: '/orders', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
            { label: 'Analytics', icon: TrendingUp, to: '/analytics', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
          ].map((action) => (
            <Link key={action.label} to={action.to}>
              <div className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-colors hover:opacity-80 ${action.color}`}>
                <action.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
