import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaClient,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { 
          type: 'object',
          properties: {
            database: { type: 'object', properties: { status: { type: 'string', example: 'up' } } },
            memory_heap: { type: 'object', properties: { status: { type: 'string', example: 'up' } } },
            memory_rss: { type: 'object', properties: { status: { type: 'string', example: 'up' } } },
          }
        },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  check() {
    return this.health.check([
      // Database connectivity
      () => this.checkDatabase(),
      
      // Memory usage (heap should not exceed 512MB)
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      
      // Memory usage (RSS should not exceed 1GB)
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
      
      // Disk usage (should have at least 1GB free)
      () => this.disk.checkStorage('storage', { 
        path: '/',
        thresholdPercent: 0.9 
      }),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if service is ready to serve requests' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-09-11T12:00:00.000Z' },
        service: { type: 'string', example: 'auth-service' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  readiness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Check if service is alive' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 12345.678 },
        timestamp: { type: 'string', example: '2023-09-11T12:00:00.000Z' }
      }
    }
  })
  liveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<{ database: { status: string; [key: string]: any } }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}
