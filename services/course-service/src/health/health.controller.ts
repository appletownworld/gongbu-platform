import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaClient,
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
}
