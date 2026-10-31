// ============================================================
// ListingDesk Pro — Publishing Orchestrator
// Manages independent publishing jobs per marketplace
// ============================================================

import type { MarketplaceId, Listing } from '../../types';
import { validateListingForMarketplace } from '../validation';
import { auditLog, AuditEventType } from '../audit';
import type { MarketplaceValidationResult } from '../validation';

export type JobStatus = 'pending' | 'validating' | 'publishing' | 'completed' | 'failed' | 'retrying';

export interface PublishingJob {
  id: string;
  listingId: string;
  marketplaceId: MarketplaceId;
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  externalId?: string;
  externalUrl?: string;
  errors: string[];
  warnings: string[];
  retryCount: number;
  maxRetries: number;
  validation?: MarketplaceValidationResult;
}

export interface PublishingBatch {
  id: string;
  listingId: string;
  listingTitle: string;
  jobs: PublishingJob[];
  createdAt: string;
  completedAt?: string;
  overallStatus: JobStatus;
  progress: number; // 0-100
}

// In-memory job storage (in production, use Redis/BullMQ)
const jobStore = new Map<string, PublishingBatch>();
const jobListeners = new Set<(batch: PublishingBatch) => void>();

// ============================================================
// Create Publishing Batch
// ============================================================
export async function createPublishingBatch(
  listing: Partial<Listing>,
  marketplaceIds: MarketplaceId[],
  fieldValues: Partial<Record<MarketplaceId, Record<string, any>>> = {},
  categories: Partial<Record<MarketplaceId, string>> = {}
): Promise<PublishingBatch> {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Create individual jobs for each marketplace
  const jobs: PublishingJob[] = marketplaceIds.map((mpId) => {
    const jobId = `job_${Date.now()}_${mpId}_${Math.random().toString(36).substring(2, 9)}`;

    // Run validation
    const validation = validateListingForMarketplace(listing, mpId, fieldValues[mpId] || {}, categories[mpId]);

    return {
      id: jobId,
      listingId: listing.id || '',
      marketplaceId: mpId,
      status: validation.canPublish ? 'pending' : 'failed',
      startedAt: new Date().toISOString(),
      errors: validation.errors.map((e) => e.message),
      warnings: validation.warnings.map((w) => w.message),
      retryCount: 0,
      maxRetries: 3,
      validation,
    };
  });

  const batch: PublishingBatch = {
    id: batchId,
    listingId: listing.id || '',
    listingTitle: listing.title || 'Untitled',
    jobs,
    createdAt: new Date().toISOString(),
    overallStatus: 'pending',
    progress: 0,
  };

  jobStore.set(batchId, batch);
  notifyListeners(batch);

  auditLog({
    type: AuditEventType.PUBLISHING_BATCH_CREATED,
    severity: 'info',
    message: `Created publishing batch for "${listing.title}" to ${marketplaceIds.length} marketplace(s)`,
    meta {
      batchId,
      listingId: listing.id,
      marketplaceIds,
      readyCount: jobs.filter((j) => j.status === 'pending').length,
      failedCount: jobs.filter((j) => j.status === 'failed').length,
    },
  });

  // Start processing jobs asynchronously
  processBatch(batchId, listing);

  return batch;
}

// ============================================================
// Process Publishing Batch
// ============================================================
async function processBatch(batchId: string, listing: Partial<Listing>): Promise<void> {
  const batch = jobStore.get(batchId);
  if (!batch) return;

  batch.overallStatus = 'publishing';
  notifyListeners(batch);

  // Process each job independently
  const promises = batch.jobs.map(async (job) => {
    if (job.status === 'failed') return; // Skip already-failed jobs

    try {
      job.status = 'publishing';
      notifyListeners(batch);

      // Simulate API call to marketplace
      // In production, this would call the actual marketplace adapter
      const result = await publishToMarketplace(job.marketplaceId, listing);

      if (result.success) {
        job.status = 'completed';
        job.externalId = result.externalId;
        job.externalUrl = result.externalUrl;
        job.completedAt = new Date().toISOString();

        auditLog({
          type: AuditEventType.LISTING_PUBLISHED,
          severity: 'info',
          message: `Published "${listing.title}" to ${job.marketplaceId}`,
          meta {
            jobId: job.id,
            marketplaceId: job.marketplaceId,
            externalId: result.externalId,
          },
        });
      } else {
        job.status = 'failed';
        job.errors.push(...(result.errors || ['Unknown error']));

        auditLog({
          type: AuditEventType.PUBLISHING_FAILED,
          severity: 'error',
          message: `Failed to publish "${listing.title}" to ${job.marketplaceId}`,
          meta {
            jobId: job.id,
            marketplaceId: job.marketplaceId,
            errors: result.errors,
          },
        });
      }
    } catch (error: any) {
      job.status = 'failed';
      job.errors.push(error.message);

      auditLog({
        type: AuditEventType.PUBLISHING_FAILED,
        severity: 'error',
        message: `Error publishing to ${job.marketplaceId}: ${error.message}`,
        meta { jobId: job.id, marketplaceId: job.marketplaceId },
      });
    }

    // Update progress
    const completed = batch.jobs.filter((j) => j.status === 'completed' || j.status === 'failed').length;
    batch.progress = Math.round((completed / batch.jobs.length) * 100);
    notifyListeners(batch);
  });

  await Promise.allSettled(promises);

  // Determine overall status
  const allCompleted = batch.jobs.every((j) => j.status === 'completed' || j.status === 'failed');
  if (allCompleted) {
    batch.overallStatus = 'completed';
    batch.completedAt = new Date().toISOString();
  }

  notifyListeners(batch);

  auditLog({
    type: AuditEventType.PUBLISHING_BATCH_COMPLETED,
    severity: batch.jobs.every((j) => j.status === 'completed') ? 'info' : 'warning',
    message: `Publishing batch completed: ${batch.jobs.filter((j) => j.status === 'completed').length}/${batch.jobs.length} succeeded`,
    meta { batchId, listingId: listing.id },
  });
}

// ============================================================
// Publish to Individual Marketplace
// ============================================================
async function publishToMarketplace(
  marketplaceId: MarketplaceId,
  listing: Partial<Listing>
): Promise<{ success: boolean; externalId?: string; externalUrl?: string; errors?: string[] }> {
  // Import adapter dynamically to avoid circular dependencies
  const { getAdapter } = await import('../marketplace-adapters');

  try {
    const adapter = getAdapter(marketplaceId);

    // Create product on marketplace
    const createResult = await adapter.createProduct(listing);

    if (!createResult.success || !createResult.externalId) {
      return {
        success: false,
        errors: createResult.errors || ['Failed to create product'],
      };
    }

    // Publish the product
    const publishResult = await adapter.publishProduct(createResult.externalId);

    if (publishResult.success) {
      return {
        success: true,
        externalId: createResult.externalId,
        externalUrl: publishResult.externalUrl,
      };
    } else {
      return {
        success: false,
        errors: publishResult.errors || ['Failed to publish product'],
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

// ============================================================
// Retry Failed Jobs
// ============================================================
export async function retryFailedJobs(batchId: string): Promise<void> {
  const batch = jobStore.get(batchId);
  if (!batch) return;

  const failedJobs = batch.jobs.filter((j) => j.status === 'failed' && j.retryCount < j.maxRetries);

  for (const job of failedJobs) {
    job.status = 'retrying';
    job.retryCount++;
    job.errors = [];
    notifyListeners(batch);

    auditLog({
      type: AuditEventType.PUBLISHING_RETRY,
      severity: 'info',
      message: `Retrying job for ${job.marketplaceId} (attempt ${job.retryCount}/${job.maxRetries})`,
      meta { jobId: job.id, marketplaceId: job.marketplaceId, retryCount: job.retryCount },
    });

    // Re-process this job
    // In production, this would re-call the marketplace adapter
  }
}

// ============================================================
// Get Batch Status
// ============================================================
export function getBatch(batchId: string): PublishingBatch | undefined {
  return jobStore.get(batchId);
}

export function getAllBatches(): PublishingBatch[] {
  return Array.from(jobStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ============================================================
// Subscribe to Batch Updates
// ============================================================
export function subscribeToBatch(listener: (batch: PublishingBatch) => void): () => void {
  jobListeners.add(listener);
  return () => {
    jobListeners.delete(listener);
  };
}

function notifyListeners(batch: PublishingBatch): void {
  jobListeners.forEach((listener) => listener(batch));
}
