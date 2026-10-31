// ============================================================
// ListingDesk Pro — Currency Conversion Service
// Real-time exchange rates with multiple providers
// ============================================================

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  provider: 'exchangerate-api' | 'openexchangerates' | 'fixer' | 'currencylayer';
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export class CurrencyConversionService {
  private apiKey: string;
  private provider: 'exchangerate-api' | 'openexchangerates' | 'fixer' | 'currencylayer';
  private cache: Map<string, { rate: number; timestamp: number }> = new Map();
  private cacheTTL: number = 3600000; // 1 hour

  constructor(
    apiKey: string,
    provider: 'exchangerate-api' | 'openexchangerates' | 'fixer' | 'currencylayer' = 'exchangerate-api'
  ) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  // ============================================================
  // GET EXCHANGE RATE
  // ============================================================

  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}_${to}`;
    const cached = this.cache.get(cacheKey);

    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.rate;
    }

    // Fetch fresh rate
    const rate = await this.fetchExchangeRate(from, to);

    // Cache the rate
    this.cache.set(cacheKey, { rate, timestamp: Date.now() });

    return rate;
  }

  // ============================================================
  // CONVERT AMOUNT
  // ============================================================

  async convert(
    amount: number,
    from: string,
    to: string,
    precision: number = 2
  ): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    const converted = amount * rate;
    return Math.round(converted * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  // ============================================================
  // CONVERT PRICE FOR MARKETPLACE
  // ============================================================

  async convertPriceForMarketplace(
    price: number,
    fromCurrency: string,
    marketplaceId: string
  ): Promise<{ convertedPrice: number; currency: string; rate: number }> {
    const marketplaceCurrencies: Record<string, string> = {
      amazon: 'USD',
      ebay: 'USD',
      shopify: 'USD',
      etsy: 'USD',
      walmart: 'USD',
      tiktok_shop: 'USD',
      shopee: 'SGD',
      lazada: 'SGD',
      kohls: 'USD',
    };

    const targetCurrency = marketplaceCurrencies[marketplaceId] || 'USD';
    const rate = await this.getExchangeRate(fromCurrency, targetCurrency);
    const convertedPrice = Math.round(price * rate * 100) / 100;

    return {
      convertedPrice,
      currency: targetCurrency,
      rate,
    };
  }

  // ============================================================
  // BATCH CONVERT
  // ============================================================

  async batchConvert(
    amounts: number[],
    from: string,
    to: string
  ): Promise<number[]> {
    const rate = await this.getExchangeRate(from, to);
    return amounts.map((amount) => Math.round(amount * rate * 100) / 100);
  }

  // ============================================================
  // GET ALL RATES
  // ============================================================

  async getAllRates(baseCurrency: string): Promise<Record<string, number>> {
    switch (this.provider) {
      case 'exchangerate-api':
        return await this.getRatesFromExchangeRateAPI(baseCurrency);
      case 'openexchangerates':
        return await this.getRatesFromOpenExchangeRates(baseCurrency);
      case 'fixer':
        return await this.getRatesFromFixer(baseCurrency);
      case 'currencylayer':
        return await this.getRatesFromCurrencyLayer(baseCurrency);
      default:
        throw new Error('Unsupported provider');
    }
  }

  // ============================================================
  // EXCHANGERATE-API
  // ============================================================

  private async fetchExchangeRate(from: string, to: string): Promise<number> {
    switch (this.provider) {
      case 'exchangerate-api':
        return await this.fetchFromExchangeRateAPI(from, to);
      case 'openexchangerates':
        return await this.fetchFromOpenExchangeRates(from, to);
      case 'fixer':
        return await this.fetchFromFixer(from, to);
      case 'currencylayer':
        return await this.fetchFromCurrencyLayer(from, to);
      default:
        throw new Error('Unsupported provider');
    }
  }

  private async fetchFromExchangeRateAPI(from: string, to: string): Promise<number> {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );

    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rates[to];
  }

  private async getRatesFromExchangeRateAPI(baseCurrency: string): Promise<Record<string, number>> {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rates;
  }

  // ============================================================
  // OPEN EXCHANGE RATES
  // ============================================================

  private async fetchFromOpenExchangeRates(from: string, to: string): Promise<number> {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}&base=${from}&symbols=${to}`
    );

    if (!response.ok) {
      throw new Error(`OpenExchangeRates error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rates[to];
  }

  private async getRatesFromOpenExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}&base=${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`OpenExchangeRates error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rates;
  }

  // ============================================================
  // FIXER
  // ============================================================

  private async fetchFromFixer(from: string, to: string): Promise<number> {
    const response = await fetch(
      `http://data.fixer.io/api/latest?access_key=${this.apiKey}&base=${from}&symbols=${to}`
    );

    if (!response.ok) {
      throw new Error(`Fixer error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rates[to];
  }

  private async getRatesFromFixer(baseCurrency: string): Promise<Record<string, number>> {
    const response = await fetch(
      `http://data.fixer.io/latest?access_key=${this.apiKey}&base=${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Fixer error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rates;
  }

  // ============================================================
  // CURRENCY LAYER
  // ============================================================

  private async fetchFromCurrencyLayer(from: string, to: string): Promise<number> {
    const response = await fetch(
      `http://api.currencylayer.com/live?access_key=${this.apiKey}&source=${from}&currencies=${to}`
    );

    if (!response.ok) {
      throw new Error(`CurrencyLayer error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.quotes[`${from}${to}`];
  }

  private async getRatesFromCurrencyLayer(baseCurrency: string): Promise<Record<string, number>> {
    const response = await fetch(
      `http://api.currencylayer.com/live?access_key=${this.apiKey}&source=${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`CurrencyLayer error: ${response.statusText}`);
    }

    const data = await response.json();
    const quotes = data.quotes;
    const rates: Record<string, number> = {};

    for (const [key, value] of Object.entries(quotes)) {
      const currency = key.replace(baseCurrency, '');
      rates[currency] = value as number;
    }

    return rates;
  }

  // ============================================================
  // GET SUPPORTED CURRENCIES
  // ============================================================

  getSupportedCurrencies(): CurrencyConfig[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
      { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2 },
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0 },
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2 },
      { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0 },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    ];
  }

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getSupportedCurrencies().find((c) => c.code === currencyCode);
    if (!currency) {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }

    return `${currency.symbol}${amount.toFixed(currency.decimalPlaces)}`;
  }

  // ============================================================
  // CLEAR CACHE
  // ============================================================

  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createCurrencyConversionService(
  apiKey: string,
  provider: 'exchangerate-api' | 'openexchangerates' | 'fixer' | 'currencylayer' = 'exchangerate-api'
): CurrencyConversionService {
  return new CurrencyConversionService(apiKey, provider);
}
