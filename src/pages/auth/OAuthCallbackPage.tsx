// ============================================================
// ListingDesk Pro — OAuth Callback Page
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMarketplaceStore, useSupplierStore, useUIStore } from '../../store';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addConnection: addMarketplaceConnection } = useMarketplaceStore();
  const { addConnection: addSupplierConnection } = useSupplierStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Extract marketplace ID from state parameter
    const marketplaceId = state?.split('_')[0];

    if (error) {
      // OAuth error
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_error', error, marketplaceId },
          window.location.origin
        );
        window.close();
      } else {
        addToast('error', `Authorization failed: ${error}`);
        navigate('/marketplaces');
      }
      return;
    }

    if (!code || !state || !marketplaceId) {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_error', error: 'Missing authorization code', marketplaceId },
          window.location.origin
        );
        window.close();
      } else {
        addToast('error', 'Invalid OAuth callback');
        navigate('/marketplaces');
      }
      return;
    }

    // Verify state
    const expectedState = sessionStorage.getItem(`ldp_oauth_state_${marketplaceId}`);
    if (state !== expectedState) {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_error', error: 'Invalid state parameter', marketplaceId },
          window.location.origin
        );
        window.close();
      } else {
        addToast('error', 'Security error: Invalid state');
        navigate('/marketplaces');
      }
      return;
    }

    // Success - send code back to opener
    if (window.opener) {
      window.opener.postMessage(
        { type: 'oauth_success', code, state, marketplaceId },
        window.location.origin
      );
      window.close();
    } else {
      // Direct navigation (not from popup) - handle connection directly
      handleDirectCallback(marketplaceId, code);
    }
  }, [searchParams, navigate, addMarketplaceConnection, addSupplierConnection, addToast]);

  const handleDirectCallback = async (marketplaceId: string, code: string) => {
    try {
      // Import OAuth utilities dynamically to avoid circular dependencies
      const { exchangeCodeForToken } = await import('../../utils/oauth');

      // Exchange code for token
      const tokenData = await exchangeCodeForToken(marketplaceId, code);

      // Determine if this is a marketplace or supplier
      const isSupplier = marketplaceId === 'aliexpress';

      if (isSupplier) {
        addSupplierConnection({
          id: `conn_${marketplaceId}_${Date.now()}`,
          supplierId: 'aliexpress',
          status: 'connected',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiry: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
          connectedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        });
        addToast('success', 'AliExpress connected successfully!');
        navigate('/suppliers');
      } else {
        addMarketplaceConnection({
          id: `conn_${marketplaceId}_${Date.now()}`,
          marketplaceId: marketplaceId as any,
          status: 'connected',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiry: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
          storeName: `My ${marketplaceId} Store`,
          connectedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
          scopes: [],
        });
        addToast('success', `${marketplaceId} connected successfully!`);
        navigate('/marketplaces');
      }
    } catch (err) {
      addToast('error', 'Failed to complete authorization');
      navigate(marketplaceId === 'aliexpress' ? '/suppliers' : '/marketplaces');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto" />
        <p className="mt-4 text-sm text-gray-600">Completing authorization...</p>
      </div>
    </div>
  );
}
