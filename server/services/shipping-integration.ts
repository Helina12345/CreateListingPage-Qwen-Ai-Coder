// ============================================================
// ListingDesk Pro — Real Shipping Integration Service
// Complete shipping carrier integration with label generation
// ============================================================

import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface ShippingAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: 'in' | 'cm';
  weightUnit: 'lb' | 'oz' | 'kg' | 'g';
}

export interface ShippingRate {
  carrier: string;
  service: string;
  cost: number;
  currency: string;
  estimatedDays: { min: number; max: number };
  trackingIncluded: boolean;
  insuranceIncluded: boolean;
  deliveryConfirmation: boolean;
}

export interface ShippingLabel {
  id: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  labelUrl: string;
  trackingUrl: string;
  cost: number;
  currency: string;
  createdAt: Date;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  trackingHistory: Array<{
    timestamp: Date;
    location: string;
    status: string;
    description: string;
  }>;
}

// ============================================================
// SHIPPING CARRIER API CLIENTS
// ============================================================

class ShippoAPI {
  private apiKey: string;
  private baseUrl = 'https://api.goshippo.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Shippo ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Shippo API request failed: ${response.status}`);
    }

    return response.json();
  }

  async createShipment(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    parcel: PackageDimensions
  ): Promise<any> {
    const shipmentData = {
      address_from: this.formatAddress(fromAddress),
      address_to: this.formatAddress(toAddress),
      parcels: [this.formatParcel(parcel)],
      async: false,
    };

    return await this.request<any>('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async getRates(shipmentId: string): Promise<any[]> {
    const response = await this.request<any>(`/shipments/${shipmentId}`);
    return response.rates || [];
  }

  async createLabel(rateId: string): Promise<any> {
    return await this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        rate: rateId,
        label_file_type: 'PDF',
        async: false,
      }),
    });
  }

  async trackPackage(trackingNumber: string, carrier: string): Promise<any> {
    return await this.request<any>(`/tracks/${carrier}/${trackingNumber}`);
  }

  private formatAddress(address: ShippingAddress): any {
    return {
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: address.country,
      phone: address.phone,
    };
  }

  private formatParcel(parcel: PackageDimensions): any {
    return {
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
      distance_unit: parcel.unit,
      weight: parcel.weight,
      mass_unit: parcel.weightUnit,
    };
  }
}

class EasyPostAPI {
  private apiKey: string;
  private baseUrl = 'https://api.easypost.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `EasyPost API request failed: ${response.status}`);
    }

    return response.json();
  }

  async createShipment(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    parcel: PackageDimensions
  ): Promise<any> {
    const shipmentData = {
      shipment: {
        from_address: this.formatAddress(fromAddress),
        to_address: this.formatAddress(toAddress),
        parcel: this.formatParcel(parcel),
      },
    };

    return await this.request<any>('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async buyLabel(shipmentId: string, rateId: string): Promise<any> {
    return await this.request<any>(`/shipments/${shipmentId}/buy`, {
      method: 'POST',
      body: JSON.stringify({ rate: { id: rateId } }),
    });
  }

  async trackPackage(trackingCode: string, carrier: string): Promise<any> {
    return await this.request<any>(`/trackers`, {
      method: 'POST',
      body: JSON.stringify({
        tracking_code: trackingCode,
        carrier,
      }),
    });
  }

  private formatAddress(address: ShippingAddress): any {
    return {
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: address.country,
      phone: address.phone,
    };
  }

  private formatParcel(parcel: PackageDimensions): any {
    return {
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
      weight: parcel.weight,
    };
  }
}

// ============================================================
// SHIPPING INTEGRATION SERVICE
// ============================================================

export class ShippingIntegrationService {
  private db: DatabaseClient;
  private shippo: ShippoAPI | null;
  private easypost: EasyPostAPI | null;
  private defaultCarrier: 'shippo' | 'easypost';

  constructor(
    db: DatabaseClient,
    shippoApiKey?: string,
    easypostApiKey?: string,
    defaultCarrier: 'shippo' | 'easypost' = 'shippo'
  ) {
    this.db = db;
    this.shippo = shippoApiKey ? new ShippoAPI(shippoApiKey) : null;
    this.easypost = easypostApiKey ? new EasyPostAPI(easypostApiKey) : null;
    this.defaultCarrier = defaultCarrier;
  }

  // ============================================================
  // GET SHIPPING RATES
  // ============================================================

  async getShippingRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    parcel: PackageDimensions
  ): Promise<ShippingRate[]> {
    const carrier = this.defaultCarrier === 'shippo' ? this.shippo : this.easypost;

    if (!carrier) {
      throw new Error('No shipping carrier configured');
    }

    try {
      if (carrier instanceof ShippoAPI) {
        const shipment = await carrier.createShipment(fromAddress, toAddress, parcel);
        const rates = await carrier.getRates(shipment.object_id);

        return rates.map((rate: any) => ({
          carrier: rate.provider,
          service: rate.servicelevel.name,
          cost: parseFloat(rate.amount),
          currency: rate.currency,
          estimatedDays: {
            min: rate.days || 3,
            max: (rate.days || 3) + 2,
          },
          trackingIncluded: true,
          insuranceIncluded: rate.attributes?.includes('insurance') || false,
          deliveryConfirmation: rate.attributes?.includes('delivery_confirmation') || false,
        }));
      } else {
        const shipment = await carrier.createShipment(fromAddress, toAddress, parcel);

        return shipment.rates.map((rate: any) => ({
          carrier: rate.carrier,
          service: rate.service,
          cost: parseFloat(rate.rate),
          currency: rate.currency,
          estimatedDays: {
            min: rate.delivery_days || 3,
            max: (rate.delivery_days || 3) + 2,
          },
          trackingIncluded: true,
          insuranceIncluded: false,
          deliveryConfirmation: false,
        }));
      }
    } catch (error: any) {
      throw new Error(`Failed to get shipping rates: ${error.message}`);
    }
  }

  // ============================================================
  // GENERATE SHIPPING LABEL
  // ============================================================

  async generateShippingLabel(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    parcel: PackageDimensions,
    rateId: string
  ): Promise<ShippingLabel> {
    const carrier = this.defaultCarrier === 'shippo' ? this.shippo : this.easypost;

    if (!carrier) {
      throw new Error('No shipping carrier configured');
    }

    try {
      let labelData: any;

      if (carrier instanceof ShippoAPI) {
        labelData = await carrier.createLabel(rateId);
      } else {
        const shipment = await carrier.createShipment(fromAddress, toAddress, parcel);
        labelData = await carrier.buyLabel(shipment.id, rateId);
      }

      return {
        id: labelData.object_id || labelData.id,
        trackingNumber: labelData.tracking_number,
        carrier: labelData.carrier || labelData.provider,
        service: labelData.servicelevel?.name || labelData.service,
        labelUrl: labelData.label_url,
        trackingUrl: labelData.tracking_url,
        cost: parseFloat(labelData.rate?.amount || labelData.rate),
        currency: labelData.rate?.currency || 'USD',
        createdAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to generate shipping label: ${error.message}`);
    }
  }

  // ============================================================
  // TRACK PACKAGE
  // ============================================================

  async trackPackage(trackingNumber: string, carrier: string): Promise<TrackingInfo> {
    const shippingCarrier = this.defaultCarrier === 'shippo' ? this.shippo : this.easypost;

    if (!shippingCarrier) {
      throw new Error('No shipping carrier configured');
    }

    try {
      let trackingData: any;

      if (shippingCarrier instanceof ShippoAPI) {
        trackingData = await shippingCarrier.trackPackage(trackingNumber, carrier);
      } else {
        trackingData = await shippingCarrier.trackPackage(trackingNumber, carrier);
      }

      return {
        trackingNumber: trackingData.tracking_number,
        carrier: trackingData.carrier,
        status: this.mapTrackingStatus(trackingData.tracking_status?.status || trackingData.status),
        estimatedDelivery: trackingData.eta ? new Date(trackingData.eta) : undefined,
        deliveredAt: trackingData.tracking_status?.status_detail === 'delivered'
          ? new Date(trackingData.tracking_status.status_date)
          : undefined,
        trackingHistory: (trackingData.tracking_history || []).map((event: any) => ({
          timestamp: new Date(event.status_date || event.timestamp),
          location: event.location?.city || event.location || 'Unknown',
          status: this.mapTrackingStatus(event.status),
          description: event.status_details || event.description || '',
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to track package: ${error.message}`);
    }
  }

  // ============================================================
  // MAP TRACKING STATUS
  // ============================================================

  private mapTrackingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      unknown: 'unknown',
      pre_transit: 'pre_transit',
      in_transit: 'in_transit',
      transit: 'in_transit',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      available_for_pickup: 'available_for_pickup',
      return_to_sender: 'return_to_sender',
      failure: 'failure',
      cancelled: 'cancelled',
      error: 'error',
    };

    return statusMap[status.toLowerCase()] || 'unknown';
  }

  // ============================================================
  // VALIDATE ADDRESS
  // ============================================================

  async validateAddress(address: ShippingAddress): Promise<{
    valid: boolean;
    normalizedAddress?: ShippingAddress;
    errors?: string[];
  }> {
    // In production, use address validation API
    // For now, basic validation
    const errors: string[] = [];

    if (!address.name) errors.push('Name is required');
    if (!address.street1) errors.push('Street address is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    if (!address.zipCode) errors.push('ZIP code is required');
    if (!address.country) errors.push('Country is required');

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      normalizedAddress: address,
    };
  }

  // ============================================================
  // CALCULATE DIMENSIONAL WEIGHT
  // ============================================================

  calculateDimensionalWeight(parcel: PackageDimensions): number {
    const divisor = parcel.unit === 'in' ? 139 : 5000; // DIM divisor

    const volume = parcel.length * parcel.width * parcel.height;
    const dimensionalWeight = volume / divisor;

    // Convert to actual weight unit if needed
    if (parcel.weightUnit === 'oz' && (parcel.unit === 'in' || parcel.unit === 'cm')) {
      return dimensionalWeight * 16; // Convert lbs to oz
    }

    return dimensionalWeight;
  }

  // ============================================================
  // GET BILLABLE WEIGHT
  // ============================================================

  getBillableWeight(parcel: PackageDimensions): number {
    const dimensionalWeight = this.calculateDimensionalWeight(parcel);
    return Math.max(parcel.weight, dimensionalWeight);
  }
}
