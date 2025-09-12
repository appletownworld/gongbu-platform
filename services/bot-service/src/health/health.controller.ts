import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly http: HttpHealthIndicator,
    private readonly prisma: PrismaClient,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health
      () => this.db.pingCheck('database', this.prisma),
      
      // Memory health (max 150MB heap)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Memory health (max 300MB RSS)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      
      // Disk health (max 80% usage)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.8,
        }),
      
      // Telegram API health
      () =>
        this.http.pingCheck('telegram_api', 'https://api.telegram.org', {
          timeout: 5000,
        }),
      
      // Auth Service health
      () => {
        const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
        return authServiceUrl
          ? this.http.pingCheck('auth_service', `${authServiceUrl}/health`)
          : Promise.resolve({ auth_service: { status: 'up', message: 'Not configured' } });
      },
      
      // Course Service health
      () => {
        const courseServiceUrl = this.configService.get('COURSE_SERVICE_URL');
        return courseServiceUrl
          ? this.http.pingCheck('course_service', `${courseServiceUrl}/health`)
          : Promise.resolve({ course_service: { status: 'up', message: 'Not configured' } });
      },
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  @HealthCheck()
  ready() {
    return this.health.check([
      // Only check critical dependencies for readiness
      () => this.db.pingCheck('database', this.prisma),
      () => this.http.pingCheck('telegram_api', 'https://api.telegram.org', { timeout: 3000 }),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is dead' })
  @HealthCheck()
  live() {
    return this.health.check([
      // Basic memory check for liveness
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('bot')
  @ApiOperation({ summary: 'Bot-specific health check' })
  @ApiResponse({ status: 200, description: 'Bot is healthy' })
  @ApiResponse({ status: 503, description: 'Bot is unhealthy' })
  async botHealth() {
    // TODO: Implement bot-specific health checks
    // - Check if bot token is valid
    // - Check webhook status
    // - Check recent message processing
    // - Check session cleanup
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      bot: {
        token: this.configService.get('TELEGRAM_BOT_TOKEN') ? 'configured' : 'missing',
        webhook: this.configService.get('TELEGRAM_BOT_WEBHOOK_URL') ? 'enabled' : 'polling',
        lastUpdate: null, // TODO: Get from bot service
        activeUsers: 0, // TODO: Get from bot service
        queueSize: 0, // TODO: Get from message queue
      },
    };
  }
}
