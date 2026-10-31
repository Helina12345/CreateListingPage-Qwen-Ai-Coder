// ============================================================
// ListingDesk Pro — CSRF Protection Service
// Complete CSRF token generation and validation
// ============================================================

import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface CSRFToken {
  token: string;
  expiresAt: Date;
}

export interface CSRFConfig {
  secret: string;
  tokenLength: number;
  expirationMinutes: number;
  cookieName: string;
  headerName: string;
}

// ============================================================
// CSRF SERVICE
// ============================================================

export class CSRFService {
  private config: CSRFConfig;

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      secret: config?.secret || process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production',
      tokenLength: config?.tokenLength || 32,
      expirationMinutes: config?.expirationMinutes || 60,
      cookieName: config?.cookieName || 'csrf_token',
      headerName: config?.headerName || 'x-csrf-token',
    };
  }

  // ============================================================
  // GENERATE TOKEN
  // ============================================================

  generateToken(sessionId: string): CSRFToken {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(this.config.tokenLength);
    const data = `${sessionId}:${timestamp}:${randomBytes.toString('hex')}`;

    const signature = crypto
      .createHmac('sha256', this.config.secret)
      .update(data)
      .digest('hex');

    const token = `${Buffer.from(data).toString('base64')}.${signature}`;

    const expiresAt = new Date(timestamp + this.config.expirationMinutes * 60 * 1000);

    return { token, expiresAt };
  }

  // ============================================================
  // VALIDATE TOKEN
  // ============================================================

  validateToken(token: string, sessionId: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        return false;
      }

      const [dataBase64, signature] = parts;

      // Verify signature
      const data = Buffer.from(dataBase64, 'base64').toString();
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secret)
        .update(data)
        .digest('hex');

      if (!this.timingSafeEqual(signature, expectedSignature)) {
        return false;
      }

      // Parse data
      const [tokenSessionId, timestamp] = data.split(':');

      // Verify session ID
      if (tokenSessionId !== sessionId) {
        return false;
      }

      // Check expiration
      const tokenTime = parseInt(timestamp, 10);
      const expirationTime = tokenTime + this.config.expirationMinutes * 60 * 1000;

      if (Date.now() > expirationTime) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // ============================================================
  // TIMING-SAFE COMPARISON
  // ============================================================

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return crypto.timingSafeEqual(bufA, bufB);
  }

  // ============================================================
  // MIDDLEWARE
  // ============================================================

  middleware() {
    return (req: any, res: any, next: any) => {
      // Skip for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip for webhook endpoints
      if (req.path.startsWith('/api/webhooks/')) {
        return next();
      }

      // Get session ID
      const sessionId = req.session?.id || req.user?.id;
      if (!sessionId) {
        return next(); // No session, skip CSRF check
      }

      // Get token from header or body
      const token = req.headers[this.config.headerName.toLowerCase()] || req.body._csrf;

      if (!token) {
        return res.status(403).json({
          success: false,
          error: 'CSRF token missing',
        });
      }

      // Validate token
      if (!this.validateToken(token, sessionId)) {
        return res.status(403).json({
          success: false,
          error: 'Invalid CSRF token',
        });
      }

      next();
    };
  }

  // ============================================================
  // GENERATE TOKEN FOR RESPONSE
  // ============================================================

  generateTokenMiddleware() {
    return (req: any, res: any, next: any) => {
      const sessionId = req.session?.id || req.user?.id;

      if (sessionId) {
        const { token, expiresAt } = this.generateToken(sessionId);

        // Set token in cookie
        res.cookie(this.config.cookieName, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: expiresAt,
        });

        // Also provide token in response for AJAX requests
        res.locals.csrfToken = token;
      }

      next();
    };
  }

  // ============================================================
  // DOUBLE SUBMIT COOKIE PATTERN
  // ============================================================

  doubleSubmitMiddleware() {
    return (req: any, res: any, next: any) => {
      // Skip for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip for webhook endpoints
      if (req.path.startsWith('/api/webhooks/')) {
        return next();
      }

      // Get token from cookie
      const cookieToken = req.cookies?.[this.config.cookieName];

      // Get token from header or body
      const headerToken = req.headers[this.config.headerName.toLowerCase()] || req.body._csrf;

      if (!cookieToken || !headerToken) {
        return res.status(403).json({
          success: false,
          error: 'CSRF token missing',
        });
      }

      // Compare tokens (they should match)
      if (!this.timingSafeEqual(cookieToken, headerToken)) {
        return res.status(403).json({
          success: false,
          error: 'CSRF token mismatch',
        });
      }

      next();
    };
  }

  // ============================================================
  // GENERATE TOKEN FOR CLIENT
  // ============================================================

  generateTokenForClient(sessionId: string): { token: string; expiresAt: Date } {
    return this.generateToken(sessionId);
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  refreshToken(sessionId: string, oldToken: string): CSRFToken | null {
    // Validate old token first
    if (!this.validateToken(oldToken, sessionId)) {
      return null;
    }

    // Generate new token
    return this.generateToken(sessionId);
  }
}

// ============================================================
// EXPORT SINGLETON
// ============================================================

export const csrfService = new CSRFService();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function generateCSRFToken(sessionId: string): CSRFToken {
  return csrfService.generateToken(sessionId);
}

export function validateCSRFToken(token: string, sessionId: string): boolean {
  return csrfService.validateToken(token, sessionId);
}

export function csrfMiddleware() {
  return csrfService.middleware();
}

export function generateCSRFTokenMiddleware() {
  return csrfService.generateTokenMiddleware();
}

export function doubleSubmitCSRFMiddleware() {
  return csrfService.doubleSubmitMiddleware();
}
