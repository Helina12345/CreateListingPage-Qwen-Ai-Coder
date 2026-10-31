// ============================================================
// ListingDesk Pro — Dynamic Pricing Rules Engine
// Automated pricing based on competition, demand, and rules
// ============================================================

export interface PricingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: PricingCondition[];
  actions: PricingAction[];
  marketplaceIds: string[];
  productIds?: string[];
  categoryIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingCondition {
  type: 'competitor_price' | 'stock_level' | 'sales_velocity' | 'time_of_day' | 'day_of_week' | 'season' | 'margin' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  value2?: any; // For 'between' operator
}

export interface PricingAction {
  type: 'set_price' | 'adjust_price' | 'adjust_percentage' | 'match_competitor' | 'beat_competitor' | 'maintain_margin';
  value?: number;
  minPrice?: number;
  maxPrice?: number;
  competitorOffset?: number; // For beat_competitor
  targetMargin?: number; // For maintain_margin
}

export interface PriceRecommendation {
  productId: string;
  marketplaceId: string;
  currentPrice: number;
  recommendedPrice: number;
  ruleId: string;
  ruleName: string;
  reason: string;
  confidence: number;
  expectedImpact: {
    salesChange?: number;
    revenueChange?: number;
    marginChange?: number;
  };
}

export class DynamicPricingService {
  private rules: PricingRule[] = [];
  private competitorService: any; // Would inject CompetitorMonitoringService
  private currencyService: any; // Would inject CurrencyConversionService

  constructor(competitorService: any, currencyService: any) {
    this.competitorService = competitorService;
    this.currencyService = currencyService;
  }

  // ============================================================
  // RULE MANAGEMENT
  // ============================================================

  addRule(rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>): PricingRule {
    const newRule: PricingRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.push(newRule);
    this.rules.sort((a, b) => b.priority - a.priority); // Sort by priority

    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<PricingRule>): PricingRule | null {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) return null;

    Object.assign(rule, updates, { updatedAt: new Date() });
    this.rules.sort((a, b) => b.priority - a.priority);

    return rule;
  }

  deleteRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index === -1) return false;

    this.rules.splice(index, 1);
    return true;
  }

  getRules(filters?: {
    enabled?: boolean;
    marketplaceId?: string;
    productId?: string;
  }): PricingRule[] {
    let filtered = this.rules;

    if (filters?.enabled !== undefined) {
      filtered = filtered.filter((r) => r.enabled === filters.enabled);
    }

    if (filters?.marketplaceId) {
      filtered = filtered.filter((r) => r.marketplaceIds.includes(filters.marketplaceId!));
    }

    if (filters?.productId) {
      filtered = filtered.filter(
        (r) => !r.productIds || r.productIds.includes(filters.productId!)
      );
    }

    return filtered;
  }

  // ============================================================
  // EVALUATE CONDITIONS
  // ============================================================

  private evaluateCondition(
    condition: PricingCondition,
    context: {
      competitorPrices?: number[];
      stockLevel?: number;
      salesVelocity?: number;
      currentPrice?: number;
      cost?: number;
      timestamp?: Date;
    }
  ): boolean {
    const { type, operator, value, value2 } = condition;

    switch (type) {
      case 'competitor_price':
        if (!context.competitorPrices || context.competitorPrices.length === 0) {
          return false;
        }
        const avgCompetitorPrice =
          context.competitorPrices.reduce((sum, p) => sum + p, 0) /
          context.competitorPrices.length;
        return this.compareValues(avgCompetitorPrice, operator, value, value2);

      case 'stock_level':
        if (context.stockLevel === undefined) return false;
        return this.compareValues(context.stockLevel, operator, value, value2);

      case 'sales_velocity':
        if (context.salesVelocity === undefined) return false;
        return this.compareValues(context.salesVelocity, operator, value, value2);

      case 'margin':
        if (!context.currentPrice || !context.cost) return false;
        const margin = ((context.currentPrice - context.cost) / context.currentPrice) * 100;
        return this.compareValues(margin, operator, value, value2);

      case 'time_of_day':
        const hour = (context.timestamp || new Date()).getHours();
        return this.compareValues(hour, operator, value, value2);

      case 'day_of_week':
        const day = (context.timestamp || new Date()).getDay();
        return this.compareValues(day, operator, value, value2);

      case 'season':
        const month = (context.timestamp || new Date()).getMonth() + 1;
        let season: string;
        if (month >= 3 && month <= 5) season = 'spring';
        else if (month >= 6 && month <= 8) season = 'summer';
        else if (month >= 9 && month <= 11) season = 'fall';
        else season = 'winter';
        return season === value;

      default:
        return false;
    }
  }

  private compareValues(
    actual: number,
    operator: string,
    expected: any,
    expected2?: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'between':
        return actual >= expected && actual <= expected2;
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  // ============================================================
  // APPLY ACTIONS
  // ============================================================

  private applyAction(
    action: PricingAction,
    currentPrice: number,
    context: {
      competitorPrices?: number[];
      cost?: number;
    }
  ): number {
    let newPrice = currentPrice;

    switch (action.type) {
      case 'set_price':
        newPrice = action.value || currentPrice;
        break;

      case 'adjust_price':
        newPrice = currentPrice + (action.value || 0);
        break;

      case 'adjust_percentage':
        newPrice = currentPrice * (1 + (action.value || 0) / 100);
        break;

      case 'match_competitor':
        if (context.competitorPrices && context.competitorPrices.length > 0) {
          const avgCompetitor =
            context.competitorPrices.reduce((sum, p) => sum + p, 0) /
            context.competitorPrices.length;
          newPrice = avgCompetitor;
        }
        break;

      case 'beat_competitor':
        if (context.competitorPrices && context.competitorPrices.length > 0) {
          const minCompetitor = Math.min(...context.competitorPrices);
          const offset = action.competitorOffset || 0.01; // Default 1% lower
          newPrice = minCompetitor * (1 - offset);
        }
        break;

      case 'maintain_margin':
        if (context.cost && action.targetMargin) {
          newPrice = context.cost / (1 - action.targetMargin / 100);
        }
        break;
    }

    // Apply min/max constraints
    if (action.minPrice !== undefined) {
      newPrice = Math.max(newPrice, action.minPrice);
    }
    if (action.maxPrice !== undefined) {
      newPrice = Math.min(newPrice, action.maxPrice);
    }

    return Math.round(newPrice * 100) / 100; // Round to 2 decimal places
  }

  // ============================================================
  // GET PRICE RECOMMENDATIONS
  // ============================================================

  async getPriceRecommendations(
    productId: string,
    marketplaceId: string,
    currentPrice: number,
    cost: number,
    stockLevel: number,
    salesVelocity: number
  ): Promise<PriceRecommendation[]> {
    const recommendations: PriceRecommendation[] = [];

    // Get competitor prices
    let competitorPrices: number[] = [];
    try {
      const competitors = await this.competitorService.searchCompetitorProducts(
        productId,
        marketplaceId
      );
      competitorPrices = competitors.map((c: any) => c.price + (c.shippingCost || 0));
    } catch (error) {
      console.error('Failed to fetch competitor prices:', error);
    }

    // Get applicable rules
    const applicableRules = this.getRules({
      enabled: true,
      marketplaceId,
      productId,
    });

    // Evaluate each rule
    for (const rule of applicableRules) {
      const context = {
        competitorPrices,
        stockLevel,
        salesVelocity,
        currentPrice,
        cost,
        timestamp: new Date(),
      };

      // Check if all conditions are met
      const allConditionsMet = rule.conditions.every((condition) =>
        this.evaluateCondition(condition, context)
      );

      if (!allConditionsMet) continue;

      // Apply actions
      let recommendedPrice = currentPrice;
      for (const action of rule.actions) {
        recommendedPrice = this.applyAction(action, recommendedPrice, {
          competitorPrices,
          cost,
        });
      }

      // Calculate expected impact
      const expectedImpact = this.calculateExpectedImpact(
        currentPrice,
        recommendedPrice,
        cost,
        salesVelocity
      );

      recommendations.push({
        productId,
        marketplaceId,
        currentPrice,
        recommendedPrice,
        ruleId: rule.id,
        ruleName: rule.name,
        reason: this.generateReasonText(rule, context),
        confidence: this.calculateConfidence(rule, context),
        expectedImpact,
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // ============================================================
  // CALCULATE EXPECTED IMPACT
  // ============================================================

  private calculateExpectedImpact(
    currentPrice: number,
    newPrice: number,
    cost: number,
    salesVelocity: number
  ): {
    salesChange?: number;
    revenueChange?: number;
    marginChange?: number;
  } {
    const priceChangePercentage = ((newPrice - currentPrice) / currentPrice) * 100;

    // Estimate sales change based on price elasticity (simplified)
    // Typically, a 1% price decrease leads to 1-2% sales increase
    const priceElasticity = -1.5; // Negative because price and demand are inversely related
    const estimatedSalesChange = priceChangePercentage * priceElasticity;

    const currentRevenue = currentPrice * salesVelocity;
    const newRevenue = newPrice * salesVelocity * (1 + estimatedSalesChange / 100);
    const revenueChange = newRevenue - currentRevenue;

    const currentMargin = ((currentPrice - cost) / currentPrice) * 100;
    const newMargin = ((newPrice - cost) / newPrice) * 100;
    const marginChange = newMargin - currentMargin;

    return {
      salesChange: Math.round(estimatedSalesChange * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      marginChange: Math.round(marginChange * 100) / 100,
    };
  }

  // ============================================================
  // GENERATE REASON TEXT
  // ============================================================

  private generateReasonText(rule: PricingRule, context: any): string {
    const reasons: string[] = [];

    for (const condition of rule.conditions) {
      switch (condition.type) {
        case 'competitor_price':
          reasons.push(`competitor prices are ${condition.operator} $${condition.value}`);
          break;
        case 'stock_level':
          reasons.push(`stock level is ${condition.operator} ${condition.value}`);
          break;
        case 'sales_velocity':
          reasons.push(`sales velocity is ${condition.operator} ${condition.value}/day`);
          break;
        case 'margin':
          reasons.push(`margin is ${condition.operator} ${condition.value}%`);
          break;
        case 'time_of_day':
          reasons.push(`time is ${condition.operator} ${condition.value}:00`);
          break;
        case 'day_of_week':
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          reasons.push(`day is ${days[condition.value]}`);
          break;
        case 'season':
          reasons.push(`season is ${condition.value}`);
          break;
      }
    }

    return `Rule "${rule.name}" triggered because ${reasons.join(' and ')}`;
  }

  // ============================================================
  // CALCULATE CONFIDENCE
  // ============================================================

  private calculateConfidence(rule: PricingRule, context: any): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on number of conditions met
    confidence += rule.conditions.length * 5;

    // Increase confidence if we have competitor data
    if (context.competitorPrices && context.competitorPrices.length > 0) {
      confidence += 20;
    }

    // Increase confidence if rule has been tested before
    // (Would need historical data)

    return Math.min(confidence, 100);
  }

  // ============================================================
  // APPLY RECOMMENDATION
  // ============================================================

  async applyRecommendation(
    recommendation: PriceRecommendation,
    updatePrice: (productId: string, marketplaceId: string, newPrice: number) => Promise<void>
  ): Promise<void> {
    await updatePrice(
      recommendation.productId,
      recommendation.marketplaceId,
      recommendation.recommendedPrice
    );
  }

  // ============================================================
  // SCHEDULED PRICING
  // ============================================================

  async runScheduledPricing(
    updatePrice: (productId: string, marketplaceId: string, newPrice: number) => Promise<void>,
    getProductData: (productId: string) => Promise<{
      currentPrice: number;
      cost: number;
      stockLevel: number;
      salesVelocity: number;
      marketplaceIds: string[];
    }>
  ): Promise<PriceRecommendation[]> {
    const allRecommendations: PriceRecommendation[] = [];

    // Get all enabled rules
    const enabledRules = this.getRules({ enabled: true });

    // For each rule, get affected products
    for (const rule of enabledRules) {
      const productIds = rule.productIds || []; // Would need to query products

      for (const productId of productIds) {
        const productData = await getProductData(productId);

        for (const marketplaceId of productData.marketplaceIds) {
          if (!rule.marketplaceIds.includes(marketplaceId)) continue;

          const recommendations = await this.getPriceRecommendations(
            productId,
            marketplaceId,
            productData.currentPrice,
            productData.cost,
            productData.stockLevel,
            productData.salesVelocity
          );

          allRecommendations.push(...recommendations);
        }
      }
    }

    return allRecommendations;
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createDynamicPricingService(
  competitorService: any,
  currencyService: any
): DynamicPricingService {
  return new DynamicPricingService(competitorService, currencyService);
}
