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
import { NotificationModule } from './notification/notification.module';
import { EmailModule } from './email/email.module';
import { PushModule } from './push/push.module';
import { TelegramModule } from './telegram/telegram.module';
import { TemplateModule } from './template/template.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';

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
          'User-Agent': 'Gongbu-Notification-Service/1.0.0',
        },
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get('THROTTLE_TTL', 60) * 1000,
            limit: configService.get('THROTTLE_LIMIT', 100),
          },
          {
            name: 'email',
            ttl: 60 * 1000, // 1 minute
            limit: configService.get('EMAIL_RATE_LIMIT', 100),
          },
          {
            name: 'push',
            ttl: 60 * 1000, // 1 minute
            limit: configService.get('PUSH_RATE_LIMIT', 1000),
          },
          {
            name: 'sms',
            ttl: 60 * 1000, // 1 minute
            limit: configService.get('SMS_RATE_LIMIT', 10),
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
        db: configService.get('REDIS_DB', 3),
        ttl: configService.get('TEMPLATE_CACHE_TTL', 3600), // 1 hour default
        max: 1000, // Maximum number of items in cache
      }),
      inject: ['ConfigService'],
      isGlobal: true,
    }),

    // Event emitter for internal events
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Bull queue for background job processing
    BullModule.forRootAsync({
      useFactory: (configService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('QUEUE_REDIS_DB', 4),
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('QUEUE_REMOVE_ON_COMPLETE', 100),
          removeOnFail: configService.get('QUEUE_REMOVE_ON_FAIL', 50),
          attempts: configService.get('QUEUE_MAX_ATTEMPTS', 3),
          backoff: {
            type: 'exponential',
            delay: configService.get('QUEUE_RETRY_DELAY', 2000),
          },
        },
      }),
      inject: ['ConfigService'],
    }),

    // Health checks
    TerminusModule.forRootAsync({
      useFactory: (configService) => ({
        errorLogStyle: 'pretty',
        logger: true,
        gracefulShutdownTimeoutMs: configService.get('HEALTH_CHECK_TIMEOUT', 5000),
      }),
      inject: ['ConfigService'],
    }),

    // Database
    PrismaModule,

    // Core feature modules
    NotificationModule,
    EmailModule,
    PushModule,
    TelegramModule,
    TemplateModule,
    AnalyticsModule,
    QueueModule,
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
      )
      .forRoutes('*');
  }
}

// Import ConfigService for middleware configuration
import { ConfigService } from '@nestjs/config';
