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
      userAgent: userAgent.substring(0, 100), // Limit length
      contentLength: headers['content-length'] || 0,
      timestamp: new Date().toISOString(),
    });

    // Override res.end to capture response
    const originalEnd = res.end;
    const originalWrite = res.write;
    const chunks: Buffer[] = [];

    res.write = function(chunk: any): boolean {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return originalWrite.apply(res, arguments as any);
    };

    res.end = function(chunk?: any): Response {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const duration = Date.now() - startTime;
      const responseBody = Buffer.concat(chunks);
      const responseSize = responseBody.length;

      // Log response
      const logLevel = res.statusCode >= 400 ? 'error' : 'log';
      const logMessage = `← ${method} ${originalUrl} ${res.statusCode}`;

      const logData = {
        requestId,
        method,
        url: originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        responseSize: `${responseSize}b`,
        ip,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
      };

      // Add error details for 4xx/5xx responses
      if (res.statusCode >= 400) {
        try {
          const responseText = responseBody.toString('utf8');
          if (responseText.length < 1000) { // Only log small error responses
            const parsedResponse = JSON.parse(responseText);
            logData['error'] = parsedResponse.message || parsedResponse.error || responseText;
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }

      this.logger[logLevel](logMessage, logData);

      return originalEnd.apply(res, arguments as any);
    };

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

    res.on('finish', () => {
      const duration = process.hrtime.bigint() - startTime;
      const durationMs = Number(duration / BigInt(1000000)); // Convert to milliseconds

      // Set timing header
      res.setHeader('X-Response-Time', `${durationMs}ms`);

      // Log slow requests (>1000ms)
      if (durationMs > 1000) {
        this.logger.warn(`Slow request detected`, {
          method: req.method,
          url: req.originalUrl,
          duration: `${durationMs}ms`,
          status: res.statusCode,
        });
      }
    });

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
