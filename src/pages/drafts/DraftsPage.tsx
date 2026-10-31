// ============================================================
// ListingDesk Pro — Draft Listings Page
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Edit, Trash2, Globe, Eye, Calendar, Clock,
  Package, AlertCircle, Check, X, FileText,
} from 'lucide-react';
import { Card, Button, Badge, Modal, EmptyState } from '../../components/ui';
import { MARKETPLACES, MARKETPLACE_LIST } from '../../config/marketplaces';
import { useListingStore, useMarketplaceStore, useUIStore } from '../../store';
import { listingApi } from '../../api/client';
import type { MarketplaceId, Listing } from '../../types';

export default function DraftsPage() {
  const navigate = useNavigate();
  const { listings, removeListing, updateListing } = useListingStore();
  const { connections } = useMarketplaceStore();
  const { addToast } = useUIStore();

  const [showPublishModal, setShowPublishModal] = useState<Listing | null>(null);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceId[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filter only draft listings from the store
  const draftListings = listings.filter((listing) => listing.status === 'draft');

  const handleEdit = (listing: Listing) => {
    // Navigate to create listing page with the draft data
    navigate(`/create-listing?edit=${listing.id}`);
  };

  const handlePublishClick = (listing: Listing) => {
    setShowPublishModal(listing);
    setSelectedMarketplaces([]);
  };

  const handlePublish = async () => {
    if (!showPublishModal) return;

    // Check if any selected marketplace is not connected
    const unconnectedSelected = selectedMarketplaces.filter((mpId) => {
      const connection = connections.find((c) => c.marketplaceId === mpId);
      return !connection || connection.status !== 'connected';
    });

    if (unconnectedSelected.length > 0) {
      const names = unconnectedSelected.map((id) => MARKETPLACES[id].name).join(', ');
      addToast('error', `Please connect your account(s) first: ${names}`);
      return;
    }

    if (selectedMarketplaces.length === 0) {
      addToast('error', 'Please select at least one marketplace to publish to');
      return;
    }

    setPublishing(true);
    try {
      // Update listing status to active
      updateListing(showPublishModal.id, { status: 'active' });

      // Publish to selected marketplaces
      const result = await listingApi.publish(showPublishModal.id, selectedMarketplaces);

      if (result.success) {
        addToast('success', `Publishing to ${selectedMarketplaces.length} marketplace(s)...`);
        setShowPublishModal(null);
        setSelectedMarketplaces([]);
      } else {
        addToast('error', result.error || 'Publish failed');
      }
    } catch {
      addToast('error', 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = (listingId: string) => {
    removeListing(listingId);
    addToast('success', 'Draft deleted');
    setShowDeleteConfirm(null);
  };

  const isConnected = (marketplaceId: MarketplaceId): boolean => {
    const connection = connections.find((c) => c.marketplaceId === marketplaceId);
    return !!connection && connection.status === 'connected';
  };

  const toggleMarketplace = (mpId: MarketplaceId) => {
    if (!isConnected(mpId)) {
      addToast('warning', `Please connect your ${MARKETPLACES[mpId].name} account first`);
      return;
    }

    setSelectedMarketplaces((prev) =>
      prev.includes(mpId) ? prev.filter((id) => id !== mpId) : [...prev, mpId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Draft Listings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {draftListings.length} draft{draftListings.length !== 1 ? 's' : ''} ready to publish
          </p>
        </div>
      </div>

      {/* Drafts List */}
      {draftListings.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No draft listings"
          description="Create a new listing and save it as a draft to see it here."
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/create-listing')}
              icon={<Package className="h-4 w-4" />}
            >
              Create Listing
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {draftListings.map((listing) => (
            <Card key={listing.id}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  {listing.images.length > 0 ? (
                    <div className="h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                        {listing.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-mono text-xs">SKU: {listing.sku}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          ${listing.pricing.basePrice.toFixed(2)}
                        </span>
                        <span>•</span>
                        <span>{listing.inventory.totalQuantity} in stock</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Last updated {new Date(listing.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {listing.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {listing.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {listing.tags.length > 5 && (
                        <span className="text-xs text-gray-500">+{listing.tags.length - 5} more</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePublishClick(listing)}
                      icon={<Globe className="h-3.5 w-3.5" />}
                    >
                      Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(listing)}
                      icon={<Edit className="h-3.5 w-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(listing.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Modal */}
      <Modal
        isOpen={!!showPublishModal}
        onClose={() => {
          setShowPublishModal(null);
          setSelectedMarketplaces([]);
        }}
        title="Publish Draft to Marketplaces"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Select which marketplaces to publish this listing to. You can only publish to connected marketplaces.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MARKETPLACE_LIST.map((mp) => {
              const connected = isConnected(mp.id);
              const isSelected = selectedMarketplaces.includes(mp.id);

              return (
                <label
                  key={mp.id}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    connected
                      ? isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 cursor-pointer'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 cursor-not-allowed opacity-60'
                  )}
                  onClick={(e) => {
                    if (!connected) {
                      e.preventDefault();
                      addToast('warning', `Please connect your ${mp.name} account first`);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!connected}
                    onChange={() => toggleMarketplace(mp.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-lg">{mp.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{mp.name}</p>
                    {connected ? (
                      <p className="text-xs text-green-600 dark:text-green-400">Connected</p>
                    ) : (
                      <p className="text-xs text-gray-500">Not connected</p>
                    )}
                  </div>
                  {connected ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </label>
              );
            })}
          </div>

          {selectedMarketplaces.length > 0 && (
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-sm text-green-700 dark:text-green-400">
                Will publish to {selectedMarketplaces.length} marketplace{selectedMarketplaces.length !== 1 ? 's' : ''}:{' '}
                {selectedMarketplaces.map((id) => MARKETPLACES[id].name).join(', ')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowPublishModal(null);
                setSelectedMarketplaces([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              loading={publishing}
              disabled={selectedMarketplaces.length === 0}
              icon={<Globe className="h-4 w-4" />}
            >
              Publish to {selectedMarketplaces.length} Marketplace{selectedMarketplaces.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Draft"
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this draft? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
          >
            Delete Draft
          </Button>
        </div>
      </Modal>
    </div>
  );
}
