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
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { AssignmentModule } from './assignments/assignment.module';
import { ProgressModule } from './progress/progress.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { CertificateModule } from './certificates/certificate.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';

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
        throttlers: [{
          ttl: configService.get('THROTTLE_TTL', 60000),
          limit: configService.get('THROTTLE_LIMIT', 100),
        }],
      }),
      inject: [ConfigService],
    }),

    // Caching (Redis)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 1),
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

    // Task scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    CoursesModule,
    LessonsModule,
    AssignmentModule,
    ProgressModule,
    EnrollmentModule,
    CertificateModule,
    FilesModule,
    AuthModule,

    // Health checks
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
