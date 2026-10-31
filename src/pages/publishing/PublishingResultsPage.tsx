// ============================================================
// ListingDesk Pro — Publishing Results Dashboard
// Shows history of all publishing attempts
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, ExternalLink, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, Button, Badge, Select } from '../../components/ui';
import { getAllBatches, type PublishingBatch } from '../../services/publishing/orchestrator';
import { MARKETPLACES } from '../../config/marketplaces';
import type { MarketplaceId } from '../../types';

export default function PublishingResultsPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<PublishingBatch[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'partial' | 'failed'>('all');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
    // Refresh every 5 seconds
    const interval = setInterval(loadBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBatches = () => {
    setBatches(getAllBatches());
  };

  const filteredBatches = batches.filter((batch) => {
    if (filter === 'all') return true;
    const completedJobs = batch.jobs.filter((j) => j.status === 'completed').length;
    const failedJobs = batch.jobs.filter((j) => j.status === 'failed').length;
    const totalJobs = batch.jobs.length;

    if (filter === 'success') return completedJobs === totalJobs;
    if (filter === 'failed') return completedJobs === 0;
    if (filter === 'partial') return completedJobs > 0 && completedJobs < totalJobs;
    return true;
  });

  const getStatusBadge = (batch: PublishingBatch) => {
    const completedJobs = batch.jobs.filter((j) => j.status === 'completed').length;
    const totalJobs = batch.jobs.length;

    if (completedJobs === totalJobs) {
      return <Badge variant="success">All Success</Badge>;
    } else if (completedJobs === 0) {
      return <Badge variant="danger">All Failed</Badge>;
    } else {
      return <Badge variant="warning">Partial ({completedJobs}/{totalJobs})</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Publishing Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View the history of all publishing attempts across marketplaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: 'all', label: 'All Results' },
              { value: 'success', label: 'All Success' },
              { value: 'partial', label: 'Partial Success' },
              { value: 'failed', label: 'All Failed' },
            ]}
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-40"
          />
          <Button variant="outline" size="sm" onClick={loadBatches} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-500">Total Attempts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{batches.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">All Success</p>
          <p className="text-2xl font-bold text-green-600">
            {batches.filter((b) => b.jobs.every((j) => j.status === 'completed')).length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Partial Success</p>
          <p className="text-2xl font-bold text-yellow-600">
            {batches.filter((b) => {
              const completed = b.jobs.filter((j) => j.status === 'completed').length;
              return completed > 0 && completed < b.jobs.length;
            }).length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">All Failed</p>
          <p className="text-2xl font-bold text-red-600">
            {batches.filter((b) => b.jobs.every((j) => j.status === 'failed')).length}
          </p>
        </Card>
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No publishing results yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Publishing results will appear here once you publish listings to marketplaces.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/create-listing')}>
              Create Listing
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch) => {
            const isExpanded = expandedBatch === batch.id;
            const completedJobs = batch.jobs.filter((j) => j.status === 'completed').length;
            const totalJobs = batch.jobs.length;

            return (
              <Card key={batch.id} padding={false}>
                {/* Batch Header */}
                <button
                  onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-left">
                        {batch.listingTitle}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(batch.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(batch)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {completedJobs}/{totalJobs}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {batch.jobs.map((job) => (
                        <div key={job.id} className="p-4">
                          <div className="flex items-start gap-3">
                            {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                            {job.status === 'failed' && <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                            {(job.status === 'publishing' || job.status === 'pending') && (
                              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                            )}
                            {job.status === 'retrying' && (
                              <RefreshCw className="w-5 h-5 text-yellow-500 mt-0.5 animate-spin" />
                            )}

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {MARKETPLACES[job.marketplaceId as MarketplaceId]?.icon}{' '}
                                  {MARKETPLACES[job.marketplaceId as MarketplaceId]?.name || job.marketplaceId}
                                </span>
                                <Badge
                                  variant={
                                    job.status === 'completed' ? 'success' :
                                    job.status === 'failed' ? 'danger' :
                                    job.status === 'retrying' ? 'warning' : 'default'
                                  }
                                >
                                  {job.status}
                                </Badge>
                              </div>

                              {job.externalId && (
                                <p className="text-xs text-gray-500">
                                  External ID: <span className="font-mono">{job.externalId}</span>
                                </p>
                              )}

                              {job.externalUrl && (
                                <a
                                  href={job.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View on marketplace
                                </a>
                              )}

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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
