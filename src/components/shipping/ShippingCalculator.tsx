// ============================================================
// ListingDesk Pro — Shipping Calculator Component
// Real-time shipping rates, customs, hazmat compliance
// ============================================================

import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '../../components/ui';
import {
  calculateShippingRates,
  estimateCustomsDuties,
  checkInternationalShippingRules,
  checkHazmatCompliance,
  type ShippingQuote,
  type CustomsEstimation,
  type HazmatInfo
} from '../../services/shipping';

interface ShippingCalculatorProps {
  listingId?: string;
}

export function ShippingCalculator({ listingId }: ShippingCalculatorProps) {
  const [originCountry, setOriginCountry] = useState('US');
  const [originPostal, setOriginPostal] = useState('');
  const [destCountry, setDestCountry] = useState('US');
  const [destPostal, setDestPostal] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [customs, setCustoms] = useState<CustomsEstimation | null>(null);
  const [hazmat, setHazmat] = useState<HazmatInfo | null>(null);

  const handleCalculate = async () => {
    if (!originPostal || !destPostal || !weight) return;

    setCalculating(true);
    try {
      const pkg = {
        weight: parseFloat(weight),
        length: parseFloat(length) || 10,
        width: parseFloat(width) || 10,
        height: parseFloat(height) || 10,
      };

      const shippingQuote = await calculateShippingRates(
        { country: originCountry, postalCode: originPostal },
        { country: destCountry, postalCode: destPostal },
        pkg
      );

      setQuote(shippingQuote);

      // Calculate customs if international
      if (originCountry !== destCountry && declaredValue) {
        const customsEst = await estimateCustomsDuties(
          destCountry,
          parseFloat(declaredValue)
        );
        setCustoms(customsEst);
      }

      // Check hazmat (simplified - would need actual product data)
      const hazmatInfo = checkHazmatCompliance([]);
      setHazmat(hazmatInfo);
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Shipping Calculator
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Calculate real-time shipping rates across multiple carriers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Origin */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Origin
          </h4>
          <Select
            label="Country"
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value)}
            options={[
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'GB', label: 'United Kingdom' },
              { value: 'DE', label: 'Germany' },
              { value: 'FR', label: 'France' },
              { value: 'AU', label: 'Australia' },
            ]}
          />
          <Input
            label="Postal Code"
            value={originPostal}
            onChange={(e) => setOriginPostal(e.target.value)}
            placeholder="e.g., 90210"
          />
        </div>

        {/* Destination */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Destination
          </h4>
          <Select
            label="Country"
            value={destCountry}
            onChange={(e) => setDestCountry(e.target.value)}
            options={[
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'MX', label: 'Mexico' },
              { value: 'GB', label: 'United Kingdom' },
              { value: 'DE', label: 'Germany' },
              { value: 'FR', label: 'France' },
              { value: 'AU', label: 'Australia' },
              { value: 'JP', label: 'Japan' },
              { value: 'CN', label: 'China' },
            ]}
          />
          <Input
            label="Postal Code"
            value={destPostal}
            onChange={(e) => setDestPostal(e.target.value)}
            placeholder="e.g., 10001"
          />
        </div>
      </div>

      {/* Package Dimensions */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Package Details
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label="Weight (lbs)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
          />
          <Input
            label="Length (in)"
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="10"
          />
          <Input
            label="Width (in)"
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="10"
          />
          <Input
            label="Height (in)"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="10"
          />
        </div>
        {originCountry !== destCountry && (
          <Input
            label="Declared Value (USD)"
            type="number"
            value={declaredValue}
            onChange={(e) => setDeclaredValue(e.target.value)}
            placeholder="100.00"
            hint="Required for international shipping"
          />
        )}
      </div>

      <Button
        onClick={handleCalculate}
        loading={calculating}
        disabled={!originPostal || !destPostal || !weight}
        className="w-full mb-6"
      >
        Calculate Shipping Rates
      </Button>

      {/* Results */}
      {quote && (
        <div className="space-y-6">
          {/* Shipping Rates */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Available Shipping Options
            </h4>
            <div className="space-y-2">
              {quote.rates.map((rate, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {rate.carrier}
                      </span>
                      <Badge variant="default">{rate.service}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {rate.estimatedDays.min}-{rate.estimatedDays.max} business days
                    </div>
                    <div className="flex gap-2 mt-1">
                      {rate.trackingIncluded && (
                        <Badge variant="success">Tracking</Badge>
                      )}
                      {rate.insuranceIncluded && (
                        <Badge variant="info">Insurance</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(rate.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customs & Duties */}
          {customs && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Customs & Duties
              </h4>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Duty Rate</span>
                  <span className="font-medium">{customs.dutyRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Duty Amount</span>
                  <span className="font-medium">{formatCurrency(customs.dutyAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax Rate</span>
                  <span className="font-medium">{customs.taxRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax Amount</span>
                  <span className="font-medium">{formatCurrency(customs.taxAmount)}</span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Customs</span>
                    <span className="text-blue-600">{formatCurrency(customs.totalCustoms)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hazmat Warning */}
          {hazmat && hazmat.isHazmat && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Hazardous Material Detected
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This item requires special handling. Only the following carriers can ship this item:
                  </p>
                  <div className="flex gap-2 mt-2">
                    {hazmat.allowedCarriers.map((carrier) => (
                      <Badge key={carrier} variant="warning">
                        {carrier}
                      </Badge>
                    ))}
                  </div>
                  {hazmat.unNumber && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      UN Number: {hazmat.unNumber} | {hazmat.properShippingName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
