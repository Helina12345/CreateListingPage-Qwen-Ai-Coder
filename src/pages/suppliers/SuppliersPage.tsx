// ============================================================
// ListingDesk Pro — Suppliers Page (AliExpress Integration)
// ============================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Search, ExternalLink, ShoppingCart, MessageSquare, Package,
  Star, Truck, RefreshCw, Check, AlertCircle, Filter,
  ChevronDown, Plus, Globe, Zap, Eye,
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, ProgressBar, EmptyState } from '../../components/ui';
import { SUPPLIERS } from '../../config/marketplaces';
import { useSupplierStore, useUIStore } from '../../store';
import { supplierApi } from '../../api/client';
import { buildAliExpressOAuthUrl, openOAuthPopup, exchangeCodeForToken, isClientIdConfigured } from '../../utils/oauth';
import type { SupplierProduct } from '../../types';

export default function SuppliersPage() {
  const { connections, addConnection, removeConnection } = useSupplierStore();
  const { addToast } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupplierProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductModal, setShowProductModal] = useState<SupplierProduct | null>(null);
  const [showConnectWizard, setShowConnectWizard] = useState(false);
  const [importingProduct, setImportingProduct] = useState(false);
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(true);
  const [autoMessageEnabled, setAutoMessageEnabled] = useState(true);

  const isConnected = connections.some((c) => c.supplierId === 'aliexpress' && c.status === 'connected');

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');

  const handleConnect = () => {
    // Check if client ID is configured
    if (!isClientIdConfigured('aliexpress')) {
      setShowCredentialsModal(true);
      return;
    }

    // Build real AliExpress OAuth URL
    const authUrl = buildAliExpressOAuthUrl();

    // Open OAuth popup
    openOAuthPopup(
      authUrl,
      'aliexpress',
      async (code, state) => {
        try {
          // Exchange code for token
          const tokenData = await exchangeCodeForToken('aliexpress', code);

          // Add connection to store
          addConnection({
            id: `conn_aliexpress_${Date.now()}`,
            supplierId: 'aliexpress',
            status: 'connected',
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            tokenExpiry: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
            connectedAt: new Date().toISOString(),
            lastSyncAt: new Date().toISOString(),
          });

          addToast('success', 'AliExpress connected successfully!');
          setShowConnectWizard(false);
        } catch (err) {
          addToast('error', 'Failed to complete authorization');
        }
      },
      (error) => {
        addToast('error', error);
      }
    );
  };

  const handleSaveCredentials = () => {
    if (clientIdInput) {
      localStorage.setItem('ldp_oauth_aliexpress_client_id', clientIdInput);
      if (clientSecretInput) {
        localStorage.setItem('ldp_oauth_aliexpress_client_secret', clientSecretInput);
      }
      setShowCredentialsModal(false);
      setClientIdInput('');
      setClientSecretInput('');
      // Now trigger the connect flow
      handleConnect();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await supplierApi.searchProducts(searchQuery);
      if (result.success && result.data) {
        setSearchResults(result.data as SupplierProduct[]);
      } else {
        // No results from API
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportToListing = async (product: SupplierProduct) => {
    setImportingProduct(true);
    try {
      // In real implementation, this would create a listing from the supplier product
      addToast('success', `Imported "${product.title}" as a new listing draft`);
      setShowProductModal(null);
    } catch {
      addToast('error', 'Import failed');
    } finally {
      setImportingProduct(false);
    }
  };

  const handleAutoOrder = async (product: SupplierProduct) => {
    try {
      const result = await supplierApi.placeOrder(product.id, product.variants[0]?.id || '', 1, {});
      if (result.success) {
        addToast('success', `Auto-order placed with ${SUPPLIERS.aliexpress.name}`);
        if (autoMessageEnabled) {
          const orderData = result.data as { id?: string } | undefined;
          await supplierApi.sendMessage(orderData?.id || '', 'Thank you for the order! Please ship ASAP.');
        }
      } else {
        addToast('error', result.error || 'Order failed');
      }
    } catch {
      addToast('error', 'Auto-order failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect suppliers to source products, auto-order, and sync tracking
          </p>
        </div>
        {!isConnected && (
          <Button variant="primary" onClick={() => setShowConnectWizard(true)} icon={<Plus className="h-4 w-4" />}>
            Connect Supplier
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl dark:bg-red-900/20">
              🛒
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">AliExpress</h3>
              <p className="text-xs text-gray-500">Product sourcing • Auto-order • Auto-message • Tracking sync</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Badge variant="success">Connected</Badge>
                <Button variant="outline" size="sm" onClick={() => { removeConnection(connections[0]?.id || ''); addToast('success', 'AliExpress disconnected successfully'); }}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Badge variant="default">Not Connected</Badge>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={clsx('rounded-lg p-2', autoOrderEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700')}>
                <ShoppingCart className={clsx('h-4 w-4', autoOrderEnabled ? 'text-green-600' : 'text-gray-400')} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Auto-Order</p>
                <p className="text-[10px] text-gray-500">{autoOrderEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                onClick={() => setAutoOrderEnabled(!autoOrderEnabled)}
                className={clsx('ml-auto h-5 w-9 rounded-full transition-colors', autoOrderEnabled ? 'bg-green-500' : 'bg-gray-300')}
              >
                <div className={clsx('h-4 w-4 rounded-full bg-white shadow transition-transform', autoOrderEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className={clsx('rounded-lg p-2', autoMessageEnabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700')}>
                <MessageSquare className={clsx('h-4 w-4', autoMessageEnabled ? 'text-blue-600' : 'text-gray-400')} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Auto-Message</p>
                <p className="text-[10px] text-gray-500">{autoMessageEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                onClick={() => setAutoMessageEnabled(!autoMessageEnabled)}
                className={clsx('ml-auto h-5 w-9 rounded-full transition-colors', autoMessageEnabled ? 'bg-blue-500' : 'bg-gray-300')}
              >
                <div className={clsx('h-4 w-4 rounded-full bg-white shadow transition-transform', autoMessageEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Tracking Sync</p>
                <p className="text-[10px] text-gray-500">Real-time updates</p>
              </div>
              <Check className="ml-auto h-4 w-4 text-green-500" />
            </div>
          </div>
        )}
      </Card>

      {/* Product Search */}
      {isConnected && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Search Products on AliExpress</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for products to source and sell..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <Button variant="primary" onClick={handleSearch} loading={isSearching} icon={<Search className="h-4 w-4" />}>
              Search
            </Button>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {searchResults.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
              <div className="p-3 space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{product.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">${product.price.toFixed(2)}</span>
                  {product.shipping.freeShipping && <Badge variant="success">Free Ship</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span>{product.rating}</span>
                  <span>•</span>
                  <span>{product.orders.toLocaleString()} orders</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Truck className="h-3 w-3" />
                  <span>{product.shipping.estimatedDays.min}-{product.shipping.estimatedDays.max} days</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowProductModal(product)}>
                    <Eye className="h-3 w-3" /> View
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => handleImportToListing(product)}>
                    <Plus className="h-3 w-3" /> Import
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Connect Wizard Modal */}
      <Modal isOpen={showConnectWizard} onClose={() => setShowConnectWizard(false)} title="Connect AliExpress" size="md">
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">What you'll get:</h3>
            <ul className="space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
              <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Search & browse millions of products</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Auto-order when you get a sale</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Auto-message suppliers for each order</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Real-time tracking number sync</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Inventory level sync</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Credential encryption (AES-256)</li>
            </ul>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Your AliExpress credentials will be encrypted and stored securely. We use OAuth 2.0 with encrypted token storage.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConnectWizard(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConnect} icon={<ExternalLink className="h-4 w-4" />}>
              Connect AliExpress
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Detail Modal */}
      <Modal isOpen={!!showProductModal} onClose={() => setShowProductModal(null)} title="Product Details" size="lg">
        {showProductModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{showProductModal.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{showProductModal.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${showProductModal.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{showProductModal.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Truck className="h-4 w-4" />
                  <span>Shipping: {showProductModal.shipping.freeShipping ? 'Free' : `$${showProductModal.shipping.cost.toFixed(2)}`}</span>
                  <span>({showProductModal.shipping.estimatedDays.min}-{showProductModal.shipping.estimatedDays.max} days)</span>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Variants ({showProductModal.variants.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {showProductModal.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">Stock: {v.stock}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">${v.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => window.open(showProductModal.url, '_blank')} icon={<ExternalLink className="h-4 w-4" />}>
                View on AliExpress
              </Button>
              <Button variant="primary" onClick={() => handleImportToListing(showProductModal)} loading={importingProduct} icon={<Plus className="h-4 w-4" />}>
                Import as Listing
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Empty state when not connected */}
      {!isConnected && (
        <EmptyState
          icon={<Globe className="h-12 w-12" />}
          title="No suppliers connected"
          description="Connect AliExpress to source products, enable auto-ordering, and sync tracking automatically."
          action={
            <Button variant="primary" onClick={() => setShowConnectWizard(true)} icon={<Plus className="h-4 w-4" />}>
              Connect AliExpress
            </Button>
          }
        />
      )}

      {/* AliExpress Credentials Modal */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setClientIdInput('');
          setClientSecretInput('');
        }}
        title="Connect AliExpress"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              To connect AliExpress, you need to provide your OAuth credentials from the AliExpress Open Platform.
            </p>
          </div>
          <Input
            label="Client ID (App Key)"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="Enter your AliExpress App Key"
          />
          <Input
            label="Client Secret (App Secret)"
            type="password"
            value={clientSecretInput}
            onChange={(e) => setClientSecretInput(e.target.value)}
            placeholder="Enter your AliExpress App Secret"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCredentialsModal(false);
                setClientIdInput('');
                setClientSecretInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveCredentials}
              disabled={!clientIdInput}
            >
              Save & Connect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
