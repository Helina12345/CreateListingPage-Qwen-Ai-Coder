// ============================================================
// ListingDesk Pro — Secrets Management Service
// Secure management of sensitive configuration
// ============================================================

import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface SecretConfig {
  key: string;
  value: string;
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretsManagerConfig {
  encryptionKey: string;
  environment: 'development' | 'staging' | 'production';
}

// ============================================================
// SECRETS MANAGER SERVICE
// ============================================================

export class SecretsManagerService {
  private config: SecretsManagerConfig;
  private secrets: Map<string, SecretConfig> = new Map();

  constructor(config: SecretsManagerConfig) {
    this.config = config;
    this.loadSecrets();
  }

  // ============================================================
  // LOAD SECRETS
  // ============================================================

  private loadSecrets(): void {
    // Load from environment variables
    const envSecrets = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'AMAZON_CLIENT_ID',
      'AMAZON_CLIENT_SECRET',
      'EBAY_CLIENT_ID',
      'EBAY_CLIENT_SECRET',
      'SHOPIFY_API_KEY',
      'SHOPIFY_API_SECRET',
      'ETSY_API_KEY',
      'ETSY_API_SECRET',
      'WALMART_CLIENT_ID',
      'WALMART_CLIENT_SECRET',
      'TIKTOK_APP_KEY',
      'TIKTOK_APP_SECRET',
      'SHOPEE_PARTNER_ID',
      'SHOPEE_PARTNER_KEY',
      'LAZADA_APP_KEY',
      'LAZADA_APP_SECRET',
      'KOHL_API_KEY',
      'KOHL_API_SECRET',
      'ALIEXPRESS_APP_KEY',
      'ALIEXPRESS_APP_SECRET',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SENTRY_DSN',
      'DATADOG_API_KEY',
      'DATADOG_APP_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'AWS_S3_BUCKET',
      'ENCRYPTION_KEY',
      'CSRF_SECRET',
    ];

    envSecrets.forEach((key) => {
      const value = process.env[key];
      if (value) {
        this.secrets.set(key, {
          key,
          value,
          encrypted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
  }

  // ============================================================
  // GET SECRET
  // ============================================================

  getSecret(key: string): string | undefined {
    const secret = this.secrets.get(key);
    return secret?.value;
  }

  getSecretOrThrow(key: string): string {
    const secret = this.getSecret(key);
    if (!secret) {
      throw new Error(`Secret ${key} not found`);
    }
    return secret;
  }

  // ============================================================
  // SET SECRET
  // ============================================================

  setSecret(key: string, value: string, encrypted = false): void {
    this.secrets.set(key, {
      key,
      value,
      encrypted,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // ============================================================
  // DELETE SECRET
  // ============================================================

  deleteSecret(key: string): boolean {
    return this.secrets.delete(key);
  }

  // ============================================================
  // LIST SECRETS
  // ============================================================

  listSecrets(): string[] {
    return Array.from(this.secrets.keys());
  }

  // ============================================================
  // ENCRYPT SECRET
  // ============================================================

  encryptSecret(key: string): void {
    const secret = this.secrets.get(key);
    if (!secret || secret.encrypted) {
      return;
    }

    const encrypted = this.encrypt(secret.value);
    secret.value = encrypted;
    secret.encrypted = true;
    secret.updatedAt = new Date();
  }

  // ============================================================
  // DECRYPT SECRET
  // ============================================================

  decryptSecret(key: string): void {
    const secret = this.secrets.get(key);
    if (!secret || !secret.encrypted) {
      return;
    }

    const decrypted = this.decrypt(secret.value);
    secret.value = decrypted;
    secret.encrypted = false;
    secret.updatedAt = new Date();
  }

  // ============================================================
  // ENCRYPT
  // ============================================================

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(this.config.encryptionKey, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // ============================================================
  // DECRYPT
  // ============================================================

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(this.config.encryptionKey, 'hex'), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // ============================================================
  // GENERATE ENCRYPTION KEY
  // ============================================================

  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ============================================================
  // VALIDATE CONFIGURATION
  // ============================================================

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredSecrets = [
      'DATABASE_URL',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
    ];

    requiredSecrets.forEach((key) => {
      if (!this.secrets.has(key)) {
        errors.push(`Missing required secret: ${key}`);
      }
    });

    // Validate encryption key length
    if (this.config.encryptionKey.length !== 64) {
      errors.push('Encryption key must be 64 characters (32 bytes in hex)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================
  // ROTATE SECRETS
  // ============================================================

  async rotateSecret(key: string, newValue: string): Promise<void> {
    const oldSecret = this.secrets.get(key);

    // Set new secret
    this.setSecret(key, newValue);

    // Log rotation (in production, send to audit log)
    console.log(`Secret rotated: ${key}`);

    // In production, you might want to:
    // 1. Update database connections
    // 2. Reconnect to external services
    // 3. Invalidate cached tokens
    // 4. Notify monitoring systems
  }

  // ============================================================
  // BACKUP SECRETS
  // ============================================================

  backupSecrets(): string {
    const backup: Record<string, string> = {};

    this.secrets.forEach((secret, key) => {
      if (secret.encrypted) {
        backup[key] = secret.value;
      } else {
        backup[key] = this.encrypt(secret.value);
      }
    });

    return JSON.stringify(backup, null, 2);
  }

  // ============================================================
  // RESTORE SECRETS
  // ============================================================

  restoreSecrets(backup: string): void {
    const secrets = JSON.parse(backup);

    Object.entries(secrets).forEach(([key, value]) => {
      this.setSecret(key, value as string, true);
      this.decryptSecret(key);
    });
  }

  // ============================================================
  // AUDIT LOG
  // ============================================================

  getAuditLog(): Array<{
    action: string;
    key: string;
    timestamp: Date;
  }> {
    // In production, this would read from a database
    return [];
  }
}

// ============================================================
// EXPORT
// ============================================================

export function createSecretsManager(config?: Partial<SecretsManagerConfig>): SecretsManagerService {
  return new SecretsManagerService({
    encryptionKey: config?.encryptionKey || process.env.ENCRYPTION_KEY || SecretsManagerService.generateEncryptionKey(),
    environment: config?.environment || (process.env.NODE_ENV as any) || 'development',
  });
}

export const secretsManager = createSecretsManager();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getSecret(key: string): string | undefined {
  return secretsManager.getSecret(key);
}

export function getSecretOrThrow(key: string): string {
  return secretsManager.getSecretOrThrow(key);
}

export function setSecret(key: string, value: string): void {
  secretsManager.setSecret(key, value);
}

export function validateSecrets(): { valid: boolean; errors: string[] } {
  return secretsManager.validateConfiguration();
}
