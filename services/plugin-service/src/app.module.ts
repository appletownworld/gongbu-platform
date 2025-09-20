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
import { PluginModule } from './plugin/plugin.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { ThemeModule } from './theme/theme.module';
import { HookModule } from './hooks/hooks.module';
import { SecurityModule } from './security/security.module';
import { SandboxModule } from './sandbox/sandbox.module';
import { ApiModule } from './api/api.module';
import { HealthModule } from './health/health.module';

// Database
import { PrismaModule } from './prisma/prisma.module';

// Middleware
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PluginContextMiddleware } from './middleware/plugin-context.middleware';

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
      useFactory: (configService) => ({
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Gongbu-Plugin-Service/1.0.0',
        },
      }),
      inject: ['ConfigService'],
    }),

    // Rate limiting with different tiers for different operations
    ThrottlerModule.forRootAsync({
      useFactory: (configService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60 * 1000, // 1 minute
            limit: configService.get('PLUGIN_API_RATE_LIMIT', 1000),
          },
          {
            name: 'plugin-execution',
            ttl: 60 * 1000, // 1 minute
            limit: 100, // Lower limit for plugin execution
          },
          {
            name: 'plugin-install',
            ttl: 60 * 60 * 1000, // 1 hour
            limit: configService.get('PLUGIN_INSTALL_RATE_LIMIT', 10),
          },
          {
            name: 'marketplace',
            ttl: 60 * 1000, // 1 minute
            limit: 500, // Moderate limit for marketplace browsing
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
        db: configService.get('REDIS_DB', 6),
        ttl: configService.get('CACHE_TTL', 3600), // 1 hour default
        max: 50000, // Higher limit for plugin data
        compress: true, // Enable compression for plugin packages
      }),
      inject: ['ConfigService'],
      isGlobal: true,
    }),

    // Event emitter for plugin system events
    EventEmitterModule.forRoot({
      wildcard: true, // Enable wildcard pattern matching for events
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 100, // Higher limit for plugin events
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Task scheduling for plugin maintenance
    ScheduleModule.forRoot(),

    // Bull queue for background plugin operations
    BullModule.forRootAsync({
      useFactory: (configService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 6) + 1, // Use next DB for queues
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep more completed jobs for plugin debugging
          removeOnFail: 50,
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

    // Specific queue configurations for different plugin operations
    BullModule.registerQueue(
      {
        name: 'plugin-installation',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          timeout: 300000, // 5 minutes timeout for installation
        },
      },
      {
        name: 'plugin-security-scan',
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 10,
          timeout: 600000, // 10 minutes timeout for security scans
        },
      },
      {
        name: 'plugin-compilation',
        defaultJobOptions: {
          removeOnComplete: 30,
          removeOnFail: 15,
          timeout: 180000, // 3 minutes timeout for compilation
        },
      },
      {
        name: 'plugin-analytics',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 25,
          timeout: 60000, // 1 minute timeout for analytics
        },
      },
      {
        name: 'marketplace-moderation',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          timeout: 300000, // 5 minutes timeout for moderation
        },
      },
      {
        name: 'theme-processing',
        defaultJobOptions: {
          removeOnComplete: 30,
          removeOnFail: 10,
          timeout: 120000, // 2 minutes timeout for theme processing
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

    // Core plugin system modules
    PluginModule,
    MarketplaceModule,
    ThemeModule,
    HookModule,
    SecurityModule,
    SandboxModule,
    ApiModule,
    HealthModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply plugin context middleware to track plugin-related requests
    consumer
      .apply(PluginContextMiddleware)
      .forRoutes('plugins', 'marketplace', 'themes', 'hooks');

    // Apply logging middleware to all routes except health checks
    consumer
      .apply(LoggingMiddleware)
      .exclude(
        'health',
        'health/(.*)',
        'plugins/health/(.*)',
      )
      .forRoutes('*');
  }
}
