// ============================================================
// ListingDesk Pro — Publishing Progress Component
// Real-time progress indicator for publishing jobs
// ============================================================

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { MARKETPLACES } from '../../config/marketplaces';
import type { PublishingBatch, PublishingJob } from '../../services/publishing/orchestrator';
import type { MarketplaceId } from '../../types';

interface PublishingProgressProps {
  batch: PublishingBatch | null;
  onRetry?: (batchId: string) => void;
  onClose?: () => void;
}

export function PublishingProgress({ batch, onRetry, onClose }: PublishingProgressProps) {
  const [currentBatch, setCurrentBatch] = useState<PublishingBatch | null>(batch);

  useEffect(() => {
    setCurrentBatch(batch);
  }, [batch]);

  if (!currentBatch) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'publishing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'retrying':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'publishing':
        return 'bg-blue-50 border-blue-200';
      case 'retrying':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const completedJobs = currentBatch.jobs.filter((j) => j.status === 'completed').length;
  const failedJobs = currentBatch.jobs.filter((j) => j.status === 'failed').length;
  const totalJobs = currentBatch.jobs.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Publishing in Progress</h3>
            <p className="text-sm opacity-90">{currentBatch.listingTitle}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">{currentBatch.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${currentBatch.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>{completedJobs} completed</span>
          <span>{failedJobs} failed</span>
          <span>{totalJobs - completedJobs - failedJobs} remaining</span>
        </div>
      </div>

      {/* Job List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {currentBatch.jobs.map((job) => (
          <div key={job.id} className={clsx('p-4 border-l-4', getStatusColor(job.status))}>
            <div className="flex items-start gap-3">
              {getStatusIcon(job.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {MARKETPLACES[job.marketplaceId as MarketplaceId]?.name || job.marketplaceId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 capitalize">
                    {job.status}
                  </span>
                </div>

                {/* External ID */}
                {job.externalId && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">ID:</span> {job.externalId}
                  </div>
                )}

                {/* External URL */}
                {job.externalUrl && (
                  <a
                    href={job.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on {MARKETPLACES[job.marketplaceId as MarketplaceId]?.name}
                  </a>
                )}

                {/* Errors */}
                {job.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {job.errors.map((error, idx) => (
                      <div key={idx} className="text-xs text-red-700 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {job.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {job.warnings.map((warning, idx) => (
                      <div key={idx} className="text-xs text-yellow-700 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Retry Count */}
                {job.retryCount > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Retry attempt {job.retryCount}/{job.maxRetries}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {currentBatch.overallStatus === 'completed' ? (
          <div className="text-center">
            {failedJobs === 0 ? (
              <div className="text-green-600 font-semibold">
                ✓ All {totalJobs} marketplace(s) published successfully!
              </div>
            ) : (
              <div>
                <div className="text-yellow-600 font-semibold mb-2">
                  {completedJobs} of {totalJobs} marketplace(s) published successfully
                </div>
                {onRetry && failedJobs > 0 && (
                  <button
                    onClick={() => onRetry(currentBatch.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Failed Jobs
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <Loader className="w-5 h-5 animate-spin inline-block mr-2" />
            Publishing to marketplaces...
          </div>
        )}
      </div>
    </div>
  );
}
