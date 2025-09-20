import { Injectable, Logger, HttpException, HttpStatus, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
}

export interface ProxyResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
}

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly services: Map<string, ServiceConfig> = new Map();
  
  private readonly defaultTimeout: number;
  private readonly defaultRetryAttempts: number;
  private readonly defaultRetryDelay: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTimeout = this.configService.get<number>('PROXY_TIMEOUT', 30000);
    this.defaultRetryAttempts = this.configService.get<number>('PROXY_RETRY_ATTEMPTS', 3);
    this.defaultRetryDelay = this.configService.get<number>('PROXY_RETRY_DELAY', 1000);

    this.initializeServices();
  }

  private initializeServices(): void {
    // Core services
    this.registerService('auth', {
      name: 'Auth Service',
      baseUrl: this.configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3001'),
      timeout: this.defaultTimeout,
      retryAttempts: this.defaultRetryAttempts,
      retryDelay: this.defaultRetryDelay,
    });

    this.registerService('course', {
      name: 'Course Service',
      baseUrl: this.configService.get<string>('COURSE_SERVICE_URL', 'http://course-service:3002'),
      timeout: this.defaultTimeout,
      retryAttempts: this.defaultRetryAttempts,
      retryDelay: this.defaultRetryDelay,
    });

    this.registerService('bot', {
      name: 'Bot Service',
      baseUrl: this.configService.get<string>('BOT_SERVICE_URL', 'http://bot-service:3003'),
      timeout: this.defaultTimeout,
      retryAttempts: this.defaultRetryAttempts,
      retryDelay: this.defaultRetryDelay,
    });

    // Optional services
    const paymentUrl = this.configService.get<string>('PAYMENT_SERVICE_URL');
    if (paymentUrl) {
      this.registerService('payment', {
        name: 'Payment Service',
        baseUrl: paymentUrl,
        timeout: this.defaultTimeout,
        retryAttempts: this.defaultRetryAttempts,
        retryDelay: this.defaultRetryDelay,
      });
    }

    const notificationUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL');
    if (notificationUrl) {
      this.registerService('notification', {
        name: 'Notification Service',
        baseUrl: notificationUrl,
        timeout: this.defaultTimeout,
        retryAttempts: this.defaultRetryAttempts,
        retryDelay: this.defaultRetryDelay,
      });
    }

    const analyticsUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL');
    if (analyticsUrl) {
      this.registerService('analytics', {
        name: 'Analytics Service',
        baseUrl: analyticsUrl,
        timeout: this.defaultTimeout,
        retryAttempts: this.defaultRetryAttempts,
        retryDelay: this.defaultRetryDelay,
      });
    }

    const pluginUrl = this.configService.get<string>('PLUGIN_SERVICE_URL');
    if (pluginUrl) {
      this.registerService('plugin', {
        name: 'Plugin Service',
        baseUrl: pluginUrl,
        timeout: this.defaultTimeout,
        retryAttempts: this.defaultRetryAttempts,
        retryDelay: this.defaultRetryDelay,
      });
    }

    this.logger.log(`✅ Initialized ${this.services.size} microservices for proxying`);
  }

  private registerService(key: string, config: ServiceConfig): void {
    this.services.set(key, config);
    this.logger.debug(`📡 Registered service: ${config.name} at ${config.baseUrl}`);
  }

  /**
   * Proxy request to a microservice
   */
  async proxyRequest(serviceName: string, request: ProxyRequest): Promise<ProxyResponse> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new BadGatewayException(`Service '${serviceName}' not found or not available`);
    }

    const fullUrl = `${service.baseUrl}${request.url}`;
    const startTime = Date.now();

    this.logger.debug(`📤 Proxying ${request.method.toUpperCase()} ${fullUrl}`, {
      serviceName,
      method: request.method,
      url: request.url,
      hasBody: !!request.body,
    });

    try {
      const response = await this.makeRequest(service, request, fullUrl);
      const duration = Date.now() - startTime;

      this.logger.debug(`📥 Proxy success for ${serviceName}`, {
        method: request.method,
        url: request.url,
        status: response.status,
        duration: `${duration}ms`,
      });

      return {
        data: response.data,
        status: response.status,
        headers: this.filterResponseHeaders(response.headers),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Proxy failed for ${serviceName}`, {
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
        error: error.message,
      });

      throw this.handleProxyError(error, serviceName);
    }
  }

  private makeRequest(
    service: ServiceConfig,
    request: ProxyRequest,
    fullUrl: string,
  ): Promise<AxiosResponse> {
    const requestConfig = {
      method: request.method.toLowerCase(),
      url: fullUrl,
      headers: this.filterRequestHeaders(request.headers),
      timeout: service.timeout,
      ...(request.body && { data: request.body }),
      ...(request.query && { params: request.query }),
    };

    return this.httpService.axiosRef.request(requestConfig);
  }

  private filterRequestHeaders(headers: Record<string, string>): Record<string, string> {
    const filtered: Record<string, string> = {};
    
    // Forward important headers
    const allowedHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'x-request-id',
      'x-forwarded-for',
      'x-real-ip',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }

    // Add proxy identification
    filtered['x-forwarded-by'] = 'gongbu-api-gateway';
    filtered['x-gateway-version'] = '1.0.0';

    return filtered;
  }

  private filterResponseHeaders(headers: Record<string, any>): Record<string, string> {
    const filtered: Record<string, string> = {};
    
    // Forward safe headers
    const allowedHeaders = [
      'content-type',
      'cache-control',
      'expires',
      'last-modified',
      'etag',
      'x-total-count',
      'x-page',
      'x-per-page',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  private handleProxyError(error: any, serviceName: string): HttpException {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new BadGatewayException(
        `Service '${serviceName}' is unavailable. Please try again later.`,
      );
    }

    if (error.response) {
      // HTTP error response from microservice
      const { status, data } = error.response;
      return new HttpException(data || `Service error from ${serviceName}`, status);
    }

    if (error.code === 'ENOTFOUND') {
      return new BadGatewayException(
        `Service '${serviceName}' could not be reached. Check service configuration.`,
      );
    }

    // Generic error
    return new BadGatewayException(
      `Proxy error when calling ${serviceName}: ${error.message}`,
    );
  }

  /**
   * Check health of all registered services
   */
  async checkServicesHealth(): Promise<Record<string, any>> {
    const healthResults: Record<string, any> = {};

    const healthChecks = Array.from(this.services.entries()).map(async ([key, service]) => {
      try {
        const startTime = Date.now();
        
        // Try to reach the health endpoint
        await this.httpService.axiosRef.get(`${service.baseUrl}/health`, {
          timeout: 5000, // Shorter timeout for health checks
        });

        const responseTime = Date.now() - startTime;
        
        healthResults[key] = {
          status: 'healthy',
          service: service.name,
          baseUrl: service.baseUrl,
          responseTime: `${responseTime}ms`,
        };
      } catch (error) {
        healthResults[key] = {
          status: 'unhealthy',
          service: service.name,
          baseUrl: service.baseUrl,
          error: error.message,
        };
      }
    });

    await Promise.allSettled(healthChecks);
    return healthResults;
  }

  /**
   * Get list of registered services
   */
  getRegisteredServices(): Record<string, ServiceConfig> {
    const services: Record<string, ServiceConfig> = {};
    this.services.forEach((config, key) => {
      services[key] = { ...config };
    });
    return services;
  }

  /**
   * Check if service is registered and available
   */
  isServiceAvailable(serviceName: string): boolean {
    return this.services.has(serviceName);
  }
}
