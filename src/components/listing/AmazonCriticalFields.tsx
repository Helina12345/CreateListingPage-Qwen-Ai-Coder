// ============================================================
// ListingDesk Pro — Amazon Critical Missing Fields Component
// Browse Nodes, Variation Themes, FBA Prep, Compliance, A+ Content
// ============================================================

import React, { useState } from 'react';
import { Input, Select, Button, Badge } from '../ui';
import { FolderTree, Upload, AlertCircle } from 'lucide-react';

interface AmazonCriticalFieldsProps {
  value: {
    browseNode?: string;
    variationTheme?: string;
    fbaPrep?: {
      fnskuLabel: boolean;
      polybagging: boolean;
      suffocationWarning: boolean;
      prepInstructions?: string[];
    };
    compliance?: {
      cpc?: boolean;
      cpcDocument?: string;
      epr?: boolean;
      eprNumber?: string;
      gatedCategory?: boolean;
      gatedCategoryApproval?: string;
    };
    aplusContent?: {
      enabled: boolean;
      modules?: Array<{
        type: 'text' | 'image' | 'comparison' | 'video';
        content?: string;
        imageUrl?: string;
      }>;
    };
    mapPolicy?: {
      acknowledged: boolean;
      mapPrice?: number;
    };
  };
  onChange: (value: AmazonCriticalFieldsProps['value']) => void;
}

export function AmazonCriticalFields({ value, onChange }: AmazonCriticalFieldsProps) {
  const [showBrowseNodeTree, setShowBrowseNodeTree] = useState(false);

  // Sample browse node tree (in production, fetch from Amazon API)
  const browseNodes = [
    {
      id: '1',
      name: 'Electronics',
      children: [
        { id: '1-1', name: 'Cell Phones & Accessories', children: [] },
        { id: '1-2', name: 'Computers & Accessories', children: [] },
        { id: '1-3', name: 'TV & Video', children: [] },
      ],
    },
    {
      id: '2',
      name: 'Clothing, Shoes & Jewelry',
      children: [
        { id: '2-1', name: 'Men', children: [] },
        { id: '2-2', name: 'Women', children: [] },
        { id: '2-3', name: 'Kids & Baby', children: [] },
      ],
    },
  ];

  const handleBrowseNodeSelect = (nodeId: string) => {
    onChange({ ...value, browseNode: nodeId });
    setShowBrowseNodeTree(false);
  };

  const handleFbaPrepChange = (field: string, val: boolean | string[]) => {
    onChange({
      ...value,
      fbaPrep: {
        ...value.fbaPrep!,
        [field]: val,
      },
    });
  };

  const handleComplianceChange = (field: string, val: boolean | string) => {
    onChange({
      ...value,
      compliance: {
        ...value.compliance!,
        [field]: val,
      },
    });
  };

  const handleAplusModuleAdd = (type: 'text' | 'image' | 'comparison' | 'video') => {
    const modules = value.aplusContent?.modules || [];
    onChange({
      ...value,
      aplusContent: {
        ...value.aplusContent!,
        modules: [...modules, { type, content: '', imageUrl: '' }],
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Amazon Critical Fields
      </h3>

      {/* Browse Node Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Browse Node (Category) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <Input
            value={value.browseNode || ''}
            onChange={(e) => onChange({ ...value, browseNode: e.target.value })}
            placeholder="Select browse node..."
            readOnly
          />
          <Button
            variant="outline"
            onClick={() => setShowBrowseNodeTree(!showBrowseNodeTree)}
            icon={<FolderTree className="h-4 w-4" />}
          >
            Browse
          </Button>
        </div>
        {showBrowseNodeTree && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
            {browseNodes.map((node) => (
              <div key={node.id} className="mb-2">
                <button
                  onClick={() => handleBrowseNodeSelect(node.id)}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600"
                >
                  {node.name}
                </button>
                {node.children.length > 0 && (
                  <div className="ml-4 mt-1">
                    {node.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleBrowseNodeSelect(child.id)}
                        className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600"
                      >
                        └ {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">
          Required: Select the most specific category for your product
        </p>
      </div>

      {/* Variation Theme */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Variation Theme
        </label>
        <Select
          value={value.variationTheme || ''}
          onChange={(e) => onChange({ ...value, variationTheme: e.target.value })}
          options={[
            { value: '', label: 'Select variation theme...' },
            { value: 'size', label: 'Size' },
            { value: 'color', label: 'Color' },
            { value: 'size_color', label: 'Size & Color' },
            { value: 'style', label: 'Style' },
            { value: 'pattern', label: 'Pattern' },
          ]}
        />
        <p className="text-xs text-gray-500">
          How are your variants organized? (e.g., by Size, Color, Style)
        </p>
      </div>

      {/* FBA Prep Requirements */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          FBA Prep Requirements
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.fbaPrep?.fnskuLabel || false}
              onChange={(e) => handleFbaPrepChange('fnskuLabel', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              FNSKU Label Required
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.fbaPrep?.polybagging || false}
              onChange={(e) => handleFbaPrepChange('polybagging', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Polybagging Required
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.fbaPrep?.suffocationWarning || false}
              onChange={(e) => handleFbaPrepChange('suffocationWarning', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Suffocation Warning Required
            </span>
          </label>
        </div>
      </div>

      {/* Product Compliance */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Product Compliance
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.compliance?.cpc || false}
              onChange={(e) => handleComplianceChange('cpc', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Children's Product Certificate (CPC) Required
            </span>
          </label>
          {value.compliance?.cpc && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload CPC Document
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) handleComplianceChange('cpcDocument', file.name);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.compliance?.epr || false}
              onChange={(e) => handleComplianceChange('epr', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              EPR Compliance (European Producer Responsibility)
            </span>
          </label>
          {value.compliance?.epr && (
            <div className="ml-6">
              <Input
                label="EPR Registration Number"
                value={value.compliance?.eprNumber || ''}
                onChange={(e) => handleComplianceChange('eprNumber', e.target.value)}
                placeholder="Enter EPR number..."
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.compliance?.gatedCategory || false}
              onChange={(e) => handleComplianceChange('gatedCategory', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Gated Category (Requires Pre-Approval)
            </span>
          </label>
          {value.compliance?.gatedCategory && (
            <div className="ml-6">
              <Input
                label="Approval Documentation"
                value={value.compliance?.gatedCategoryApproval || ''}
                onChange={(e) => handleComplianceChange('gatedCategoryApproval', e.target.value)}
                placeholder="Upload approval document URL or reference..."
              />
            </div>
          )}
        </div>
      </div>

      {/* A+ Content / Enhanced Brand Content */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            A+ Content (Enhanced Brand Content)
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.aplusContent?.enabled || false}
              onChange={(e) =>
                onChange({
                  ...value,
                  aplusContent: { ...value.aplusContent!, enabled: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable A+ Content</span>
          </label>
        </div>
        {value.aplusContent?.enabled && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAplusModuleAdd('text')}
              >
                + Text Module
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAplusModuleAdd('image')}
              >
                + Image Module
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAplusModuleAdd('comparison')}
              >
                + Comparison Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAplusModuleAdd('video')}
              >
                + Video Module
              </Button>
            </div>
            {value.aplusContent.modules?.map((module, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="info">{module.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const modules = value.aplusContent!.modules!.filter((_, i) => i !== idx);
                      onChange({
                        ...value,
                        aplusContent: { ...value.aplusContent!, modules },
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
                {module.type === 'text' && (
                  <textarea
                    value={module.content || ''}
                    onChange={(e) => {
                      const modules = [...value.aplusContent!.modules!];
                      modules[idx] = { ...modules[idx], content: e.target.value };
                      onChange({
                        ...value,
                        aplusContent: { ...value.aplusContent!, modules },
                      });
                    }}
                    placeholder="Enter rich text content..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={4}
                  />
                )}
                {module.type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const modules = [...value.aplusContent!.modules!];
                          modules[idx] = { ...modules[idx], imageUrl: URL.createObjectURL(file) };
                          onChange({
                            ...value,
                            aplusContent: { ...value.aplusContent!, modules },
                          });
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAP Policy */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          MAP Policy (Minimum Advertised Price)
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.mapPolicy?.acknowledged || false}
            onChange={(e) =>
              onChange({
                ...value,
                mapPolicy: { ...value.mapPolicy!, acknowledged: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I acknowledge and comply with MAP policies
          </span>
        </label>
        {value.mapPolicy?.acknowledged && (
          <div className="ml-6">
            <Input
              label="MAP Price (if applicable)"
              type="number"
              value={value.mapPolicy?.mapPrice?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  mapPolicy: {
                    ...value.mapPolicy!,
                    mapPrice: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              placeholder="0.00"
            />
          </div>
        )}
      </div>
    </div>
  );
}
