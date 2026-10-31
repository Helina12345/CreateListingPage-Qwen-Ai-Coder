// ============================================================
// ListingDesk Pro — Advanced Analytics Service
// ML-based insights and advanced reporting
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';

// ============================================================
// TYPES
// ============================================================

export interface AdvancedAnalytics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: Date;
  endDate: Date;
  insights: Insight[];
  trends: Trend[];
  anomalies: Anomaly[];
  correlations: Correlation[];
}

export interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendation?: string;
  relatedMetrics?: string[];
}

export interface Trend {
  metric: string;
  data: Array<{
    date: Date;
    value: number;
  }>;
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  significance: 'high' | 'medium' | 'low';
}

export interface Anomaly {
  metric: string;
  date: Date;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'high' | 'medium' | 'low';
  possibleCauses?: string[];
}

export interface Correlation {
  metric1: string;
  metric2: string;
  correlationCoefficient: number;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  significance: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  characteristics: Record<string, any>;
  avgOrderValue: number;
  lifetimeValue: number;
}

export interface ProductPerformance {
  productId: string;
  title: string;
  metrics: {
    revenue: number;
    unitsSold: number;
    conversionRate: number;
    returnRate: number;
    avgRating: number;
    viewCount: number;
  };
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

// ============================================================
// ADVANCED ANALYTICS SERVICE
// ============================================================

export class AdvancedAnalyticsService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // GENERATE ADVANCED ANALYTICS
  // ============================================================

  async generateAdvancedAnalytics(
    userId: string,
    period: AdvancedAnalytics['period'],
    startDate?: Date,
    endDate?: Date
  ): Promise<AdvancedAnalytics> {
    const dateRange = this.getDateRange(period, startDate, endDate);

    const [insights, trends, anomalies, correlations] = await Promise.all([
      this.generateInsights(userId, dateRange.start, dateRange.end),
      this.analyzeTrends(userId, dateRange.start, dateRange.end),
      this.detectAnomalies(userId, dateRange.start, dateRange.end),
      this.findCorrelations(userId, dateRange.start, dateRange.end),
    ]);

    return {
      period,
      startDate: dateRange.start,
      endDate: dateRange.end,
      insights,
      trends,
      anomalies,
      correlations,
    };
  }

  // ============================================================
  // GENERATE INSIGHTS
  // ============================================================

  private async generateInsights(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get orders in period
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Insight 1: Best performing marketplace
    const marketplaceRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      marketplaceRevenue[order.marketplaceId] =
        (marketplaceRevenue[order.marketplaceId] || 0) + order.total;
    });

    const bestMarketplace = Object.entries(marketplaceRevenue)
      .sort(([, a], [, b]) => b - a)[0];

    if (bestMarketplace) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'opportunity',
        title: `${bestMarketplace[0]} is your best performing marketplace`,
        description: `Generated $${bestMarketplace[1].toFixed(2)} in revenue, ${((bestMarketplace[1] / orders.reduce((sum, o) => sum + o.total, 0)) * 100).toFixed(1)}% of total`,
        impact: 'high',
        confidence: 90,
        actionable: true,
        recommendation: 'Consider expanding your presence on this marketplace',
        relatedMetrics: ['revenue', 'marketplace_performance'],
      });
    }

    // Insight 2: Low stock alerts
    const products = await this.db.product.findByUserId(userId);
    let lowStockCount = 0;

    for (const product of products) {
      const inventory = await this.db.inventory.findByProductId(product.id);
      if (inventory && inventory.totalQuantity <= inventory.lowStockThreshold) {
        lowStockCount++;
      }
    }

    if (lowStockCount > 0) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'warning',
        title: `${lowStockCount} product${lowStockCount > 1 ? 's' : ''} running low on stock`,
        description: 'These products may run out of stock soon, potentially losing sales',
        impact: 'high',
        confidence: 95,
        actionable: true,
        recommendation: 'Restock these products or adjust inventory thresholds',
        relatedMetrics: ['inventory', 'stock_level'],
      });
    }

    // Insight 3: Average order value trend
    const currentPeriodOrders = orders.filter((o) => o.createdAt >= startDate);
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousPeriodOrders = await this.db.order.findByUserId(userId, {
      dateFrom: previousPeriodStart,
      dateTo: startDate,
    });

    const currentAOV = currentPeriodOrders.length > 0
      ? currentPeriodOrders.reduce((sum, o) => sum + o.total, 0) / currentPeriodOrders.length
      : 0;

    const previousAOV = previousPeriodOrders.length > 0
      ? previousPeriodOrders.reduce((sum, o) => sum + o.total, 0) / previousPeriodOrders.length
      : 0;

    if (previousAOV > 0) {
      const aovChange = ((currentAOV - previousAOV) / previousAOV) * 100;

      if (aovChange > 10) {
        insights.push({
          id: `insight_${Date.now()}_3`,
          type: 'opportunity',
          title: 'Average order value increased significantly',
          description: `AOV increased by ${aovChange.toFixed(1)}% compared to previous period`,
          impact: 'medium',
          confidence: 85,
          actionable: false,
          recommendation: 'Continue current pricing and bundling strategies',
          relatedMetrics: ['aov', 'pricing'],
        });
      } else if (aovChange < -10) {
        insights.push({
          id: `insight_${Date.now()}_3`,
          type: 'warning',
          title: 'Average order value decreased',
          description: `AOV decreased by ${Math.abs(aovChange).toFixed(1)}% compared to previous period`,
          impact: 'medium',
          confidence: 85,
          actionable: true,
          recommendation: 'Consider bundling products or adjusting pricing strategy',
          relatedMetrics: ['aov', 'pricing'],
        });
      }
    }

    return insights;
  }

  // ============================================================
  // ANALYZE TRENDS
  // ============================================================

  private async analyzeTrends(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Trend[]> {
    const trends: Trend[] = [];

    // Get daily order data
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;
    });

    // Create trend data
    const revenueData = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date: new Date(date),
        value,
      }));

    if (revenueData.length >= 2) {
      const firstValue = revenueData[0].value;
      const lastValue = revenueData[revenueData.length - 1].value;
      const changePercentage = ((lastValue - firstValue) / firstValue) * 100;

      trends.push({
        metric: 'daily_revenue',
        data: revenueData,
        direction: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
        changePercentage,
        significance: Math.abs(changePercentage) > 20 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low',
      });
    }

    return trends;
  }

  // ============================================================
  // DETECT ANOMALIES
  // ============================================================

  private async detectAnomalies(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get daily order data
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Group by date
    const dailyOrders: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    // Calculate mean and standard deviation
    const values = Object.values(dailyOrders);
    if (values.length > 0) {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Detect anomalies (values > 2 standard deviations from mean)
      Object.entries(dailyOrders).forEach(([date, count]) => {
        const deviation = Math.abs(count - mean);
        if (deviation > 2 * stdDev) {
          anomalies.push({
            metric: 'daily_orders',
            date: new Date(date),
            actualValue: count,
            expectedValue: mean,
            deviation,
            severity: deviation > 3 * stdDev ? 'high' : 'medium',
            possibleCauses: [
              'Promotional campaign',
              'Seasonal demand',
              'Marketing effort',
              'External event',
            ],
          });
        }
      });
    }

    return anomalies;
  }

  // ============================================================
  // FIND CORRELATIONS
  // ============================================================

  private async findCorrelations(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Correlation[]> {
    const correlations: Correlation[] = [];

    // Get orders
    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Calculate correlation between order count and revenue
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { orders: 0, revenue: 0 };
      }
      dailyData[date].orders++;
      dailyData[date].revenue += order.total;
    });

    const orderCounts = Object.values(dailyData).map((d) => d.orders);
    const revenues = Object.values(dailyData).map((d) => d.revenue);

    if (orderCounts.length > 1) {
      const correlation = this.calculateCorrelation(orderCounts, revenues);

      correlations.push({
        metric1: 'order_count',
        metric2: 'revenue',
        correlationCoefficient: correlation,
        strength: Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak',
        direction: correlation > 0 ? 'positive' : 'negative',
        significance: Math.abs(correlation),
      });
    }

    return correlations;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // ============================================================
  // CUSTOMER SEGMENTATION
  // ============================================================

  async segmentCustomers(userId: string): Promise<CustomerSegment[]> {
    const orders = await this.db.order.findByUserId(userId);

    // Group by customer email
    const customerData: Record<string, any[]> = {};
    orders.forEach((order) => {
      if (!customerData[order.buyerEmail]) {
        customerData[order.buyerEmail] = [];
      }
      customerData[order.buyerEmail].push(order);
    });

    // Simple segmentation based on order value and frequency
    const segments: CustomerSegment[] = [
      {
        id: 'high_value',
        name: 'High Value Customers',
        description: 'Customers with high average order value',
        customerCount: 0,
        characteristics: { avgOrderValue: 0 },
        avgOrderValue: 0,
        lifetimeValue: 0,
      },
      {
        id: 'frequent',
        name: 'Frequent Buyers',
        description: 'Customers who order frequently',
        customerCount: 0,
        characteristics: { orderFrequency: 0 },
        avgOrderValue: 0,
        lifetimeValue: 0,
      },
      {
        id: 'regular',
        name: 'Regular Customers',
        description: 'Customers with moderate activity',
        customerCount: 0,
        characteristics: {},
        avgOrderValue: 0,
        lifetimeValue: 0,
      },
    ];

    // Classify customers
    Object.values(customerData).forEach((customerOrders) => {
      const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
      const avgOrderValue = totalSpent / customerOrders.length;

      if (avgOrderValue > 100) {
        segments[0].customerCount++;
        segments[0].avgOrderValue += avgOrderValue;
        segments[0].lifetimeValue += totalSpent;
      } else if (customerOrders.length > 5) {
        segments[1].customerCount++;
        segments[1].avgOrderValue += avgOrderValue;
        segments[1].lifetimeValue += totalSpent;
      } else {
        segments[2].customerCount++;
        segments[2].avgOrderValue += avgOrderValue;
        segments[2].lifetimeValue += totalSpent;
      }
    });

    // Calculate averages
    segments.forEach((segment) => {
      if (segment.customerCount > 0) {
        segment.avgOrderValue /= segment.customerCount;
        segment.lifetimeValue /= segment.customerCount;
      }
    });

    return segments;
  }

  // ============================================================
  // PRODUCT PERFORMANCE ANALYSIS
  // ============================================================

  async analyzeProductPerformance(
    userId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<ProductPerformance[]> {
    const products = await this.db.product.findByUserId(userId);
    const performances: ProductPerformance[] = [];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (period === 'week' ? 7 : period === 'month' ? 30 : 90));

    for (const product of products) {
      const orders = await this.db.order.findByUserId(userId, {
        dateFrom: startDate,
        dateTo: endDate,
      });

      const productOrders = orders.filter((o) =>
        o.items.some((item) => item.listingId === product.id)
      );

      const unitsSold = productOrders.reduce((sum, o) =>
        sum + o.items.filter((item) => item.listingId === product.id).reduce((s, i) => s + i.quantity, 0),
        0
      );

      const revenue = productOrders.reduce((sum, o) =>
        sum + o.items.filter((item) => item.listingId === product.id).reduce((s, i) => s + i.totalPrice, 0),
        0
      );

      // Calculate trend (compare to previous period)
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - (period === 'week' ? 7 : period === 'month' ? 30 : 90));

      const previousOrders = await this.db.order.findByUserId(userId, {
        dateFrom: previousStartDate,
        dateTo: previousEndDate,
      });

      const previousUnitsSold = previousOrders.reduce((sum, o) =>
        sum + o.items.filter((item) => item.listingId === product.id).reduce((s, i) => s + i.quantity, 0),
        0
      );

      const trend = unitsSold > previousUnitsSold * 1.1 ? 'improving' :
                    unitsSold < previousUnitsSold * 0.9 ? 'declining' : 'stable';

      const recommendations: string[] = [];
      if (trend === 'declining') {
        recommendations.push('Consider adjusting pricing');
        recommendations.push('Review product images and description');
      } else if (trend === 'improving') {
        recommendations.push('Increase inventory to meet demand');
        recommendations.push('Consider expanding to more marketplaces');
      }

      performances.push({
        productId: product.id,
        title: product.title,
        metrics: {
          revenue,
          unitsSold,
          conversionRate: 0, // Would need view data
          returnRate: 0, // Would need return data
          avgRating: 0, // Would need rating data
          viewCount: 0, // Would need view data
        },
        trend,
        recommendations,
      });
    }

    return performances.sort((a, b) => b.metrics.revenue - a.metrics.revenue);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private getDateRange(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
    const now = new Date();

    if (period === 'custom' && startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    let start: Date;

    switch (period) {
      case 'day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end: now };
  }
}
