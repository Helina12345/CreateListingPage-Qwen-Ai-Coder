// ============================================================
// ListingDesk Pro — Compliance & Legal Service
// Product compliance validation and certification management
// ============================================================

export interface ComplianceRequirement {
  id: string;
  name: string;
  type: 'CE' | 'FCC' | 'RoHS' | 'REACH' | 'WEEE' | 'FDA' | 'CPSC' | 'Prop65' | 'custom';
  region: string[];
  category: string[];
  required: boolean;
  description: string;
  documentation: string[];
}

export interface ComplianceCertificate {
  id: string;
  productId: string;
  requirementId: string;
  certificateNumber: string;
  issuedDate: Date;
  expiryDate?: Date;
  documentUrl: string;
  status: 'valid' | 'expired' | 'pending';
}

export interface ComplianceCheck {
  productId: string;
  marketplaceId: string;
  requirements: ComplianceRequirement[];
  certificates: ComplianceCertificate[];
  compliant: boolean;
  missingRequirements: ComplianceRequirement[];
  warnings: string[];
}

export class ComplianceService {
  private requirements: ComplianceRequirement[] = [];
  private certificates: ComplianceCertificate[] = [];

  constructor() {
    this.initializeRequirements();
  }

  // ============================================================
  // INITIALIZE REQUIREMENTS
  // ============================================================

  private initializeRequirements(): void {
    this.requirements = [
      {
        id: 'ce_marking',
        name: 'CE Marking',
        type: 'CE',
        region: ['EU', 'EEA'],
        category: ['electronics', 'toys', 'machinery', 'medical_devices', 'construction'],
        required: true,
        description: 'Conformité Européenne mark for products sold in European Economic Area',
        documentation: ['EU Declaration of Conformity', 'Technical documentation', 'Test reports'],
      },
      {
        id: 'fcc_compliance',
        name: 'FCC Compliance',
        type: 'FCC',
        region: ['US'],
        category: ['electronics', 'wireless_devices', 'computers'],
        required: true,
        description: 'Federal Communications Commission compliance for electronic devices',
        documentation: ['FCC ID', 'Test reports', 'User manual'],
      },
      {
        id: 'rohs_compliance',
        name: 'RoHS Compliance',
        type: 'RoHS',
        region: ['EU'],
        category: ['electronics', 'electrical_equipment'],
        required: true,
        description: 'Restriction of Hazardous Substances Directive',
        documentation: ['RoHS declaration', 'Material composition report'],
      },
      {
        id: 'reach_compliance',
        name: 'REACH Compliance',
        type: 'REACH',
        region: ['EU'],
        category: ['chemicals', 'textiles', 'electronics', 'toys'],
        required: true,
        description: 'Registration, Evaluation, Authorisation and Restriction of Chemicals',
        documentation: ['SVHC declaration', 'Safety Data Sheet'],
      },
      {
        id: 'weee_registration',
        name: 'WEEE Registration',
        type: 'WEEE',
        region: ['EU'],
        category: ['electronics', 'electrical_equipment'],
        required: true,
        description: 'Waste Electrical and Electronic Equipment registration',
        documentation: ['WEEE registration number', 'Take-back scheme membership'],
      },
      {
        id: 'fda_registration',
        name: 'FDA Registration',
        type: 'FDA',
        region: ['US'],
        category: ['food', 'drugs', 'medical_devices', 'cosmetics'],
        required: true,
        description: 'Food and Drug Administration registration',
        documentation: ['FDA registration number', 'Product listing', 'Label approval'],
      },
      {
        id: 'cpsc_compliance',
        name: 'CPSC Compliance',
        type: 'CPSC',
        region: ['US'],
        category: ['toys', 'children_products', 'furniture'],
        required: true,
        description: 'Consumer Product Safety Commission compliance',
        documentation: ['CPC certificate', 'Test reports from CPSC-accepted lab'],
      },
      {
        id: 'prop65_warning',
        name: 'Proposition 65 Warning',
        type: 'Prop65',
        region: ['US-CA'],
        category: ['all'],
        required: true,
        description: 'California Safe Drinking Water and Toxic Enforcement Act warning',
        documentation: ['Prop 65 warning label', 'Chemical list'],
      },
    ];
  }

  // ============================================================
  // GET APPLICABLE REQUIREMENTS
  // ============================================================

  getApplicableRequirements(
    marketplaceId: string,
    category: string,
    region?: string
  ): ComplianceRequirement[] {
    const marketplaceRegions: Record<string, string[]> = {
      amazon: ['US', 'EU', 'UK', 'CA'],
      ebay: ['US', 'UK', 'AU', 'DE'],
      shopify: ['US', 'CA', 'UK', 'AU'],
      etsy: ['US', 'CA', 'UK', 'AU'],
      walmart: ['US'],
      tiktok_shop: ['US', 'UK', 'SEA'],
      shopee: ['SEA'],
      lazada: ['SEA'],
      kohls: ['US'],
    };

    const regions = region ? [region] : marketplaceRegions[marketplaceId] || ['US'];

    return this.requirements.filter((req) => {
      const regionMatch = req.region.some((r) => regions.includes(r));
      const categoryMatch = req.category.includes(category) || req.category.includes('all');
      return regionMatch && categoryMatch;
    });
  }

  // ============================================================
  // CHECK COMPLIANCE
  // ============================================================

  async checkCompliance(
    productId: string,
    marketplaceId: string,
    category: string
  ): Promise<ComplianceCheck> {
    const requirements = this.getApplicableRequirements(marketplaceId, category);
    const certificates = this.certificates.filter((c) => c.productId === productId);

    const missingRequirements = requirements.filter((req) => {
      const hasCert = certificates.some(
        (cert) => cert.requirementId === req.id && cert.status === 'valid'
      );
      return req.required && !hasCert;
    });

    const warnings: string[] = [];

    // Check for expiring certificates
    const expiringSoon = certificates.filter((cert) => {
      if (!cert.expiryDate) return false;
      const daysUntilExpiry =
        (cert.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry < 30 && daysUntilExpiry > 0;
    });

    if (expiringSoon.length > 0) {
      warnings.push(
        `${expiringSoon.length} certificate(s) expiring within 30 days`
      );
    }

    // Check for expired certificates
    const expired = certificates.filter(
      (cert) => cert.expiryDate && cert.expiryDate < new Date()
    );

    if (expired.length > 0) {
      warnings.push(`${expired.length} certificate(s) have expired`);
    }

    return {
      productId,
      marketplaceId,
      requirements,
      certificates,
      compliant: missingRequirements.length === 0,
      missingRequirements,
      warnings,
    };
  }

  // ============================================================
  // ADD CERTIFICATE
  // ============================================================

  addCertificate(
    productId: string,
    requirementId: string,
    certificateNumber: string,
    documentUrl: string,
    expiryDate?: Date
  ): ComplianceCertificate {
    const certificate: ComplianceCertificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      requirementId,
      certificateNumber,
      issuedDate: new Date(),
      expiryDate,
      documentUrl,
      status: 'valid',
    };

    this.certificates.push(certificate);
    return certificate;
  }

  // ============================================================
  // UPDATE CERTIFICATE STATUS
  // ============================================================

  updateCertificateStatus(certificateId: string, status: ComplianceCertificate['status']): void {
    const certificate = this.certificates.find((c) => c.id === certificateId);
    if (certificate) {
      certificate.status = status;
    }
  }

  // ============================================================
  // GET CERTIFICATES
  // ============================================================

  getCertificates(productId?: string, requirementId?: string): ComplianceCertificate[] {
    let filtered = this.certificates;

    if (productId) {
      filtered = filtered.filter((c) => c.productId === productId);
    }

    if (requirementId) {
      filtered = filtered.filter((c) => c.requirementId === requirementId);
    }

    return filtered;
  }

  // ============================================================
  // DELETE CERTIFICATE
  // ============================================================

  deleteCertificate(certificateId: string): boolean {
    const index = this.certificates.findIndex((c) => c.id === certificateId);
    if (index === -1) return false;

    this.certificates.splice(index, 1);
    return true;
  }

  // ============================================================
  // VALIDATE DOCUMENTATION
  // ============================================================

  async validateDocumentation(
    documentUrl: string,
    requirementType: ComplianceRequirement['type']
  ): Promise<{ valid: boolean; errors: string[] }> {
    // In production, this would:
    // 1. Download the document
    // 2. Parse PDF/images
    // 3. Validate content against requirements
    // 4. Check for required fields
    // 5. Verify authenticity

    // For now, return mock validation
    return {
      valid: true,
      errors: [],
    };
  }

  // ============================================================
  // GET COMPLIANCE REPORT
  // ============================================================

  async getComplianceReport(
    productId: string,
    marketplaceIds: string[],
    category: string
  ): Promise<{
    productId: string;
    overallCompliance: number;
    marketplaceCompliance: Record<string, ComplianceCheck>;
    recommendations: string[];
  }> {
    const marketplaceCompliance: Record<string, ComplianceCheck> = {};
    let totalRequirements = 0;
    let metRequirements = 0;
    const recommendations: string[] = [];

    for (const marketplaceId of marketplaceIds) {
      const check = await this.checkCompliance(productId, marketplaceId, category);
      marketplaceCompliance[marketplaceId] = check;

      totalRequirements += check.requirements.length;
      metRequirements += check.requirements.length - check.missingRequirements.length;

      if (!check.compliant) {
        recommendations.push(
          `${marketplaceId}: Missing ${check.missingRequirements.length} required certification(s)`
        );
      }

      if (check.warnings.length > 0) {
        recommendations.push(`${marketplaceId}: ${check.warnings.join(', ')}`);
      }
    }

    const overallCompliance =
      totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 100;

    return {
      productId,
      overallCompliance,
      marketplaceCompliance,
      recommendations,
    };
  }

  // ============================================================
  // AUTO-CHECK ON LISTING CREATION
  // ============================================================

  async autoCheckOnListingCreation(
    productId: string,
    marketplaceId: string,
    category: string
  ): Promise<{
    canProceed: boolean;
    blockingIssues: string[];
    warnings: string[];
  }> {
    const check = await this.checkCompliance(productId, marketplaceId, category);

    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    if (!check.compliant) {
      for (const req of check.missingRequirements) {
        blockingIssues.push(`Missing required certification: ${req.name}`);
      }
    }

    warnings.push(...check.warnings);

    return {
      canProceed: blockingIssues.length === 0,
      blockingIssues,
      warnings,
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createComplianceService(): ComplianceService {
  return new ComplianceService();
}
