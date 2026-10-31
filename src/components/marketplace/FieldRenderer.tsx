// ============================================================
// ListingDesk Pro — Marketplace Field Renderer
// Dynamically renders form fields based on marketplace schemas
// ============================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Info, AlertCircle, TrendingUp, X } from 'lucide-react';
import { Input, Button, Badge } from '../ui';
import type { FieldSchema, FieldOption } from '../../config/marketplace-schemas';

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  errors?: Record<string, string>;
}

export function FieldRenderer({ field, value, onChange, errors }: FieldRendererProps) {
  const error = errors?.[field.key];

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'url':
      case 'gtin':
        return (
          <Input
            label={field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            error={error}
            hint={field.helpText}
            maxLength={field.maxLength}
            type={field.type === 'url' ? 'url' : 'text'}
          />
        );

      case 'textarea':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              maxLength={field.maxLength}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500',
                'bg-white dark:bg-gray-800 dark:text-gray-100',
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              )}
            />
            {field.maxLength && (
              <p className="text-xs text-gray-500 text-right">
                {(value || '').length}/{field.maxLength}
              </p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {field.helpText && !error && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'number':
        return (
          <Input
            label={field.label}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            error={error}
            hint={field.helpText}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'select':
        return (
          <SearchableSelect
            field={field}
            value={value}
            onChange={onChange}
            error={error}
          />
        );

      case 'multiselect':
        return (
          <MultiSelectField field={field} value={value || []} onChange={onChange} error={error} />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
            {field.helpText && (
              <span className="text-xs text-gray-500 ml-2">{field.helpText}</span>
            )}
          </label>
        );

      case 'currency':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={clsx(
                  'w-full rounded-lg border bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                  error ? 'border-red-500' : 'border-gray-300'
                )}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {field.helpText && !error && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'weight':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={clsx(
                  'flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                  error ? 'border-red-500' : 'border-gray-300'
                )}
              />
              <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="lb">lb</option>
                <option value="oz">oz</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'measurement':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.1"
                value={value?.length || ''}
                onChange={(e) => onChange({ ...value, length: parseFloat(e.target.value) || 0 })}
                placeholder="L"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="number"
                step="0.1"
                value={value?.width || ''}
                onChange={(e) => onChange({ ...value, width: parseFloat(e.target.value) || 0 })}
                placeholder="W"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="number"
                step="0.1"
                value={value?.height || ''}
                onChange={(e) => onChange({ ...value, height: parseFloat(e.target.value) || 0 })}
                placeholder="H"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <p className="text-xs text-gray-500">Length × Width × Height (inches)</p>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
              <p className="text-sm text-gray-500">Drag & drop images here or click to upload</p>
              {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}
            </div>
          </div>
        );

      case 'rich-text':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="rounded-lg border border-gray-300 dark:border-gray-600">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-1.5 flex gap-1 dark:border-gray-700 dark:bg-gray-800">
                <button type="button" className="rounded px-2 py-0.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 font-bold">B</button>
                <button type="button" className="rounded px-2 py-0.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 italic">I</button>
                <button type="button" className="rounded px-2 py-0.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 underline">U</button>
              </div>
              <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={6}
                className="w-full rounded-b-lg bg-white px-3 py-2 text-sm focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'date':
        return (
          <Input
            label={field.label}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            hint={field.helpText}
          />
        );

      default:
        return (
          <Input
            label={field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            error={error}
            hint={field.helpText}
          />
        );
    }
  };

  return <div className="space-y-1">{renderField()}</div>;
}

// ============================================================
// Multi-Select Field
// ============================================================
function MultiSelectField({ field, value, onChange, error }: {
  field: FieldSchema;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = (optionValue: string) => {
    if (!value.includes(optionValue)) {
      onChange([...value, optionValue]);
    }
    setInputValue('');
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAdd(inputValue.trim());
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((v) => {
          const option = field.options?.find((o) => o.value === v);
          return (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              {option?.label || v}
              <button type="button" onClick={() => handleRemove(v)} className="hover:text-indigo-900">
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || 'Type to add...'}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        {isOpen && field.options && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {field.options
              .filter((opt) =>
                opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
                !value.includes(opt.value)
              )
              .map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAdd(opt.value)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span>{opt.label}</span>
                  {opt.trending && <TrendingUp className="h-3 w-3 text-orange-500" />}
                </button>
              ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {field.helpText && !error && <p className="text-xs text-gray-500">{field.helpText}</p>}
    </div>
  );
}

// ============================================================
// Searchable Select with Clear Button
// ============================================================
function SearchableSelect({ field, value, onChange, error }: {
  field: FieldSchema;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = field.options?.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  const selectedOption = field.options?.find((opt) => opt.value === value);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedOption?.label || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={`Search ${field.label.toLowerCase()}...`}
          className={clsx(
            'w-full rounded-lg border bg-white px-3 py-2 pr-16 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            error ? 'border-red-500' : 'border-gray-300'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={clsx(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                    value === opt.value && 'bg-indigo-50 dark:bg-indigo-900/20'
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.trending && <TrendingUp className="h-3 w-3 text-orange-500" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {field.helpText && !error && <p className="text-xs text-gray-500">{field.helpText}</p>}
    </div>
  );
}

// ============================================================
// Collapsible Field Group
// ============================================================
interface FieldGroupProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  count?: number;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldGroup({ title, description, defaultOpen = true, count, required, children }: FieldGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {required && <Badge variant="danger">Required</Badge>}
            {count !== undefined && (
              <span className="text-xs text-gray-500">({count} fields)</span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-4 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}
