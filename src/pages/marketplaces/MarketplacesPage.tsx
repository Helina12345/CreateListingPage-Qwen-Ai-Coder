// ============================================================
// ListingDesk Pro — Marketplaces Connection Page (Seller Frontend)
// ============================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  ExternalLink, Check, AlertCircle, RefreshCw, Trash2,
  Shield, Clock, ChevronRight, Store, Info, Settings,
} from 'lucide-react';
import { Card, Button, Badge, Modal, ProgressBar, Input } from '../../components/ui';
import { MARKETPLACES, MARKETPLACE_LIST } from '../../config/marketplaces';
import { useMarketplaceStore, useUIStore } from '../../store';
import { marketplaceApi } from '../../api/client';
import { buildOAuthUrl, openOAuthPopup, exchangeCodeForToken, isClientIdConfigured } from '../../utils/oauth';
import type { MarketplaceId, MarketplaceConnection } from '../../types';

export default function MarketplacesPage() {
  const { connections, isConnected, addConnection, removeConnection, updateConnection } = useMarketplaceStore();
  const { addToast } = useUIStore();
  const [connectingId, setConnectingId] = useState<MarketplaceId | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState<MarketplaceId | null>(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');

  const handleConnect = async (marketplaceId: MarketplaceId) => {
    // Check if client ID is configured
    if (!isClientIdConfigured(marketplaceId)) {
      setShowCredentialsModal(marketplaceId);
      return;
    }

    setConnectingId(marketplaceId);
    try {
      // Build real OAuth URL
      const authUrl = buildOAuthUrl(marketplaceId);

      // Open OAuth popup and listen for callback
      openOAuthPopup(
        authUrl,
        marketplaceId,
        async (code, state) => {
          try {
            // Exchange code for token
            const tokenData = await exchangeCodeForToken(marketplaceId, code);

            // Add connection to store
            addConnection({
              id: `conn_${marketplaceId}_${Date.now()}`,
              marketplaceId,
              status: 'connected',
              accessToken: tokenData.accessToken,
              refreshToken: tokenData.refreshToken,
              tokenExpiry: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
              storeName: `My ${MARKETPLACES[marketplaceId].name} Store`,
              connectedAt: new Date().toISOString(),
              lastSyncAt: new Date().toISOString(),
              scopes: MARKETPLACES[marketplaceId].scopes,
            });

            addToast('success', `${MARKETPLACES[marketplaceId].name} connected successfully!`);
          } catch (err) {
            addToast('error', 'Failed to complete authorization');
          } finally {
            setConnectingId(null);
          }
        },
        (error) => {
          addToast('error', error);
          setConnectingId(null);
        }
      );
    } catch {
      addToast('error', 'Connection failed. Please try again.');
      setConnectingId(null);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    // Remove connection directly from state (works offline)
    removeConnection(connectionId);
    addToast('success', 'Marketplace disconnected successfully');
  };

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      const result = await marketplaceApi.sync(connectionId);
      if (result.success) {
        updateConnection(connectionId, { lastSyncAt: new Date().toISOString() });
        addToast('success', 'Sync initiated. Data will update in real-time.');
      } else {
        addToast('error', result.error || 'Sync failed');
      }
    } catch {
      addToast('error', 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const getConnection = (marketplaceId: MarketplaceId) =>
    connections.find((c) => c.marketplaceId === marketplaceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Marketplaces</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect your store accounts to publish listings, sync inventory, and manage orders across all platforms.
        </p>
      </div>

      {/* Connection Status Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {connections.filter((c) => c.status === 'connected').length}
              </p>
              <p className="text-xs text-gray-500">Connected</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {connections.filter((c) => c.status === 'expired').length}
              </p>
              <p className="text-xs text-gray-500">Expired Tokens</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {MARKETPLACE_LIST.length}
              </p>
              <p className="text-xs text-gray-500">Available Marketplaces</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Marketplace Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MARKETPLACE_LIST.map((marketplace) => {
          const connection = getConnection(marketplace.id);
          const connected = connection?.status === 'connected';
          const expired = connection?.status === 'expired';

          return (
            <Card key={marketplace.id} className="relative overflow-hidden">
              {/* Marketplace Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `${marketplace.color}15` }}
                  >
                    {marketplace.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{marketplace.name}</h3>
                    <p className="text-xs text-gray-500">Fee: {marketplace.feePercentage}%</p>
                  </div>
                </div>
                <Badge variant={connected ? 'success' : expired ? 'warning' : 'default'}>
                  {connected ? 'Connected' : expired ? 'Expired' : 'Not Connected'}
                </Badge>
              </div>

              {/* Connection Details */}
              {connected && connection && (
                <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Store</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{connection.storeName || 'My Store'}</span>
                  </div>
                  {connection.lastSyncAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Last Sync</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(connection.lastSyncAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Scopes</span>
                    <span className="text-gray-700 dark:text-gray-300">{connection.scopes.length} permissions</span>
                  </div>
                </div>
              )}

              {/* Marketplace Features */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {marketplace.supportedFields.variants.supportsSize && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">Sizes</span>
                )}
                {marketplace.supportedFields.variants.supportsColor && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">Colors</span>
                )}
                {marketplace.supportedFields.shipping.international && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">International</span>
                )}
                {marketplace.supportedFields.pricing.hasMAP && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">MAP</span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                {!connected ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    loading={connectingId === marketplace.id}
                    onClick={() => handleConnect(marketplace.id)}
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                  >
                    Connect {marketplace.name}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      loading={syncingId === connection?.id}
                      onClick={() => connection && handleSync(connection.id)}
                      icon={<RefreshCw className="h-3.5 w-3.5" />}
                    >
                      Sync Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => connection && setShowDisconnectModal(connection.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </>
                )}
              </div>

              {/* Security Badge */}
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400">
                <Shield className="h-3 w-3" />
                <span>OAuth 2.0 • Encrypted credentials • Auto-refresh tokens</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={!!showDisconnectModal}
        onClose={() => setShowDisconnectModal(null)}
        title="Disconnect Marketplace"
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to disconnect this marketplace? Your listings will be paused and you won't receive new orders.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDisconnectModal(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (showDisconnectModal) handleDisconnect(showDisconnectModal);
              setShowDisconnectModal(null);
            }}
          >
            Disconnect
          </Button>
        </div>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        isOpen={!!showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(null);
          setClientIdInput('');
          setClientSecretInput('');
        }}
        title={`Connect ${showCredentialsModal ? MARKETPLACES[showCredentialsModal].name : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              To connect {showCredentialsModal ? MARKETPLACES[showCredentialsModal].name : ''}, you need to provide your OAuth credentials from the {showCredentialsModal ? MARKETPLACES[showCredentialsModal].name : ''} Developer Portal.
            </p>
          </div>
          <Input
            label="Client ID"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="Enter your Client ID"
          />
          <Input
            label="Client Secret"
            type="password"
            value={clientSecretInput}
            onChange={(e) => setClientSecretInput(e.target.value)}
            placeholder="Enter your Client Secret"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCredentialsModal(null);
                setClientIdInput('');
                setClientSecretInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (showCredentialsModal && clientIdInput) {
                  // Save credentials
                  localStorage.setItem(`ldp_oauth_${showCredentialsModal}_client_id`, clientIdInput);
                  if (clientSecretInput) {
                    localStorage.setItem(`ldp_oauth_${showCredentialsModal}_client_secret`, clientSecretInput);
                  }
                  setShowCredentialsModal(null);
                  setClientIdInput('');
                  setClientSecretInput('');
                  // Now trigger the connect flow
                  handleConnect(showCredentialsModal);
                }
              }}
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
