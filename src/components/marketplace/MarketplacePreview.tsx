// ============================================================
// ListingDesk Pro — Marketplace Preview Components
// Realistic previews based on each marketplace's actual layout
// ============================================================

import React from 'react';
import { clsx } from 'clsx';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, ChevronRight, Package, Check } from 'lucide-react';
import { MARKETPLACES } from '../../config/marketplaces';
import type { MarketplaceId, Listing } from '../../types';

interface PreviewProps {
  listing: Partial<Listing>;
  marketplaceId: MarketplaceId;
}

// ============================================================
// Main Preview Component
// ============================================================
export function MarketplacePreview({ listing, marketplaceId }: PreviewProps) {
  const marketplace = MARKETPLACES[marketplaceId];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-lg">{marketplace.icon}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{marketplace.name} Preview</span>
        </div>
        <span className="text-xs text-gray-500">Live Preview</span>
      </div>

      {/* Marketplace-specific preview */}
      <div className="p-4">
        {marketplaceId === 'ebay' && <EbayPreview listing={listing} />}
        {marketplaceId === 'amazon' && <AmazonPreview listing={listing} />}
        {marketplaceId === 'shopify' && <ShopifyPreview listing={listing} />}
        {marketplaceId === 'etsy' && <EtsyPreview listing={listing} />}
        {marketplaceId === 'walmart' && <WalmartPreview listing={listing} />}
        {marketplaceId === 'tiktok_shop' && <TikTokPreview listing={listing} />}
        {marketplaceId === 'shopee' && <ShopeePreview listing={listing} />}
        {marketplaceId === 'lazada' && <LazadaPreview listing={listing} />}
        {marketplaceId === 'kohls' && <KohlsPreview listing={listing} />}
      </div>
    </div>
  );
}

// ============================================================
// eBay Preview
// ============================================================
function EbayPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-blue-600 mb-1">eBay</p>
            <h2 className="text-lg font-medium text-blue-700 hover:underline cursor-pointer line-clamp-2">
              {listing.title || 'Your product title'}
            </h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${price.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Condition: <span className="font-medium">{listing.condition || 'New'}</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Truck className="h-3.5 w-3.5" />
            <span>Free shipping</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {listing.sku ? `SKU: ${listing.sku}` : ''}
          </p>
          <div className="pt-2 space-y-2">
            <button className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Buy It Now
            </button>
            <button className="w-full rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
              Add to cart
            </button>
          </div>
        </div>
      </div>
      {listing.description && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Item Description</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{listing.description}</p>
        </div>
      )}
      {listing.tags && listing.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Item Specifics</h3>
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Amazon Preview
// ============================================================
function AmazonPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="aspect-square rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-contain rounded-lg p-4" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="sm:col-span-2 space-y-2">
          <p className="text-xs text-orange-600">Brand: {listing.brand || 'Brand Name'}</p>
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-orange-700 cursor-pointer">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-blue-600 ml-1">1,234 ratings</span>
          </div>
          <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">Price:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs align-top">$</span>
              <span className="text-2xl font-medium text-gray-900 dark:text-gray-100">
                {Math.floor(price)}
              </span>
              <span className="text-xs align-top">{(price % 1).toFixed(2).substring(2)}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              FREE delivery <span className="font-bold text-gray-900 dark:text-gray-100">Tomorrow</span>
            </p>
          </div>
          <div className="pt-2 space-y-2">
            <button className="w-full rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-500">
              Add to Cart
            </button>
            <button className="w-full rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
              Buy Now
            </button>
          </div>
        </div>
      </div>
      {listing.description && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">About this item</h3>
          <ul className="space-y-1">
            {listing.description.split('. ').slice(0, 5).map((sentence, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-400">•</span>
                <span>{sentence.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Shopify Preview
// ============================================================
function ShopifyPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
            {listing.title || 'Your product title'}
          </h2>
          <p className="text-xl font-medium text-gray-900 dark:text-gray-100">${price.toFixed(2)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tax included. Shipping calculated at checkout.
          </p>
          {listing.variants && listing.variants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Options</p>
              <div className="flex flex-wrap gap-2">
                {listing.variants.slice(0, 4).map((v) => (
                  <button key={v.id} className="rounded border border-gray-300 px-3 py-1 text-xs hover:border-gray-900 dark:border-gray-600 dark:hover:border-gray-300">
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 space-y-2">
            <button className="w-full rounded bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              Add to cart
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
              Buy it now
            </button>
          </div>
        </div>
      </div>
      {listing.description && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{listing.description}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Etsy Preview
// ============================================================
function EtsyPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-orange-50 dark:bg-gray-700 flex items-center justify-center">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            ))}
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">(2,345)</span>
          </div>
          <p className="text-2xl font-medium text-gray-900 dark:text-gray-100">
            ${price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Local taxes included (where applicable)
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Truck className="h-3.5 w-3.5" />
            <span>Arrives by Dec 20-25</span>
          </div>
          <div className="pt-2 space-y-2">
            <button className="w-full rounded-full bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
              Add to cart
            </button>
            <div className="flex gap-2">
              <button className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600">
                <Heart className="inline h-3.5 w-3.5 mr-1" /> Favorite
              </button>
              <button className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600">
                <Share2 className="inline h-3.5 w-3.5 mr-1" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>
      {listing.description && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Item details</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{listing.description}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Walmart Preview
// ============================================================
function WalmartPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-contain rounded-lg p-4" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <p className="text-xs text-blue-600">Brand: {listing.brand || 'Brand'}</p>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">4.5</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={clsx('h-3.5 w-3.5', i <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')} />
              ))}
            </div>
            <span className="text-xs text-blue-600">(892 reviews)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${price.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Free shipping, arrives in 2 days
          </p>
          <div className="pt-2 space-y-2">
            <button className="w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Add to cart
            </button>
            <button className="w-full rounded-full border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
              Buy now with Walmart+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TikTok Shop Preview
// ============================================================
function TikTokPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="aspect-[9/16] max-h-96 rounded-lg bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {listing.images?.[0]?.url ? (
          <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-600" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <h2 className="text-white font-medium line-clamp-2 mb-2">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">${price.toFixed(2)}</span>
          </div>
          <button className="mt-3 w-full rounded-full bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
            Buy Now
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5" />
          <span>Free Shipping</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span>Buyer Protection</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shopee Preview
// ============================================================
function ShopeePreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-orange-50 dark:bg-gray-700 flex items-center justify-center">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 line-through">${(price * 1.2).toFixed(2)}</span>
            <span className="text-2xl font-bold text-orange-500">${price.toFixed(2)}</span>
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">-17%</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>⭐ 4.9</span>
            <span>1.2K Ratings</span>
            <span>5K Sold</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Truck className="h-3.5 w-3.5" />
            <span>Free Shipping</span>
          </div>
          <div className="pt-2">
            <button className="w-full rounded-sm bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 border border-orange-600">
              Add To Cart
            </button>
            <button className="mt-2 w-full rounded-sm border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50">
              Buy With voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Lazada Preview
// ============================================================
function LazadaPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-blue-50 dark:bg-gray-700 flex items-center justify-center">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600">${price.toFixed(2)}</span>
            <span className="text-xs text-gray-500 line-through">${(price * 1.15).toFixed(2)}</span>
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">-13%</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>⭐ 4.8</span>
            <span>856 Ratings</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Truck className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-blue-600 font-medium">Free Shipping</span>
          </div>
          <div className="pt-2">
            <button className="w-full rounded bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Kohl's Preview
// ============================================================
function KohlsPreview({ listing }: { listing: Partial<Listing> }) {
  const price = listing.pricing?.basePrice || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-medium text-blue-700">{listing.brand || 'Brand Name'}</p>
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {listing.title || 'Your product title'}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-red-600">${price.toFixed(2)}</span>
            <span className="text-xs text-gray-500">Reg. ${(price * 1.25).toFixed(2)}</span>
          </div>
          <div className="rounded bg-yellow-100 p-2 text-xs text-yellow-800">
            <p className="font-medium">Earn $5 Kohl's Cash</p>
            <p>on every $25 spent</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Truck className="h-3.5 w-3.5" />
            <span>Free Shipping with $25+ purchase</span>
          </div>
          <div className="pt-2">
            <button className="w-full rounded bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">
              Add to Bag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Marketplace Selector for Preview
// ============================================================
interface PreviewSelectorProps {
  listing: Partial<Listing>;
  selectedMarketplace: MarketplaceId | null;
  onSelect: (id: MarketplaceId) => void;
  connectedMarketplaces: MarketplaceId[];
}

export function PreviewSelector({ listing, selectedMarketplace, onSelect, connectedMarketplaces }: PreviewSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {(Object.keys(MARKETPLACES) as MarketplaceId[]).map((mpId) => {
          const mp = MARKETPLACES[mpId];
          const isConnected = connectedMarketplaces.includes(mpId);
          const isSelected = selectedMarketplace === mpId;

          return (
            <button
              key={mpId}
              onClick={() => onSelect(mpId)}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-lg border p-2 transition-all',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                !isConnected && 'opacity-50'
              )}
            >
              <span className="text-xl">{mp.icon}</span>
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                {mp.name}
              </span>
              {isConnected ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <span className="text-[9px] text-gray-400">Not connected</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedMarketplace && (
        <MarketplacePreview listing={listing} marketplaceId={selectedMarketplace} />
      )}
    </div>
  );
}
