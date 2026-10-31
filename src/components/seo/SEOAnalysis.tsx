// ============================================================
// ListingDesk Pro — SEO Analysis Component
// Real-time SEO scoring, keyword density, and recommendations
// ============================================================

import React, { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar } from '../../components/ui';
import {
  calculateSEOScore,
  analyzeKeywordDensity,
  generateSearchTermSuggestions,
  type SEOScoreResult,
  type KeywordDensityResult,
  type SearchTermSuggestion
} from '../../services/seo';
import type { Listing, MarketplaceId } from '../../types';

interface SEOAnalysisProps {
  listing: Partial<Listing>;
  marketplaceId: MarketplaceId;
}

export function SEOAnalysis({ listing, marketplaceId }: SEOAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'score' | 'keywords' | 'suggestions'>('score');
  const [seoScore, setSeoScore] = useState<SEOScoreResult | null>(null);
  const [keywordDensity, setKeywordDensity] = useState<KeywordDensityResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchTermSuggestion[]>([]);

  useEffect(() => {
    if (listing.title && listing.description) {
      const score = calculateSEOScore(listing, marketplaceId);
      setSeoScore(score);

      const targetKeywords = listing.tags || [];
      const density = analyzeKeywordDensity(
        `${listing.title} ${listing.description}`,
        targetKeywords
      );
      setKeywordDensity(density);

      const terms = generateSearchTermSuggestions(listing, marketplaceId);
      setSuggestions(terms);
    }
  }, [listing, marketplaceId]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  if (!seoScore) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">Add title and description to see SEO analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          SEO Analysis
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Optimize your listing for better visibility
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        {(['score', 'keywords', 'suggestions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {/* Score Tab */}
        {activeTab === 'score' && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(seoScore.overallScore)}`}>
                {seoScore.overallScore}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {getScoreLabel(seoScore.overallScore)}
              </div>
              <div className="mt-2">
                <ProgressBar value={seoScore.overallScore} max={100} />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Title</span>
                  <span className="font-medium">{seoScore.titleScore}/25</span>
                </div>
                <ProgressBar value={seoScore.titleScore} max={25} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Description</span>
                  <span className="font-medium">{seoScore.descriptionScore}/25</span>
                </div>
                <ProgressBar value={seoScore.descriptionScore} max={25} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Keywords</span>
                  <span className="font-medium">{seoScore.keywordScore}/20</span>
                </div>
                <ProgressBar value={seoScore.keywordScore} max={20} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Images</span>
                  <span className="font-medium">{seoScore.imageScore}/15</span>
                </div>
                <ProgressBar value={seoScore.imageScore} max={15} />
              </div>

              <div className="col-span-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Marketplace Optimization</span>
                  <span className="font-medium">{seoScore.marketplaceScore}/15</span>
                </div>
                <ProgressBar value={seoScore.marketplaceScore} max={15} />
              </div>
            </div>

            {/* Issues */}
            {seoScore.issues.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Issues to Fix
                </h4>
                <div className="space-y-2">
                  {seoScore.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        issue.severity === 'error'
                          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                          : issue.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                          : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      }`}
                    >
                      <div className="font-medium text-sm">{issue.field}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {issue.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {seoScore.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  💡 Recommendations
                </h4>
                <ul className="space-y-1">
                  {seoScore.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Keyword density analysis helps you optimize your content for search engines.
              Ideal density is 1-3% for target keywords.
            </div>

            {keywordDensity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No keywords found. Add tags to your listing.
              </div>
            ) : (
              <div className="space-y-3">
                {keywordDensity.map((keyword, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {keyword.keyword}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {keyword.count} occurrence{keyword.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        keyword.optimal ? 'text-green-600' :
                        keyword.density > 3 ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {keyword.density}%
                      </div>
                      <Badge
                        variant={
                          keyword.optimal ? 'success' :
                          keyword.density > 3 ? 'danger' :
                          'warning'
                        }
                      >
                        {keyword.optimal ? 'Optimal' :
                         keyword.density > 3 ? 'Too High' :
                         'Too Low'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Suggested search terms to improve your listing visibility
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Add more details to get search term suggestions
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.term}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {suggestion.estimatedVolume && (
                          <Badge variant="info">{suggestion.estimatedVolume} Volume</Badge>
                        )}
                        {suggestion.competition && (
                          <Badge
                            variant={
                              suggestion.competition === 'low' ? 'success' :
                              suggestion.competition === 'medium' ? 'warning' :
                              'danger'
                            }
                          >
                            {suggestion.competition} Competition
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Relevance
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(suggestion.relevance * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
