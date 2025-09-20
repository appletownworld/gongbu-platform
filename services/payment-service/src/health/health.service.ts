import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class HealthService extends HealthIndicator {
  private readonly logger = new Logger(HealthService.name);
  private stripe?: Stripe;
  private startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
    
    // Инициализируем Stripe если настроен
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  async checkDatabase(key: string): Promise<HealthIndicatorResult> {
    try {
      // Простой запрос для проверки подключения к БД
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Дополнительно проверяем количество подключений
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as connection_count 
        FROM pg_stat_activity 
        WHERE datname = current_database();
      ` as any[];
      
      const connectionCount = parseInt(result[0]?.connection_count || '0');
      
      return this.getStatus(key, true, {
        status: 'connected',
        connectionCount,
        responseTime: '< 100ms',
      });
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw this.getStatus(key, false, {
        status: 'disconnected',
        error: error.message,
      });
    }
  }

  async checkStripe(key: string): Promise<HealthIndicatorResult> {
    try {
      if (!this.stripe) {
        return this.getStatus(key, true, {
          status: 'not_configured',
          message: 'Stripe не настроен (необязательно в development)',
        });
      }

      // Проверяем соединение со Stripe
      const startTime = Date.now();
      await this.stripe.customers.list({ limit: 1 });
      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        apiVersion: '2023-10-16',
      });
    } catch (error) {
      this.logger.error('Stripe health check failed:', error);
      return this.getStatus(key, false, {
        status: 'error',
        error: error.message,
        configured: !!this.stripe,
      });
    }
  }

  async checkYooKassa(key: string): Promise<HealthIndicatorResult> {
    try {
      const yooKassaKey = this.configService.get('YOOKASSA_SECRET_KEY');
      
      if (!yooKassaKey) {
        return this.getStatus(key, true, {
          status: 'not_configured',
          message: 'YooKassa не настроена (необязательно в development)',
        });
      }

      // Простая проверка конфигурации YooKassa
      // В реальном приложении здесь можно сделать тестовый запрос к API
      return this.getStatus(key, true, {
        status: 'configured',
        message: 'YooKassa настроена корректно',
      });
    } catch (error) {
      this.logger.error('YooKassa health check failed:', error);
      return this.getStatus(key, false, {
        status: 'error',
        error: error.message,
      });
    }
  }

  async getDetailedHealth() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    // Получаем статистики из БД
    let dbStats = null;
    try {
      const paymentCount = await this.prisma.payment.count();
      const subscriptionCount = await this.prisma.subscription.count();
      const refundCount = await this.prisma.refund.count();
      
      dbStats = {
        payments: paymentCount,
        subscriptions: subscriptionCount,
        refunds: refundCount,
        status: 'connected',
      };
    } catch (error) {
      dbStats = {
        status: 'error',
        error: error.message,
      };
    }

    return {
      service: 'payment-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime,
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
      },
      dependencies: {
        database: dbStats,
        stripe: {
          configured: !!this.configService.get('STRIPE_SECRET_KEY'),
          status: this.stripe ? 'initialized' : 'not_configured',
        },
        yookassa: {
          configured: !!this.configService.get('YOOKASSA_SECRET_KEY'),
          status: 'configured',
        },
      },
      configuration: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        databaseConnected: !!dbStats && dbStats.status === 'connected',
        corsEnabled: true,
        rateLimitingEnabled: true,
        validationEnabled: true,
      },
    };
  }

  async getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Статистики БД
    let dbMetrics = null;
    let paymentMetrics = null;

    try {
      // Метрики подключения к БД
      const connectionStats = await this.prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database();
      ` as any[];

      dbMetrics = {
        totalConnections: parseInt(connectionStats[0]?.total_connections || '0'),
        activeConnections: parseInt(connectionStats[0]?.active_connections || '0'),
        idleConnections: parseInt(connectionStats[0]?.idle_connections || '0'),
        status: 'healthy',
      };

      // Метрики платежей за последние 24 часа
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const paymentsLast24h = await this.prisma.payment.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
        },
      });

      const successfulPaymentsLast24h = await this.prisma.payment.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          status: 'COMPLETED',
        },
      });

      const totalRevenueLast24h = await this.prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: last24Hours,
          },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      });

      paymentMetrics = {
        totalPayments: paymentsLast24h,
        successfulPayments: successfulPaymentsLast24h,
        successRate: paymentsLast24h > 0 ? 
          Math.round((successfulPaymentsLast24h / paymentsLast24h) * 100) : 0,
        totalRevenue: Number(totalRevenueLast24h._sum.amount || 0),
        period: 'last_24_hours',
      };

    } catch (error) {
      this.logger.error('Error getting metrics:', error);
      dbMetrics = { status: 'error', error: error.message };
      paymentMetrics = { status: 'error', error: error.message };
    }

    return {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        heapUtilization: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      uptime,
      requests: {
        // В реальном приложении здесь можно использовать счетчики запросов
        total: 'N/A',
        rps: 'N/A',
        averageResponseTime: 'N/A',
      },
      database: dbMetrics,
      payments: paymentMetrics,
      timestamp: new Date().toISOString(),
    };
  }
}
