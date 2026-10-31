// ============================================================
// ListingDesk Pro — Forecasting Service
// Sales and inventory forecasting using statistical methods
// ============================================================

import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface SalesForecast {
  productId: string;
  productTitle: string;
  forecastPeriod: 'week' | 'month' | 'quarter';
  forecastData: Array<{
    date: Date;
    predictedSales: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: string;
}

export interface InventoryForecast {
  productId: string;
  productTitle: string;
  currentStock: number;
  predictedDepletionDate: Date;
  reorderDate: Date;
  recommendedOrderQuantity: number;
  safetyStock: number;
  leadTimeDays: number;
}

export interface RevenueForecast {
  period: 'week' | 'month' | 'quarter' | 'year';
  forecastData: Array<{
    date: Date;
    predictedRevenue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
  accuracy: number;
  growthRate: number;
}

// ============================================================
// FORECASTING SERVICE
// ============================================================

export class ForecastingService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ============================================================
  // SALES FORECASTING
  // ============================================================

  async forecastSales(
    productId: string,
    period: 'week' | 'month' | 'quarter' = 'month',
    historicalDays: number = 90
  ): Promise<SalesForecast> {
    const product = await this.db.product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get historical sales data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    const orders = await this.db.order.findAll({
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Extract sales data for this product
    const salesData: Array<{ date: Date; quantity: number }> = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.listingId === productId || item.sku === product.sku) {
          const date = new Date(order.createdAt.toISOString().split('T')[0]);
          const existing = salesData.find((s) => s.date.getTime() === date.getTime());

          if (existing) {
            existing.quantity += item.quantity;
          } else {
            salesData.push({ date, quantity: item.quantity });
          }
        }
      });
    });

    // Fill in missing dates with 0
    const filledData = this.fillMissingDates(salesData, startDate, endDate);

    // Apply forecasting method
    const forecastData = this.applyForecastingMethod(filledData, period);

    // Calculate accuracy (using holdout method)
    const accuracy = this.calculateForecastAccuracy(filledData, period);

    // Determine trend
    const trend = this.determineTrend(filledData);

    // Detect seasonality
    const seasonality = this.detectSeasonality(filledData);

    return {
      productId,
      productTitle: product.title,
      forecastPeriod: period,
      forecastData,
      accuracy,
      trend,
      seasonality,
    };
  }

  private fillMissingDates(
    salesData: Array<{ date: Date; quantity: number }>,
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; quantity: number }> {
    const filled: Array<{ date: Date; quantity: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const existing = salesData.find((s) => s.date.getTime() === currentDate.getTime());
      filled.push({
        date: new Date(currentDate),
        quantity: existing ? existing.quantity : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filled;
  }

  private applyForecastingMethod(
    historicalData: Array<{ date: Date; quantity: number }>,
    period: 'week' | 'month' | 'quarter'
  ): Array<{
    date: Date;
    predictedSales: number;
    confidenceInterval: { lower: number; upper: number };
  }> {
    const forecast: Array<{
      date: Date;
      predictedSales: number;
      confidenceInterval: { lower: number; upper: number };
    }> = [];

    const daysToForecast = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const lastDate = historicalData[historicalData.length - 1].date;

    // Simple moving average method
    const windowSize = Math.min(7, historicalData.length);
    const recentData = historicalData.slice(-windowSize);
    const average = recentData.reduce((sum, d) => sum + d.quantity, 0) / windowSize;
    const stdDev = Math.sqrt(
      recentData.reduce((sum, d) => sum + Math.pow(d.quantity - average, 2), 0) / windowSize
    );

    for (let i = 1; i <= daysToForecast; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Add slight trend adjustment
      const trendAdjustment = i * 0.01 * average; // 1% growth per day
      const predictedSales = Math.max(0, Math.round(average + trendAdjustment));

      // 95% confidence interval
      const confidenceInterval = {
        lower: Math.max(0, Math.round(predictedSales - 1.96 * stdDev)),
        upper: Math.round(predictedSales + 1.96 * stdDev),
      };

      forecast.push({
        date: forecastDate,
        predictedSales,
        confidenceInterval,
      });
    }

    return forecast;
  }

  private calculateForecastAccuracy(
    historicalData: Array<{ date: Date; quantity: number }>,
    period: 'week' | 'month' | 'quarter'
  ): number {
    if (historicalData.length < 14) {
      return 50; // Low confidence with limited data
    }

    // Split data into training and test sets
    const splitIndex = Math.floor(historicalData.length * 0.8);
    const trainingData = historicalData.slice(0, splitIndex);
    const testData = historicalData.slice(splitIndex);

    // Generate forecast for test period
    const forecast = this.applyForecastingMethod(trainingData, period);

    // Calculate Mean Absolute Percentage Error (MAPE)
    let totalError = 0;
    let count = 0;

    testData.forEach((actual, index) => {
      if (index < forecast.length && actual.quantity > 0) {
        const predicted = forecast[index].predictedSales;
        const error = Math.abs((actual.quantity - predicted) / actual.quantity);
        totalError += error;
        count++;
      }
    });

    const mape = count > 0 ? (totalError / count) * 100 : 100;
    const accuracy = Math.max(0, 100 - mape);

    return Math.round(accuracy);
  }

  private determineTrend(
    data: Array<{ date: Date; quantity: number }>
  ): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 7) {
      return 'stable';
    }

    // Split into two halves
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.quantity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.quantity, 0) / secondHalf.length;

    const changePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercentage > 10) {
      return 'increasing';
    } else if (changePercentage < -10) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  private detectSeasonality(
    data: Array<{ date: Date; quantity: number }>
  ): string | undefined {
    if (data.length < 30) {
      return undefined;
    }

    // Simple seasonality detection using autocorrelation
    const values = data.map((d) => d.quantity);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Check for weekly pattern (lag 7)
    const weeklyCorrelation = this.calculateAutocorrelation(values, 7, mean);
    if (weeklyCorrelation > 0.3) {
      return 'weekly';
    }

    // Check for monthly pattern (lag 30)
    const monthlyCorrelation = this.calculateAutocorrelation(values, 30, mean);
    if (monthlyCorrelation > 0.3) {
      return 'monthly';
    }

    return undefined;
  }

  private calculateAutocorrelation(
    values: number[],
    lag: number,
    mean: number
  ): number {
    if (values.length <= lag) {
      return 0;
    }

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < values.length - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // ============================================================
  // INVENTORY FORECASTING
  // ============================================================

  async forecastInventory(
    productId: string,
    leadTimeDays: number = 7,
    safetyStockDays: number = 3
  ): Promise<InventoryForecast> {
    const product = await this.db.product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const inventory = await this.db.inventory.findByProductId(productId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Get sales forecast
    const salesForecast = await this.forecastSales(productId, 'week', 90);

    // Calculate average daily sales
    const totalPredictedSales = salesForecast.forecastData.reduce(
      (sum, d) => sum + d.predictedSales,
      0
    );
    const avgDailySales = totalPredictedSales / salesForecast.forecastData.length;

    // Calculate when stock will run out
    const daysUntilDepletion = avgDailySales > 0
      ? Math.floor(inventory.totalQuantity / avgDailySales)
      : Infinity;

    const predictedDepletionDate = new Date();
    predictedDepletionDate.setDate(predictedDepletionDate.getDate() + daysUntilDepletion);

    // Calculate reorder date (before depletion)
    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + Math.max(0, daysUntilDepletion - leadTimeDays));

    // Calculate safety stock
    const safetyStock = Math.ceil(avgDailySales * safetyStockDays);

    // Calculate recommended order quantity
    const recommendedOrderQuantity = Math.ceil(
      (avgDailySales * (leadTimeDays + safetyStockDays)) + safetyStock - inventory.totalQuantity
    );

    return {
      productId,
      productTitle: product.title,
      currentStock: inventory.totalQuantity,
      predictedDepletionDate,
      reorderDate,
      recommendedOrderQuantity: Math.max(0, recommendedOrderQuantity),
      safetyStock,
      leadTimeDays,
    };
  }

  // ============================================================
  // REVENUE FORECASTING
  // ============================================================

  async forecastRevenue(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    historicalDays: number = 90
  ): Promise<RevenueForecast> {
    // Get historical revenue data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    const orders = await this.db.order.findByUserId(userId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Extract daily revenue
    const revenueData: Array<{ date: Date; revenue: number }> = [];

    orders.forEach((order) => {
      const date = new Date(order.createdAt.toISOString().split('T')[0]);
      const existing = revenueData.find((r) => r.date.getTime() === date.getTime());

      if (existing) {
        existing.revenue += order.total;
      } else {
        revenueData.push({ date, revenue: order.total });
      }
    });

    // Fill in missing dates with 0
    const filledData = this.fillMissingRevenueDates(revenueData, startDate, endDate);

    // Apply forecasting method
    const forecastData = this.applyRevenueForecastingMethod(filledData, period);

    // Calculate accuracy
    const accuracy = this.calculateRevenueForecastAccuracy(filledData, period);

    // Calculate growth rate
    const growthRate = this.calculateGrowthRate(filledData);

    return {
      period,
      forecastData,
      accuracy,
      growthRate,
    };
  }

  private fillMissingRevenueDates(
    revenueData: Array<{ date: Date; revenue: number }>,
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; revenue: number }> {
    const filled: Array<{ date: Date; revenue: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const existing = revenueData.find((r) => r.date.getTime() === currentDate.getTime());
      filled.push({
        date: new Date(currentDate),
        revenue: existing ? existing.revenue : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filled;
  }

  private applyRevenueForecastingMethod(
    historicalData: Array<{ date: Date; revenue: number }>,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Array<{
    date: Date;
    predictedRevenue: number;
    confidenceInterval: { lower: number; upper: number };
  }> {
    const forecast: Array<{
      date: Date;
      predictedRevenue: number;
      confidenceInterval: { lower: number; upper: number };
    }> = [];

    const daysToForecast = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    const lastDate = historicalData[historicalData.length - 1].date;

    // Simple moving average method
    const windowSize = Math.min(7, historicalData.length);
    const recentData = historicalData.slice(-windowSize);
    const average = recentData.reduce((sum, d) => sum + d.revenue, 0) / windowSize;
    const stdDev = Math.sqrt(
      recentData.reduce((sum, d) => sum + Math.pow(d.revenue - average, 2), 0) / windowSize
    );

    for (let i = 1; i <= daysToForecast; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Add slight trend adjustment
      const trendAdjustment = i * 0.01 * average; // 1% growth per day
      const predictedRevenue = Math.max(0, average + trendAdjustment);

      // 95% confidence interval
      const confidenceInterval = {
        lower: Math.max(0, predictedRevenue - 1.96 * stdDev),
        upper: predictedRevenue + 1.96 * stdDev,
      };

      forecast.push({
        date: forecastDate,
        predictedRevenue: Math.round(predictedRevenue * 100) / 100,
        confidenceInterval: {
          lower: Math.round(confidenceInterval.lower * 100) / 100,
          upper: Math.round(confidenceInterval.upper * 100) / 100,
        },
      });
    }

    return forecast;
  }

  private calculateRevenueForecastAccuracy(
    historicalData: Array<{ date: Date; revenue: number }>,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): number {
    if (historicalData.length < 14) {
      return 50; // Low confidence with limited data
    }

    // Split data into training and test sets
    const splitIndex = Math.floor(historicalData.length * 0.8);
    const trainingData = historicalData.slice(0, splitIndex);
    const testData = historicalData.slice(splitIndex);

    // Generate forecast for test period
    const forecast = this.applyRevenueForecastingMethod(trainingData, period);

    // Calculate Mean Absolute Percentage Error (MAPE)
    let totalError = 0;
    let count = 0;

    testData.forEach((actual, index) => {
      if (index < forecast.length && actual.revenue > 0) {
        const predicted = forecast[index].predictedRevenue;
        const error = Math.abs((actual.revenue - predicted) / actual.revenue);
        totalError += error;
        count++;
      }
    });

    const mape = count > 0 ? (totalError / count) * 100 : 100;
    const accuracy = Math.max(0, 100 - mape);

    return Math.round(accuracy);
  }

  private calculateGrowthRate(
    data: Array<{ date: Date; revenue: number }>
  ): number {
    if (data.length < 7) {
      return 0;
    }

    // Compare last 7 days to previous 7 days
    const recentData = data.slice(-7);
    const previousData = data.slice(-14, -7);

    const recentAvg = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;
    const previousAvg = previousData.reduce((sum, d) => sum + d.revenue, 0) / previousData.length;

    if (previousAvg === 0) {
      return 0;
    }

    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  // ============================================================
  // BATCH FORECASTING
  // ============================================================

  async forecastAllProducts(
    userId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<SalesForecast[]> {
    const products = await this.db.product.findByUserId(userId);
    const forecasts: SalesForecast[] = [];

    for (const product of products) {
      try {
        const forecast = await this.forecastSales(product.id, period);
        forecasts.push(forecast);
      } catch (error) {
        // Skip products with insufficient data
        continue;
      }
    }

    return forecasts;
  }

  async forecastAllInventory(
    userId: string,
    leadTimeDays: number = 7,
    safetyStockDays: number = 3
  ): Promise<InventoryForecast[]> {
    const products = await this.db.product.findByUserId(userId);
    const forecasts: InventoryForecast[] = [];

    for (const product of products) {
      try {
        const forecast = await this.forecastInventory(product.id, leadTimeDays, safetyStockDays);
        forecasts.push(forecast);
      } catch (error) {
        // Skip products with errors
        continue;
      }
    }

    return forecasts;
  }
}
