import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { 
  HealthCheck, 
  HealthCheckService, 
  HttpHealthIndicator, 
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly httpHealthIndicator: HttpHealthIndicator,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly configService: ConfigService,
    private readonly proxyService: ProxyService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Overall health check',
    description: 'Returns the health status of API Gateway and all connected microservices'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const result = await this.healthCheckService.check([
        // Memory health
        () => this.memoryHealthIndicator.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
        () => this.memoryHealthIndicator.checkRSS('memory_rss', 300 * 1024 * 1024),   // 300MB

        // Microservices health
        () => this.checkAuthService(),
        () => this.checkCourseService(),
        () => this.checkBotService(),
      ]);

      const duration = Date.now() - startTime;
      
      // Add custom metadata
      result.info = {
        ...result.info,
        gateway: {
          status: 'up',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          responseTime: `${duration}ms`,
          environment: this.configService.get('NODE_ENV'),
          port: this.configService.get('PORT'),
        }
      };

      this.logger.debug(`Health check completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Health check failed in ${duration}ms:`, error.message);
      throw error;
    }
  }

  @Get('services')
  @ApiOperation({ 
    summary: 'Detailed microservices health',
    description: 'Returns detailed health information for all registered microservices'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Services health information',
    schema: {
      type: 'object',
      properties: {
        services: { 
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              service: { type: 'string' },
              baseUrl: { type: 'string' },
              responseTime: { type: 'string' },
              lastChecked: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            healthy: { type: 'number' },
            unhealthy: { type: 'number' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  })
  async checkServices() {
    try {
      const healthResults = await this.proxyService.checkServicesHealth();
      
      // Calculate summary
      const total = Object.keys(healthResults).length;
      const healthy = Object.values(healthResults).filter(s => s.status === 'healthy').length;
      const unhealthy = total - healthy;

      return {
        services: healthResults,
        summary: {
          total,
          healthy,
          unhealthy,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.logger.error('Failed to check services health:', error);
      throw error;
    }
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe - checks if gateway is ready to serve traffic'
  })
  @ApiResponse({ status: 200, description: 'Gateway is ready' })
  @ApiResponse({ status: 503, description: 'Gateway is not ready' })
  async ready() {
    try {
      // Check if essential services are available
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
      const courseServiceUrl = this.configService.get<string>('COURSE_SERVICE_URL');

      await Promise.all([
        this.httpHealthIndicator.pingCheck('auth-service', `${authServiceUrl}/api/v1/health`, { timeout: 3000 }),
        this.httpHealthIndicator.pingCheck('course-service', `${courseServiceUrl}/api/v1/health`, { timeout: 3000 }),
      ]);

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error.message);
      throw error;
    }
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe - checks if gateway process is alive'
  })
  @ApiResponse({ status: 200, description: 'Gateway is alive' })
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      pid: process.pid,
    };
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Basic metrics',
    description: 'Returns basic operational metrics for monitoring'
  })
  @ApiResponse({ status: 200, description: 'Metrics data' })
  async metrics() {
    const memUsage = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: this.configService.get('PORT'),
      },
    };
  }

  private async checkAuthService() {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    return this.httpHealthIndicator.pingCheck(
      'auth-service',
      `${authServiceUrl}/api/v1/health`,
      { timeout: 5000 }
    );
  }

  private async checkCourseService() {
    const courseServiceUrl = this.configService.get<string>('COURSE_SERVICE_URL');
    return this.httpHealthIndicator.pingCheck(
      'course-service', 
      `${courseServiceUrl}/api/v1/health`,
      { timeout: 5000 }
    );
  }

  private async checkBotService() {
    const botServiceUrl = this.configService.get<string>('BOT_SERVICE_URL');
    return this.httpHealthIndicator.pingCheck(
      'bot-service',
      `${botServiceUrl}/api/v1/health`,
      { timeout: 5000 }
    );
  }
}
