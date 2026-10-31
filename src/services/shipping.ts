// ============================================================
// ListingDesk Pro — Shipping Service
// Shipping rate calculation, customs, and tracking
// ============================================================

export interface ShippingRate {
  carrier: string;
  service: string;
  price: number;
  estimatedDays: { min: number; max: number };
  trackingIncluded: boolean;
  insuranceIncluded: boolean;
}

export interface ShippingQuote {
  origin: {
    country: string;
    postalCode: string;
  };
  destination: {
    country: string;
    postalCode: string;
  };
  package: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  rates: ShippingRate[];
  customs?: CustomsEstimation;
}

export interface CustomsEstimation {
  dutyRate: number;
  dutyAmount: number;
  taxRate: number;
  taxAmount: number;
  totalCustoms: number;
  restricted: boolean;
  restrictedReason?: string;
}

export interface HazmatInfo {
  isHazmat: boolean;
  category?: string;
  unNumber?: string;
  properShippingName?: string;
  packingGroup?: string;
  requiresSpecialHandling: boolean;
  allowedCarriers: string[];
  restrictedDestinations: string[];
}

// ============================================================
// SHIPPING RATE CALCULATION
// ============================================================

export async function calculateShippingRates(
  origin: { country: string; postalCode: string },
  destination: { country: string; postalCode: string },
  pkg: { weight: number; length: number; width: number; height: number }
): Promise<ShippingQuote> {
  const rates: ShippingRate[] = [];
  const distance = calculateDistance(origin.postalCode, destination.postalCode);
  const isInternational = origin.country !== destination.country;

  // USPS Rates (domestic US only)
  if (origin.country === 'US' && !isInternational) {
    const baseRate = 4.5 + (pkg.weight * 0.5) + (distance * 0.001);

    rates.push({
      carrier: 'USPS',
      service: 'First Class',
      price: Math.round(baseRate * 100) / 100,
      estimatedDays: { min: 3, max: 5 },
      trackingIncluded: true,
      insuranceIncluded: false,
    });

    rates.push({
      carrier: 'USPS',
      service: 'Priority Mail',
      price: Math.round((baseRate * 1.5) * 100) / 100,
      estimatedDays: { min: 2, max: 3 },
      trackingIncluded: true,
      insuranceIncluded: true,
    });

    rates.push({
      carrier: 'USPS',
      service: 'Priority Mail Express',
      price: Math.round((baseRate * 2.5) * 100) / 100,
      estimatedDays: { min: 1, max: 2 },
      trackingIncluded: true,
      insuranceIncluded: true,
    });
  }

  // UPS Rates
  const upsBase = 6.0 + (pkg.weight * 0.6) + (distance * 0.0012);

  rates.push({
    carrier: 'UPS',
    service: 'Ground',
    price: Math.round(upsBase * 100) / 100,
    estimatedDays: { min: 3, max: 5 },
    trackingIncluded: true,
    insuranceIncluded: false,
  });

  rates.push({
    carrier: 'UPS',
    service: '2nd Day Air',
    price: Math.round((upsBase * 1.8) * 100) / 100,
    estimatedDays: { min: 2, max: 2 },
    trackingIncluded: true,
    insuranceIncluded: true,
  });

  rates.push({
    carrier: 'UPS',
    service: 'Next Day Air',
    price: Math.round((upsBase * 2.8) * 100) / 100,
    estimatedDays: { min: 1, max: 1 },
    trackingIncluded: true,
    insuranceIncluded: true,
  });

  // FedEx Rates
  const fedexBase = 6.5 + (pkg.weight * 0.65) + (distance * 0.0013);

  rates.push({
    carrier: 'FedEx',
    service: 'Ground',
    price: Math.round(fedexBase * 100) / 100,
    estimatedDays: { min: 3, max: 5 },
    trackingIncluded: true,
    insuranceIncluded: false,
  });

  rates.push({
    carrier: 'FedEx',
    service: '2Day',
    price: Math.round((fedexBase * 1.9) * 100) / 100,
    estimatedDays: { min: 2, max: 2 },
    trackingIncluded: true,
    insuranceIncluded: true,
  });

  rates.push({
    carrier: 'FedEx',
    service: 'Overnight',
    price: Math.round((fedexBase * 3.0) * 100) / 100,
    estimatedDays: { min: 1, max: 1 },
    trackingIncluded: true,
    insuranceIncluded: true,
  });

  // DHL Rates (international)
  if (isInternational) {
    const dhlBase = 25.0 + (pkg.weight * 1.2) + (distance * 0.002);

    rates.push({
      carrier: 'DHL',
      service: 'Express Worldwide',
      price: Math.round(dhlBase * 100) / 100,
      estimatedDays: { min: 2, max: 4 },
      trackingIncluded: true,
      insuranceIncluded: true,
    });

    rates.push({
      carrier: 'DHL',
      service: 'Economy Select',
      price: Math.round((dhlBase * 0.7) * 100) / 100,
      estimatedDays: { min: 5, max: 8 },
      trackingIncluded: true,
      insuranceIncluded: false,
    });
  }

  // Sort by price
  rates.sort((a, b) => a.price - b.price);

  // Calculate customs if international
  let customs: CustomsEstimation | undefined;
  if (isInternational) {
    customs = await estimateCustomsDuties(destination.country, pkg.weight * 100); // Assume $100 value per kg
  }

  return {
    origin,
    destination,
    package: pkg,
    rates,
    customs,
  };
}

// ============================================================
// CUSTOMS & DUTY ESTIMATION
// ============================================================

export async function estimateCustomsDuties(
  destinationCountry: string,
  declaredValue: number
): Promise<CustomsEstimation> {
  // Real customs duty rates by country (simplified)
  const dutyRates: Record<string, number> = {
    CA: 0.05, // Canada
    MX: 0.16, // Mexico
    GB: 0.025, // United Kingdom
    DE: 0.03, // Germany
    FR: 0.03, // France
    AU: 0.05, // Australia
    JP: 0.04, // Japan
    CN: 0.08, // China
    IN: 0.10, // India
    BR: 0.12, // Brazil
  };

  // Tax rates (VAT/GST)
  const taxRates: Record<string, number> = {
    CA: 0.13, // Canada HST
    MX: 0.16, // Mexico VAT
    GB: 0.20, // UK VAT
    DE: 0.19, // Germany VAT
    FR: 0.20, // France VAT
    AU: 0.10, // Australia GST
    JP: 0.10, // Japan VAT
    CN: 0.13, // China VAT
    IN: 0.18, // India GST
    BR: 0.17, // Brazil taxes
  };

  const dutyRate = dutyRates[destinationCountry] || 0.05;
  const taxRate = taxRates[destinationCountry] || 0.0;

  const dutyAmount = declaredValue * dutyRate;
  const taxableAmount = declaredValue + dutyAmount;
  const taxAmount = taxableAmount * taxRate;

  return {
    dutyRate: dutyRate * 100,
    dutyAmount: Math.round(dutyAmount * 100) / 100,
    taxRate: taxRate * 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalCustoms: Math.round((dutyAmount + taxAmount) * 100) / 100,
    restricted: false,
  };
}

// ============================================================
// INTERNATIONAL SHIPPING RULES
// ============================================================

export function checkInternationalShippingRules(
  origin: string,
  destination: string,
  items: Array<{ name: string; value: number; weight: number }>
): { allowed: boolean; restrictions: string[]; requiredDocuments: string[] } {
  const restrictions: string[] = [];
  const requiredDocuments: string[] = ['Commercial Invoice', 'Packing List'];

  // Check for restricted destinations
  const restrictedCountries = ['CU', 'IR', 'KP', 'SY']; // Cuba, Iran, North Korea, Syria
  if (restrictedCountries.includes(destination)) {
    restrictions.push('Shipping to this country is restricted due to sanctions');
    return { allowed: false, restrictions, requiredDocuments };
  }

  // Check value limits
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);

  if (destination === 'CA' && totalValue > 20) {
    requiredDocuments.push('Certificate of Origin');
  }

  if (destination === 'MX' && totalValue > 50) {
    requiredDocuments.push('Pedimento (Customs Declaration)');
  }

  if (destination === 'BR' && totalValue > 50) {
    restrictions.push('Brazil requires import license for values over $50');
    requiredDocuments.push('Import License');
  }

  // Check weight limits
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight > 30) {
    restrictions.push('Shipment exceeds 30kg - freight shipping may be required');
  }

  return {
    allowed: restrictions.length === 0 || !restrictions.some(r => r.includes('restricted')),
    restrictions,
    requiredDocuments,
  };
}

// ============================================================
// HAZMAT SHIPPING COMPLIANCE
// ============================================================

export function checkHazmatCompliance(
  items: Array<{ name: string; category?: string }>
): HazmatInfo {
  // Common hazmat categories
  const hazmatCategories = [
    'flammable',
    'corrosive',
    'explosive',
    'toxic',
    'radioactive',
    'oxidizer',
    'compressed gas',
  ];

  const hazmatItems = items.filter((item) => {
    const name = item.name.toLowerCase();
    return (
      name.includes('battery') ||
      name.includes('lithium') ||
      name.includes('alcohol') ||
      name.includes('aerosol') ||
      name.includes('perfume') ||
      name.includes('nail polish') ||
      name.includes('paint') ||
      name.includes('solvent') ||
      (item.category && hazmatCategories.includes(item.category.toLowerCase()))
    );
  });

  if (hazmatItems.length === 0) {
    return {
      isHazmat: false,
      requiresSpecialHandling: false,
      allowedCarriers: ['USPS', 'UPS', 'FedEx', 'DHL'],
      restrictedDestinations: [],
    };
  }

  // Determine hazmat category
  let category = 'other';
  let unNumber = 'UN3481'; // Default for lithium batteries
  let properShippingName = 'Lithium ion batteries';
  let packingGroup = 'II';

  const firstItem = hazmatItems[0].name.toLowerCase();
  if (firstItem.includes('battery') || firstItem.includes('lithium')) {
    category = 'lithium batteries';
    unNumber = 'UN3481';
    properShippingName = 'Lithium ion batteries';
    packingGroup = 'II';
  } else if (firstItem.includes('alcohol') || firstItem.includes('perfume')) {
    category = 'flammable liquid';
    unNumber = 'UN1266';
    properShippingName = 'Perfumery products';
    packingGroup = 'III';
  } else if (firstItem.includes('aerosol')) {
    category = 'flammable gas';
    unNumber = 'UN1950';
    properShippingName = 'Aerosols, flammable';
    packingGroup = 'II';
  }

  return {
    isHazmat: true,
    category,
    unNumber,
    properShippingName,
    packingGroup,
    requiresSpecialHandling: true,
    allowedCarriers: ['UPS', 'FedEx', 'DHL'], // USPS has restrictions restrictions
    restrictedDestinations: ['air'], // Cannot ship by air in many cases
  };
}

// ============================================================
// RETURN SHIPPING MANAGEMENT
// ============================================================

export interface ReturnLabel {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  labelUrl: string;
  reason: string;
  status: 'generated' | 'printed' | 'used' | 'expired';
  expiresAt: string;
}

const returnLabels: ReturnLabel[] = [];

export async function generateReturnLabel(
  orderId: string,
  reason: string,
  originalShipment: {
    carrier: string;
    origin: { country: string; postalCode: string };
    destination: { country: string; postalCode: string };
    weight: number;
  }
): Promise<ReturnLabel> {
  // Generate tracking number
  const trackingNumber = `1Z${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const labelId = `RETURN-${Date.now()}`;

  const returnLabel: ReturnLabel = {
    id: labelId,
    orderId,
    carrier: originalShipment.carrier,
    trackingNumber,
    labelUrl: `application/pdf;base64,${btoa('Return Label PDF Content')}`,
    reason,
    status: 'generated',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  returnLabels.push(returnLabel);

  return returnLabel;
}

export function getReturnLabels(orderId?: string): ReturnLabel[] {
  if (orderId) {
    return returnLabels.filter((label) => label.orderId === orderId);
  }
  return returnLabels;
}

export function updateReturnLabelStatus(labelId: string, status: ReturnLabel['status']): void {
  const label = returnLabels.find((l) => l.id === labelId);
  if (label) {
    label.status = status;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function calculateDistance(postalCode1: string, postalCode2: string): number {
  // Simplified distance calculation
  // In production, use real geocoding API
  const zip1 = parseInt(postalCode1.substring(0, 3)) || 0;
  const zip2 = parseInt(postalCode2.substring(0, 3)) || 0;
  return Math.abs(zip1 - zip2) * 50; // Rough estimate in miles
}
