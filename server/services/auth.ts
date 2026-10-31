// ============================================================
// ListingDesk Pro — Real Authentication Service
// Complete JWT, password hashing, and 2FA implementation
// ============================================================

import type { ServerUser } from '../types';
import type { DatabaseClient } from './database';

// ============================================================
// TYPES
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<ServerUser, 'passwordHash' | 'twoFactorSecret'>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

// ============================================================
// CRYPTO UTILITIES (Browser-compatible)
// ============================================================

class CryptoUtils {
  // Generate random bytes
  static generateRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }

  // Convert bytes to base64
  static bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  // Convert base64 to bytes
  static base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Convert bytes to hex
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Convert hex to bytes
  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // SHA-256 hash
  static async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return this.bytesToHex(hashArray);
  }

  // HMAC-SHA256
  static async hmacSha256(key: string, data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);
    const dataBuffer = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    const signatureArray = new Uint8Array(signature);
    return this.bytesToHex(signatureArray);
  }

  // Generate random string
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = this.generateRandomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    return result;
  }

  // Base32 encoding (for TOTP)
  static base32Encode(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  static base32Decode(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < encoded.length; i++) {
      const idx = alphabet.indexOf(encoded[i].toUpperCase());
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(bytes);
  }
}

// ============================================================
// JWT IMPLEMENTATION
// ============================================================

class JWT {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // Sign a JWT token
  async sign(payload: Record<string, any>, expiresIn: string = '7d'): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiry(expiresIn);

    const tokenPayload = {
      ...payload,
      iat: now,
      exp,
    };

    const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(tokenPayload));

    const signature = await CryptoUtils.hmacSha256(
      this.secret,
      `${headerBase64}.${payloadBase64}`
    );

    const signatureBase64 = this.base64UrlEncode(
      JSON.stringify({ signature })
    );

    return `${headerBase64}.${payloadBase64}.${signatureBase64}`;
  }

  // Verify a JWT token
  async verify(token: string): Promise<Record<string, any>> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerBase64, payloadBase64, signatureBase64] = parts;

    // Verify signature
    const expectedSignature = await CryptoUtils.hmacSha256(
      this.secret,
      `${headerBase64}.${payloadBase64}`
    );

    const signatureData = JSON.parse(
      atob(this.base64UrlDecode(signatureBase64))
    );

    if (signatureData.signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payload = JSON.parse(atob(this.base64UrlDecode(payloadBase64)));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiry format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return str;
  }
}

// ============================================================
// PASSWORD HASHING (PBKDF2)
// ============================================================

class PasswordHasher {
  private iterations = 100000;
  private keyLength = 64;
  private saltLength = 16;

  // Hash a password
  async hash(password: string): Promise<string> {
    const salt = CryptoUtils.generateRandomBytes(this.saltLength);
    const saltBase64 = CryptoUtils.bytesToBase64(salt);

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      this.keyLength * 8
    );

    const hashArray = new Uint8Array(derivedBits);
    const hashBase64 = CryptoUtils.bytesToBase64(hashArray);

    // Format: iterations:keyLength:salt:hash
    return `${this.iterations}:${this.keyLength}:${saltBase64}:${hashBase64}`;
  }

  // Verify a password
  async verify(password: string, hash: string): Promise<boolean> {
    const parts = hash.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid hash format');
    }

    const [iterationsStr, keyLengthStr, saltBase64, storedHash] = parts;
    const iterations = parseInt(iterationsStr, 10);
    const keyLength = parseInt(keyLengthStr, 10);
    const salt = CryptoUtils.base64ToBytes(saltBase64);

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      keyLength * 8
    );

    const hashArray = new Uint8Array(derivedBits);
    const computedHash = CryptoUtils.bytesToBase64(hashArray);

    // Constant-time comparison
    return this.timingSafeEqual(computedHash, storedHash);
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

// ============================================================
// TOTP (Time-based One-Time Password)
// ============================================================

class TOTP {
  private period = 30; // 30 seconds
  private digits = 6;
  private algorithm = 'SHA-1';

  // Generate a random secret
  generateSecret(length: number = 20): string {
    const bytes = CryptoUtils.generateRandomBytes(length);
    return CryptoUtils.base32Encode(bytes);
  }

  // Generate TOTP URI for QR code
  generateUri(email: string, secret: string, issuer: string = 'ListingDesk Pro'): string {
    return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=${this.algorithm}&digits=${this.digits}&period=${this.period}`;
  }

  // Generate TOTP code
  async generate(secret: string, timestamp?: number): Promise<string> {
    const time = timestamp || Math.floor(Date.now() / 1000);
    const counter = Math.floor(time / this.period);

    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const key = CryptoUtils.base32Decode(secret);

    // HMAC-SHA1
    const encoder = new TextEncoder();
    const keyBuffer = key;
    const counterBuffer = counterBytes;

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hash = new Uint8Array(signature);

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0xf;
    const code =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = code % Math.pow(10, this.digits);
    return otp.toString().padStart(this.digits, '0');
  }

  // Verify TOTP code
  async verify(token: string, secret: string, window: number = 1): Promise<boolean> {
    const time = Math.floor(Date.now() / 1000);

    for (let i = -window; i <= window; i++) {
      const expectedToken = await this.generate(secret, time + i * this.period);
      if (token === expectedToken) {
        return true;
      }
    }

    return false;
  }
}

// ============================================================
// AUTHENTICATION SERVICE
// ============================================================

export class AuthenticationService {
  private db: DatabaseClient;
  private jwt: JWT;
  private passwordHasher: PasswordHasher;
  private totp: TOTP;
  private tokenExpiry: string;

  constructor(db: DatabaseClient, jwtSecret: string, tokenExpiry = '7d') {
    this.db = db;
    this.jwt = new JWT(jwtSecret);
    this.passwordHasher = new PasswordHasher();
    this.totp = new TOTP();
    this.tokenExpiry = tokenExpiry;
  }

  // ============================================================
  // REGISTER
  // ============================================================

  async register( RegisterRequest): Promise<AuthResponse> {
    // Validate input
    if (!data.email || !data.password || !data.name) {
      throw new Error('Email, password, and name are required');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await this.db.user.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(data.password);

    // Create user
    const user = await this.db.user.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'seller',
      twoFactorEnabled: false,
    });

    // Generate token
    const token = await this.jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.tokenExpiry
    );

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async login( LoginRequest): Promise<AuthResponse> {
    // Validate input
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const user = await this.db.user.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.passwordHasher.verify(
      data.password,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      throw new Error('2FA_REQUIRED');
    }

    // Generate token
    const token = await this.jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.tokenExpiry
    );

    // Log audit
    await this.db.auditLog.create({
      userId: user.id,
      action: 'user.login',
      resource: 'user',
      resourceId: user.id,
    });

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  // ============================================================
  // VERIFY 2FA
  // ============================================================

  async verifyTwoFactor(userId: string, code: string): Promise<AuthResponse> {
    const user = await this.db.user.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA is not enabled for this user');
    }

    // Verify TOTP code
    const isValid = await this.totp.verify(code, user.twoFactorSecret);
    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }

    // Generate token
    const token = await this.jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.tokenExpiry
    );

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  // ============================================================
  // ENABLE 2FA
  // ============================================================

  async enableTwoFactor(userId: string): Promise<TwoFactorSetup> {
    const user = await this.db.user.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = this.totp.generateSecret();

    // Generate QR code URI
    const qrCode = this.totp.generateUri(user.email, secret);

    // Update user (but don't enable yet - wait for verification)
    await this.db.user.update(userId, {
      twoFactorSecret: secret,
    });

    return { secret, qrCode };
  }

  async confirmTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.db.user.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA setup not initiated');
    }

    // Verify code
    const isValid = await this.totp.verify(code, user.twoFactorSecret);
    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }

    // Enable 2FA
    await this.db.user.update(userId, {
      twoFactorEnabled: true,
    });
  }

  // ============================================================
  // VERIFY TOKEN
  // ============================================================

  async verifyToken(token: string): Promise<TokenPayload> {
    const payload = await this.jwt.verify(token);
    return payload as TokenPayload;
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refreshToken(userId: string): Promise<string> {
    const user = await this.db.user.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.tokenExpiry
    );
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private sanitizeUser(user: ServerUser): Omit<ServerUser, 'passwordHash' | 'twoFactorSecret'> {
    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
