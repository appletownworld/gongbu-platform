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
    // Подключение событий логирования
    this.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Query: ${e.query} -- Params: ${e.params} -- Duration: ${e.duration}ms`);
      }
    });

    this.$on('error', (e) => {
      this.logger.error(`Prisma Error: ${e.message} -- Target: ${e.target}`);
    });

    this.$on('info', (e) => {
      this.logger.log(`Prisma Info: ${e.message} -- Target: ${e.target}`);
    });

    this.$on('warn', (e) => {
      this.logger.warn(`Prisma Warning: ${e.message} -- Target: ${e.target}`);
    });

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
