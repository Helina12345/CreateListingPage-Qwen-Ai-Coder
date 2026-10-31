// ============================================================
// ListingDesk Pro — Utility Functions
// ============================================================

import { clsx } from 'clsx';
import type { MarketplaceId } from '../types';

// ============================================================
// Input Sanitization (XSS Protection)
// ============================================================
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// ============================================================
// Currency Formatting
// ============================================================
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================
// Number Formatting
// ============================================================
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

// ============================================================
// Date Formatting
// ============================================================
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

// ============================================================
// Marketplace Price Calculation
// ============================================================
export function calculateMarketplacePrice(
  basePrice: number,
  marketplaceId: MarketplaceId,
  feePercentage: number,
  profitMarginPercent: number
): number {
  const feeMultiplier = 1 + (feePercentage / 100);
  const profitMultiplier = 1 + (profitMarginPercent / 100);
  return Math.round(basePrice * feeMultiplier * profitMultiplier * 100) / 100;
}

// ============================================================
// Marketplace Field Validation
// ============================================================
export function validateTitleForMarketplace(title: string, marketplaceId: MarketplaceId, maxLength: number): { valid: boolean; message?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: 'Title is required' };
  }
  if (title.length > maxLength) {
    return { valid: false, message: `Title exceeds ${maxLength} characters for this marketplace` };
  }
  return { valid: true };
}

// ============================================================
// Debounce Utility
// ============================================================
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================
// Throttle Utility
// ============================================================
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// ============================================================
// Retry with Exponential Backoff
// ============================================================
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ============================================================
// Generate Unique ID
// ============================================================
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// ============================================================
// Deep Clone
// ============================================================
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// Object Diff
// ============================================================
export function objectDiff<T extends Record<string, any>>(original: T, modified: T): Partial<T> {
  const diff: Partial<T> = {};
  for (const key of Object.keys(modified)) {
    if (JSON.stringify(original[key]) !== JSON.stringify(modified[key])) {
      (diff as any)[key] = modified[key];
    }
  }
  return diff;
}

// ============================================================
// File Size Formatting
// ============================================================
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================
// Truncate Text
// ============================================================
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// ============================================================
// Copy to Clipboard
// ============================================================
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

// ============================================================
// Download File
// ============================================================
export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// Local Storage with Expiry
// ============================================================
export const storage = {
  set: (key: string, value: any, expiryMs?: number) => {
    const item = {
      value,
      expiry: expiryMs ? Date.now() + expiryMs : null,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: <T = any>(key: string): T | null => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    try {
      const item = JSON.parse(itemStr);
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  },

  remove: (key: string) => {
    localStorage.removeItem(key);
  },
};

// ============================================================
// Responsive Helpers
// ============================================================
export function getBreakpoint(): 'mobile' | 'tablet' | 'laptop' | 'desktop' {
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'laptop';
  return 'desktop';
}
