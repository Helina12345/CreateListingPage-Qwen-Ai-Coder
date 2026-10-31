// ============================================================
// ListingDesk Pro — Marketplace Field Schemas
// Real field definitions based on each marketplace's actual API
// ============================================================

import type { MarketplaceId } from '../types';

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'multiselect'
  | 'checkbox' | 'date' | 'image' | 'rich-text' | 'url'
  | 'measurement' | 'weight' | 'currency' | 'gtin';

export interface FieldOption {
  value: string;
  label: string;
  trending?: boolean;
  searchVolume?: number;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  dependsOn?: { field: string; value: string }[];
  category?: string[];
  group?: 'required' | 'recommended' | 'optional';
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
  requiredFields?: string[];
  recommendedFields?: string[];
}

export interface MarketplaceSchema {
  marketplaceId: MarketplaceId;
  name: string;
  titleField: FieldSchema;
  descriptionField: FieldSchema;
  categoryTree: CategoryNode[];
  itemSpecifics: FieldSchema[];
  pricingFields: FieldSchema[];
  shippingFields: FieldSchema[];
  imageFields: FieldSchema[];
  returnPolicyFields?: FieldSchema[];
  additionalFields?: FieldSchema[];
}

// ============================================================
// eBay Schema
// ============================================================
const ebaySchema: MarketplaceSchema = {
  marketplaceId: 'ebay',
  name: 'eBay',
  titleField: {
    key: 'title',
    label: 'Item Title',
    type: 'text',
    required: true,
    maxLength: 80,
    placeholder: 'Describe your item clearly (max 80 characters)',
    helpText: 'Include brand, model, size, color, and key features',
  },
  descriptionField: {
    key: 'description',
    label: 'Item Description',
    type: 'rich-text',
    required: true,
    maxLength: 50000,
    helpText: 'HTML supported. Include all details buyers need.',
  },
  categoryTree: [
    {
      id: '1', name: 'Electronics', children: [
        { id: '1-1', name: 'Cell Phones & Smartphones' },
        { id: '1-2', name: 'Laptops & Netbooks' },
        { id: '1-3', name: 'TV, Video & Home Audio' },
      ],
    },
    {
      id: '2', name: 'Fashion', children: [
        { id: '2-1', name: 'Men' },
        { id: '2-2', name: 'Women' },
        { id: '2-3', name: 'Kids' },
      ],
    },
    {
      id: '3', name: 'Home & Garden', children: [
        { id: '3-1', name: 'Furniture' },
        { id: '3-2', name: 'Home Decor' },
      ],
    },
    {
      id: '4', name: 'eBay Motors', children: [
        { id: '4-1', name: 'Cars & Trucks', requiredFields: ['year', 'mileage', 'title', 'make', 'model'] },
        { id: '4-2', name: 'Motorcycles' },
        { id: '4-3', name: 'Parts & Accessories' },
      ],
    },
  ],
  itemSpecifics: [
    // Required
    { key: 'brand', label: 'Brand', type: 'text', required: true, group: 'required', placeholder: 'Enter brand name' },
    { key: 'condition', label: 'Condition', type: 'select', required: true, group: 'required', options: [
      { value: '1000', label: 'New' }, { value: '1500', label: 'New other' },
      { value: '2000', label: 'Manufacturer refurbished' }, { value: '2500', label: 'Seller refurbished' },
      { value: '3000', label: 'Used' }, { value: '4000', label: 'Very Good' },
      { value: '5000', label: 'Good' }, { value: '6000', label: 'Acceptable' },
      { value: '7000', label: 'For parts or not working' },
    ]},
    // Recommended
    { key: 'type', label: 'Type', type: 'text', required: false, group: 'recommended' },
    { key: 'color', label: 'Color', type: 'select', required: false, group: 'recommended', options: [
      { value: 'black', label: 'Black' }, { value: 'white', label: 'White' },
      { value: 'blue', label: 'Blue' }, { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' }, { value: 'gray', label: 'Gray' },
      { value: 'brown', label: 'Brown' }, { value: 'multicolor', label: 'Multicolor' },
    ]},
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'material', label: 'Material', type: 'text', required: false, group: 'recommended' },
    { key: 'style', label: 'Style', type: 'text', required: false, group: 'recommended' },
    { key: 'mpn', label: 'Manufacturer Part Number', type: 'text', required: false, group: 'recommended' },
    // Optional
    { key: 'country_of_origin', label: 'Country/Region of Manufacture', type: 'text', required: false, group: 'optional' },
    { key: 'unit_quantity', label: 'Unit Quantity', type: 'number', required: false, group: 'optional' },
    { key: 'features', label: 'Features', type: 'multiselect', required: false, group: 'optional', options: [
      { value: 'bluetooth', label: 'Bluetooth' }, { value: 'waterproof', label: 'Waterproof' },
      { value: 'wireless', label: 'Wireless' }, { value: 'rechargeable', label: 'Rechargeable' },
    ]},
    // Vehicle-specific (conditional)
    { key: 'year', label: 'Year', type: 'text', required: false, group: 'required', category: ['4-1', '4-2'], placeholder: 'e.g., 2020' },
    { key: 'mileage', label: 'Mileage', type: 'text', required: false, group: 'required', category: ['4-1'], placeholder: 'Enter your own' },
    { key: 'vehicle_title', label: 'Vehicle Title', type: 'select', required: false, group: 'required', category: ['4-1'], options: [
      { value: 'clean', label: 'Clean' }, { value: 'salvage', label: 'Salvage' },
      { value: 'rebuilt', label: 'Rebuilt/Rebuildable' }, { value: 'parts_only', label: 'Parts Only' },
    ]},
    { key: 'make', label: 'Make', type: 'text', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'model', label: 'Model', type: 'text', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'car_type', label: 'Car Type', type: 'select', required: false, group: 'recommended', category: ['4-1'], options: [
      { value: 'sedan', label: 'Sedan' }, { value: 'suv', label: 'SUV' },
      { value: 'truck', label: 'Truck' }, { value: 'coupe', label: 'Coupe' },
      { value: 'convertible', label: 'Convertible' }, { value: 'van', label: 'Van' },
    ]},
    { key: 'body_type', label: 'Body Type', type: 'text', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'seats', label: 'Number of Seats', type: 'number', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'transmission', label: 'Transmission', type: 'select', required: false, group: 'recommended', category: ['4-1'], options: [
      { value: 'automatic', label: 'Automatic' }, { value: 'manual', label: 'Manual' },
      { value: 'cvt', label: 'CVT' },
    ]},
    { key: 'doors', label: 'Number of Doors', type: 'number', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'for_sale_by', label: 'For Sale By', type: 'select', required: false, group: 'recommended', category: ['4-1'], options: [
      { value: 'dealer', label: 'Dealer', trending: true }, { value: 'private', label: 'Private Seller', trending: true },
    ]},
    { key: 'fuel_type', label: 'Fuel Type', type: 'select', required: false, group: 'recommended', category: ['4-1'], options: [
      { value: 'gasoline', label: 'Gasoline' }, { value: 'diesel', label: 'Diesel' },
      { value: 'electric', label: 'Electric' }, { value: 'hybrid', label: 'Hybrid' },
    ]},
    { key: 'exterior_color', label: 'Exterior Color', type: 'text', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'interior_color', label: 'Interior Color', type: 'text', required: false, group: 'recommended', category: ['4-1'] },
    { key: 'drive_side', label: 'Drive Side', type: 'select', required: false, group: 'recommended', category: ['4-1'], options: [
      { value: 'left', label: 'Left-Hand Drive' }, { value: 'right', label: 'Right-Hand Drive' },
    ]},
    { key: 'engine', label: 'Engine', type: 'text', required: false, group: 'optional', category: ['4-1'] },
    { key: 'previous_owners', label: 'Number of Previous Owners', type: 'number', required: false, group: 'optional', category: ['4-1'] },
    { key: 'cylinders', label: 'Number of Cylinders', type: 'number', required: false, group: 'optional', category: ['4-1'] },
    { key: 'drive_type', label: 'Drive Type', type: 'select', required: false, group: 'optional', category: ['4-1'], options: [
      { value: 'fwd', label: 'FWD' }, { value: 'rwd', label: 'RWD' },
      { value: 'awd', label: 'AWD' }, { value: '4wd', label: '4WD' },
    ]},
    { key: 'engine_size', label: 'Engine Size', type: 'text', required: false, group: 'optional', category: ['4-1'] },
    { key: 'horsepower', label: 'Horse Power', type: 'number', required: false, group: 'optional', category: ['4-1'] },
    { key: 'safety_features', label: 'Safety Features', type: 'multiselect', required: false, group: 'optional', category: ['4-1'], options: [
      { value: 'abs', label: 'ABS Brakes' }, { value: 'airbags', label: 'Airbags' },
      { value: 'backup_camera', label: 'Backup Camera' }, { value: 'lane_assist', label: 'Lane Assist' },
    ]},
    { key: 'trim', label: 'Trim', type: 'text', required: false, group: 'optional', category: ['4-1'] },
    { key: 'prop65', label: 'California Prop 65 Warning', type: 'text', required: false, group: 'optional', maxLength: 800 },
  ],
  pricingFields: [
    { key: 'start_price', label: 'Start Price', type: 'currency', required: true },
    { key: 'buy_it_now', label: 'Buy It Now Price', type: 'currency', required: false },
    { key: 'reserve_price', label: 'Reserve Price', type: 'currency', required: false },
    { key: 'listing_format', label: 'Listing Format', type: 'select', required: true, options: [
      { value: 'fixed', label: 'Fixed Price' }, { value: 'auction', label: 'Auction' },
    ]},
  ],
  shippingFields: [
    { key: 'shipping_service', label: 'Shipping Service', type: 'select', required: true, options: [
      { value: 'usps_first', label: 'USPS First Class' },
      { value: 'usps_priority', label: 'USPS Priority Mail' },
      { value: 'ups_ground', label: 'UPS Ground' },
      { value: 'fedex_ground', label: 'FedEx Ground' },
    ]},
    { key: 'handling_time', label: 'Handling Time (days)', type: 'number', required: true, validation: { min: 0, max: 30 } },
    { key: 'returns_accepted', label: 'Returns Accepted', type: 'select', required: true, options: [
      { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
    ]},
    { key: 'return_days', label: 'Return Days', type: 'select', required: false, options: [
      { value: '14', label: '14 days' }, { value: '30', label: '30 days' },
      { value: '60', label: '60 days' },
    ]},
  ],
  imageFields: [
    { key: 'main_image', label: 'Main Image', type: 'image', required: true, helpText: 'Minimum 500x500px, square recommended' },
    { key: 'additional_images', label: 'Additional Images', type: 'image', required: false, helpText: 'Up to 24 images, max 7MB each' },
    { key: 'video', label: 'Video URL', type: 'url', required: false },
  ],
  returnPolicyFields: [
    { key: 'return_policy', label: 'Return Policy', type: 'select', required: true, options: [
      { value: '30_days', label: '30 day returns, buyer pays shipping' },
      { value: '30_days_seller', label: '30 day returns, seller pays shipping' },
      { value: '60_days', label: '60 day returns' },
      { value: 'no_returns', label: 'No returns' },
    ]},
  ],
};

// ============================================================
// Amazon Schema
// ============================================================
const amazonSchema: MarketplaceSchema = {
  marketplaceId: 'amazon',
  name: 'Amazon',
  titleField: {
    key: 'title',
    label: 'Product Name',
    type: 'text',
    required: true,
    maxLength: 200,
    placeholder: 'Brand + Product Line + Key Feature + Size + Color + Quantity',
    helpText: 'Follow Amazon style guide: capitalize first letter of each word',
  },
  descriptionField: {
    key: 'description',
    label: 'Product Description',
    type: 'textarea',
    required: true,
    maxLength: 2000,
    helpText: 'No HTML allowed. Use plain text only.',
  },
  categoryTree: [
    { id: 'electronics', name: 'Electronics', children: [
      { id: 'phones', name: 'Cell Phones & Accessories' },
      { id: 'computers', name: 'Computers & Accessories' },
      { id: 'tv', name: 'TV & Video' },
    ]},
    { id: 'fashion', name: 'Clothing, Shoes & Jewelry', children: [
      { id: 'mens', name: 'Men' }, { id: 'womens', name: 'Women' },
      { id: 'kids', name: 'Girls & Boys' },
    ]},
    { id: 'home', name: 'Home & Kitchen', children: [
      { id: 'furniture', name: 'Furniture' }, { id: 'kitchen', name: 'Kitchen & Dining' },
    ]},
    { id: 'beauty', name: 'Beauty & Personal Care' },
    { id: 'toys', name: 'Toys & Games' },
  ],
  itemSpecifics: [
    { key: 'brand', label: 'Brand Name', type: 'text', required: true, group: 'required', helpText: 'Must match brand registry' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, group: 'required' },
    { key: 'product_id', label: 'Product ID (UPC/EAN/ISBN)', type: 'gtin', required: true, group: 'required', helpText: 'GTIN lookup required' },
    { key: 'product_id_type', label: 'Product ID Type', type: 'select', required: true, group: 'required', options: [
      { value: 'upc', label: 'UPC' }, { value: 'ean', label: 'EAN' },
      { value: 'isbn', label: 'ISBN' }, { value: 'asin', label: 'ASIN' },
    ]},
    { key: 'bullet_points', label: 'Key Product Features (Bullet Points)', type: 'multiselect', required: true, group: 'required', helpText: '5 bullet points, max 500 chars each' },
    { key: 'item_type', label: 'Item Type Keyword', type: 'text', required: false, group: 'recommended' },
    { key: 'color', label: 'Color', type: 'text', required: false, group: 'recommended' },
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'material', label: 'Material', type: 'text', required: false, group: 'recommended' },
    { key: 'model', label: 'Model Number', type: 'text', required: false, group: 'recommended' },
    { key: 'part_number', label: 'Part Number', type: 'text', required: false, group: 'recommended' },
    { key: 'target_audience', label: 'Target Audience', type: 'multiselect', required: false, group: 'recommended', options: [
      { value: 'men', label: 'Men' }, { value: 'women', label: 'Women' },
      { value: 'unisex', label: 'Unisex' }, { value: 'kids', label: 'Kids' },
    ]},
    { key: 'country_of_origin', label: 'Country of Origin', type: 'text', required: false, group: 'optional' },
    { key: 'warranty', label: 'Manufacturer Warranty', type: 'text', required: false, group: 'optional' },
    { key: 'hazmat', label: 'Is this a hazardous material?', type: 'select', required: true, group: 'required', options: [
      { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Unknown' },
    ]},
  ],
  pricingFields: [
    { key: 'standard_price', label: 'Your Price', type: 'currency', required: true },
    { key: 'sale_price', label: 'Sale Price', type: 'currency', required: false },
    { key: 'business_price', label: 'Business Price', type: 'currency', required: false },
    { key: 'map_price', label: 'MAP Price (Minimum Advertised)', type: 'currency', required: false, helpText: 'MAP enforcement applies' },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
    { key: 'fulfillment', label: 'Fulfillment Channel', type: 'select', required: true, options: [
      { value: 'fba', label: 'Amazon (FBA)' }, { value: 'fbm', label: 'Merchant (FBM)' },
    ]},
  ],
  shippingFields: [
    { key: 'item_weight', label: 'Item Weight', type: 'weight', required: true },
    { key: 'package_dimensions', label: 'Package Dimensions', type: 'measurement', required: true, helpText: 'L x W x H in inches' },
    { key: 'shipping_weight', label: 'Shipping Weight', type: 'weight', required: false },
  ],
  imageFields: [
    { key: 'main_image', label: 'Main Image', type: 'image', required: true, helpText: 'Pure white background (RGB 255,255,255), product fills 85% of frame' },
    { key: 'additional_images', label: 'Additional Images', type: 'image', required: false, helpText: 'Up to 8 images, minimum 1000x1000px for zoom' },
  ],
};

// ============================================================
// Shopify Schema
// ============================================================
const shopifySchema: MarketplaceSchema = {
  marketplaceId: 'shopify',
  name: 'Shopify',
  titleField: {
    key: 'title', label: 'Product Title', type: 'text', required: true, maxLength: 255,
    helpText: 'SEO-friendly title recommended',
  },
  descriptionField: {
    key: 'description', label: 'Description', type: 'rich-text', required: false, maxLength: 50000,
    helpText: 'HTML supported. Use rich formatting.',
  },
  categoryTree: [
    { id: 'all', name: 'All Collections', children: [
      { id: 'new', name: 'New Arrivals' }, { id: 'best', name: 'Best Sellers' },
      { id: 'sale', name: 'Sale' },
    ]},
  ],
  itemSpecifics: [
    { key: 'vendor', label: 'Vendor', type: 'text', required: true, group: 'required' },
    { key: 'product_type', label: 'Product Type', type: 'text', required: true, group: 'required' },
    { key: 'tags', label: 'Tags', type: 'multiselect', required: false, group: 'recommended', helpText: 'Comma-separated tags for filtering' },
    { key: 'collections', label: 'Collections', type: 'multiselect', required: false, group: 'recommended' },
    { key: 'color', label: 'Color', type: 'text', required: false, group: 'recommended' },
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'material', label: 'Material', type: 'text', required: false, group: 'optional' },
    { key: 'style', label: 'Style', type: 'text', required: false, group: 'optional' },
    { key: 'gender', label: 'Gender', type: 'select', required: false, group: 'optional', options: [
      { value: 'men', label: 'Men' }, { value: 'women', label: 'Women' },
      { value: 'unisex', label: 'Unisex' },
    ]},
  ],
  pricingFields: [
    { key: 'price', label: 'Price', type: 'currency', required: true },
    { key: 'compare_at_price', label: 'Compare-at Price', type: 'currency', required: false, helpText: 'Strike-through price' },
    { key: 'cost_per_item', label: 'Cost per Item', type: 'currency', required: false },
    { key: 'charge_tax', label: 'Charge Tax', type: 'checkbox', required: false },
  ],
  shippingFields: [
    { key: 'weight', label: 'Weight', type: 'weight', required: false },
    { key: 'requires_shipping', label: 'Requires Shipping', type: 'checkbox', required: false },
    { key: 'hs_code', label: 'HS Code', type: 'text', required: false, helpText: 'For international shipping' },
    { key: 'country_origin', label: 'Country of Origin', type: 'text', required: false },
  ],
  imageFields: [
    { key: 'images', label: 'Product Images', type: 'image', required: false, helpText: 'Up to 250 images' },
    { key: 'alt_text', label: 'Alt Text', type: 'text', required: false, helpText: 'For accessibility and SEO' },
  ],
};

// ============================================================
// Etsy Schema
// ============================================================
const etsySchema: MarketplaceSchema = {
  marketplaceId: 'etsy',
  name: 'Etsy',
  titleField: {
    key: 'title', label: 'Title', type: 'text', required: true, maxLength: 140,
    helpText: 'Use keywords buyers search for',
  },
  descriptionField: {
    key: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 50000,
    helpText: 'No HTML. Plain text only.',
  },
  categoryTree: [
    { id: 'jewelry', name: 'Jewelry & Accessories' },
    { id: 'clothing', name: 'Clothing & Shoes' },
    { id: 'home', name: 'Home & Living' },
    { id: 'wedding', name: 'Wedding & Parties' },
    { id: 'toys', name: 'Toys & Entertainment' },
    { id: 'art', name: 'Art & Collectibles' },
    { id: 'craft', name: 'Craft Supplies & Tools' },
    { id: 'vintage', name: 'Vintage' },
  ],
  itemSpecifics: [
    { key: 'who_made', label: 'Who made it?', type: 'select', required: true, group: 'required', options: [
      { value: 'i_did', label: 'I did' }, { value: 'someone_else', label: 'Someone else' },
      { value: 'company', label: 'A company or organization' },
    ]},
    { key: 'when_made', label: 'When was it made?', type: 'select', required: true, group: 'required', options: [
      { value: 'made_to_order', label: 'Made to order' }, { value: '2020_2025', label: '2020 - 2025' },
      { value: '2010_2019', label: '2010 - 2019' }, { value: 'vintage', label: 'Before 2006 (Vintage)' },
    ]},
    { key: 'is_supply', label: 'Is it a supply?', type: 'select', required: true, group: 'required', options: [
      { value: 'yes', label: 'Yes, it is a craft supply' }, { value: 'no', label: 'No, it is a finished product' },
    ]},
    { key: 'materials', label: 'Materials', type: 'multiselect', required: false, group: 'recommended', helpText: 'List all materials used' },
    { key: 'occasion', label: 'Occasion', type: 'multiselect', required: false, group: 'recommended', options: [
      { value: 'birthday', label: 'Birthday' }, { value: 'wedding', label: 'Wedding' },
      { value: 'anniversary', label: 'Anniversary' }, { value: 'christmas', label: 'Christmas' },
    ]},
    { key: 'recipient', label: 'Recipient', type: 'multiselect', required: false, group: 'recommended', options: [
      { value: 'men', label: 'Men' }, { value: 'women', label: 'Women' },
      { value: 'kids', label: 'Kids' }, { value: 'unisex', label: 'Unisex adults' },
    ]},
    { key: 'style', label: 'Style', type: 'multiselect', required: false, group: 'recommended', options: [
      { value: 'boho', label: 'Bohemian' }, { value: 'minimalist', label: 'Minimalist' },
      { value: 'rustic', label: 'Rustic' }, { value: 'modern', label: 'Modern' },
      { value: 'vintage', label: 'Vintage' },
    ]},
    { key: 'color', label: 'Primary Color', type: 'select', required: false, group: 'recommended', options: [
      { value: 'black', label: 'Black' }, { value: 'white', label: 'White' },
      { value: 'red', label: 'Red' }, { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' }, { value: 'yellow', label: 'Yellow' },
      { value: 'pink', label: 'Pink' }, { value: 'brown', label: 'Brown' },
    ]},
    { key: 'holiday', label: 'Holiday', type: 'multiselect', required: false, group: 'optional', options: [
      { value: 'christmas', label: 'Christmas' }, { value: 'valentines', label: "Valentine's Day" },
      { value: 'easter', label: 'Easter' }, { value: 'halloween', label: 'Halloween' },
    ]},
  ],
  pricingFields: [
    { key: 'price', label: 'Price', type: 'currency', required: true },
    { key: 'sale_price', label: 'Sale Price', type: 'currency', required: false },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
  ],
  shippingFields: [
    { key: 'weight', label: 'Weight', type: 'weight', required: true },
    { key: 'dimensions', label: 'Dimensions', type: 'measurement', required: true },
    { key: 'ships_from', label: 'Ships From', type: 'text', required: true },
    { key: 'processing_time', label: 'Processing Time', type: 'text', required: true },
  ],
  imageFields: [
    { key: 'images', label: 'Photos', type: 'image', required: true, helpText: 'Up to 10 photos, minimum 2000px shortest side' },
  ],
};

// ============================================================
// Walmart Schema
// ============================================================
const walmartSchema: MarketplaceSchema = {
  marketplaceId: 'walmart',
  name: 'Walmart',
  titleField: {
    key: 'productName', label: 'Product Name', type: 'text', required: true, maxLength: 200,
    helpText: 'Include brand, size, color, quantity',
  },
  descriptionField: {
    key: 'shortDescription', label: 'Short Description', type: 'rich-text', required: true, maxLength: 4000 },
  categoryTree: [
    { id: 'electronics', name: 'Electronics' },
    { id: 'home', name: 'Home' },
    { id: 'fashion', name: 'Clothing, Shoes & Accessories' },
    { id: 'toys', name: 'Toys & Video Games' },
    { id: 'health', name: 'Health, Household & Baby' },
    { id: 'auto', name: 'Auto & Tires' },
    { id: 'sports', name: 'Sports & Outdoors' },
  ],
  itemSpecifics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, group: 'required' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, group: 'required' },
    { key: 'model', label: 'Manufacturer Part Number', type: 'text', required: false, group: 'recommended' },
    { key: 'main_image', label: 'Main Image URL', type: 'url', required: true, group: 'required' },
    { key: 'key_features', label: 'Key Features', type: 'multiselect', required: true, group: 'required', helpText: 'Up to 5 key features' },
    { key: 'color', label: 'Color', type: 'text', required: false, group: 'recommended' },
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'material', label: 'Material', type: 'text', required: false, group: 'recommended' },
    { key: 'assembled_length', label: 'Assembled Product Length', type: 'text', required: false, group: 'optional' },
    { key: 'assembled_width', label: 'Assembled Product Width', type: 'text', required: false, group: 'optional' },
    { key: 'assembled_height', label: 'Assembled Product Height', type: 'text', required: false, group: 'optional' },
    { key: 'assembled_weight', label: 'Assembled Product Weight', type: 'text', required: false, group: 'optional' },
    { key: 'contains_electronic', label: 'Contains Electronic Component?', type: 'select', required: false, group: 'optional', options: [
      { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
    ]},
    { key: 'is_primary_variant', label: 'Is Primary Variant', type: 'select', required: false, group: 'optional', options: [
      { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
    ]},
  ],
  pricingFields: [
    { key: 'price', label: 'Price', type: 'currency', required: true },
    { key: 'msrp', label: 'Was Price (MSRP)', type: 'currency', required: false, helpText: 'MAP enforcement applies' },
    { key: 'fulfillment', label: 'Fulfillment Lag Time', type: 'number', required: true },
  ],
  shippingFields: [
    { key: 'shipping_weight', label: 'Shipping Weight', type: 'weight', required: true },
    { key: 'package_length', label: 'Package Length', type: 'text', required: true },
    { key: 'package_width', label: 'Package Width', type: 'text', required: true },
    { key: 'package_height', label: 'Package Height', type: 'text', required: true },
  ],
  imageFields: [
    { key: 'main_image', label: 'Main Image', type: 'image', required: true, helpText: 'Max 7 images, white background' },
    { key: 'additional_images', label: 'Additional Images', type: 'image', required: false },
  ],
};

// ============================================================
// TikTok Shop Schema
// ============================================================
const tiktokSchema: MarketplaceSchema = {
  marketplaceId: 'tiktok_shop',
  name: 'TikTok Shop',
  titleField: {
    key: 'title', label: 'Product Name', type: 'text', required: true, maxLength: 255,
  },
  descriptionField: {
    key: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 10000,
    helpText: 'No HTML. Plain text only.',
  },
  categoryTree: [
    { id: 'beauty', name: 'Beauty' },
    { id: 'fashion', name: 'Women Fashion & Men Fashion' },
    { id: 'home', name: 'Home Supplies' },
    { id: 'electronics', name: 'Phones & Electronics' },
    { id: 'food', name: 'Food & Beverages' },
    { id: 'kids', name: 'Mom & Baby' },
    { id: 'health', name: 'Health' },
  ],
  itemSpecifics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, group: 'required' },
    { key: 'material', label: 'Material', type: 'text', required: false, group: 'recommended' },
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'color', label: 'Color', type: 'text', required: false, group: 'recommended' },
    { key: 'weight', label: 'Weight', type: 'text', required: false, group: 'optional' },
    { key: 'package_content', label: 'Package Content', type: 'text', required: false, group: 'recommended', helpText: 'What is included in the package' },
    { key: 'shelf_life', label: 'Shelf Life', type: 'text', required: false, group: 'optional' },
    { key: 'size_chart', label: 'Size Chart', type: 'image', required: false, group: 'optional' },
  ],
  pricingFields: [
    { key: 'original_price', label: 'Original Price', type: 'currency', required: true },
    { key: 'sale_price', label: 'Discounted Price', type: 'currency', required: false },
  ],
  shippingFields: [
    { key: 'package_weight', label: 'Package Weight', type: 'weight', required: true },
    { key: 'package_size', label: 'Package Size', type: 'measurement', required: true },
  ],
  imageFields: [
    { key: 'images', label: 'Product Images', type: 'image', required: true, helpText: 'Up to 9 images, minimum 600x600px' },
  ],
};

// ============================================================
// Shopee Schema
// ============================================================
const shopeeSchema: MarketplaceSchema = {
  marketplaceId: 'shopee',
  name: 'Shopee',
  titleField: {
    key: 'name', label: 'Product Name', type: 'text', required: true, maxLength: 120,
    helpText: 'Max 120 characters. Include key search terms.',
  },
  descriptionField: {
    key: 'description', label: 'Product Description', type: 'textarea', required: true, maxLength: 5000,
  },
  categoryTree: [
    { id: 'fashion', name: 'Fashion' },
    { id: 'beauty', name: 'Health & Beauty' },
    { id: 'home', name: 'Home & Living' },
    { id: 'electronics', name: 'Mobile & Gadgets' },
    { id: 'baby', name: 'Baby & Kids' },
    { id: 'food', name: 'Food & Beverages' },
  ],
  itemSpecifics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, group: 'required' },
    { key: 'category', label: 'Category', type: 'select', required: true, group: 'required' },
    { key: 'stock', label: 'Stock', type: 'number', required: true, group: 'required' },
    { key: 'condition', label: 'Condition', type: 'select', required: true, group: 'required', options: [
      { value: 'new', label: 'Brand New' }, { value: 'used', label: 'Used' },
    ]},
    { key: 'shipping_origin', label: 'Shipping Origin', type: 'text', required: true, group: 'required' },
    { key: 'variations', label: 'Variations', type: 'multiselect', required: false, group: 'recommended', helpText: 'Size, Color, etc.' },
  ],
  pricingFields: [
    { key: 'price', label: 'Product Price', type: 'currency', required: true },
  ],
  shippingFields: [
    { key: 'weight', label: 'Package Weight', type: 'weight', required: true },
    { key: 'size', label: 'Package Size', type: 'measurement', required: true },
    { key: 'logistics', label: 'Logistics Channels', type: 'multiselect', required: true, options: [
      { value: 'standard', label: 'Standard Delivery' },
      { value: 'express', label: 'Express Delivery' },
      { value: 'economy', label: 'Economy Delivery' },
    ]},
  ],
  imageFields: [
    { key: 'images', label: 'Product Images', type: 'image', required: true, helpText: 'Up to 9 images' },
  ],
};

// ============================================================
// Lazada Schema
// ============================================================
const lazadaSchema: MarketplaceSchema = {
  marketplaceId: 'lazada',
  name: 'Lazada',
  titleField: {
    key: 'name', label: 'Product Name', type: 'text', required: true, maxLength: 255,
  },
  descriptionField: {
    key: 'description', label: 'Product Description', type: 'rich-text', required: true, maxLength: 50000,
    helpText: 'HTML supported',
  },
  categoryTree: [
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'home', name: 'Home & Lifestyle' },
    { id: 'beauty', name: 'Beauty & Health' },
    { id: 'baby', name: 'Babies & Toys' },
    { id: 'groceries', name: 'Groceries & Pets' },
  ],
  itemSpecifics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, group: 'required' },
    { key: 'category', label: 'Category', type: 'select', required: true, group: 'required' },
    { key: 'highlights', label: 'Product Highlights', type: 'textarea', required: false, group: 'recommended', helpText: 'Key selling points' },
    { key: 'package_content', label: 'What is in the box', type: 'textarea', required: true, group: 'required' },
    { key: 'warranty_type', label: 'Warranty Type', type: 'select', required: false, group: 'recommended', options: [
      { value: 'local', label: 'Local seller warranty' },
      { value: 'international', label: 'International manufacturer warranty' },
      { value: 'none', label: 'No warranty' },
    ]},
    { key: 'warranty_period', label: 'Warranty Period', type: 'select', required: false, group: 'recommended', options: [
      { value: '1_month', label: '1 Month' }, { value: '3_months', label: '3 Months' },
      { value: '6_months', label: '6 Months' }, { value: '1_year', label: '1 Year' },
      { value: '2_years', label: '2 Years' },
    ]},
    { key: 'color', label: 'Color', type: 'text', required: false, group: 'recommended' },
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'material', label: 'Material', type: 'text', required: false, group: 'recommended' },
  ],
  pricingFields: [
    { key: 'price', label: 'Price', type: 'currency', required: true },
    { key: 'special_price', label: 'Special Price', type: 'currency', required: false },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
  ],
  shippingFields: [
    { key: 'weight', label: 'Weight', type: 'weight', required: true },
    { key: 'length', label: 'Length', type: 'text', required: true },
    { key: 'width', label: 'Width', type: 'text', required: true },
    { key: 'height', label: 'Height', type: 'text', required: true },
    { key: 'free_shipping', label: 'Free Shipping', type: 'checkbox', required: false },
  ],
  imageFields: [
    { key: 'images', label: 'Product Images', type: 'image', required: true, helpText: 'Up to 8 images' },
  ],
};

// ============================================================
// Kohl's Schema
// ============================================================
const kohlsSchema: MarketplaceSchema = {
  marketplaceId: 'kohls',
  name: "Kohl's",
  titleField: {
    key: 'title', label: 'Product Title', type: 'text', required: true, maxLength: 150,
  },
  descriptionField: {
    key: 'description', label: 'Product Description', type: 'rich-text', required: true, maxLength: 10000,
    helpText: 'HTML supported',
  },
  categoryTree: [
    { id: 'women', name: "Women's" },
    { id: 'men', name: "Men's" },
    { id: 'kids', name: 'Kids & Baby' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'home', name: 'Home' },
    { id: 'jewelry', name: 'Jewelry & Watches' },
    { id: 'beauty', name: 'Beauty' },
  ],
  itemSpecifics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, group: 'required' },
    { key: 'department', label: 'Department', type: 'select', required: true, group: 'required', options: [
      { value: 'womens', label: "Women's" }, { value: 'mens', label: "Men's" },
      { value: 'kids', label: 'Kids' }, { value: 'home', label: 'Home' },
    ]},
    { key: 'size', label: 'Size', type: 'text', required: false, group: 'recommended' },
    { key: 'color', label: 'Color', type: 'text', required: false, group: 'recommended' },
    { key: 'material', label: 'Material/Fabric', type: 'text', required: false, group: 'recommended' },
    { key: 'care_instructions', label: 'Care Instructions', type: 'multiselect', required: false, group: 'recommended', options: [
      { value: 'machine_wash', label: 'Machine Washable' },
      { value: 'hand_wash', label: 'Hand Wash' },
      { value: 'dry_clean', label: 'Dry Clean Only' },
      { value: 'spot_clean', label: 'Spot Clean' },
    ]},
    { key: 'origin', label: 'Country of Origin', type: 'text', required: false, group: 'optional' },
    { key: 'upc', label: 'UPC', type: 'gtin', required: true, group: 'required' },
  ],
  pricingFields: [
    { key: 'regular_price', label: 'Regular Price', type: 'currency', required: true },
    { key: 'sale_price', label: 'Sale Price', type: 'currency', required: false, helpText: 'MAP enforcement applies' },
    { key: 'cost', label: 'Cost', type: 'currency', required: false },
  ],
  shippingFields: [
    { key: 'weight', label: 'Weight', type: 'weight', required: true },
    { key: 'dimensions', label: 'Dimensions', type: 'measurement', required: true },
  ],
  imageFields: [
    { key: 'images', label: 'Product Images', type: 'image', required: true, helpText: 'Up to 10 images' },
  ],
};

// ============================================================
// Export all schemas
// ============================================================
export const MARKETPLACE_SCHEMAS: Record<MarketplaceId, MarketplaceSchema> = {
  ebay: ebaySchema,
  amazon: amazonSchema,
  shopify: shopifySchema,
  etsy: etsySchema,
  walmart: walmartSchema,
  tiktok_shop: tiktokSchema,
  shopee: shopeeSchema,
  lazada: lazadaSchema,
  kohls: kohlsSchema,
};

export const getSchema = (marketplaceId: MarketplaceId): MarketplaceSchema =>
  MARKETPLACE_SCHEMAS[marketplaceId];

// Get all required fields across all marketplaces (union)
export const getAllRequiredFields = (): FieldSchema[] => {
  const seen = new Set<string>();
  const fields: FieldSchema[] = [];
  Object.values(MARKETPLACE_SCHEMAS).forEach((schema) => {
    schema.itemSpecifics.forEach((field) => {
      if (field.required && !seen.has(field.key)) {
        seen.add(field.key);
        fields.push(field);
      }
    });
  });
  return fields;
};

// Get fields specific to a category
export const getFieldsForCategory = (
  marketplaceId: MarketplaceId,
  categoryId?: string
): FieldSchema[] => {
  const schema = getSchema(marketplaceId);
  if (!categoryId) return schema.itemSpecifics;
  return schema.itemSpecifics.filter(
    (field) => !field.category || field.category.includes(categoryId)
  );
};
