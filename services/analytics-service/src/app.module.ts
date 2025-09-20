import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import * as redisStore from 'cache-manager-redis-store';

// Configuration
import { validateEnv } from './config/env.validation';

// Core modules
import { AnalyticsModule } from './analytics/analytics.module';
import { TrackingModule } from './tracking/tracking.module';
import { ReportingModule } from './reporting/reporting.module';
import { InsightsModule } from './insights/insights.module';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { DashboardModule } from './dashboards/dashboards.module';
import { HealthModule } from './health/health.module';

// Database
import { PrismaModule } from './prisma/prisma.module';

// Middleware
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      expandVariables: true,
    }),

    // HTTP client for external API calls
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Gongbu-Analytics-Service/1.0.0',
        },
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60 * 1000, // 1 minute
            limit: 1000, // High limit for analytics endpoints
          },
          {
            name: 'tracking',
            ttl: 60 * 1000, // 1 minute
            limit: 10000, // Very high limit for tracking endpoints
          },
          {
            name: 'reporting',
            ttl: 60 * 1000, // 1 minute
            limit: 100, // Lower limit for heavy reporting queries
          },
        ],
        errorMessage: 'Too many requests, please try again later.',
      }),
      inject: ['ConfigService'],
    }),

    // Caching with Redis
    CacheModule.registerAsync({
      useFactory: async (configService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 5),
        ttl: configService.get('CACHE_TTL', 3600), // 1 hour default
        max: 10000, // Maximum number of items in cache
        compress: true, // Enable compression for large analytics data
      }),
      inject: ['ConfigService'],
      isGlobal: true,
    }),

    // Event emitter for internal events and real-time updates
    EventEmitterModule.forRoot({
      wildcard: true, // Enable wildcard pattern matching for events
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 50, // Higher limit for analytics events
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Task scheduling for data processing
    ScheduleModule.forRoot(),

    // Bull queue for background job processing
    BullModule.forRootAsync({
      useFactory: (configService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 5) + 1, // Use next DB for queues
        },
        defaultJobOptions: {
          removeOnComplete: 200, // Keep more completed jobs for debugging
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // 5 seconds initial delay
          },
        },
        settings: {
          stalledInterval: 30 * 1000, // 30 seconds
          maxStalledCount: 1,
        },
      }),
      inject: ['ConfigService'],
    }),

    // Specific queue configurations
    BullModule.registerQueue(
      {
        name: 'analytics-processing',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: 'data-aggregation',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
        },
      },
      {
        name: 'report-generation',
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 10,
          timeout: 300000, // 5 minutes timeout for reports
        },
      },
      {
        name: 'ml-insights',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          timeout: 600000, // 10 minutes timeout for ML jobs
        },
      },
    ),

    // Health checks
    TerminusModule.forRootAsync({
      useFactory: (configService) => ({
        errorLogStyle: 'pretty',
        logger: true,
        gracefulShutdownTimeoutMs: configService.get('HEALTH_CHECK_TIMEOUT', 10000),
      }),
      inject: ['ConfigService'],
    }),

    // Database
    PrismaModule,

    // Core feature modules
    AnalyticsModule,
    TrackingModule,
    ReportingModule,
    InsightsModule,
    EventsModule,
    MetricsModule,
    DashboardModule,
    HealthModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logging middleware to all routes except health checks
    consumer
      .apply(LoggingMiddleware)
      .exclude(
        'health',
        'health/(.*)',
        'analytics/health/(.*)',
      )
      .forRoutes('*');
  }
}
