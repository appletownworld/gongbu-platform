import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });
  }

  async onModuleInit() {
    // Prisma event logging disabled due to type compatibility issues
    // TODO: Update when Prisma client types are fixed

    // Подключение к БД
    try {
      await this.$connect();
      this.logger.log('✅ Successfully connected to database');
    } catch (error) {
      this.logger.error(`❌ Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}
