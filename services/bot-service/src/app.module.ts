import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';

// Core modules
import { PrismaModule } from './config/prisma.module';
import { HealthModule } from './health/health.module';

// Feature modules
import { BotModule } from './bot/bot.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CommandsModule } from './commands/commands.module';
import { IntegrationsModule } from './integrations/integrations.module';

// Configuration
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      expandVariables: true,
    }),

    // Database
    PrismaModule,

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 50),
      }),
      inject: [ConfigService],
    }),

    // Caching (Redis)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 2),
        ttl: 300, // 5 minutes default TTL
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Event system for inter-service communication
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Task scheduling for cleanup and analytics
    ScheduleModule.forRoot(),

    // Feature modules
    BotModule,
    WebhooksModule,
    CommandsModule,
    IntegrationsModule,

    // Health checks
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
