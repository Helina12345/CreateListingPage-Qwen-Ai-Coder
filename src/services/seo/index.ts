// ============================================================
// ListingDesk Pro — SEO Service
// Real SEO analysis, keyword density, scoring, and audit
// ============================================================

import type { MarketplaceId, Listing } from '../../types';
import { MARKETPLACES } from '../../config/marketplaces';

// ============================================================
// Types
// ============================================================
export interface KeywordDensityResult {
  keyword: string;
  count: number;
  density: number; // percentage
  optimal: boolean;
  recommendation?: string;
}

export interface SEOScoreResult {
  overallScore: number; // 0-100
  titleScore: number;
  descriptionScore: number;
  keywordScore: number;
  imageScore: number;
  marketplaceScore: number;
  issues: SEOIssue[];
  recommendations: string[];
}

export interface SEOIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SearchTermSuggestion {
  term: string;
  relevance: number;
  estimatedVolume?: string;
  competition?: 'low' | 'medium' | 'high';
}

export interface CompetitorAnalysis {
  competitorTitle: string;
  competitorPrice?: number;
  competitorRating?: number;
  keywordOverlap: string[];
  advantages: string[];
  disadvantages: string[];
}

export interface ABTestResult {
  variantA: { title: string; description: string };
  variantB: { title: string; description: string };
  metrics: {
    variantAImpressions?: number;
    variantBImpressions?: number;
    variantAClicks?: number;
    variantBClicks?: number;
    variantAConversions?: number;
    variantBConversions?: number;
  };
  winner?: 'A' | 'B' | 'tie';
  confidence?: number;
}

export interface SEOAuditReport {
  listingId: string;
  marketplaceId: MarketplaceId;
  timestamp: string;
  overallScore: number;
  scores: {
    title: number;
    description: number;
    keywords: number;
    images: number;
    pricing: number;
    category: number;
  };
  issues: SEOIssue[];
  recommendations: string[];
  passed: string[];
}

export interface RankingData {
  keyword: string;
  position: number;
  previousPosition?: number;
  change: number;
  url?: string;
  marketplaceId: MarketplaceId;
  lastChecked: string;
}

// ============================================================
// Keyword Density Analysis
// ============================================================
export function analyzeKeywordDensity(
  text: string,
  targetKeywords: string[] = []
): KeywordDensityResult[] {
  if (!text) return [];

  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  const wordFrequency: Record<string, number> = {};

  // Count single words
  words.forEach((word) => {
    const clean = word.replace(/[^a-z0-9]/g, '');
    if (clean.length > 2) {
      wordFrequency[clean] = (wordFrequency[clean] || 0) + 1;
    }
  });

  // Count phrases (2-3 words)
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`.replace(/[^a-z0-9\s]/g, '');
    wordFrequency[phrase] = (wordFrequency[phrase] || 0) + 1;
  }

  const results: KeywordDensityResult[] = [];

  // Analyze target keywords
  targetKeywords.forEach((keyword) => {
    const cleanKeyword = keyword.toLowerCase();
    const count = wordFrequency[cleanKeyword] || 0;
    const density = (count / totalWords) * 100;

    results.push({
      keyword,
      count,
      density: Math.round(density * 100) / 100,
      optimal: density >= 1 && density <= 3,
      recommendation: density < 1
        ? 'Keyword density too low. Consider adding more instances.'
        : density > 3
        ? 'Keyword density too high. Risk of keyword stuffing.'
        : 'Optimal keyword density.',
    });
  });

  // Add top natural keywords
  const sortedWords = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  sortedWords.forEach(([word, count]) => {
    if (!targetKeywords.includes(word)) {
      const density = (count / totalWords) * 100;
      results.push({
        keyword: word,
        count,
        density: Math.round(density * 100) / 100,
        optimal: density >= 1 && density <= 3,
      });
    }
  });

  return results;
}

// ============================================================
// SEO Score Calculation
// ============================================================
export function calculateSEOScore(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId
): SEOScoreResult {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  const marketplace = MARKETPLACES[marketplaceId];

  // Title Score (0-25)
  let titleScore = 0;
  const title = listing.title || '';
  const maxLength = marketplace.supportedFields.title.maxLength;

  if (title.length >= 20 && title.length <= maxLength) {
    titleScore += 15;
  } else if (title.length > 0) {
    titleScore += 5;
    issues.push({
      severity: 'warning',
      field: 'title',
      message: `Title length (${title.length}) is not optimal for ${marketplace.name}. Ideal: 20-${maxLength} chars.`,
      impact: 'high',
    });
  } else {
    issues.push({
      severity: 'error',
      field: 'title',
      message: 'Title is required',
      impact: 'high',
    });
  }

  if (title.split(' ').length >= 5) titleScore += 5;
  if (/[A-Z]/.test(title) && /[a-z]/.test(title)) titleScore += 5;

  // Description Score (0-25)
  let descriptionScore = 0;
  const description = listing.description || '';

  if (description.length >= 200) {
    descriptionScore += 15;
  } else if (description.length >= 50) {
    descriptionScore += 8;
    issues.push({
      severity: 'warning',
      field: 'description',
      message: 'Description could be longer for better SEO',
      impact: 'medium',
    });
  } else if (description.length > 0) {
    descriptionScore += 3;
    issues.push({
      severity: 'warning',
      field: 'description',
      message: 'Description too short. Aim for 200+ characters.',
      impact: 'high',
    });
  }

  if (description.split(/\s+/).length >= 50) descriptionScore += 5;
  if (/\d/.test(description)) descriptionScore += 3;
  if (description.includes(listing.brand || '')) descriptionScore += 2;

  // Keyword Score (0-20)
  let keywordScore = 0;
  const tags = listing.tags || [];

  if (tags.length >= 5) {
    keywordScore += 10;
  } else if (tags.length >= 2) {
    keywordScore += 5;
    recommendations.push('Add more tags/keywords for better discoverability');
  }

  if (listing.upc || listing.ean) keywordScore += 5;
  if (listing.brand) keywordScore += 5;

  // Image Score (0-15)
  let imageScore = 0;
  const images = listing.images || [];

  if (images.length >= 5) {
    imageScore += 10;
  } else if (images.length >= 3) {
    imageScore += 7;
    recommendations.push('Add more product images (5+ recommended)');
  } else if (images.length >= 1) {
    imageScore += 3;
    issues.push({
      severity: 'warning',
      field: 'images',
      message: 'Only 1-2 images. Add more for better conversion.',
      impact: 'medium',
    });
  }

  if (images.some((img) => img.alt)) imageScore += 5;
  else recommendations.push('Add alt text to images for accessibility and SEO');

  // Marketplace Score (0-15)
  let marketplaceScore = 0;
  const hasCategory = !!listing.category;
  const hasVariants = (listing.variants || []).length > 0;
  const hasShipping = !!listing.shipping;

  if (hasCategory) marketplaceScore += 5;
  if (hasVariants) marketplaceScore += 5;
  if (hasShipping) marketplaceScore += 5;

  if (!hasCategory) {
    issues.push({
      severity: 'warning',
      field: 'category',
      message: 'No category selected. This affects search visibility.',
      impact: 'high',
    });
  }

  const overallScore = titleScore + descriptionScore + keywordScore + imageScore + marketplaceScore;

  return {
    overallScore,
    titleScore,
    descriptionScore,
    keywordScore,
    imageScore,
    marketplaceScore,
    issues,
    recommendations,
  };
}

// ============================================================
// Search Term Suggestions
// ============================================================
export function generateSearchTermSuggestions(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId
): SearchTermSuggestion[] {
  const suggestions: SearchTermSuggestion[] = [];
  const title = listing.title || '';
  const brand = listing.brand || '';
  const category = listing.category || '';
  const tags = listing.tags || [];

  // Generate suggestions based on listing data
  if (brand) {
    suggestions.push({
      term: brand,
      relevance: 0.9,
      estimatedVolume: 'High',
      competition: 'high',
    });
  }

  if (category) {
    suggestions.push({
      term: category,
      relevance: 0.85,
      estimatedVolume: 'High',
      competition: 'medium',
    });
  }

  // Extract keywords from title
  const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
  titleWords.slice(0, 5).forEach((word) => {
    suggestions.push({
      term: word.toLowerCase(),
      relevance: 0.7,
      estimatedVolume: 'Medium',
      competition: 'medium',
    });
  });

  // Add tag-based suggestions
  tags.forEach((tag) => {
    suggestions.push({
      term: tag,
      relevance: 0.8,
      estimatedVolume: 'Medium',
      competition: 'low',
    });
  });

  // Marketplace-specific suggestions
  if (marketplaceId === 'amazon') {
    suggestions.push({
      term: `${brand} ${category}`.trim(),
      relevance: 0.95,
      estimatedVolume: 'Very High',
      competition: 'high',
    });
  }

  if (marketplaceId === 'ebay') {
    suggestions.push({
      term: `${title.split(' ').slice(0, 3).join(' ')}`.trim(),
      relevance: 0.85,
      estimatedVolume: 'High',
      competition: 'medium',
    });
  }

  return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
}

// ============================================================
// Competitor Keyword Analysis
// ============================================================
export function analyzeCompetitorKeywords(
  listing: Partial<Listing>,
  competitorTitles: string[]
): CompetitorAnalysis[] {
  const listingKeywords = new Set([
    ...(listing.title || '').toLowerCase().split(/\s+/),
    ...(listing.tags || []).map((t) => t.toLowerCase()),
  ]);

  return competitorTitles.map((compTitle) => {
    const compKeywords = new Set(compTitle.toLowerCase().split(/\s+/));
    const overlap = Array.from(listingKeywords).filter((k) => compKeywords.has(k));

    const advantages: string[] = [];
    const disadvantages: string[] = [];

    // Analyze advantages
    if ((listing.images || []).length > 3) advantages.push('More product images');
    if (listing.brand) advantages.push('Established brand presence');
    if ((listing.tags || []).length > 5) advantages.push('Better keyword coverage');

    // Analyze disadvantages
    if (overlap.length < 3) disadvantages.push('Low keyword overlap with competitors');
    if (!listing.description || listing.description.length < 200) {
      disadvantages.push('Shorter description than competitors');
    }

    return {
      competitorTitle: compTitle,
      keywordOverlap: overlap,
      advantages,
      disadvantages,
    };
  });
}

// ============================================================
// A/B Testing
// ============================================================
export function createABTest(
  listing: Partial<Listing>,
  variantB: { title?: string; description?: string }
): ABTestResult {
  return {
    variantA: {
      title: listing.title || '',
      description: listing.description || '',
    },
    variantB: {
      title: variantB.title || listing.title || '',
      description: variantB.description || listing.description || '',
    },
    metrics: {},
  };
}

export function calculateABTestWinner(test: ABTestResult): ABTestResult {
  const { metrics } = test;

  if (!metrics.variantAClicks || !metrics.variantBClicks) {
    return test;
  }

  const aCTR = (metrics.variantAClicks / (metrics.variantAImpressions || 1)) * 100;
  const bCTR = (metrics.variantBClicks / (metrics.variantBImpressions || 1)) * 100;

  const aConv = metrics.variantAConversions || 0;
  const bConv = metrics.variantBConversions || 0;

  const aScore = aCTR * 0.6 + (aConv / (metrics.variantAClicks || 1)) * 100 * 0.4;
  const bScore = bCTR * 0.6 + (bConv / (metrics.variantBClicks || 1)) * 100 * 0.4;

  const diff = Math.abs(aScore - bScore);
  const confidence = Math.min(95, diff * 10);

  return {
    ...test,
    winner: diff < 2 ? 'tie' : aScore > bScore ? 'A' : 'B',
    confidence,
  };
}

// ============================================================
// SEO Audit Report
// ============================================================
export function generateSEOAuditReport(
  listing: Partial<Listing>,
  marketplaceId: MarketplaceId
): SEOAuditReport {
  const seoScore = calculateSEOScore(listing, marketplaceId);
  const passed: string[] = [];

  // Check what passed
  if ((listing.title || '').length >= 20) passed.push('Title length is optimal');
  if ((listing.description || '').length >= 200) passed.push('Description is comprehensive');
  if ((listing.images || []).length >= 5) passed.push('Sufficient product images');
  if ((listing.tags || []).length >= 5) passed.push('Good keyword coverage');
  if (listing.brand) passed.push('Brand information provided');
  if (listing.upc || listing.ean) passed.push('Product identifier (GTIN) provided');
  if (listing.category) passed.push('Category properly selected');

  return {
    listingId: listing.id || '',
    marketplaceId,
    timestamp: new Date().toISOString(),
    overallScore: seoScore.overallScore,
    scores: {
      title: seoScore.titleScore,
      description: seoScore.descriptionScore,
      keywords: seoScore.keywordScore,
      images: seoScore.imageScore,
      pricing: listing.pricing?.basePrice ? 10 : 0,
      category: listing.category ? 10 : 0,
    },
    issues: seoScore.issues,
    recommendations: seoScore.recommendations,
    passed,
  };
}

// ============================================================
// Search Ranking Tracking
// ============================================================
const rankingHistory: RankingData[] = [];

export function trackSearchRanking(
  keyword: string,
  position: number,
  marketplaceId: MarketplaceId,
  url?: string
): void {
  const existing = rankingHistory.find(
    (r) => r.keyword === keyword && r.marketplaceId === marketplaceId
  );

  if (existing) {
    existing.previousPosition = existing.position;
    existing.position = position;
    existing.change = existing.previousPosition - position;
    existing.lastChecked = new Date().toISOString();
    if (url) existing.url = url;
  } else {
    rankingHistory.push({
      keyword,
      position,
      change: 0,
      marketplaceId,
      url,
      lastChecked: new Date().toISOString(),
    });
  }
}

export function getRankingHistory(
  marketplaceId?: MarketplaceId,
  limit: number = 50
): RankingData[] {
  let data = [...rankingHistory];
  if (marketplaceId) {
    data = data.filter((r) => r.marketplaceId === marketplaceId);
  }
  return data.sort((a, b) => new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime()).slice(0, limit);
}
