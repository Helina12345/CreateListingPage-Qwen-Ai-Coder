// ============================================================
// ListingDesk Pro — Listings Management Page
// ============================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Copy,
  Pause, Play, Globe, Eye, Package, ArrowUpDown,
  CheckSquare, Square, Download, Upload, Zap,
} from 'lucide-react';
import { Card, Button, Badge, Input, Select, Modal, ConfirmDialog, ProgressBar, EmptyState } from '../../components/ui';
import { MARKETPLACES, MARKETPLACE_NAMES } from '../../config/marketplaces';
import { useListingStore, useUIStore, useMarketplaceStore } from '../../store';
import { listingApi } from '../../api/client';
import type { Listing, MarketplaceId } from '../../types';

export default function ListingsPage() {
  const { listings, setListings, removeListing, updateListing } = useListingStore();
  const { connections } = useMarketplaceStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkPublish, setShowBulkPublish] = useState(false);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceId[]>([]);
  const [publishing, setPublishing] = useState(false);

  const filteredListings = listings.filter((listing: Listing) => {
    // Exclude draft listings - they go to the Drafts page
    if (listing.status === 'draft') return false;

    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredListings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredListings.map((l) => l.id));
    }
  };

  const handlePublish = async (listingId: string) => {
    setPublishing(true);
    try {
      const result = await listingApi.publish(listingId, selectedMarketplaces);
      if (result.success) {
        addToast('success', `Publishing to ${selectedMarketplaces.length} marketplace(s)...`);
        setShowPublishModal(false);
      } else {
        addToast('error', result.error || 'Publish failed');
      }
    } catch {
      addToast('error', 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleBulkPublish = async () => {
    setPublishing(true);
    try {
      const result = await listingApi.bulkPublish(selectedIds, selectedMarketplaces);
      if (result.success) {
        addToast('success', `Bulk publishing ${selectedIds.length} listings...`);
        setShowBulkPublish(false);
        setSelectedIds([]);
      } else {
        addToast('error', result.error || 'Bulk publish failed');
      }
    } catch {
      addToast('error', 'Bulk publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await listingApi.delete(id);
      if (result.success) {
        removeListing(id);
        addToast('success', 'Listing deleted');
      } else {
        addToast('error', result.error || 'Delete failed');
      }
    } catch {
      addToast('error', 'Delete failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      active: 'success', draft: 'default', paused: 'warning', archived: 'danger',
    };
    return <Badge variant={map[status] || 'default'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getMarketplaceStatus = (listing: Listing, mpId: MarketplaceId) => {
    const data = listing.marketplaceData.find((d) => d.marketplaceId === mpId);
    if (!data) return null;
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      published: 'success', publishing: 'info', pending: 'warning', failed: 'danger', paused: 'warning',
    };
    return <Badge variant={statusMap[data.status] || 'default'}>{data.status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Listings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage all your product listings across 9 marketplaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="primary" size="sm" onClick={() => setShowBulkPublish(true)} icon={<Zap className="h-3.5 w-3.5" />}>
                Bulk Publish ({selectedIds.length})
              </Button>
              <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            </>
          )}
          <Link to="/create-listing">
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>New Listing</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, SKU, or tag..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'paused', label: 'Paused' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
      </Card>

      {/* Listings Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="p-3 text-left">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === filteredListings.length && filteredListings.length > 0
                      ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                      : <Square className="h-4 w-4 text-gray-400" />
                    }
                  </button>
                </th>
                <th className="p-3 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="p-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Stock</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="p-3 text-center font-medium text-gray-500 dark:text-gray-400">Marketplaces</th>
                <th className="p-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-800/50">
                  <td className="p-3">
                    <button onClick={() => toggleSelect(listing.id)}>
                      {selectedIds.includes(listing.id)
                        ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                        : <Square className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[200px]">{listing.title}</p>
                        <p className="text-xs text-gray-500">{listing.variants.length} variant(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{listing.sku}</td>
                  <td className="p-3 text-center font-medium text-gray-900 dark:text-gray-100">${listing.pricing.basePrice.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={clsx(
                      'font-medium',
                      listing.inventory.totalQuantity <= listing.inventory.lowStockThreshold ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {listing.inventory.totalQuantity}
                    </span>
                  </td>
                  <td className="p-3 text-center">{getStatusBadge(listing.status)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {(['ebay', 'amazon', 'shopify', 'etsy', 'walmart'] as MarketplaceId[]).map((mpId) => (
                        <div key={mpId} className="relative group">
                          <span className="text-sm cursor-help" title={MARKETPLACES[mpId].name}>
                            {MARKETPLACES[mpId].icon}
                          </span>
                        </div>
                      ))}
                      {listing.marketplaceData.length > 0 && (
                        <span className="text-xs text-gray-500 ml-1">
                          {listing.marketplaceData.filter((d) => d.status === 'published').length}/{listing.marketplaceData.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setShowPublishModal(true); setSelectedIds([listing.id]); }}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700"
                        title="Publish"
                      >
                        <Globe className="h-4 w-4" />
                      </button>
                      <Link to={`/listings/${listing.id}/edit`} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(listing.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredListings.length === 0 && (
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No listings found"
            description="Create your first listing or adjust your filters."
            action={
              <Link to="/create-listing">
                <Button variant="primary" icon={<Plus className="h-4 w-4" />}>Create Listing</Button>
              </Link>
            }
          />
        )}
      </Card>

      {/* Publish Modal */}
      <Modal isOpen={showPublishModal} onClose={() => setShowPublishModal(false)} title="Publish to Marketplaces" size="lg">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Select which marketplaces to publish this listing to. Each marketplace has different requirements.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.values(MARKETPLACES).map((mp) => (
            <label
              key={mp.id}
              className={clsx(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                selectedMarketplaces.includes(mp.id)
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              )}
            >
              <input
                type="checkbox"
                checked={selectedMarketplaces.includes(mp.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedMarketplaces([...selectedMarketplaces, mp.id]);
                  else setSelectedMarketplaces(selectedMarketplaces.filter((id) => id !== mp.id));
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-lg">{mp.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{mp.name}</p>
                <p className="text-[10px] text-gray-500">Max {mp.supportedFields.images.maxCount} images</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowPublishModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            loading={publishing}
            disabled={selectedMarketplaces.length === 0}
            onClick={() => selectedIds.length === 1 ? handlePublish(selectedIds[0]) : handleBulkPublish()}
          >
            Publish to {selectedMarketplaces.length} Marketplace(s)
          </Button>
        </div>
      </Modal>

      {/* Bulk Publish Modal */}
      <Modal isOpen={showBulkPublish} onClose={() => setShowBulkPublish(false)} title={`Bulk Publish ${selectedIds.length} Listings`} size="lg">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Select marketplaces to publish all {selectedIds.length} selected listings to.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.values(MARKETPLACES).map((mp) => (
            <label
              key={mp.id}
              className={clsx(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                selectedMarketplaces.includes(mp.id)
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              )}
            >
              <input
                type="checkbox"
                checked={selectedMarketplaces.includes(mp.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedMarketplaces([...selectedMarketplaces, mp.id]);
                  else setSelectedMarketplaces(selectedMarketplaces.filter((id) => id !== mp.id));
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-lg">{mp.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{mp.name}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowBulkPublish(false)}>Cancel</Button>
          <Button variant="primary" loading={publishing} onClick={handleBulkPublish}>
            Bulk Publish
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This will remove it from all connected marketplaces. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
