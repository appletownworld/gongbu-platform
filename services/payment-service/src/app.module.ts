import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { PaymentModule } from './payment/payment.module';
import { WebhookModule } from './webhooks/webhook.module';
import { ProviderModule } from './providers/provider.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 100, // 100 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 1000, // 1000 requests per minute
      },
    ]),

    // Scheduling for tasks
    ScheduleModule.forRoot(),

    // Health checks
    TerminusModule,

    // Core modules
    PrismaModule,
    AuthModule,
    PaymentModule,
    WebhookModule,
    ProviderModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
