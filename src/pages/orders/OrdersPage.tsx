// ============================================================
// ListingDesk Pro — Orders Page
// ============================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Package, Truck, Check, Clock, AlertCircle, Search,
  Filter, Eye, MessageSquare, Download, RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge, Input, Select, Modal, EmptyState } from '../../components/ui';
import { MARKETPLACES, ORDER_STATUS_LABELS } from '../../config/marketplaces';
import { useOrderStore, useUIStore } from '../../store';
import { orderApi } from '../../api/client';
import type { MarketplaceId, Order, OrderStatus } from '../../types';

export default function OrdersPage() {
  const { orders, setOrders, updateOrder } = useOrderStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.buyer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.externalOrderId.toLowerCase().includes(search.toLowerCase()) ||
      order.items.some((i) => i.title.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesMarketplace = !marketplaceFilter || order.marketplaceId === marketplaceFilter;
    return matchesSearch && matchesStatus && matchesMarketplace;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setProcessing(true);
    try {
      const result = await orderApi.updateStatus(orderId, newStatus);
      if (result.success) {
        updateOrder(orderId, { status: newStatus });
        addToast('success', `Order status updated to ${ORDER_STATUS_LABELS[newStatus]}`);
      } else {
        addToast('error', result.error || 'Failed to update status');
      }
    } catch {
      addToast('error', 'Failed to update order status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning', confirmed: 'info', processing: 'info',
      ordered_from_supplier: 'info', shipped_by_supplier: 'info',
      shipped: 'success', delivered: 'success',
      cancelled: 'danger', refunded: 'danger', returned: 'danger',
    };
    return map[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'confirmed': case 'processing': return <RefreshCw className="h-3.5 w-3.5" />;
      case 'ordered_from_supplier': case 'shipped_by_supplier': return <Package className="h-3.5 w-3.5" />;
      case 'shipped': return <Truck className="h-3.5 w-3.5" />;
      case 'delivered': return <Check className="h-3.5 w-3.5" />;
      default: return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Unified order dashboard across all 9 marketplaces with auto supplier ordering
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />}>Export CSV</Button>
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>Sync All</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{orders.filter((o: Order) => o.status === 'pending').length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">From Supplier</p>
          <p className="text-xl font-bold text-blue-600">{orders.filter((o: Order) => o.supplierOrder).length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-xl font-bold text-green-600">${orders.reduce((sum: number, o: Order) => sum + o.payment.amount, 0).toFixed(2)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by buyer, order ID, or product..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <Select
            options={[{ value: '', label: 'All Status' }, ...Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40"
          />
          <Select
            options={[{ value: '', label: 'All Marketplaces' }, ...Object.entries(MARKETPLACES).map(([id, mp]) => ({ value: id, label: `${mp.icon} ${mp.name}` }))]}
            value={marketplaceFilter} onChange={(e) => setMarketplaceFilter(e.target.value)} className="w-full sm:w-44"
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="p-3 text-left font-medium text-gray-500 dark:text-gray-400">Order</th>
                <th className="p-3 text-left font-medium text-gray-500 dark:text-gray-400">Buyer</th>
                <th className="p-3 text-left font-medium text-gray-500 dark:text-gray-400">Items</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Marketplace</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Supplier</th>
                <th className="p-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                <th className="p-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-800/50">
                  <td className="p-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{order.externalOrderId}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-gray-900 dark:text-gray-100">{order.buyer.name}</p>
                    <p className="text-xs text-gray-500">{order.buyer.address.city}, {order.buyer.address.state}</p>
                  </td>
                  <td className="p-3">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-gray-700 dark:text-gray-300 text-xs line-clamp-1">
                        {item.quantity}x {item.title}
                      </p>
                    ))}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-lg" title={MARKETPLACES[order.marketplaceId]?.name}>
                      {MARKETPLACES[order.marketplaceId]?.icon}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={getStatusColor(order.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    {order.supplierOrder ? (
                      <Badge variant="info">AliExpress</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium text-gray-900 dark:text-gray-100">${order.payment.amount.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setShowOrderDetail(order)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <EmptyState icon={<Package className="h-12 w-12" />} title="No orders found" description="Orders from all marketplaces will appear here." />
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal isOpen={!!showOrderDetail} onClose={() => setShowOrderDetail(null)} title="Order Details" size="lg">
        {showOrderDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{showOrderDetail.externalOrderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Marketplace</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {MARKETPLACES[showOrderDetail.marketplaceId]?.icon} {MARKETPLACES[showOrderDetail.marketplaceId]?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Buyer</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{showOrderDetail.buyer.name}</p>
                  <p className="text-xs text-gray-500">{showOrderDetail.buyer.email}</p>
                  <p className="text-xs text-gray-500">{showOrderDetail.buyer.address.line1}, {showOrderDetail.buyer.address.city}, {showOrderDetail.buyer.address.state} {showOrderDetail.buyer.address.zipCode}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Items</p>
                  {showOrderDetail.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.quantity}x {item.title}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Shipping</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{showOrderDetail.shipping.carrier} - {showOrderDetail.shipping.service}</p>
                  {showOrderDetail.shipping.trackingNumber && (
                    <p className="text-xs text-indigo-600">Tracking: {showOrderDetail.shipping.trackingNumber}</p>
                  )}
                </div>
                {showOrderDetail.supplierOrder && (
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Supplier Order (AliExpress)</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Status: {showOrderDetail.supplierOrder.status}</p>
                    {showOrderDetail.supplierOrder.autoMessage && (
                      <p className="text-xs text-blue-500 mt-1">Auto-message: "{showOrderDetail.supplierOrder.autoMessage}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" icon={<MessageSquare className="h-4 w-4" />}>Message Buyer</Button>
              <Button variant="primary" icon={<Truck className="h-4 w-4" />}>
                {showOrderDetail.shipping.trackingNumber ? 'Update Tracking' : 'Add Tracking'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
