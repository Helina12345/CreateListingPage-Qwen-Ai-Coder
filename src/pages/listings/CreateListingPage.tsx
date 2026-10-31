// ============================================================
// ListingDesk Pro — Create/Edit Listing Page
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Image, Upload, X, GripVertical, Trash2, Plus, Eye,
  Save, Globe, AlertCircle, Check, ChevronDown, ChevronRight,
  Package, DollarSign, Truck, Tag, Shield, Layout, Calendar,
  MapPin, RotateCw,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, Modal, ProgressBar } from '../../components/ui';
import { MARKETPLACES, MARKETPLACE_LIST } from '../../config/marketplaces';
import { MARKETPLACE_SCHEMAS, getFieldsForCategory } from '../../config/marketplace-schemas';
import { FieldRenderer, FieldGroup } from '../../components/marketplace/FieldRenderer';
import { PreviewSelector } from '../../components/marketplace/MarketplacePreview';
import { RichTextEditor } from '../../components/editor/RichTextEditor';
import { ImageLightbox } from '../../components/media/ImageLightbox';
import { CountrySelector } from '../../components/listing/CountrySelector';
import { GTINExemption } from '../../components/listing/GTINExemption';
import { HazmatDeclaration } from '../../components/listing/HazmatDeclaration';
import { ProductionLabels } from '../../components/listing/ProductionLabels';
import { BrandRegistry } from '../../components/listing/BrandRegistry';
import { VariantLimitsValidator } from '../../components/listing/VariantLimitsValidator';
import { ImageRequirementsValidator } from '../../components/listing/ImageRequirementsValidator';
import { ShippingReturnsConfig } from '../../components/listing/ShippingReturnsConfig';
import { ProductIdentifiersCompliance } from '../../components/listing/ProductIdentifiersCompliance';
import { VideoUpload } from '../../components/listing/VideoUpload';
import { TaxConfiguration } from '../../components/listing/TaxConfiguration';
import { ProductCertifications } from '../../components/listing/ProductCertifications';
import { CrossBorderTrade } from '../../components/listing/CrossBorderTrade';
import { PaymentMethods } from '../../components/listing/PaymentMethods';
import { BulkImageUpload } from '../../components/listing/BulkImageUpload';
import { InventoryAllocation } from '../../components/listing/InventoryAllocation';
import { CustomItemSpecifics } from '../../components/listing/CustomItemSpecifics';
import { ProductDimensions } from '../../components/listing/ProductDimensions';
import { LegalDisclaimers } from '../../components/listing/LegalDisclaimers';
import { EbaySpecificFields } from '../../components/listing/EbaySpecificFields';
import { AmazonSpecificFields } from '../../components/listing/AmazonSpecificFields';
import { ShopifySpecificFields } from '../../components/listing/ShopifySpecificFields';
import { EtsySpecificFields } from '../../components/listing/EtsySpecificFields';
import { WalmartSpecificFields } from '../../components/listing/WalmartSpecificFields';
import { TikTokShopSpecificFields } from '../../components/listing/TikTokShopSpecificFields';
import { ShopeeSpecificFields } from '../../components/listing/ShopeeSpecificFields';
import { LazadaSpecificFields } from '../../components/listing/LazadaSpecificFields';
import { KohlsSpecificFields } from '../../components/listing/KohlsSpecificFields';
import { AmazonCriticalFields } from '../../components/listing/AmazonCriticalFields';
import { EbayCriticalFields } from '../../components/listing/EbayCriticalFields';
import { ShopifyCriticalFields } from '../../components/listing/ShopifyCriticalFields';
import { EtsyCriticalFields } from '../../components/listing/EtsyCriticalFields';
import { WalmartCriticalFields } from '../../components/listing/WalmartCriticalFields';
import { TikTokShopCriticalFields } from '../../components/listing/TikTokShopCriticalFields';
import { ShopeeCriticalFields } from '../../components/listing/ShopeeCriticalFields';
import { LazadaCriticalFields } from '../../components/listing/LazadaCriticalFields';
import { KohlsCriticalFields } from '../../components/listing/KohlsCriticalFields';
import { AliExpressCriticalFields } from '../../components/listing/AliExpressCriticalFields';
import { useListingStore, useUIStore, useMarketplaceStore } from '../../store';
import { listingApi } from '../../api/client';
import type { MarketplaceId, ListingImage, ListingVariant, Listing } from '../../types';

type TabId = 'basic' | 'media' | 'variants' | 'pricing' | 'shipping' | 'marketplaces' | 'marketplace-fields' | 'preview' | 'seo';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'basic', label: 'Basic Info', icon: Package },
  { id: 'media', label: 'Images & Media', icon: Image },
  { id: 'variants', label: 'Variants', icon: Tag },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'marketplaces', label: 'Marketplaces', icon: Globe },
  { id: 'marketplace-fields', label: 'Marketplace Fields', icon: Layout },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'seo', label: 'SEO & Compliance', icon: Shield },
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { addToast } = useUIStore();
  const { connections } = useMarketplaceStore();
  const { listings, addListing, updateListing } = useListingStore();
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('new');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [upc, setUpc] = useState('');
  const [ean, setEan] = useState('');
  const [images, setImages] = useState<ListingImage[]>([]);
  const [variants, setVariants] = useState<ListingVariant[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceId[]>([]);
  const [autoPriceAdjust, setAutoPriceAdjust] = useState(true);
  const [profitMargin, setProfitMargin] = useState('30');

  // Marketplace-specific field overrides
  const [marketplaceOverrides, setMarketplaceOverrides] = useState<Record<string, Record<string, string>>>({});

  // Marketplace-specific field values (per marketplace)
  const [marketplaceFieldValues, setMarketplaceFieldValues] = useState<Record<string, Record<string, any>>>({});

  // Preview marketplace selection
  const [previewMarketplace, setPreviewMarketplace] = useState<MarketplaceId | null>(null);

  // Selected category per marketplace
  const [marketplaceCategories, setMarketplaceCategories] = useState<Record<string, string>>({});

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // New critical features state
  const [countryOfOrigin, setCountryOfOrigin] = useState<string>('');
  const [materialsSourced, setMaterialsSourced] = useState<string[]>([]);
  const [gtinExemption, setGtinExemption] = useState<{
    requested: boolean;
    reason?: string;
    category?: string;
    brandName?: string;
    status?: 'pending' | 'approved' | 'rejected';
  }>({ requested: false });
  const [hazmat, setHazmat] = useState<{
    isHazmat: boolean;
    category?: string;
    unNumber?: string;
    properShippingName?: string;
    packingGroup?: string;
  }>({ isHazmat: false });
  const [productionLabels, setProductionLabels] = useState<{
    productionPartner?: string;
    label?: 'made_by' | 'designed_by' | 'sourced_by' | 'handpicked_by';
    whoMadeIt?: string;
    whenMade?: string;
  }>({});
  const [brandRegistry, setBrandRegistry] = useState<{
    brandName: string;
    registered: boolean;
    registryId?: string;
    verificationStatus?: 'unverified' | 'verifying' | 'verified' | 'failed';
  }>({ brandName: '', registered: false, verificationStatus: 'unverified' });

  // Marketplace-specific fields state
  const [ebayFields, setEbayFields] = useState<any>({});
  const [amazonFields, setAmazonFields] = useState<any>({});
  const [shopifyFields, setShopifyFields] = useState<any>({});
  const [etsyFields, setEtsyFields] = useState<any>({});
  const [walmartFields, setWalmartFields] = useState<any>({});
  const [tiktokFields, setTiktokFields] = useState<any>({});
  const [shopeeFields, setShopeeFields] = useState<any>({});
  const [lazadaFields, setLazadaFields] = useState<any>({});
  const [kohlsFields, setKohlsFields] = useState<any>({});

  // Marketplace critical fields state
  const [amazonCriticalFields, setAmazonCriticalFields] = useState<any>({});
  const [ebayCriticalFields, setEbayCriticalFields] = useState<any>({});
  const [shopifyCriticalFields, setShopifyCriticalFields] = useState<any>({});
  const [etsyCriticalFields, setEtsyCriticalFields] = useState<any>({});
  const [walmartCriticalFields, setWalmartCriticalFields] = useState<any>({});
  const [tiktokCriticalFields, setTiktokCriticalFields] = useState<any>({});
  const [shopeeCriticalFields, setShopeeCriticalFields] = useState<any>({});
  const [lazadaCriticalFields, setLazadaCriticalFields] = useState<any>({});
  const [kohlsCriticalFields, setKohlsCriticalFields] = useState<any>({});
  const [aliexpressCriticalFields, setAliexpressCriticalFields] = useState<any>({});

  // New features state
  const [shippingReturns, setShippingReturns] = useState<{
    shippingProfile?: string;
    fulfillmentMethod?: 'FBM' | 'FBA';
    returnPolicy?: {
      acceptsReturns: boolean;
      days?: number;
      whoPaysShipping?: 'buyer' | 'seller';
    };
  }>({});

  const [productIdentifiersCompliance, setProductIdentifiersCompliance] = useState<{
    upc?: string;
    ean?: string;
    isbn?: string;
    jan?: string;
    asin?: string;
    conditionNotes?: string;
    compliance?: {
      fda?: boolean;
      ce?: boolean;
      fcc?: boolean;
      cpsia?: boolean;
      prop65?: boolean;
    };
  }>({});

  // Additional features state
  const [video, setVideo] = useState<{
    url?: string;
    duration?: number;
    size?: number;
  }>({});

  const [taxConfig, setTaxConfig] = useState<{
    taxCategory?: string;
    taxExempt?: boolean;
    taxExemptReason?: string;
    vatRegistered?: boolean;
    vatNumber?: string;
  }>({});

  const [certifications, setCertifications] = useState<{
    certifications: Array<{
      id: string;
      type: string;
      name: string;
      fileUrl?: string;
      fileName?: string;
      uploadedAt?: string;
    }>;
  }>({ certifications: [] });

  const [crossBorderTrade, setCrossBorderTrade] = useState<{
    shipsInternationally?: boolean;
    excludedCountries?: string[];
    customsInfo?: {
      hsCode?: string;
      countryOfOrigin?: string;
      description?: string;
      value?: number;
    };
  }>({});

  const [paymentMethods, setPaymentMethods] = useState<{
    acceptedPayments: string[];
  }>({ acceptedPayments: [] });

  const [inventoryAllocation, setInventoryAllocation] = useState<Record<MarketplaceId, number>>({} as Record<MarketplaceId, number>);

  const [customItemSpecifics, setCustomItemSpecifics] = useState<Array<{
    id: string;
    name: string;
    value: string;
  }>>([]);

  const [productDimensions, setProductDimensions] = useState<{
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    dimensionsUnit?: 'inches' | 'cm';
    weightUnit?: 'lbs' | 'oz' | 'kg' | 'g';
  }>({});

  const [legalDisclaimers, setLegalDisclaimers] = useState<{
    prop65?: boolean;
    prop65Text?: string;
    ageRestriction?: boolean;
    minAge?: number;
    healthWarning?: boolean;
    healthWarningText?: string;
    chokingHazard?: boolean;
    smallParts?: boolean;
    batteryIncluded?: boolean;
    customDisclaimer?: string;
  }>({});

  // Load draft data if editing
  useEffect(() => {
    if (editId) {
      const draft = listings.find((l) => l.id === editId);
      if (draft && draft.status === 'draft') {
        setEditingDraftId(draft.id);
        setTitle(draft.title);
        setDescription(draft.description);
        setShortDescription(draft.shortDescription || '');
        setSku(draft.sku);
        setBrand(draft.brand || '');
        setCondition(draft.condition);
        setBasePrice(draft.pricing.basePrice.toString());
        setSalePrice(draft.pricing.salePrice?.toString() || '');
        setCostPrice(draft.pricing.costPrice?.toString() || '');
        setQuantity(draft.inventory.totalQuantity.toString());
        setWeight(draft.shipping.weight.toString());
        setTags(draft.tags);
        setUpc(draft.upc || '');
        setEan(draft.ean || '');
        setImages(draft.images);
        setVariants(draft.variants);
      }
    }
  }, [editId, listings]);

  const handleSave = async (publish = false) => {
    if (!title || !sku || !basePrice) {
      addToast('error', 'Please fill in required fields: Title, SKU, and Price');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const listingData: Partial<Listing> = {
        title,
        description,
        shortDescription,
        sku,
        brand,
        condition: condition as 'new' | 'used' | 'refurbished',
        pricing: {
          basePrice: parseFloat(basePrice),
          salePrice: salePrice ? parseFloat(salePrice) : undefined,
          costPrice: costPrice ? parseFloat(costPrice) : undefined,
          currency: 'USD',
          marketplacePrices: calculateMarketplacePrices() as Record<MarketplaceId, number>,
          pricingRules: [],
        },
        inventory: {
          totalQuantity: parseInt(quantity) || 0,
          allocatedPerMarketplace: {} as Record<MarketplaceId, number>,
          lowStockThreshold: 5,
          reorderPoint: 10,
          lastUpdated: now,
        },
        images,
        variants,
        tags,
        upc,
        ean,
        shipping: {
          weight: parseFloat(weight) || 0,
          dimensions: { length: 0, width: 0, height: 0 },
          origin: { country: 'US', zipCode: '90210' },
          profiles: [],
          international: true,
          hazmat: false,
        },
        status: publish ? 'active' : 'draft',
        marketplaceData: [],
        createdAt: now,
        updatedAt: now,
      };

      if (editingDraftId) {
        // Update existing draft
        updateListing(editingDraftId, listingData);
        addToast('success', publish ? 'Listing updated and publishing...' : 'Draft updated');

        if (publish && selectedMarketplaces.length > 0) {
          await listingApi.publish(editingDraftId, selectedMarketplaces);
        }

        navigate(publish ? '/listings' : '/drafts');
      } else {
        // Create new listing
        const newListing: Listing = {
          id: `listing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: listingData.title!,
          description: listingData.description!,
          shortDescription: listingData.shortDescription,
          sku: listingData.sku!,
          brand: listingData.brand,
          condition: listingData.condition!,
          tags: listingData.tags || [],
          status: listingData.status!,
          images: listingData.images || [],
          variants: listingData.variants || [],
          pricing: listingData.pricing as any,
          inventory: listingData.inventory as any,
          shipping: listingData.shipping as any,
          marketplaceData: [],
          upc: listingData.upc,
          ean: listingData.ean,
          createdAt: now,
          updatedAt: now,
        };

        addListing(newListing);
        addToast('success', publish ? 'Listing created and publishing...' : 'Draft saved');

        if (publish && selectedMarketplaces.length > 0) {
          await listingApi.publish(newListing.id, selectedMarketplaces);
        }

        navigate(publish ? '/listings' : '/drafts');
      }
    } catch {
      addToast('error', 'Failed to save listing');
    } finally {
      setSaving(false);
    }
  };

  const calculateMarketplacePrices = (): Record<MarketplaceId, number> => {
    const base = parseFloat(basePrice) || 0;
    const margin = (parseFloat(profitMargin) || 0) / 100;
    const prices: Record<string, number> = {};

    MARKETPLACE_LIST.forEach((mp) => {
      const feeMultiplier = 1 + (mp.feePercentage / 100);
      prices[mp.id] = Math.round(base * feeMultiplier * (1 + margin) * 100) / 100;
    });

    return prices as Record<MarketplaceId, number>;
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `v-${Date.now()}`,
        sku: `${sku}-VAR${variants.length + 1}`,
        title: `Variant ${variants.length + 1}`,
        attributes: {},
        price: parseFloat(basePrice) || 0,
        inventory: 0,
        images: [],
      },
    ]);
  };

  const currentTab = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingDraftId ? 'Edit Draft' : 'Create Listing'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingDraftId
              ? 'Update your draft listing and publish when ready'
              : 'Create a listing and publish to multiple marketplaces simultaneously'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} loading={saving} icon={<Save className="h-4 w-4" />}>
            Save Draft
          </Button>
          <Button variant="primary" onClick={() => handleSave(true)} loading={saving} icon={<Globe className="h-4 w-4" />}>
            Save & Publish
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <ProgressBar
          value={currentTab + 1}
          max={TABS.length}
          label={`Step ${currentTab + 1} of ${TABS.length}`}
          variant={currentTab === TABS.length - 1 ? 'success' : 'default'}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Tab Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 sticky top-4">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive product title"
                    maxLength={255}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Will be adapted per marketplace</span>
                    <span className={clsx(
                      'font-medium',
                      title.length > 200 ? 'text-red-500' : title.length > 80 ? 'text-yellow-600' : 'text-gray-500'
                    )}>
                      {title.length}/255 characters
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Brief product summary"
                  />
                </div>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  label="Full Description"
                  placeholder="Detailed product description (HTML supported on some marketplaces)"
                  helpText="Use the toolbar to format your description with fonts, colors, lists, and more"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="SKU *" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g., PROD-001" />
                  <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    options={[
                      { value: 'new', label: 'New' },
                      { value: 'used', label: 'Used' },
                      { value: 'refurbished', label: 'Refurbished' },
                    ]}
                  />
                  <Input label="UPC/GTIN" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="012345678905" hint="GTIN/UPC/EAN lookup" />
                  <Input label="EAN" value={ean} onChange={(e) => setEan(e.target.value)} placeholder="Optional" />
                </div>

                {/* Product Identifiers & Compliance */}
                {selectedMarketplaces.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ProductIdentifiersCompliance
                      selectedMarketplaces={selectedMarketplaces}
                      value={{
                        ...productIdentifiersCompliance,
                        upc: upc || productIdentifiersCompliance.upc,
                        ean: ean || productIdentifiersCompliance.ean,
                      }}
                      onChange={(newValue) => {
                        setProductIdentifiersCompliance(newValue);
                        if (newValue.upc) setUpc(newValue.upc);
                        if (newValue.ean) setEan(newValue.ean);
                      }}
                      condition={condition}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {tag}
                        <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
                  </div>
                </div>

                {/* Critical Marketplace Requirements */}
                {selectedMarketplaces.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                      Marketplace Requirements
                    </h3>

                    {/* Country of Origin (eBay, Walmart, Kohl's) */}
                    {selectedMarketplaces.some((mp) => ['ebay', 'walmart', 'kohls'].includes(mp)) && (
                      <CountrySelector
                        label="Country of Origin"
                        value={countryOfOrigin}
                        onChange={(value) => setCountryOfOrigin(value as string)}
                        required
                        placeholder="Select country of origin..."
                      />
                    )}

                    {/* Materials Sourced From (eBay) */}
                    {selectedMarketplaces.includes('ebay') && (
                      <CountrySelector
                        label="Materials Sourced From"
                        value={materialsSourced}
                        onChange={(value) => setMaterialsSourced(value as string[])}
                        multiple
                        placeholder="Select countries where materials were sourced..."
                      />
                    )}

                    {/* GTIN Exemption (Amazon) */}
                    {selectedMarketplaces.includes('amazon') && !upc && !ean && (
                      <GTINExemption
                        value={gtinExemption}
                        onChange={setGtinExemption}
                        marketplaceId="amazon"
                      />
                    )}

                    {/* Hazmat Declaration (TikTok Shop, Amazon, Walmart) */}
                    {selectedMarketplaces.some((mp) => ['tiktok_shop', 'amazon', 'walmart'].includes(mp)) && (
                      <HazmatDeclaration
                        value={hazmat}
                        onChange={setHazmat}
                        marketplaceId={selectedMarketplaces.find((mp) => ['tiktok_shop', 'amazon', 'walmart'].includes(mp)) || 'tiktok_shop'}
                      />
                    )}

                    {/* Production Labels (Etsy) */}
                    {selectedMarketplaces.includes('etsy') && (
                      <ProductionLabels
                        value={productionLabels}
                        onChange={setProductionLabels}
                        marketplaceId="etsy"
                      />
                    )}

                    {/* Brand Registry (Amazon, Kohl's) */}
                    {selectedMarketplaces.some((mp) => ['amazon', 'kohls'].includes(mp)) && brand && (
                      <BrandRegistry
                        value={{ ...brandRegistry, brandName: brand }}
                        onChange={(value) => setBrandRegistry({ ...value, brandName: brand })}
                        marketplaceId={selectedMarketplaces.find((mp) => ['amazon', 'kohls'].includes(mp)) || 'amazon'}
                      />
                    )}

                    {/* Custom Item Specifics */}
                    {selectedMarketplaces.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <CustomItemSpecifics
                          selectedMarketplaces={selectedMarketplaces}
                          value={customItemSpecifics}
                          onChange={setCustomItemSpecifics}
                        />
                      </div>
                    )}

                    {/* Product Certifications */}
                    {selectedMarketplaces.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <ProductCertifications
                          selectedMarketplaces={selectedMarketplaces}
                          value={certifications}
                          onChange={setCertifications}
                        />
                      </div>
                    )}

                    {/* Legal Disclaimers */}
                    {selectedMarketplaces.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <LegalDisclaimers
                          selectedMarketplaces={selectedMarketplaces}
                          value={legalDisclaimers}
                          onChange={setLegalDisclaimers}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Images Tab */}
          {activeTab === 'media' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Photos & Video</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You can add up to 24 photos and a 1-minute video. Buyers want to see all details and angles.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map((img, i) => (
                    <div key={img.id} className={clsx('relative aspect-square rounded-lg border-2 overflow-hidden group', img.isMain ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700')}>
                      <button
                        onClick={() => {
                          setLightboxIndex(i);
                          setLightboxOpen(true);
                        }}
                        className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity"
                      >
                        {img.url ? (
                          <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                        ) : (
                          <Image className="h-8 w-8 text-gray-400" />
                        )}
                      </button>
                      {img.isMain && (
                        <span className="absolute top-1 left-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white font-medium">Main</span>
                      )}
                      <button
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i > 0 && <button onClick={() => { const newImages = [...images]; [newImages[i], newImages[i-1]] = [newImages[i-1], newImages[i]]; setImages(newImages); }} className="text-white text-xs">←</button>}
                        {i < images.length - 1 && <button onClick={() => { const newImages = [...images]; [newImages[i], newImages[i+1]] = [newImages[i+1], newImages[i]]; setImages(newImages); }} className="text-white text-xs">→</button>}
                      </div>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 dark:border-gray-600 transition-colors">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="mt-1 text-xs text-gray-500">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const newImages = files.map((file, i) => ({
                          id: `img-${Date.now()}-${i}`,
                          url: URL.createObjectURL(file),
                          alt: file.name,
                          isMain: images.length === 0 && i === 0,
                          position: images.length + i,
                        }));
                        setImages([...images, ...newImages]);
                      }}
                    />
                  </label>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    📸 Image Requirements by Marketplace
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-400">
                    <div><strong>eBay:</strong> Up to 24 photos + 1-min video, min 500x500px</div>
                    <div><strong>Amazon:</strong> Max 9 images, min 1000x1000px for zoom, pure white background</div>
                    <div><strong>Shopify:</strong> Up to 250 images, alt text for SEO</div>
                    <div><strong>Etsy:</strong> Max 10 photos, min 2000px shortest side</div>
                    <div><strong>Walmart:</strong> Max 7 images, white background recommended</div>
                    <div><strong>TikTok Shop:</strong> Up to 9 images, min 600x600px</div>
                    <div><strong>Shopee:</strong> Up to 9 images</div>
                    <div><strong>Lazada:</strong> Up to 8 images</div>
                    <div><strong>Kohl's:</strong> Up to 10 images</div>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    💡 Tip: Use square images (1:1 ratio) for best results across all marketplaces
                  </p>
                </div>

                {/* Bulk Image Upload */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <BulkImageUpload
                    value={images}
                    onChange={setImages}
                    maxImages={24}
                  />
                </div>

                {/* Video Upload */}
                {selectedMarketplaces.some((mp) => ['ebay', 'tiktok_shop'].includes(mp)) && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <VideoUpload
                      selectedMarketplaces={selectedMarketplaces}
                      value={video}
                      onChange={setVideo}
                    />
                  </div>
                )}

                {/* Image Requirements Validator */}
                {images.length > 0 && selectedMarketplaces.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ImageRequirementsValidator
                      images={images}
                      selectedMarketplaces={selectedMarketplaces}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Variants</h2>
                <Button variant="outline" size="sm" onClick={addVariant} icon={<Plus className="h-3.5 w-3.5" />}>
                  Add Variant
                </Button>
              </div>
              {variants.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No variants yet. Add variants for different sizes, colors, etc.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, i) => (
                    <div key={variant.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <Input label="Variant Name" value={variant.title} onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[i] = { ...newVariants[i], title: e.target.value };
                          setVariants(newVariants);
                        }} placeholder="e.g., Black / Large" />
                        <Input label="SKU" value={variant.sku} onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[i] = { ...newVariants[i], sku: e.target.value };
                          setVariants(newVariants);
                        }} />
                        <Input label="Price" type="number" value={variant.price.toString()} onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[i] = { ...newVariants[i], price: parseFloat(e.target.value) || 0 };
                          setVariants(newVariants);
                        }} />
                        <Input label="Stock" type="number" value={variant.inventory.toString()} onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[i] = { ...newVariants[i], inventory: parseInt(e.target.value) || 0 };
                          setVariants(newVariants);
                        }} />
                      </div>
                    </div>
                  ))}

                  {/* Variant Limits Validator */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <VariantLimitsValidator
                      variants={variants}
                      selectedMarketplaces={selectedMarketplaces}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pricing</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Base Price *" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0.00" />
                  <Input label="Sale Price" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Optional" />
                  <Input label="Cost Price" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="Your cost" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Profit Margin %" type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} placeholder="30" />
                  <Input label="Total Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" />
                </div>

                {/* Marketplace Price Preview */}
                {basePrice && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Marketplace Prices (auto-calculated with fees + margin)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {MARKETPLACE_LIST.map((mp) => {
                        const prices = calculateMarketplacePrices();
                        return (
                          <div key={mp.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span>{mp.icon}</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{mp.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">${prices[mp.id]?.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Prices include marketplace fees ({MARKETPLACE_LIST.map((m) => `${m.name}: ${m.feePercentage}%`).join(', ')}) + {profitMargin}% profit margin
                    </p>
                  </div>
                )}

                {/* Inventory Allocation */}
                {selectedMarketplaces.length > 0 && quantity && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <InventoryAllocation
                      selectedMarketplaces={selectedMarketplaces}
                      totalQuantity={parseInt(quantity) || 0}
                      value={inventoryAllocation}
                      onChange={setInventoryAllocation}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shipping & Returns</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Weight (lbs)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.5" />
                  <Input label="Origin ZIP Code" value="90210" onChange={() => {}} placeholder="90210" />
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">
                      <p><strong>Hazmat Check:</strong> If your product contains hazardous materials, additional compliance is required for certain marketplaces.</p>
                      <p className="mt-1"><strong>International Shipping:</strong> Customs/duty estimation available. Not all marketplaces support international shipping (Walmart, Kohl's are US-only).</p>
                    </div>
                  </div>
                </div>

                {/* Shipping & Returns Configuration */}
                <ShippingReturnsConfig
                  selectedMarketplaces={selectedMarketplaces}
                  value={shippingReturns}
                  onChange={setShippingReturns}
                />

                {/* Product Dimensions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <ProductDimensions
                    value={productDimensions}
                    onChange={setProductDimensions}
                  />
                </div>

                {/* Tax Configuration */}
                {selectedMarketplaces.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <TaxConfiguration
                      selectedMarketplaces={selectedMarketplaces}
                      value={taxConfig}
                      onChange={setTaxConfig}
                    />
                  </div>
                )}

                {/* Cross-Border Trade */}
                {selectedMarketplaces.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <CrossBorderTrade
                      selectedMarketplaces={selectedMarketplaces}
                      value={crossBorderTrade}
                      onChange={setCrossBorderTrade}
                    />
                  </div>
                )}

                {/* Payment Methods */}
                {selectedMarketplaces.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <PaymentMethods
                      selectedMarketplaces={selectedMarketplaces}
                      value={paymentMethods}
                      onChange={setPaymentMethods}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Marketplaces Tab */}
          {activeTab === 'marketplaces' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Marketplaces</h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose which marketplaces to publish this listing to. Each marketplace has specific field requirements.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MARKETPLACE_LIST.map((mp) => {
                  const isSelected = selectedMarketplaces.includes(mp.id);
                  return (
                    <label
                      key={mp.id}
                      className={clsx(
                        'flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all',
                        isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMarketplaces([...selectedMarketplaces, mp.id]);
                          else setSelectedMarketplaces(selectedMarketplaces.filter((id) => id !== mp.id));
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mp.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{mp.name}</span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
                          <p>Title: max {mp.supportedFields.title.maxLength} chars</p>
                          <p>Images: max {mp.supportedFields.images.maxCount}</p>
                          <p>Fee: {mp.feePercentage}%</p>
                          {mp.supportedFields.pricing.hasMAP && <p className="text-amber-600">⚠ MAP enforcement</p>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Preview Section */}
              {selectedMarketplaces.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview: How your listing will appear</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedMarketplaces.slice(0, 4).map((mpId) => {
                      const mp = MARKETPLACES[mpId];
                      return (
                        <div key={mpId} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-3">
                            <span>{mp.icon}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{mp.name} Preview</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                              {title ? title.slice(0, mp.supportedFields.title.maxLength) : 'Your product title...'}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {description ? description.slice(0, 100) : 'Product description...'}
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              ${calculateMarketplacePrices()[mpId]?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Marketplace Fields Tab */}
          {activeTab === 'marketplace-fields' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Marketplace-Specific Fields</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Fill in marketplace-specific item details. These fields vary by marketplace and category.
              </p>

              {selectedMarketplaces.length === 0 ? (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                      <p className="font-medium">No marketplaces selected</p>
                      <p className="text-xs mt-1">Go to the "Marketplaces" tab to select which marketplaces you want to publish to.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedMarketplaces.map((mpId) => {
                    const schema = MARKETPLACE_SCHEMAS[mpId];
                    const mp = MARKETPLACES[mpId];
                    const fieldValues = marketplaceFieldValues[mpId] || {};
                    const categoryId = marketplaceCategories[mpId];

                    const setFieldValue = (key: string, value: any) => {
                      setMarketplaceFieldValues((prev) => ({
                        ...prev,
                        [mpId]: { ...fieldValues, [key]: value },
                      }));
                    };

                    // Group fields by their group
                    const requiredFields = schema.itemSpecifics.filter((f) => f.group === 'required' && (!f.category || !categoryId || f.category.includes(categoryId)));
                    const recommendedFields = schema.itemSpecifics.filter((f) => f.group === 'recommended' && (!f.category || !categoryId || f.category.includes(categoryId)));
                    const optionalFields = schema.itemSpecifics.filter((f) => f.group === 'optional' && (!f.category || !categoryId || f.category.includes(categoryId)));

                    return (
                      <div key={mpId} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 dark:bg-gray-800">
                          <span className="text-2xl">{mp.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{mp.name}</h3>
                            <p className="text-xs text-gray-500">
                              {requiredFields.length} required • {recommendedFields.length} recommended • {optionalFields.length} optional
                            </p>
                          </div>
                        </div>

                        {/* Category selector */}
                        {schema.categoryTree.length > 0 && (
                          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Category
                            </label>
                            <select
                              value={categoryId || ''}
                              onChange={(e) => setMarketplaceCategories((prev) => ({ ...prev, [mpId]: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                            >
                              <option value="">Select a category...</option>
                              {schema.categoryTree.map((cat) => (
                                <optgroup key={cat.id} label={cat.name}>
                                  <option value={cat.id}>{cat.name}</option>
                                  {cat.children?.map((child) => (
                                    <option key={child.id} value={child.id}>— {child.name}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="p-4 space-y-4">
                          {/* Required fields */}
                          {requiredFields.length > 0 && (
                            <FieldGroup
                              title="Required"
                              description="Buyers need these details to find your item"
                              count={requiredFields.length}
                              required
                            >
                              {requiredFields.map((field) => (
                                <FieldRenderer
                                  key={field.key}
                                  field={field}
                                  value={fieldValues[field.key]}
                                  onChange={(value) => setFieldValue(field.key, value)}
                                />
                              ))}
                            </FieldGroup>
                          )}

                          {/* Recommended fields */}
                          {recommendedFields.length > 0 && (
                            <FieldGroup
                              title="Recommended"
                              description="Buyers also search for these details"
                              count={recommendedFields.length}
                              defaultOpen={false}
                            >
                              {recommendedFields.map((field) => (
                                <FieldRenderer
                                  key={field.key}
                                  field={field}
                                  value={fieldValues[field.key]}
                                  onChange={(value) => setFieldValue(field.key, value)}
                                />
                              ))}
                            </FieldGroup>
                          )}

                          {/* Optional fields */}
                          {optionalFields.length > 0 && (
                            <FieldGroup
                              title="Additional (optional)"
                              description="Add more details to improve visibility"
                              count={optionalFields.length}
                              defaultOpen={false}
                            >
                              {optionalFields.map((field) => (
                                <FieldRenderer
                                  key={field.key}
                                  field={field}
                                  value={fieldValues[field.key]}
                                  onChange={(value) => setFieldValue(field.key, value)}
                                />
                              ))}
                            </FieldGroup>
                          )}

                          {/* Marketplace-Specific Fields */}
                          {mpId === 'ebay' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <EbaySpecificFields value={ebayFields} onChange={setEbayFields} />
                            </div>
                          )}

                          {mpId === 'amazon' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <AmazonSpecificFields value={amazonFields} onChange={setAmazonFields} />
                            </div>
                          )}

                          {mpId === 'shopify' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <ShopifySpecificFields value={shopifyFields} onChange={setShopifyFields} />
                            </div>
                          )}

                          {mpId === 'etsy' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <EtsySpecificFields value={etsyFields} onChange={setEtsyFields} />
                            </div>
                          )}

                          {mpId === 'walmart' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <WalmartSpecificFields value={walmartFields} onChange={setWalmartFields} />
                            </div>
                          )}

                          {mpId === 'tiktok_shop' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <TikTokShopSpecificFields value={tiktokFields} onChange={setTiktokFields} />
                            </div>
                          )}

                          {mpId === 'shopee' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <ShopeeSpecificFields value={shopeeFields} onChange={setShopeeFields} />
                            </div>
                          )}

                          {mpId === 'lazada' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <LazadaSpecificFields value={lazadaFields} onChange={setLazadaFields} />
                            </div>
                          )}

                          {mpId === 'kohls' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <KohlsSpecificFields value={kohlsFields} onChange={setKohlsFields} />
                            </div>
                          )}

                          {/* Critical Fields */}
                          {mpId === 'amazon' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <AmazonCriticalFields value={amazonCriticalFields} onChange={setAmazonCriticalFields} />
                            </div>
                          )}

                          {mpId === 'ebay' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <EbayCriticalFields value={ebayCriticalFields} onChange={setEbayCriticalFields} />
                            </div>
                          )}

                          {mpId === 'shopify' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <ShopifyCriticalFields value={shopifyCriticalFields} onChange={setShopifyCriticalFields} />
                            </div>
                          )}

                          {mpId === 'etsy' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <EtsyCriticalFields value={etsyCriticalFields} onChange={setEtsyCriticalFields} />
                            </div>
                          )}

                          {mpId === 'walmart' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <WalmartCriticalFields value={walmartCriticalFields} onChange={setWalmartCriticalFields} />
                            </div>
                          )}

                          {mpId === 'tiktok_shop' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <TikTokShopCriticalFields value={tiktokCriticalFields} onChange={setTiktokCriticalFields} />
                            </div>
                          )}

                          {mpId === 'shopee' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <ShopeeCriticalFields value={shopeeCriticalFields} onChange={setShopeeCriticalFields} />
                            </div>
                          )}

                          {mpId === 'lazada' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <LazadaCriticalFields value={lazadaCriticalFields} onChange={setLazadaCriticalFields} />
                            </div>
                          )}

                          {mpId === 'kohls' && (
                            <div className="border-t-2 border-red-200 dark:border-red-800 pt-4 mt-4">
                              <KohlsCriticalFields value={kohlsCriticalFields} onChange={setKohlsCriticalFields} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Live Preview</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                See how your listing will appear on each marketplace. Select a marketplace to preview.
              </p>

              {selectedMarketplaces.length === 0 ? (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                      <p className="font-medium">No marketplaces selected</p>
                      <p className="text-xs mt-1">Go to the "Marketplaces" tab to select which marketplaces you want to publish to.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <PreviewSelector
                  listing={{
                    title,
                    description,
                    shortDescription,
                    sku,
                    brand,
                    condition: condition as any,
                    pricing: {
                      basePrice: parseFloat(basePrice) || 0,
                      currency: 'USD',
                      marketplacePrices: calculateMarketplacePrices(),
                      pricingRules: [],
                    },
                    images,
                    variants,
                    tags,
                    inventory: {
                      totalQuantity: parseInt(quantity) || 0,
                      allocatedPerMarketplace: {} as Record<MarketplaceId, number>,
                      lowStockThreshold: 5,
                      reorderPoint: 10,
                      lastUpdated: new Date().toISOString(),
                    },
                    shipping: {
                      weight: parseFloat(weight) || 0,
                      dimensions: { length: 0, width: 0, height: 0 },
                      origin: { country: 'US', zipCode: '90210' },
                      profiles: [],
                      international: true,
                      hazmat: false,
                    },
                    marketplaceData: [],
                  }}
                  selectedMarketplace={previewMarketplace}
                  onSelect={setPreviewMarketplace}
                  connectedMarketplaces={connections
                    .filter((c) => c.status === 'connected')
                    .map((c) => c.marketplaceId)}
                />
              )}
            </Card>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">SEO & Compliance</h2>
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SEO Score</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Title length</span>
                      <Badge variant={title.length > 20 && title.length < 80 ? 'success' : 'warning'}>
                        {title.length}/80 chars
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Description</span>
                      <Badge variant={description.length > 100 ? 'success' : 'warning'}>
                        {description.length > 100 ? 'Good' : 'Too short'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Images</span>
                      <Badge variant={images.length >= 3 ? 'success' : 'warning'}>
                        {images.length} image(s)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>GTIN/UPC</span>
                      <Badge variant={upc ? 'success' : 'default'}>
                        {upc ? 'Provided' : 'Missing'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Compliance Checks</h3>
                  <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Brand registry verification</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Restricted product detection</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Hazardous material check</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Legal compliance (FDA, CE, etc.)</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Intellectual property check</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Duplication checker</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const idx = TABS.findIndex((t) => t.id === activeTab);
                if (idx > 0) setActiveTab(TABS[idx - 1].id);
              }}
              disabled={currentTab === 0}
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500">Step {currentTab + 1} of {TABS.length}</span>
            <Button
              variant="primary"
              onClick={() => {
                if (currentTab < TABS.length - 1) setActiveTab(TABS[currentTab + 1].id);
                else handleSave(false);
              }}
            >
              {currentTab === TABS.length - 1 ? 'Save Listing' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
        onDelete={(index) => {
          setImages(images.filter((_, i) => i !== index));
          if (lightboxIndex >= images.length - 1) {
            setLightboxIndex(Math.max(0, images.length - 2));
          }
        }}
      />
    </div>
  );
}
