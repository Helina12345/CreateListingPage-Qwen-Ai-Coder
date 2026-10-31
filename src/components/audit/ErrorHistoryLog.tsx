// ============================================================
// ListingDesk Pro — Error History Log Component
// UI for viewing error history from audit logs
// ============================================================

import React, { useEffect, useState } from 'react';
import { AlertCircle, Filter, Download, RefreshCw, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Select } from '../../components/ui';
import { getErrorHistory, getAuditEvents, AuditEventType, type AuditEvent } from '../../services/audit';
import { MARKETPLACES } from '../../config/marketplaces';
import type { MarketplaceId } from '../../types';

export function ErrorHistoryLog() {
  const [errors, setErrors] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'publishing' | 'validation' | 'system'>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');

  useEffect(() => {
    loadErrors();
    const interval = setInterval(loadErrors, 10000);
    return () => clearInterval(interval);
  }, [filter, marketplaceFilter]);

  const loadErrors = () => {
    let events: AuditEvent[];

    if (filter === 'publishing') {
      events = getAuditEvents({
        type: AuditEventType.PUBLISHING_FAILED,
        limit: 100,
      });
    } else if (filter === 'validation') {
      events = getAuditEvents({
        type: AuditEventType.VALIDATION_FAILED,
        limit: 100,
      });
    } else if (filter === 'system') {
      events = getAuditEvents({
        type: AuditEventType.ERROR_OCCURRED,
        limit: 100,
      });
    } else {
      events = getErrorHistory(100);
    }

    if (marketplaceFilter !== 'all') {
      events = events.filter((e) => e.marketplaceId === marketplaceFilter);
    }

    setErrors(events);
  };

  const handleExport = () => {
    const csv = [
      'Timestamp,Type,Severity,Marketplace,Message',
      ...errors.map((e) =>
        `"${e.timestamp}","${e.type}","${e.severity}","${e.marketplaceId || ''}","${e.message.replace(/"/g, '""')}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Error History</h2>
          <p className="text-sm text-gray-500">Recent errors and failures</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} icon={<Download className="h-3.5 w-3.5" />}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadErrors} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          options={[
            { value: 'all', label: 'All Errors' },
            { value: 'publishing', label: 'Publishing Errors' },
            { value: 'validation', label: 'Validation Errors' },
            { value: 'system', label: 'System Errors' },
          ]}
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-40"
        />
        <Select
          options={[
            { value: 'all', label: 'All Marketplaces' },
            ...Object.entries(MARKETPLACES).map(([id, mp]) => ({
              value: id,
              label: `${mp.icon} ${mp.name}`,
            })),
          ]}
          value={marketplaceFilter}
          onChange={(e) => setMarketplaceFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Error List */}
      {errors.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No errors found</h3>
            <p className="mt-1 text-xs text-gray-500">All systems are running smoothly.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {errors.map((error) => (
            <Card key={error.id} className="!p-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-500">{error.type}</span>
                    {error.marketplaceId && (
                      <Badge variant="info">
                        {MARKETPLACES[error.marketplaceId as MarketplaceId]?.icon}{' '}
                        {MARKETPLACES[error.marketplaceId as MarketplaceId]?.name}
                      </Badge>
                    )}
                    <Badge variant={error.severity === 'critical' ? 'danger' : 'warning'}>
                      {error.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{error.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                  {error.metadata && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                        View details
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
