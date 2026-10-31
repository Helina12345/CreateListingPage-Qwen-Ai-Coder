// ============================================================
// ListingDesk Pro — Custom Marketplace Icons
// Original SVG icons representing each marketplace
// These are custom designs, not copyrighted logos
// ============================================================

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// eBay - Custom shopping bag icon with "e" stylization
export const EbayIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#E53238"/>
    <path d="M7 8h3c1.5 0 2.5 1 2.5 2.5S11.5 13 10 13H8v3H7V8zm1 4h2c.8 0 1.5-.5 1.5-1.5S9.8 9 9 9H8v3z" fill="white"/>
    <circle cx="16" cy="12" r="2" fill="white"/>
  </svg>
);

// Amazon - Custom smile arrow icon
export const AmazonIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#FF9900"/>
    <path d="M6 10c0-1 .5-2 2-2s2 1 2 2v1c0 1-.5 2-2 2s-2-1-2-2v-1zm1 0v1c0 .5.3 1 1 1s1-.5 1-1v-1c0-.5-.3-1-1-1s-1 .5-1 1z" fill="white"/>
    <path d="M14 10c0-1 .5-2 2-2s2 1 2 2v1c0 1-.5 2-2 2s-2-1-2-2v-1zm1 0v1c0 .5.3 1 1 1s1-.5 1-1v-1c0-.5-.3-1-1-1s-1 .5-1 1z" fill="white"/>
    <path d="M8 15c2 1.5 6 1.5 8 0" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Shopify - Custom shopping bag with leaf
export const ShopifyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#96BF48"/>
    <path d="M9 7l3-2 3 2v2H9V7z" fill="white"/>
    <path d="M8 10h8v7c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-7z" fill="white"/>
    <path d="M12 12c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z" fill="#96BF48"/>
  </svg>
);

// Etsy - Custom craft/handmade icon
export const EtsyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#F1641E"/>
    <path d="M7 8h10v2H9v2h6v2H9v2h8v2H7V8z" fill="white"/>
  </svg>
);

// Walmart - Custom spark/star icon
export const WalmartIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#0071CE"/>
    <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5L12 6z" fill="white"/>
    <circle cx="8" cy="8" r="1" fill="white"/>
    <circle cx="16" cy="8" r="1" fill="white"/>
    <circle cx="8" cy="16" r="1" fill="white"/>
    <circle cx="16" cy="16" r="1" fill="white"/>
  </svg>
);

// TikTok Shop - Custom music note with shopping bag
export const TikTokShopIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#000000"/>
    <path d="M10 7v6c0 1.5-1.5 3-3 3s-3-1.5-3-3 1.5-3 3-3v2c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1V7h2z" fill="white"/>
    <path d="M14 7h4v2h-4c0 2 2 3 4 3v2c-3 0-6-2-6-5V7h2z" fill="white"/>
    <rect x="14" y="14" width="6" height="5" rx="1" fill="white"/>
  </svg>
);

// Shopee - Custom shopping bag with "S"
export const ShopeeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#EE4D2D"/>
    <path d="M8 7h8l1 3H7l1-3z" fill="white"/>
    <path d="M7 11h10v6c0 1-1 2-2 2H9c-1 0-2-1-2-2v-6z" fill="white"/>
    <path d="M10 13h4v1c0 1-1 2-2 2s-2-1-2-2v-1z" fill="#EE4D2D"/>
  </svg>
);

// Lazada - Custom shopping cart with "L"
export const LazadaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#0F146D"/>
    <path d="M6 8h2l2 7h6l2-7h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="18" r="1.5" fill="white"/>
    <circle cx="16" cy="18" r="1.5" fill="white"/>
    <path d="M9 11h3v1H9v-1z" fill="white"/>
  </svg>
);

// Kohl's - Custom "K" with shopping element
export const KohlsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#003087"/>
    <path d="M8 7h2v4l3-4h2l-3 4 3 4h-2l-3-4v4H8V7z" fill="white"/>
    <rect x="15" y="7" width="2" height="10" fill="white"/>
  </svg>
);

// AliExpress - Custom shopping globe icon
export const AliExpressIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#FF4747"/>
    <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="1.5"/>
    <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="1" opacity="0.5"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
  </svg>
);

// Helper function to get icon by marketplace ID
export const getMarketplaceIcon = (marketplaceId: string): React.FC<IconProps> => {
  const icons: Record<string, React.FC<IconProps>> = {
    ebay: EbayIcon,
    amazon: AmazonIcon,
    shopify: ShopifyIcon,
    etsy: EtsyIcon,
    walmart: WalmartIcon,
    tiktok_shop: TikTokShopIcon,
    shopee: ShopeeIcon,
    lazada: LazadaIcon,
    kohls: KohlsIcon,
    aliexpress: AliExpressIcon,
  };
  return icons[marketplaceId] || EbayIcon;
};

// MarketplaceIcon component for easy usage
export const MarketplaceIcon: React.FC<{ marketplaceId: string; size?: number; className?: string }> = ({
  marketplaceId,
  size = 24,
  className = '',
}) => {
  const IconComponent = getMarketplaceIcon(marketplaceId);
  return <IconComponent size={size} className={className} />;
};
