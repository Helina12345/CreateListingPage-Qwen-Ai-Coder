// ============================================================
// ListingDesk Pro — Real-time Status Polling Service
// Polls marketplace APIs to check if listings are actually live
// ============================================================

import type { MarketplaceId, Listing } from '../../types';
import { getAdapter } from '../marketplace-adapters';
import { auditLog, AuditEventType } from '../audit';

export interface PollingJob {
  id: string;
  listingId: string;
  marketplaceId: MarketplaceId;
  externalId: string;
  interval: number; // milliseconds
  lastPolledAt?: string;
  nextPollAt: string;
  status: 'active' | 'paused' | 'stopped';
  consecutiveFailures: number;
  maxFailures: number;
}

export interface PollingResult {
  listingId: string;
  marketplaceId: MarketplaceId;
  externalId: string;
  polledAt: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'deleted' | 'error';
  details?: {
    title?: string;
    price?: number;
    inventory?: number;
    url?: string;
  };
  error?: string;
}

// In-memory storage (in production, use database or Redis)
const pollingJobs: PollingJob[] = [];
const pollingResults: PollingResult[] = [];

// ============================================================
// Polling Job Management
// ============================================================

export function createPollingJob(
  listingId: string,
  marketplaceId: MarketplaceId,
  externalId: string,
  interval: number = 60000 // Default: 1 minute
): PollingJob {
  const job: PollingJob = {
    id: `poll_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    marketplaceId,
    externalId,
    interval,
    nextPollAt: new Date(Date.now() + interval).toISOString(),
    status: 'active',
    consecutiveFailures: 0,
    maxFailures: 5,
  };

  pollingJobs.push(job);

  auditLog({
    type: AuditEventType.MARKETPLACE_SYNC_STARTED,
    severity: 'info',
    message: `Created polling job for listing on ${marketplaceId}`,
    meta {
      listingId,
      marketplaceId,
      externalId,
      interval,
    },
  });

  return job;
}

export function getPollingJob(jobId: string): PollingJob | undefined {
  return pollingJobs.find((j) => j.id === jobId);
}

export function getPollingJobsForListing(listingId: string): PollingJob[] {
  return pollingJobs.filter((j) => j.listingId === listingId);
}

export function getAllActivePollingJobs(): PollingJob[] {
  return pollingJobs.filter((j) => j.status === 'active');
}

export function pausePollingJob(jobId: string): boolean {
  const job = pollingJobs.find((j) => j.id === jobId);
  if (job) {
    job.status = 'paused';
    return true;
  }
  return false;
}

export function resumePollingJob(jobId: string): boolean {
  const job = pollingJobs.find((j) => j.id === jobId);
  if (job && job.status === 'paused') {
    job.status = 'active';
    job.nextPollAt = new Date(Date.now() + job.interval).toISOString();
    return true;
  }
  return false;
}

export function stopPollingJob(jobId: string): boolean {
  const job = pollingJobs.find((j) => j.id === jobId);
  if (job) {
    job.status = 'stopped';
    return true;
  }
  return false;
}

export function deletePollingJob(jobId: string): boolean {
  const index = pollingJobs.findIndex((j) => j.id === jobId);
  if (index !== -1) {
    pollingJobs.splice(index, 1);
    return true;
  }
  return false;
}

// ============================================================
// Polling Execution
// ============================================================

export async function pollListingStatus(
  marketplaceId: MarketplaceId,
  externalId: string
): Promise<PollingResult> {
  const polledAt = new Date().toISOString();

  try {
    const adapter = getAdapter(marketplaceId);
    const status = await adapter.getProductStatus(externalId);

    const result: PollingResult = {
      listingId: '', // Will be set by caller
      marketplaceId,
      externalId,
      polledAt,
      status: status.status,
      details: {
        title: status.reason, // Could fetch full product if needed
      },
    };

    pollingResults.unshift(result);
    if (pollingResults.length > 1000) {
      pollingResults.length = 1000;
    }

    return result;
  } catch (error: any) {
    const result: PollingResult = {
      listingId: '',
      marketplaceId,
      externalId,
      polledAt,
      status: 'error',
      error: error.message,
    };

    pollingResults.unshift(result);
    if (pollingResults.length > 1000) {
      pollingResults.length = 1000;
    }

    return result;
  }
}

export async function executePollingJob(jobId: string): Promise<PollingResult | null> {
  const job = pollingJobs.find((j) => j.id === jobId);

  if (!job || job.status !== 'active') {
    return null;
  }

  const result = await pollListingStatus(job.marketplaceId, job.externalId);
  result.listingId = job.listingId;

  job.lastPolledAt = new Date().toISOString();
  job.nextPollAt = new Date(Date.now() + job.interval).toISOString();

  if (result.status === 'error') {
    job.consecutiveFailures++;

    if (job.consecutiveFailures >= job.maxFailures) {
      job.status = 'paused';

      auditLog({
        type: AuditEventType.MARKETPLACE_SYNC_FAILED,
        severity: 'error',
        message: `Polling job paused after ${job.consecutiveFailures} consecutive failures`,
        meta {
          jobId: job.id,
          listingId: job.listingId,
          marketplaceId: job.marketplaceId,
        },
      });
    }
  } else {
    job.consecutiveFailures = 0;
  }

  return result;
}

// ============================================================
// Polling Scheduler
// ============================================================

export function getJobsReadyForPolling(): PollingJob[] {
  const now = new Date().toISOString();
  return pollingJobs.filter(
    (j) => j.status === 'active' && j.nextPollAt <= now
  );
}

export async function executeReadyJobs(): Promise<PollingResult[]> {
  const readyJobs = getJobsReadyForPolling();
  const results: PollingResult[] = [];

  for (const job of readyJobs) {
    const result = await executePollingJob(job.id);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

// ============================================================
// Polling Results
// ============================================================

export function getPollingResults(
  listingId?: string,
  marketplaceId?: MarketplaceId,
  limit: number = 50
): PollingResult[] {
  let results = [...pollingResults];

  if (listingId) {
    results = results.filter((r) => r.listingId === listingId);
  }

  if (marketplaceId) {
    results = results.filter((r) => r.marketplaceId === marketplaceId);
  }

  return results.slice(0, limit);
}

export function getLatestPollingResult(
  listingId: string,
  marketplaceId: MarketplaceId
): PollingResult | undefined {
  return pollingResults.find(
    (r) => r.listingId === listingId && r.marketplaceId === marketplaceId
  );
}

export function getPollingSummary(listingId: string): {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  lastPolledAt?: string;
  latestStatus?: string;
} {
  const jobs = pollingJobs.filter((j) => j.listingId === listingId);
  const results = pollingResults.filter((r) => r.listingId === listingId);

  return {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.status === 'active').length,
    pausedJobs: jobs.filter((j) => j.status === 'paused').length,
    lastPolledAt: results[0]?.polledAt,
    latestStatus: results[0]?.status,
  };
}

// ============================================================
// Bulk Operations
// ============================================================

export function createPollingJobsForListing(
  listing: Listing,
  interval: number = 60000
): PollingJob[] {
  const jobs: PollingJob[] = [];

  listing.marketplaceData.forEach((mpData) => {
    if (mpData.externalId) {
      const job = createPollingJob(
        listing.id,
        mpData.marketplaceId,
        mpData.externalId,
        interval
      );
      jobs.push(job);
    }
  });

  return jobs;
}

export function stopAllPollingJobsForListing(listingId: string): number {
  const jobs = pollingJobs.filter((j) => j.listingId === listingId);
  jobs.forEach((j) => (j.status = 'stopped'));
  return jobs.length;
}

export function deleteAllPollingJobsForListing(listingId: string): number {
  const indices: number[] = [];
  pollingJobs.forEach((j, i) => {
    if (j.listingId === listingId) indices.push(i);
  });

  indices.reverse().forEach((i) => pollingJobs.splice(i, 1));
  return indices.length;
}

// ============================================================
// Status Change Detection
// ============================================================

export function detectStatusChanges(
  listingId: string,
  marketplaceId: MarketplaceId
): Array<{
  timestamp: string;
  oldStatus: string;
  newStatus: string;
}> {
  const results = pollingResults
    .filter((r) => r.listingId === listingId && r.marketplaceId === marketplaceId)
    .sort((a, b) => new Date(a.polledAt).getTime() - new Date(b.polledAt).getTime());

  const changes: Array<{
    timestamp: string;
    oldStatus: string;
    newStatus: string;
  }> = [];

  for (let i = 1; i < results.length; i++) {
    if (results[i].status !== results[i - 1].status) {
      changes.push({
        timestamp: results[i].polledAt,
        oldStatus: results[i - 1].status,
        newStatus: results[i].status,
      });
    }
  }

  return changes;
}
