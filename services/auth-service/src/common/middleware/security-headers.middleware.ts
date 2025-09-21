import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isEnabled = this.configService.get('SECURITY_HEADERS_ENABLED', 'true') === 'true';
    
    if (!isEnabled) {
      return next();
    }

    // Content Security Policy
    const cspEnabled = this.configService.get('CONTENT_SECURITY_POLICY', 'true') === 'true';
    if (cspEnabled) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https: wss:; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'"
      );
    }

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    // Strict-Transport-Security (HTTPS only)
    const isHttps = req.secure || req.get('X-Forwarded-Proto') === 'https';
    if (isHttps) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // X-Download-Options
    res.setHeader('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cross-Origin-Embedder-Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin-Opener-Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove X-Powered-By
    res.removeHeader('X-Powered-By');

    // Add custom security headers
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Response-Time', Date.now().toString());

    next();
  }
}

// Input Validation Middleware
@Injectable()
export class InputValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize route parameters
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove potentially dangerous keys
      if (this.isDangerousKey(key)) {
        continue;
      }
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    return value;
  }

  private isDangerousKey(key: string): boolean {
    const dangerousKeys = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'script',
      'javascript',
      'vbscript',
      'onload',
      'onerror',
      'onclick',
      'onmouseover',
    ];
    
    return dangerousKeys.some(dangerous => 
      key.toLowerCase().includes(dangerous.toLowerCase())
    );
  }
}

// CSRF Protection Middleware
@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  private readonly csrfTokens = new Map<string, { token: string; expires: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for API endpoints with proper authentication
    if (req.path.startsWith('/api/') && req.headers.authorization) {
      return next();
    }

    const token = req.headers['x-csrf-token'] as string;
    const sessionId = req.sessionID || req.ip;

    if (!token || !this.validateCSRFToken(sessionId, token)) {
      return res.status(403).json({
        error: 'CSRF token validation failed',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    next();
  }

  generateCSRFToken(sessionId: string): string {
    const token = this.generateRandomToken();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    this.csrfTokens.set(sessionId, { token, expires });
    return token;
  }

  private validateCSRFToken(sessionId: string, token: string): boolean {
    const tokenData = this.csrfTokens.get(sessionId);
    
    if (!tokenData) {
      return false;
    }

    if (Date.now() > tokenData.expires) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    return tokenData.token === token;
  }

  private generateRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
