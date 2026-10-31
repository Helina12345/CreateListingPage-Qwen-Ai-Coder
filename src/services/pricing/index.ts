// ============================================================
// ListingDesk Pro — Price History & Repricing Rules Service
// Tracks price changes and automates repricing strategies
// ============================================================

import type { MarketplaceId } from '../../types';
import { auditLog, AuditEventType } from '../audit';

// ============================================================
// Price History
// ============================================================

export interface PriceHistoryEntry {
  id: string;
  listingId: string;
  marketplaceId?: MarketplaceId;
  previousPrice: number;
  newPrice: number;
  change: number;
  changePercentage: number;
  reason: 'manual' | 'repricing_rule' | 'competitor_match' | 'promotion' | 'bulk_update';
  userId?: string;
  timestamp: string;
  notes?: string;
}

const priceHistory: PriceHistoryEntry[] = [];

export function recordPriceChange(
  listingId: string,
  previousPrice: number,
  newPrice: number,
  reason: PriceHistoryEntry['reason'],
  options?: {
    marketplaceId?: MarketplaceId;
    userId?: string;
    notes?: string;
  }
): PriceHistoryEntry {
  const change = newPrice - previousPrice;
  const changePercentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

  const entry: PriceHistoryEntry = {
    id: `price_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    previousPrice,
    newPrice,
    change,
    changePercentage,
    reason,
    marketplaceId: options?.marketplaceId,
    userId: options?.userId,
    timestamp: new Date().toISOString(),
    notes: options?.notes,
  };

  priceHistory.unshift(entry);

  auditLog({
    type: AuditEventType.LISTING_UPDATED,
    severity: 'info',
    message: `Price changed for listing ${listingId}`,
    meta {
      listingId,
      previousPrice,
      newPrice,
      change,
      changePercentage,
      reason,
      marketplaceId: options?.marketplaceId,
    },
  });

  return entry;
}

export function getPriceHistory(
  listingId: string,
  marketplaceId?: MarketplaceId,
  limit: number = 50
): PriceHistoryEntry[] {
  let entries = priceHistory.filter((e) => e.listingId === listingId);

  if (marketplaceId) {
    entries = entries.filter((e) => e.marketplaceId === marketplaceId);
  }

  return entries.slice(0, limit);
}

export function getPriceStatistics(listingId: string): {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  totalChanges: number;
  lastChangedAt?: string;
} {
  const entries = priceHistory.filter((e) => e.listingId === listingId);

  if (entries.length === 0) {
    return {
      currentPrice: 0,
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      totalChanges: 0,
    };
  }

  const prices = entries.map((e) => e.newPrice);
  const currentPrice = entries[0].newPrice;

  return {
    currentPrice,
    lowestPrice: Math.min(...prices),
    highestPrice: Math.max(...prices),
    averagePrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    totalChanges: entries.length,
    lastChangedAt: entries[0].timestamp,
  };
}

// ============================================================
// Repricing Rules
// ============================================================

export type RepricingStrategy =
  | 'match_lowest'
  | 'beat_lowest'
  | 'maintain_margin'
  | 'fixed_increase'
  | 'fixed_decrease'
  | 'percentage_increase'
  | 'percentage_decrease';

export interface RepricingRule {
  id: string;
  name: string;
  description: string;
  strategy: RepricingStrategy;
  parameters: {
    targetPrice?: number;
    margin?: number;
    amount?: number;
    percentage?: number;
    minPrice?: number;
    maxPrice?: number;
  };
  marketplaceIds: MarketplaceId[];
  listingIds: string[];
  active: boolean;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const repricingRules: RepricingRule[] = [];

export function createRepricingRule(
  rule: Omit<RepricingRule, 'id' | 'createdAt' | 'updatedAt'>
): RepricingRule {
  const newRule: RepricingRule = {
    ...rule,
    id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  repricingRules.push(newRule);
  return newRule;
}

export function getRepricingRules(listingId?: string): RepricingRule[] {
  if (listingId) {
    return repricingRules.filter((r) => r.listingIds.includes(listingId));
  }
  return [...repricingRules];
}

export function updateRepricingRule(
  ruleId: string,
  updates: Partial<RepricingRule>
): RepricingRule | undefined {
  const rule = repricingRules.find((r) => r.id === ruleId);
  if (rule) {
    Object.assign(rule, updates, { updatedAt: new Date().toISOString() });
  }
  return rule;
}

export function deleteRepricingRule(ruleId: string): boolean {
  const index = repricingRules.findIndex((r) => r.id === ruleId);
  if (index !== -1) {
    repricingRules.splice(index, 1);
    return true;
  }
  return false;
}

export function activateRepricingRule(ruleId: string): boolean {
  const rule = repricingRules.find((r) => r.id === ruleId);
  if (rule) {
    rule.active = true;
    rule.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function deactivateRepricingRule(ruleId: string): boolean {
  const rule = repricingRules.find((r) => r.id === ruleId);
  if (rule) {
    rule.active = false;
    rule.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

// ============================================================
// Repricing Execution
// ============================================================

export function calculateNewPrice(
  currentPrice: number,
  rule: RepricingRule,
  competitorPrices?: number[]
): number {
  let newPrice = currentPrice;

  switch (rule.strategy) {
    case 'match_lowest':
      if (competitorPrices && competitorPrices.length > 0) {
        newPrice = Math.min(...competitorPrices);
      }
      break;

    case 'beat_lowest':
      if (competitorPrices && competitorPrices.length > 0) {
        newPrice = Math.min(...competitorPrices) - 0.01;
      }
      break;

    case 'maintain_margin':
      if (rule.parameters.margin) {
        // Assuming cost is known, calculate price to maintain margin
        // This would need cost data in production
        newPrice = currentPrice;
      }
      break;

    case 'fixed_increase':
      if (rule.parameters.amount) {
        newPrice = currentPrice + rule.parameters.amount;
      }
      break;

    case 'fixed_decrease':
      if (rule.parameters.amount) {
        newPrice = currentPrice - rule.parameters.amount;
      }
      break;

    case 'percentage_increase':
      if (rule.parameters.percentage) {
        newPrice = currentPrice * (1 + rule.parameters.percentage / 100);
      }
      break;

    case 'percentage_decrease':
      if (rule.parameters.percentage) {
        newPrice = currentPrice * (1 - rule.parameters.percentage / 100);
      }
      break;
  }

  // Apply min/max constraints
  if (rule.parameters.minPrice) {
    newPrice = Math.max(newPrice, rule.parameters.minPrice);
  }
  if (rule.parameters.maxPrice) {
    newPrice = Math.min(newPrice, rule.parameters.maxPrice);
  }

  return Math.round(newPrice * 100) / 100;
}

export async function executeRepricingRules(listingId: string): Promise<{
  rulesExecuted: number;
  pricesChanged: number;
  results: Array<{
    ruleId: string;
    ruleName: string;
    oldPrice: number;
    newPrice: number;
    marketplaceId: MarketplaceId;
  }>;
}> {
  const rules = repricingRules.filter(
    (r) => r.active && r.listingIds.includes(listingId)
  );

  const results: Array<{
    ruleId: string;
    ruleName: string;
    oldPrice: number;
    newPrice: number;
    marketplaceId: MarketplaceId;
  }> = [];

  for (const rule of rules) {
    for (const marketplaceId of rule.marketplaceIds) {
      // In production, fetch current price and competitor prices from marketplace
      const currentPrice = 0; // Would fetch from listing
      const competitorPrices: number[] = []; // Would fetch from marketplace

      const newPrice = calculateNewPrice(currentPrice, rule, competitorPrices);

      if (newPrice !== currentPrice) {
        recordPriceChange(listingId, currentPrice, newPrice, 'repricing_rule', {
          marketplaceId,
          notes: `Applied rule: ${rule.name}`,
        });

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          oldPrice: currentPrice,
          newPrice,
          marketplaceId,
        });
      }
    }

    rule.lastExecutedAt = new Date().toISOString();
    rule.updatedAt = new Date().toISOString();
  }

  return {
    rulesExecuted: rules.length,
    pricesChanged: results.length,
    results,
  };
}

// ============================================================
// Scheduled Price Changes
// ============================================================

export interface ScheduledPriceChange {
  id: string;
  listingId: string;
  marketplaceId?: MarketplaceId;
  newPrice: number;
  scheduledAt: string;
  executed: boolean;
  executedAt?: string;
  createdAt: string;
}

const scheduledPriceChanges: ScheduledPriceChange[] = [];

export function schedulePriceChange(
  listingId: string,
  newPrice: number,
  scheduledAt: string,
  marketplaceId?: MarketplaceId
): ScheduledPriceChange {
  const scheduled: ScheduledPriceChange = {
    id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    marketplaceId,
    newPrice,
    scheduledAt,
    executed: false,
    createdAt: new Date().toISOString(),
  };

  scheduledPriceChanges.push(scheduled);
  return scheduled;
}

export function getPendingScheduledChanges(): ScheduledPriceChange[] {
  const now = new Date().toISOString();
  return scheduledPriceChanges.filter(
    (s) => !s.executed && s.scheduledAt <= now
  );
}

export function executeScheduledPriceChange(changeId: string): boolean {
  const change = scheduledPriceChanges.find((c) => c.id === changeId);
  if (change && !change.executed) {
    // In production, fetch current price and apply change
    const currentPrice = 0; // Would fetch from listing

    recordPriceChange(
      change.listingId,
      currentPrice,
      change.newPrice,
      'manual',
      {
        marketplaceId: change.marketplaceId,
        notes: 'Scheduled price change executed',
      }
    );

    change.executed = true;
    change.executedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function cancelScheduledPriceChange(changeId: string): boolean {
  const index = scheduledPriceChanges.findIndex((c) => c.id === changeId);
  if (index !== -1) {
    scheduledPriceChanges.splice(index, 1);
    return true;
  }
  return false;
}

// ============================================================
// MAP Enforcement
// ============================================================

export interface MAPPolicy {
  id: string;
  brand: string;
  minimumPrice: number;
  marketplaceIds: MarketplaceId[];
  effectiveDate: string;
  expirationDate?: string;
}

const mapPolicies: MAPPolicy[] = [];

export function createMAPPolicy(policy: Omit<MAPPolicy, 'id'>): MAPPolicy {
  const newPolicy: MAPPolicy = {
    ...policy,
    id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };

  mapPolicies.push(newPolicy);
  return newPolicy;
}

export function checkMAPCompliance(
  listingId: string,
  brand: string,
  price: number,
  marketplaceId: MarketplaceId
): {
  compliant: boolean;
  policy?: MAPPolicy;
  violation?: string;
} {
  const policy = mapPolicies.find(
    (p) =>
      p.brand === brand &&
      p.marketplaceIds.includes(marketplaceId) &&
      (!p.expirationDate || new Date(p.expirationDate) > new Date())
  );

  if (!policy) {
    return { compliant: true };
  }

  if (price < policy.minimumPrice) {
    return {
      compliant: false,
      policy,
      violation: `Price $${price} is below MAP of $${policy.minimumPrice}`,
    };
  }

  return { compliant: true, policy };
}

export function getMAPPolicies(brand?: string): MAPPolicy[] {
  if (brand) {
    return mapPolicies.filter((p) => p.brand === brand);
  }
  return [...mapPolicies];
}
