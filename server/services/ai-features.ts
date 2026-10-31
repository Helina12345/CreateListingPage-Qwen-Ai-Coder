// ============================================================
// ListingDesk Pro — AI Features Service
// AI-powered suggestions for titles, descriptions, keywords, etc.
// ============================================================

import type { DatabaseClient } from './database';
import type { MarketplaceId } from '../../types';

// ============================================================
// TYPES
// ============================================================

export interface AISuggestion {
  type: 'title' | 'description' | 'keywords' | 'category' | 'pricing' | 'images';
  suggestion: string;
  confidence: number;
  reasoning?: string;
}

export interface TitleOptimizationResult {
  originalTitle: string;
  optimizedTitle: string;
  marketplaceId: MarketplaceId;
  improvements: string[];
  score: {
    original: number;
    optimized: number;
  };
}

export interface DescriptionGenerationResult {
  description: string;
  htmlFormatted: boolean;
  marketplaceId: MarketplaceId;
  wordCount: number;
  keywordDensity: Record<string, number>;
}

export interface KeywordResearchResult {
  keywords: Array<{
    keyword: string;
    relevance: number;
    estimatedVolume?: string;
    competition?: 'low' | 'medium' | 'high';
  }>;
}

export interface CategorySuggestionResult {
  suggestedCategories: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
    marketplaceId: MarketplaceId;
  }>;
}

export interface PricingRecommendationResult {
  recommendedPrice: number;
  currentPrice: number;
  marketplaceId: MarketplaceId;
  reasoning: string;
  competitorPrices?: number[];
  confidence: number;
}

// ============================================================
// AI FEATURES SERVICE
// ============================================================

export class AIFeaturesService {
  private db: DatabaseClient;
  private openaiApiKey?: string;

  constructor(db: DatabaseClient, openaiApiKey?: string) {
    this.db = db;
    this.openaiApiKey = openaiApiKey;
  }

  // ============================================================
  // TITLE OPTIMIZATION
  // ============================================================

  async optimizeTitle(
    title: string,
    marketplaceId: MarketplaceId,
    category?: string,
    brand?: string
  ): Promise<TitleOptimizationResult> {
    // Calculate original score
    const originalScore = this.calculateTitleScore(title, marketplaceId);

    // Generate optimized title
    const optimizedTitle = await this.generateOptimizedTitle(
      title,
      marketplaceId,
      category,
      brand
    );

    // Calculate optimized score
    const optimizedScore = this.calculateTitleScore(optimizedTitle, marketplaceId);

    // Identify improvements
    const improvements = this.identifyTitleImprovements(title, optimizedTitle, marketplaceId);

    return {
      originalTitle: title,
      optimizedTitle,
      marketplaceId,
      improvements,
      score: {
        original: originalScore,
        optimized: optimizedScore,
      },
    };
  }

  private async generateOptimizedTitle(
    title: string,
    marketplaceId: MarketplaceId,
    category?: string,
    brand?: string
  ): Promise<string> {
    // In production, use OpenAI API or similar
    // For now, implement rule-based optimization

    const maxLength = this.getMarketplaceTitleLimit(marketplaceId);
    let optimized = title;

    // Add brand if missing and provided
    if (brand && !optimized.toLowerCase().includes(brand.toLowerCase())) {
      optimized = `${brand} ${optimized}`;
    }

    // Add category keywords if missing
    if (category) {
      const categoryKeywords = this.extractCategoryKeywords(category);
      for (const keyword of categoryKeywords) {
        if (!optimized.toLowerCase().includes(keyword.toLowerCase())) {
          optimized = `${optimized} ${keyword}`;
          break; // Add only one category keyword
        }
      }
    }

    // Remove special characters
    optimized = optimized.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();

    // Capitalize first letter of each word
    optimized = optimized
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Truncate if too long
    if (optimized.length > maxLength) {
      optimized = optimized.substring(0, maxLength - 3) + '...';
    }

    return optimized;
  }

  private calculateTitleScore(title: string, marketplaceId: MarketplaceId): number {
    let score = 0;
    const maxLength = this.getMarketplaceTitleLimit(marketplaceId);

    // Length score (0-30 points)
    if (title.length >= 50 && title.length <= maxLength) {
      score += 30;
    } else if (title.length >= 30) {
      score += 20;
    } else {
      score += 10;
    }

    // Capitalization score (0-20 points)
    const words = title.split(' ');
    const capitalizedWords = words.filter((w) => w[0] === w[0].toUpperCase());
    if (capitalizedWords.length === words.length) {
      score += 20;
    } else if (capitalizedWords.length >= words.length * 0.7) {
      score += 10;
    }

    // Keyword diversity score (0-25 points)
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    if (uniqueWords.size >= 5) {
      score += 25;
    } else if (uniqueWords.size >= 3) {
      score += 15;
    } else {
      score += 5;
    }

    // No special characters score (0-15 points)
    if (!/[^\w\s-]/.test(title)) {
      score += 15;
    }

    // Brand presence score (0-10 points)
    if (words.length >= 3) {
      score += 10;
    }

    return score;
  }

  private identifyTitleImprovements(
    original: string,
    optimized: string,
    marketplaceId: MarketplaceId
  ): string[] {
    const improvements: string[] = [];

    if (optimized.length > original.length) {
      improvements.push('Added more descriptive keywords');
    }

    if (optimized !== original && optimized[0] === optimized[0].toUpperCase()) {
      improvements.push('Improved capitalization');
    }

    if (!/[^\w\s-]/.test(optimized) && /[^\w\s-]/.test(original)) {
      improvements.push('Removed special characters');
    }

    const maxLength = this.getMarketplaceTitleLimit(marketplaceId);
    if (original.length > maxLength && optimized.length <= maxLength) {
      improvements.push(`Reduced length to fit ${marketplaceId} limit (${maxLength} chars)`);
    }

    return improvements;
  }

  private getMarketplaceTitleLimit(marketplaceId: MarketplaceId): number {
    const limits: Record<MarketplaceId, number> = {
      amazon: 200,
      ebay: 80,
      shopify: 255,
      etsy: 140,
      walmart: 200,
      tiktok_shop: 255,
      shopee: 120,
      lazada: 255,
      kohls: 150,
    };

    return limits[marketplaceId] || 200;
  }

  private extractCategoryKeywords(category: string): string[] {
    // Simple keyword extraction from category name
    return category
      .split(/[\s>]+/)
      .filter((word) => word.length > 3)
      .slice(0, 3);
  }

  // ============================================================
  // DESCRIPTION GENERATION
  // ============================================================

  async generateDescription(
    title: string,
    brand?: string,
    category?: string,
    features?: string[],
    marketplaceId?: MarketplaceId
  ): Promise<DescriptionGenerationResult> {
    // In production, use OpenAI API
    // For now, implement template-based generation

    let description = '';

    // Opening paragraph
    description += `${title}${brand ? ` by ${brand}` : ''} is a high-quality product`;
    if (category) {
      description += ` in the ${category} category`;
    }
    description += '. ';

    // Features section
    if (features && features.length > 0) {
      description += '\n\nKey Features:\n';
      features.forEach((feature) => {
        description += `• ${feature}\n`;
      });
    }

    // Benefits section
    description += '\n\nBenefits:\n';
    description += '• Premium quality construction\n';
    description += '• Durable and long-lasting\n';
    description += '• Excellent value for money\n';

    // Closing
    description += '\n\nOrder now and experience the difference!';

    // Format for marketplace
    const htmlFormatted = marketplaceId === 'ebay' || marketplaceId === 'shopify';
    const finalDescription = htmlFormatted ? this.formatHTML(description) : description;

    // Calculate keyword density
    const words = finalDescription.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const keywordDensity: Record<string, number> = {};

    const keywords = [title.toLowerCase(), ...(brand ? [brand.toLowerCase()] : [])];
    keywords.forEach((keyword) => {
      const count = words.filter((w) => w.includes(keyword)).length;
      keywordDensity[keyword] = (count / wordCount) * 100;
    });

    return {
      description: finalDescription,
      htmlFormatted,
      marketplaceId: marketplaceId || 'amazon',
      wordCount,
      keywordDensity,
    };
  }

  private formatHTML(description: string): string {
    return description
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n•/g, '<br>•')
      .replace(/^(.*)$/, '<p>$1</p>');
  }

  // ============================================================
  // KEYWORD RESEARCH
  // ============================================================

  async researchKeywords(
    title: string,
    description: string,
    category?: string,
    marketplaceId?: MarketplaceId
  ): Promise<KeywordResearchResult> {
    // In production, use keyword research API or AI
    // For now, implement basic keyword extraction

    const text = `${title} ${description} ${category || ''}`.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 3);

    // Count word frequency
    const wordFrequency: Record<string, number> = {};
    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Sort by frequency and take top keywords
    const keywords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({
        keyword,
        relevance: Math.min(count / words.length * 100, 100),
        estimatedVolume: count > 5 ? 'High' : count > 2 ? 'Medium' : 'Low',
        competition: count > 5 ? 'high' as const : count > 2 ? 'medium' as const : 'low' as const,
      }));

    return { keywords };
  }

  // ============================================================
  // CATEGORY SUGGESTION
  // ============================================================

  async suggestCategory(
    title: string,
    description: string,
    marketplaceId: MarketplaceId
  ): Promise<CategorySuggestionResult> {
    // In production, use AI or marketplace category API
    // For now, implement simple keyword matching

    const text = `${title} ${description}`.toLowerCase();
    const suggestedCategories: CategorySuggestionResult['suggestedCategories'] = [];

    // Simple category mapping based on keywords
    const categoryKeywords: Record<string, string[]> = {
      'Electronics': ['electronics', 'phone', 'computer', 'laptop', 'tablet', 'camera'],
      'Clothing': ['shirt', 'pants', 'dress', 'clothing', 'fashion', 'apparel'],
      'Home & Garden': ['home', 'garden', 'furniture', 'decor', 'kitchen'],
      'Sports & Outdoors': ['sports', 'outdoor', 'fitness', 'exercise', 'camping'],
      'Toys & Games': ['toy', 'game', 'play', 'kids', 'children'],
      'Books': ['book', 'reading', 'novel', 'literature'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matchCount = keywords.filter((keyword) => text.includes(keyword)).length;
      if (matchCount > 0) {
        suggestedCategories.push({
          categoryId: category.toLowerCase().replace(/\s+/g, '-'),
          categoryName: category,
          confidence: Math.min(matchCount / keywords.length * 100, 100),
          marketplaceId,
        });
      }
    }

    // Sort by confidence
    suggestedCategories.sort((a, b) => b.confidence - a.confidence);

    return {
      suggestedCategories: suggestedCategories.slice(0, 5),
    };
  }

  // ============================================================
  // PRICING RECOMMENDATION
  // ============================================================

  async recommendPricing(
    productId: string,
    marketplaceId: MarketplaceId,
    currentPrice?: number
  ): Promise<PricingRecommendationResult> {
    // In production, analyze competitor prices and market data
    // For now, implement simple recommendation logic

    const product = await this.db.product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get similar products' prices (placeholder logic)
    const competitorPrices = await this.getCompetitorPrices(product, marketplaceId);

    let recommendedPrice = currentPrice || product.pricing?.basePrice || 0;
    let reasoning = '';

    if (competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
      const minCompetitorPrice = Math.min(...competitorPrices);
      const maxCompetitorPrice = Math.max(...competitorPrices);

      // Recommend price in the middle of competitor range
      recommendedPrice = (minCompetitorPrice + maxCompetitorPrice) / 2;
      reasoning = `Based on ${competitorPrices.length} competitor prices ranging from $${minCompetitorPrice.toFixed(2)} to $${maxCompetitorPrice.toFixed(2)}`;
    } else {
      reasoning = 'No competitor data available. Using current price.';
    }

    return {
      recommendedPrice,
      currentPrice: currentPrice || product.pricing?.basePrice || 0,
      marketplaceId,
      reasoning,
      competitorPrices,
      confidence: competitorPrices.length > 0 ? 80 : 50,
    };
  }

  private async getCompetitorPrices(product: any, marketplaceId: MarketplaceId): Promise<number[]> {
    // In production, query marketplace API for similar products
    // For now, return empty array
    return [];
  }

  // ============================================================
  // IMAGE ANALYSIS
  // ============================================================

  async analyzeImages(imageUrls: string[]): Promise<{
    suggestions: string[];
    issues: string[];
  }> {
    // In production, use computer vision API
    // For now, implement basic checks

    const suggestions: string[] = [];
    const issues: string[] = [];

    if (imageUrls.length === 0) {
      issues.push('No images provided');
    } else if (imageUrls.length < 3) {
      suggestions.push('Add more images (recommended: 5-8 images)');
    }

    if (imageUrls.length > 0) {
      suggestions.push('Ensure main image has white background');
      suggestions.push('Use high-resolution images (minimum 1000x1000px)');
      suggestions.push('Show product from multiple angles');
    }

    return { suggestions, issues };
  }

  // ============================================================
  // PRODUCT MATCHING
  // ============================================================

  async findMatchingProducts(
    title: string,
    brand?: string,
    category?: string
  ): Promise<Array<{
    productId: string;
    title: string;
    similarity: number;
  }>> {
    // In production, use vector similarity search
    // For now, implement simple text matching

    const products = await this.db.product.findAll();
    const matches: Array<{ productId: string; title: string; similarity: number }> = [];

    for (const product of products) {
      let similarity = 0;

      // Title similarity
      const titleWords = title.toLowerCase().split(/\s+/);
      const productWords = product.title.toLowerCase().split(/\s+/);
      const commonWords = titleWords.filter((w) => productWords.includes(w));
      similarity += (commonWords.length / Math.max(titleWords.length, productWords.length)) * 50;

      // Brand similarity
      if (brand && product.brand && brand.toLowerCase() === product.brand.toLowerCase()) {
        similarity += 30;
      }

      // Category similarity
      if (category && product.category && category.toLowerCase() === product.category.toLowerCase()) {
        similarity += 20;
      }

      if (similarity > 30) {
        matches.push({
          productId: product.id,
          title: product.title,
          similarity,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }
}
