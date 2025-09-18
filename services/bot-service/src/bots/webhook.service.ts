import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BotInstanceManager } from './bot-instance-manager.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private botInstanceManager: BotInstanceManager,
  ) {}

  async handleWebhook(botId: string, update: any) {
    const startTime = Date.now();
    let webhookEventId: string | undefined;

    try {
      // Логируем входящий webhook
      const webhookEvent = await this.prisma.webhookEvents.create({
        data: {
          botId,
          eventType: this.getUpdateType(update),
          telegramUpdateId: update.update_id ? BigInt(update.update_id) : undefined,
          rawPayload: update,
          status: 'PROCESSING',
          processingStartedAt: new Date(),
        },
      });
      webhookEventId = webhookEvent.id;

      // Получаем экземпляр бота
      const bot = this.botInstanceManager.getBotInstance(botId);
      if (!bot) {
        throw new Error(`Bot instance not found: ${botId}`);
      }

      // Обрабатываем обновление через Telegraf
      await bot.handleUpdate(update);

      // Помечаем как обработанный
      await this.prisma.webhookEvents.update({
        where: { id: webhookEventId },
        data: {
          status: 'COMPLETED',
          processingCompletedAt: new Date(),
          processedPayload: {
            processed: true,
            processingTime: Date.now() - startTime,
          },
        },
      });

      this.logger.log(`Webhook processed successfully: ${webhookEventId}`);
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);

      // Обновляем статус ошибки
      if (webhookEventId) {
        await this.prisma.webhookEvents.update({
          where: { id: webhookEventId },
          data: {
            status: 'FAILED',
            processingCompletedAt: new Date(),
            errorMessage: error.message,
            retryCount: { increment: 1 },
          },
        });
      }

      throw error;
    }
  }

  async retryFailedWebhooks(botId?: string) {
    const maxRetries = 3;
    const retryDelay = 5 * 60 * 1000; // 5 minutes

    const failedEvents = await this.prisma.webhookEvents.findMany({
      where: {
        ...(botId && { botId }),
        status: 'FAILED',
        retryCount: { lt: maxRetries },
        createdAt: {
          gte: new Date(Date.now() - retryDelay),
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    for (const event of failedEvents) {
      try {
        this.logger.log(`Retrying webhook event: ${event.id}`);
        await this.handleWebhook(event.botId!, event.rawPayload);
      } catch (error) {
        this.logger.error(`Retry failed for webhook ${event.id}: ${error.message}`);
      }
    }

    return {
      processed: failedEvents.length,
      retried: failedEvents.length,
    };
  }

  async getWebhookStats(botId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.prisma.webhookEvents.groupBy({
      by: ['status'],
      where: {
        botId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    const eventTypes = await this.prisma.webhookEvents.groupBy({
      by: ['eventType'],
      where: {
        botId,
        createdAt: { gte: startDate },
      },
      _count: true,
      orderBy: { _count: { eventType: 'desc' } },
    });

    return {
      status_distribution: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      event_types: eventTypes.map(type => ({
        type: type.eventType,
        count: type._count,
      })),
      total_events: stats.reduce((sum, stat) => sum + stat._count, 0),
    };
  }

  private getUpdateType(update: any): string {
    if (update.message) return 'message';
    if (update.callback_query) return 'callback_query';
    if (update.inline_query) return 'inline_query';
    if (update.chosen_inline_result) return 'chosen_inline_result';
    if (update.pre_checkout_query) return 'pre_checkout_query';
    if (update.successful_payment) return 'successful_payment';
    if (update.web_app_data) return 'web_app_data';
    if (update.my_chat_member) return 'my_chat_member';
    if (update.chat_member) return 'chat_member';
    if (update.chat_join_request) return 'chat_join_request';
    return 'unknown';
  }
}
