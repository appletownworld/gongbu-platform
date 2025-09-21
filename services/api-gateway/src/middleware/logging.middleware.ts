import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly isLoggingEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isLoggingEnabled = this.configService.get<boolean>('ENABLE_REQUEST_LOGGING', true);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.isLoggingEnabled) {
      return next();
    }

    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const requestId = this.generateRequestId();

    // Add request ID to request for tracking
    (req as any).requestId = requestId;

    // Log request start
    this.logger.log(`→ ${method} ${originalUrl}`, {
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'error' : 'log';
      const logMessage = `← ${method} ${originalUrl} ${res.statusCode}`;

      this.logger[logLevel](logMessage, {
        requestId,
        method,
        url: originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
      });
    });

    next();
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Timing');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();

    // Set timing header before response is sent
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
      const duration = process.hrtime.bigint() - startTime;
      const durationMs = Number(duration / BigInt(1000000));
      
      // Set timing header
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${durationMs}ms`);
      }

      return originalEnd.call(res, chunk, encoding, cb);
    };

    next();
  }
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Security');

  use(req: Request, res: Response, next: NextFunction): void {
    // Security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // API Gateway identification
    res.setHeader('X-Powered-By', 'Gongbu-API-Gateway');
    res.setHeader('X-Gateway-Version', '1.0.0');

    // CORS headers (will be overridden by CORS middleware if enabled)
    if (!res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }

    next();
  }
}
