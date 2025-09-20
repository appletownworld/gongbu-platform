import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private healthService: HealthService,
  ) {}

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Проверяет, что сервис запущен и отвечает на запросы'
  })
  @ApiResponse({
    status: 200,
    description: 'Сервис работает',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      }
    }
  })
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB heap limit
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),   // 300MB RSS limit
    ]);
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Проверяет готовность сервиса к обработке запросов (включая зависимости)'
  })
  @ApiResponse({
    status: 200,
    description: 'Сервис готов',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      }
    }
  })
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      // Database health check
      () => this.healthService.checkDatabase('database'),
      
      // Memory checks
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      
      // Disk space check
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9  // Alert when 90% full
      }),
      
      // External services
      () => this.healthService.checkStripe('stripe'),
      () => this.healthService.checkYooKassa('yookassa'),
    ]);
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Подробная информация о состоянии сервиса и всех зависимостей'
  })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация о здоровье сервиса',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'string' },
        version: { type: 'string' },
        environment: { type: 'string' },
        uptime: { type: 'number' },
        timestamp: { type: 'string' },
        memory: { type: 'object' },
        dependencies: { type: 'object' },
        configuration: { type: 'object' },
      }
    }
  })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Service metrics',
    description: 'Метрики производительности и использования ресурсов'
  })
  @ApiResponse({
    status: 200,
    description: 'Метрики сервиса',
    schema: {
      type: 'object',
      properties: {
        cpu: { type: 'object' },
        memory: { type: 'object' },
        uptime: { type: 'number' },
        requests: { type: 'object' },
        database: { type: 'object' },
        payments: { type: 'object' },
      }
    }
  })
  async getMetrics() {
    return this.healthService.getMetrics();
  }
}
