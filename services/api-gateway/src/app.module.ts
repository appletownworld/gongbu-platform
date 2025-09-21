import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import * as redisStore from 'cache-manager-redis-store';

// Configuration
import { validateEnv } from './config/env.validation';

// Controllers
import { GatewayController } from './gateway/gateway.controller';
import { HealthController } from './health/health.controller';

// Services
import { ProxyService } from './proxy/proxy.service';

// Guards
import { GatewayAuthGuard, GatewayOptionalAuthGuard } from './guards/auth.guard';

// Middleware
import { LoggingMiddleware, RequestTimingMiddleware, SecurityHeadersMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      expandVariables: true,
    }),

    // HTTP client for proxying
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('PROXY_TIMEOUT', 30000),
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Gongbu-API-Gateway/1.0.0',
          'X-Gateway-Client': 'nestjs-axios',
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get('THROTTLE_TTL', 60) * 1000, // Convert to milliseconds
            limit: configService.get('THROTTLE_LIMIT', 100),
          },
          {
            name: 'global',
            ttl: configService.get('THROTTLE_TTL', 60) * 1000,
            limit: configService.get('THROTTLE_GLOBAL_LIMIT', 10000),
          },
        ],
        errorMessage: 'Too many requests from this IP, please try again later.',
      }),
      inject: [ConfigService],
    }),

    // Caching with Redis
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: 300, // 5 minutes default TTL
        max: 100, // Maximum number of items in cache
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Health checks
    TerminusModule,
  ],

  controllers: [
    GatewayController,
    HealthController,
  ],

  providers: [
    // Core services
    ProxyService,

    // Guards
    GatewayAuthGuard,
    GatewayOptionalAuthGuard,

    // Middleware (registered below)
    LoggingMiddleware,
    RequestTimingMiddleware,
    SecurityHeadersMiddleware,
  ],

  exports: [
    ProxyService,
    GatewayAuthGuard,
    GatewayOptionalAuthGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware in order
    consumer
      .apply(SecurityHeadersMiddleware) // Apply security headers first
      .forRoutes('*');

    consumer
      .apply(RequestTimingMiddleware) // Track request timing
      .forRoutes('*');

    consumer
      .apply(LoggingMiddleware) // Log requests and responses
      .exclude(
        { path: 'health', method: RequestMethod.GET }, // Exclude health checks from logging
        { path: 'health/live', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
        { path: 'favicon.ico', method: RequestMethod.GET }, // Exclude favicon
      )
      .forRoutes('*');
  }
}

// Import RequestMethod for middleware configuration
import { RequestMethod } from '@nestjs/common';
