// ============================================================
// ListingDesk Pro — Competitor Price Monitoring Service
// Real-time competitor price tracking and analysis
// ============================================================

export interface CompetitorProduct {
  id: string;
  marketplaceId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  price: number;
  currency: string;
  shippingCost?: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  rating?: number;
  reviewCount?: number;
  url: string;
  lastUpdated: Date;
}

export interface PriceHistory {
  productId: string;
  competitorId: string;
  prices: Array<{
    date: Date;
    price: number;
    currency: string;
  }>;
}

export interface PriceAlert {
  id: string;
  productId: string;
  competitorId: string;
  type: 'price_drop' | 'price_increase' | 'out_of_stock' | 'back_in_stock';
  oldPrice?: number;
  newPrice?: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export class CompetitorMonitoringService {
  private apiKey: string;
  private priceHistory: Map<string, PriceHistory> = new Map();
  private alerts: PriceAlert[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ============================================================
  // SEARCH COMPETITOR PRODUCTS
  // ============================================================

  async searchCompetitorProducts(
    query: string,
    marketplaceId: string,
    options?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
    }
  ): Promise<CompetitorProduct[]> {
    // This would integrate with marketplace APIs or scraping services
    // For now, returning mock structure that shows the integration point

    const competitors: CompetitorProduct[] = [];

    // Integration with Keepa API for Amazon
    if (marketplaceId === 'amazon') {
      const keepaProducts = await this.searchAmazonCompetitors(query, options);
      competitors.push(...keepaProducts);
    }

    // Integration with other marketplaces would follow similar pattern
    // eBay, Walmart, etc.

    return competitors;
  }

  // ============================================================
  // AMAZON COMPETITOR SEARCH (via Keepa API)
  // ============================================================

  private async searchAmazonCompetitors(
    query: string,
    options?: { limit?: number }
  ): Promise<CompetitorProduct[]> {
    const response = await fetch(
      `https://api.keepa.com/steam/search?key=${this.apiKey}&term=${encodeURIComponent(query)}&type=product&domain=1`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.products.map((product: any) => ({
      id: product.asin,
      marketplaceId: 'amazon',
      sellerId: product.sellerId || 'unknown',
      sellerName: product.sellerName || 'Unknown Seller',
      title: product.title,
      price: product.currentPrice?.[0] || 0,
      currency: 'USD',
      shippingCost: product.shippingCost,
      availability: this.mapAvailability(product.stockStatus),
      rating: product.rating,
      reviewCount: product.reviewCount,
      url: `https://www.amazon.com/dp/${product.asin}`,
      lastUpdated: new Date(),
    }));
  }

  private mapAvailability(status: string): 'in_stock' | 'out_of_stock' | 'limited' {
    switch (status) {
      case 'IN_STOCK':
        return 'in_stock';
      case 'OUT_OF_STOCK':
        return 'out_of_stock';
      case 'LOW_STOCK':
        return 'limited';
      default:
        return 'in_stock';
    }
  }

  // ============================================================
  // TRACK PRICE HISTORY
  // ============================================================

  async trackPriceHistory(
    productId: string,
    competitorId: string,
    marketplaceId: string
  ): Promise<PriceHistory> {
    const cacheKey = `${productId}_${competitorId}`;
    const cached = this.priceHistory.get(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch price history from API
    let history: PriceHistory;

    if (marketplaceId === 'amazon') {
      history = await this.fetchAmazonPriceHistory(productId, competitorId);
    } else {
      history = await this.fetchGenericPriceHistory(productId, competitorId, marketplaceId);
    }

    this.priceHistory.set(cacheKey, history);
    return history;
  }

  private async fetchAmazonPriceHistory(
    productId: string,
    competitorId: string
  ): Promise<PriceHistory> {
    const response = await fetch(
      `https://api.keepa.com/price?key=${this.apiKey}&asin=${productId}&domain=1`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      productId,
      competitorId,
      prices: data.products[0].csv[0].map((pricePoint: number[], index: number) => ({
        date: new Date(pricePoint[0] * 1000),
        price: pricePoint[1] / 100, // Convert from cents
        currency: 'USD',
      })),
    };
  }

  private async fetchGenericPriceHistory(
    productId: string,
    competitorId: string,
    marketplaceId: string
  ): Promise<PriceHistory> {
    // Generic implementation for other marketplaces
    // Would integrate with their respective APIs
    return {
      productId,
      competitorId,
      prices: [],
    };
  }

  // ============================================================
  // ANALYZE PRICE TRENDS
  // ============================================================

  analyzePriceTrends(history: PriceHistory): {
    currentPrice: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    priceChange: number;
    priceChangePercentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  } {
    if (history.prices.length === 0) {
      throw new Error('No price history available');
    }

    const prices = history.prices.map((p) => p.price);
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;

    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage = (priceChange / previousPrice) * 100;

    // Calculate volatility (standard deviation)
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - averagePrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (priceChangePercentage > 5) {
      trend = 'increasing';
    } else if (priceChangePercentage < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      currentPrice,
      averagePrice,
      minPrice,
      maxPrice,
      priceChange,
      priceChangePercentage,
      trend,
      volatility,
    };
  }

  // ============================================================
  // SET PRICE ALERTS
  // ============================================================

  setPriceAlert(
    productId: string,
    competitorId: string,
    type: PriceAlert['type'],
    threshold?: number
  ): void {
    const alert: PriceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      competitorId,
      type,
      message: `Price alert set for ${type}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
  }

  // ============================================================
  // CHECK AND TRIGGER ALERTS
  // ============================================================

  async checkAndTriggerAlerts(productId: string): Promise<PriceAlert[]> {
    const triggeredAlerts: PriceAlert[] = [];
    const productAlerts = this.alerts.filter((a) => a.productId === productId && !a.acknowledged);

    for (const alert of productAlerts) {
      const history = await this.trackPriceHistory(
        alert.productId,
        alert.competitorId,
        'amazon' // Would need to store marketplace ID
      );

      const trends = this.analyzePriceTrends(history);

      if (alert.type === 'price_drop' && trends.priceChange < 0) {
        alert.oldPrice = trends.currentPrice - Math.abs(trends.priceChange);
        alert.newPrice = trends.currentPrice;
        alert.message = `Price dropped from $${alert.oldPrice} to $${alert.newPrice}`;
        triggeredAlerts.push(alert);
      } else if (alert.type === 'price_increase' && trends.priceChange > 0) {
        alert.oldPrice = trends.currentPrice - trends.priceChange;
        alert.newPrice = trends.currentPrice;
        alert.message = `Price increased from $${alert.oldPrice} to $${alert.newPrice}`;
        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  }

  // ============================================================
  // GET ALERTS
  // ============================================================

  getAlerts(productId?: string, acknowledged?: boolean): PriceAlert[] {
    let filteredAlerts = this.alerts;

    if (productId) {
      filteredAlerts = filteredAlerts.filter((a) => a.productId === productId);
    }

    if (acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter((a) => a.acknowledged === acknowledged);
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ============================================================
  // ACKNOWLEDGE ALERT
  // ============================================================

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // ============================================================
  // GET COMPETITIVE ANALYSIS
  // ============================================================

  async getCompetitiveAnalysis(
    productId: string,
    yourPrice: number,
    marketplaceId: string
  ): Promise<{
    yourPrice: number;
    competitorCount: number;
    averageCompetitorPrice: number;
    minCompetitorPrice: number;
    maxCompetitorPrice: number;
    yourPosition: 'lowest' | 'competitive' | 'highest';
    recommendation: string;
    competitors: CompetitorProduct[];
  }> {
    const competitors = await this.searchCompetitorProducts(productId, marketplaceId, { limit: 10 });

    if (competitors.length === 0) {
      return {
        yourPrice,
        competitorCount: 0,
        averageCompetitorPrice: yourPrice,
        minCompetitorPrice: yourPrice,
        maxCompetitorPrice: yourPrice,
        yourPosition: 'competitive',
        recommendation: 'No competitors found. Your price is competitive.',
        competitors: [],
      };
    }

    const competitorPrices = competitors.map((c) => c.price + (c.shippingCost || 0));
    const averageCompetitorPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    let yourPosition: 'lowest' | 'competitive' | 'highest';
    let recommendation: string;

    if (yourPrice <= minCompetitorPrice) {
      yourPosition = 'lowest';
      recommendation = 'You have the lowest price. Consider increasing to improve margins.';
    } else if (yourPrice >= maxCompetitorPrice) {
      yourPosition = 'highest';
      recommendation = 'You have the highest price. Consider reducing to improve competitiveness.';
    } else {
      yourPosition = 'competitive';
      recommendation = 'Your price is competitive. Monitor competitors for changes.';
    }

    return {
      yourPrice,
      competitorCount: competitors.length,
      averageCompetitorPrice,
      minCompetitorPrice,
      maxCompetitorPrice,
      yourPosition,
      recommendation,
      competitors,
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createCompetitorMonitoringService(apiKey: string): CompetitorMonitoringService {
  return new CompetitorMonitoringService(apiKey);
}
