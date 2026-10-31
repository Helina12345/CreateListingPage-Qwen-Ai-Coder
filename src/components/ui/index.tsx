// ============================================================
// ListingDesk Pro — Shared UI Components
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  X, Check, AlertCircle, Info, AlertTriangle, Loader2,
  ChevronDown, Search, Bell, Menu, Sun, Moon, Monitor,
} from 'lucide-react';
import { useUIStore, useNotificationStore } from '../../store';

// ============================================================
// Button
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ============================================================
// Input
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'bg-white dark:bg-gray-800 dark:text-gray-100',
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ============================================================
// Select
// ============================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={clsx(
            'w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

// ============================================================
// Badge
// ============================================================
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

// ============================================================
// Card
// ============================================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={clsx(
      'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800',
      padding && 'p-6',
      className
    )}>
      {children}
    </div>
  );
}


// ============================================================
// Skeleton
// ============================================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700', className)} />
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </Card>
  );
}

// ============================================================
// Toast System
// ============================================================
export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => removeToast(toast.id), 5000);
      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  const icons: Record<string, React.ReactNode> = {
    success: <Check className="h-4 w-4 text-green-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast: { id: string; type: string; message: string }) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right',
            'bg-white dark:bg-gray-800 dark:border-gray-700'
          )}
        >
          {icons[toast.type]}
          <p className="text-sm text-gray-700 dark:text-gray-200">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Modal
// ============================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800', sizes[size])}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Confirm Dialog
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================================
// Notification Bell
// ============================================================
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n: { id: string; title: string; message: string; read: boolean }) => (
                <div key={n.id} className={clsx('border-b border-gray-100 p-3 dark:border-gray-700', !n.read && 'bg-indigo-50/50 dark:bg-indigo-900/10')}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Theme Toggle
// ============================================================
export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const themes = [
    { id: 'light' as const, icon: Sun, label: 'Light' },
    { id: 'dark' as const, icon: Moon, label: 'Dark' },
    { id: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setMenuOpen(false); }}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                theme === t.id && 'text-indigo-600 dark:text-indigo-400'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Search Input
// ============================================================
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// Progress Bar
// ============================================================
interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({ value, max, label, variant = 'default' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  const variants = {
    default: 'bg-indigo-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          <span className="text-gray-500">{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Error Boundary
// ============================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-500">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// useDebounce Hook
// ============================================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================
// useLocalStorage Hook
// ============================================================
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key]);

  return [storedValue, setValue];
}
