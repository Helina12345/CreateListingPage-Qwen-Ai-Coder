// ============================================================
// ListingDesk Pro — Product Certifications Component
// Handles certification document uploads and management
// ============================================================

import React, { useState } from 'react';
import { FileText, Upload, X, CheckCircle } from 'lucide-react';
import { Button, Badge } from '../ui';
import type { MarketplaceId } from '../../types';

interface ProductCertificationsProps {
  selectedMarketplaces: MarketplaceId[];
  value: {
    certifications: Array<{
      id: string;
      type: string;
      name: string;
      fileUrl?: string;
      fileName?: string;
      uploadedAt?: string;
    }>;
  };
  onChange: (value: ProductCertificationsProps['value']) => void;
}

export function ProductCertifications({ selectedMarketplaces, value, onChange }: ProductCertificationsProps) {
  const [uploading, setUploading] = useState(false);

  if (selectedMarketplaces.length === 0) {
    return null;
  }

  const certificationTypes = [
    { value: 'organic', label: 'Organic Certification' },
    { value: 'fair_trade', label: 'Fair Trade Certification' },
    { value: 'fsc', label: 'FSC (Forest Stewardship Council)' },
    { value: 'energy_star', label: 'Energy Star' },
    { value: 'ul', label: 'UL (Underwriters Laboratories)' },
    { value: 'ce', label: 'CE Marking' },
    { value: 'rohs', label: 'RoHS Compliance' },
    { value: 'iso', label: 'ISO Certification' },
    { value: 'gmp', label: 'GMP (Good Manufacturing Practice)' },
    { value: 'haccp', label: 'HACCP (Food Safety)' },
    { value: 'other', label: 'Other Certification' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, certType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // In production, this would upload to your backend/S3
      // For now, we'll create a local URL
      const fileUrl = URL.createObjectURL(file);

      const newCert = {
        id: `cert_${Date.now()}`,
        type: certType,
        name: certificationTypes.find(c => c.value === certType)?.label || certType,
        fileUrl,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };

      onChange({
        certifications: [...(value.certifications || []), newCert],
      });

      setUploading(false);
    } catch (error) {
      console.error('Certification upload error:', error);
      alert('Failed to upload certification');
      setUploading(false);
    }
  };

  const handleRemoveCert = (certId: string) => {
    const cert = value.certifications?.find(c => c.id === certId);
    if (cert?.fileUrl && cert.fileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cert.fileUrl);
    }

    onChange({
      certifications: value.certifications?.filter(c => c.id !== certId) || [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Certifications
        </h3>
      </div>

      <p className="text-xs text-gray-500">
        Upload certification documents to verify product quality and compliance.
        This can help increase buyer trust and may be required for certain categories.
      </p>

      {/* Existing Certifications */}
      {value.certifications && value.certifications.length > 0 && (
        <div className="space-y-2">
          {value.certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {cert.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cert.fileName} • Uploaded {new Date(cert.uploadedAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCert(cert.id)}
                icon={<X className="h-4 w-4" />}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add New Certification */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Add Certification
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {certificationTypes.map((certType) => (
            <div key={certType.value} className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, certType.value)}
                className="hidden"
                id={`cert-upload-${certType.value}`}
              />
              <label
                htmlFor={`cert-upload-${certType.value}`}
                className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <Upload className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {certType.label}
                </span>
              </label>
            </div>
          ))}
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading certification...
          </div>
        )}
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
        <p className="text-xs text-purple-700 dark:text-purple-400">
          <strong>Tip:</strong> Certifications can help your product stand out and may be required
          for certain categories (e.g., organic food, electronics, children's products).
          Accepted formats: PDF, JPG, PNG (max 10MB per file).
        </p>
      </div>
    </div>
  );
}
