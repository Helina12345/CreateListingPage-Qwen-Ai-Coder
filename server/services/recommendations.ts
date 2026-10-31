// ============================================================
// ListingDesk Pro — Recommendations Service
// Product and pricing recommendations based on data analysis
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';

// ============================================================
// TYPES
// ============================================================

export interface ProductRecommendation {
  type: 'restock' | 'discontinue' | 'price_adjustment' | 'expand' | 'optimize';
  productId: string;
  productTitle: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  action: string;
  expectedImpact?: string;
  confidence: number;
}

export interface PricingRecommendation {
  productId: string;
  productTitle: string;
  marketplaceId: MarketplaceId;
  currentPrice: number;
  recommendedPrice: number;
  reasoning: string;
  expectedImpact: string;
  confidence: number;
}

export interface InventoryRecommendation {
  productId: string;
  productTitle: string;
  action: 'reorder' | 'reduce' | 'maintain' | 'discontinue';
  recommendedQuantity: number;
  reasoning: string;
  urgency: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface MarketplaceRecommendation {
  marketplaceId: MarketplaceId;
  action: 'expand' | 'optimize' | 'reduce' | 'exit';
  reasoning: string;
  expectedImpact: string;
  confidence: number;
  metrics: {
    revenue: number;
    orders: number;
    conversionRate: number;
    avgOrderValue: number;
  };
}

// ============================================================
// RECOMMENDATIONS SERVICE
// ============================================================

export class RecommendationsService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // GENERATE PRODUCT RECOMMENDATIONS
  // ============================================================

  async generateProductRecommendations(userId: string): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const products = await this.db.product.findByUserId(userId);

    for (const product of products) {
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (!inventory) continue;

      const orders = await this.db.order.findAll({});
      const productOrders = orders.filter((o) =>
        o.items.some((item) => item.listingId === product.id)
      );

      const totalSold = productOrders.reduce((sum, o) =>
        sum + o.items.filter((item) => item.listingId === product.id).reduce((s, i) => s + i.quantity, 0),
        0
      );

      const daysSinceCreated = Math.floor(
        (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const salesPerDay = daysSinceCreated > 0 ? totalSold / daysSinceCreated : 0;

      // Recommendation 1: Restock if low inventory and good sales
      if (
        inventory.totalQuantity <= inventory.lowStockThreshold &&
        salesPerDay > 0.5
      ) {
        recommendations.push({
          type: 'restock',
          productId: product.id,
          productTitle: product.title,
          priority: 'high',
          reasoning: `Low stock (${inventory.totalQuantity} units) with good sales velocity (${salesPerDay.toFixed(2)} units/day)`,
          action: 'Reorder inventory immediately',
          expectedImpact: 'Prevent stockouts and lost sales',
          confidence: 90,
        });
      }

      // Recommendation 2: Discontinue if no sales
      if (totalSold === 0 && daysSinceCreated > 60) {
        recommendations.push({
          type: 'discontinue',
          productId: product.id,
          productTitle: product.title,
          priority: 'medium',
          reasoning: `No sales in ${daysSinceCreated} days`,
          action: 'Consider discontinuing this product',
          expectedImpact: 'Free up inventory capital',
          confidence: 75,
        });
      }

      // Recommendation 3: Optimize listing if low conversion
      const listings = await this.db.listing.findByProductId(product.id);
      if (listings.length > 0 && salesPerDay < 0.1 && daysSinceCreated > 30) {
        recommendations.push({
          type: 'optimize',
          productId: product.id,
          productTitle: product.title,
          priority: 'medium',
          reasoning: `Low sales velocity (${salesPerDay.toFixed(2)} units/day) despite being listed for ${daysSinceCreated} days`,
          action: 'Optimize product title, description, and images',
          expectedImpact: 'Improve conversion rate and sales',
          confidence: 70,
        });
      }

      // Recommendation 4: Expand to more marketplaces
      const marketplaceCount = listings.length;
      if (salesPerDay > 1 && marketplaceCount < 3) {
        recommendations.push({
          type: 'expand',
          productId: product.id,
          productTitle: product.title,
          priority: 'high',
          reasoning: `Strong sales (${salesPerDay.toFixed(2)} units/day) but only listed on ${marketplaceCount} marketplace${marketplaceCount > 1 ? 's' : ''}`,
          action: 'Expand to additional marketplaces',
          expectedImpact: 'Increase sales volume and reach',
          confidence: 85,
        });
      }
    }

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });
  }

  // ============================================================
  // GENERATE PRICING RECOMMENDATIONS
  // ============================================================

  async generatePricingRecommendations(userId: string): Promise<PricingRecommendation[]> {
    const recommendations: PricingRecommendation[] = [];
    const products = await this.db.product.findByUserId(userId);

    for (const product of products) {
      const listings = await this.db.listing.findByProductId(product.id);

      for (const listing of listings) {
        const currentPrice = listing.price;

        // Get competitor prices (placeholder - in production, query marketplace APIs)
        const competitorPrices = await this.getCompetitorPrices(product, listing.marketplaceId);

        if (competitorPrices.length === 0) continue;

        const avgCompetitorPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
        const minCompetitorPrice = Math.min(...competitorPrices);
        const maxCompetitorPrice = Math.max(...competitorPrices);

        // Recommendation 1: Price too high
        if (currentPrice > maxCompetitorPrice * 1.2) {
          const recommendedPrice = avgCompetitorPrice * 1.05; // 5% above average
          recommendations.push({
            productId: product.id,
            productTitle: product.title,
            marketplaceId: listing.marketplaceId,
            currentPrice,
            recommendedPrice,
            reasoning: `Current price ($${currentPrice.toFixed(2)}) is ${((currentPrice / maxCompetitorPrice - 1) * 100).toFixed(0)}% above highest competitor`,
            expectedImpact: 'Increase sales velocity by becoming more competitive',
            confidence: 80,
          });
        }

        // Recommendation 2: Price too low
        if (currentPrice < minCompetitorPrice * 0.8) {
          const recommendedPrice = avgCompetitorPrice * 0.95; // 5% below average
          recommendations.push({
            productId: product.id,
            productTitle: product.title,
            marketplaceId: listing.marketplaceId,
            currentPrice,
            recommendedPrice,
            reasoning: `Current price ($${currentPrice.toFixed(2)}) is ${((1 - currentPrice / minCompetitorPrice) * 100).toFixed(0)}% below lowest competitor`,
            expectedImpact: 'Increase profit margin while remaining competitive',
            confidence: 75,
          });
        }

        // Recommendation 3: Optimal pricing
        if (currentPrice >= avgCompetitorPrice * 0.95 && currentPrice <= avgCompetitorPrice * 1.05) {
          recommendations.push({
            productId: product.id,
            productTitle: product.title,
            marketplaceId: listing.marketplaceId,
            currentPrice,
            recommendedPrice: currentPrice,
            reasoning: `Current price ($${currentPrice.toFixed(2)}) is well-positioned relative to competitors`,
            expectedImpact: 'Maintain current pricing strategy',
            confidence: 90,
          });
        }
      }
    }

    return recommendations;
  }

  private async getCompetitorPrices(product: any, marketplaceId: MarketplaceId): Promise<number[]> {
    // In production, query marketplace API for similar products
    // For now, return empty array
    return [];
  }

  // ============================================================
  // GENERATE INVENTORY RECOMMENDATIONS
  // ============================================================

  async generateInventoryRecommendations(userId: string): Promise<InventoryRecommendation[]> {
    const recommendations: InventoryRecommendation[] = [];
    const products = await this.db.product.findByUserId(userId);

    for (const product of products) {
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (!inventory) continue;

      // Get sales velocity
      const orders = await this.db.order.findAll({});
      const productOrders = orders.filter((o) =>
        o.items.some((item) => item.listingId === product.id)
      );

      const totalSold = productOrders.reduce((sum, o) =>
        sum + o.items.filter((item) => item.listingId === product.id).reduce((s, i) => s + i.quantity, 0),
        0
      );

      const daysSinceCreated = Math.floor(
        (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const salesPerDay = daysSinceCreated > 0 ? totalSold / daysSinceCreated : 0;
      const daysOfStock = salesPerDay > 0 ? inventory.totalQuantity / salesPerDay : Infinity;

      // Recommendation 1: Reorder if low stock
      if (inventory.totalQuantity <= inventory.lowStockThreshold && salesPerDay > 0) {
        const recommendedQuantity = Math.ceil(salesPerDay * 30); // 30 days of stock
        recommendations.push({
          productId: product.id,
          productTitle: product.title,
          action: 'reorder',
          recommendedQuantity,
          reasoning: `Low stock (${inventory.totalQuantity} units) with ${daysOfStock.toFixed(1)} days of inventory remaining`,
          urgency: daysOfStock < 7 ? 'high' : 'medium',
          confidence: 90,
        });
      }

      // Recommendation 2: Reduce inventory if overstocked
      if (daysOfStock > 90 && salesPerDay > 0) {
        const recommendedQuantity = Math.ceil(salesPerDay * 60); // 60 days of stock
        recommendations.push({
          productId: product.id,
          productTitle: product.title,
          action: 'reduce',
          recommendedQuantity,
          reasoning: `Overstocked with ${daysOfStock.toFixed(0)} days of inventory (${inventory.totalQuantity} units)`,
          urgency: 'low',
          confidence: 75,
        });
      }

      // Recommendation 3: Discontinue if no sales
      if (totalSold === 0 && daysSinceCreated > 90) {
        recommendations.push({
          productId: product.id,
          productTitle: product.title,
          action: 'discontinue',
          recommendedQuantity: 0,
          reasoning: `No sales in ${daysSinceCreated} days`,
          urgency: 'medium',
          confidence: 80,
        });
      }

      // Recommendation 4: Maintain current levels
      if (daysOfStock >= 30 && daysOfStock <= 60 && salesPerDay > 0) {
        recommendations.push({
          productId: product.id,
          productTitle: product.title,
          action: 'maintain',
          recommendedQuantity: inventory.totalQuantity,
          reasoning: `Healthy inventory level with ${daysOfStock.toFixed(0)} days of stock`,
          urgency: 'low',
          confidence: 85,
        });
      }
    }

    // Sort by urgency
    return recommendations.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  // ============================================================
  // GENERATE MARKETPLACE RECOMMENDATIONS
  // ============================================================

  async generateMarketplaceRecommendations(userId: string): Promise<MarketplaceRecommendation[]> {
    const recommendations: MarketplaceRecommendation[] = [];
    const connections = await this.db.marketplaceConnection.findByUserId(userId);

    const marketplaceMetrics: Record<string, {
      revenue: number;
      orders: number;
      listings: number;
    }> = {};

    // Calculate metrics for each marketplace
    for (const connection of connections) {
      const orders = await this.db.order.findByUserId(userId, {
        marketplaceId: connection.marketplaceId,
      });

      const listings = await this.db.listing.findByMarketplaceId(connection.marketplaceId);

      marketplaceMetrics[connection.marketplaceId] = {
        revenue: orders.reduce((sum, o) => sum + o.total, 0),
        orders: orders.length,
        listings: listings.length,
      };
    }

    // Generate recommendations
    for (const [marketplaceId, metrics] of Object.entries(marketplaceMetrics)) {
      const avgOrderValue = metrics.orders > 0 ? metrics.revenue / metrics.orders : 0;
      const revenuePerListing = metrics.listings > 0 ? metrics.revenue / metrics.listings : 0;

      // Recommendation 1: Expand if high performance
      if (metrics.revenue > 1000 && revenuePerListing > 100) {
        recommendations.push({
          marketplaceId: marketplaceId as MarketplaceId,
          action: 'expand',
          reasoning: `Strong performance with $${metrics.revenue.toFixed(2)} revenue and $${revenuePerListing.toFixed(2)} revenue per listing`,
          expectedImpact: 'Increase market share and revenue',
          confidence: 85,
          metrics: {
            revenue: metrics.revenue,
            orders: metrics.orders,
            conversionRate: 0, // Would need view data
            avgOrderValue,
          },
        });
      }

      // Recommendation 2: Optimize if moderate performance
      if (metrics.revenue > 100 && metrics.revenue <= 1000) {
        recommendations.push({
          marketplaceId: marketplaceId as MarketplaceId,
          action: 'optimize',
          reasoning: `Moderate performance with $${metrics.revenue.toFixed(2)} revenue. Consider optimizing listings and pricing`,
          expectedImpact: 'Improve conversion rates and sales',
          confidence: 70,
          metrics: {
            revenue: metrics.revenue,
            orders: metrics.orders,
            conversionRate: 0,
            avgOrderValue,
          },
        });
      }

      // Recommendation 3: Reduce if low performance
      if (metrics.revenue < 100 && metrics.listings > 5) {
        recommendations.push({
          marketplaceId: marketplaceId as MarketplaceId,
          action: 'reduce',
          reasoning: `Low performance with only $${metrics.revenue.toFixed(2)} revenue across ${metrics.listings} listings`,
          expectedImpact: 'Reduce operational overhead',
          confidence: 65,
          metrics: {
            revenue: metrics.revenue,
            orders: metrics.orders,
            conversionRate: 0,
            avgOrderValue,
          },
        });
      }

      // Recommendation 4: Exit if very low performance
      if (metrics.revenue === 0 && metrics.listings > 0) {
        recommendations.push({
          marketplaceId: marketplaceId as MarketplaceId,
          action: 'exit',
          reasoning: `No revenue generated from ${metrics.listings} listings`,
          expectedImpact: 'Eliminate marketplace fees and operational costs',
          confidence: 80,
          metrics: {
            revenue: metrics.revenue,
            orders: metrics.orders,
            conversionRate: 0,
            avgOrderValue,
          },
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // ============================================================
  // GENERATE ALL RECOMMENDATIONS
  // ============================================================

  async generateAllRecommendations(userId: string): Promise<{
    product: ProductRecommendation[];
    pricing: PricingRecommendation[];
    inventory: InventoryRecommendation[];
    marketplace: MarketplaceRecommendation[];
  }> {
    const [product, pricing, inventory, marketplace] = await Promise.all([
      this.generateProductRecommendations(userId),
      this.generatePricingRecommendations(userId),
      this.generateInventoryRecommendations(userId),
      this.generateMarketplaceRecommendations(userId),
    ]);

    return {
      product,
      pricing,
      inventory,
      marketplace,
    };
  }
}
