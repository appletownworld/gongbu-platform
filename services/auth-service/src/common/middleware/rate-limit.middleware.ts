import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const config = this.getRateLimitConfig(req);
    const key = this.generateKey(req, config);
    
    this.checkRateLimit(key, config)
      .then(allowed => {
        if (allowed) {
          this.setRateLimitHeaders(res, config);
          next();
        } else {
          throw new HttpException(
            'Too Many Requests',
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
      })
      .catch(error => {
        if (error instanceof HttpException) {
          throw error;
        }
        // If Redis is down, allow request but log error
        console.error('Rate limit check failed:', error);
        next();
      });
  }

  private getRateLimitConfig(req: Request): RateLimitConfig {
    const baseConfig = { ...this.defaultConfig };

    // Override with environment variables
    if (this.configService.get('RATE_LIMIT_WINDOW_MS')) {
      baseConfig.windowMs = parseInt(this.configService.get('RATE_LIMIT_WINDOW_MS'));
    }
    
    if (this.configService.get('RATE_LIMIT_MAX_REQUESTS')) {
      baseConfig.maxRequests = parseInt(this.configService.get('RATE_LIMIT_MAX_REQUESTS'));
    }

    // Different limits for different endpoints
    if (req.path.includes('/auth/login')) {
      baseConfig.maxRequests = 5; // Stricter for login
      baseConfig.windowMs = 15 * 60 * 1000; // 15 minutes
    } else if (req.path.includes('/auth/register')) {
      baseConfig.maxRequests = 3; // Very strict for registration
      baseConfig.windowMs = 60 * 60 * 1000; // 1 hour
    } else if (req.path.includes('/2fa/')) {
      baseConfig.maxRequests = 10; // Moderate for 2FA
      baseConfig.windowMs = 5 * 60 * 1000; // 5 minutes
    }

    return baseConfig;
  }

  private generateKey(req: Request, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }

    // Default key generation
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const path = req.path;
    
    // Create a hash of IP + User-Agent + Path for more granular limiting
    const keyData = `${ip}:${userAgent}:${path}`;
    const hash = this.simpleHash(keyData);
    
    const window = Math.floor(Date.now() / config.windowMs);
    return `rate_limit:${hash}:${window}`;
  }

  private async checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    try {
      const current = await this.redisService.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= config.maxRequests) {
        return false;
      }

      // Increment counter
      await this.redisService.setex(key, Math.ceil(config.windowMs / 1000), (count + 1).toString());
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow request if Redis fails
    }
  }

  private setRateLimitHeaders(res: Response, config: RateLimitConfig): void {
    const remaining = Math.max(0, config.maxRequests - 1);
    const resetTime = Math.ceil((Date.now() + config.windowMs) / 1000);
    
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      'unknown'
    );
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// DDoS Protection Middleware
@Injectable()
export class DDoSProtectionMiddleware implements NestMiddleware {
  private readonly suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();
  private readonly maxRequestsPerMinute = 60;
  private readonly suspiciousThreshold = 100;

  use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIP(req);
    const now = Date.now();
    const minute = Math.floor(now / 60000);

    // Clean old entries
    this.cleanOldEntries(now);

    // Check if IP is suspicious
    const ipData = this.suspiciousIPs.get(ip);
    if (ipData && ipData.count > this.suspiciousThreshold) {
      throw new HttpException(
        'Suspicious activity detected',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Track requests
    if (!ipData || ipData.lastSeen < minute * 60000) {
      this.suspiciousIPs.set(ip, { count: 1, lastSeen: now });
    } else {
      ipData.count++;
      ipData.lastSeen = now;
    }

    // Check rate limit
    const currentCount = ipData?.count || 1;
    if (currentCount > this.maxRequestsPerMinute) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    next();
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      'unknown'
    );
  }

  private cleanOldEntries(now: number): void {
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastSeen < fiveMinutesAgo) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}
