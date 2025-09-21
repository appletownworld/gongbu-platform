import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TelegramPaymentRequest {
  botId: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  amount: number;
  currency: string;
  description: string;
  providerToken: string;
  startParameter?: string;
  payload?: string;
}

export interface TelegramPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  invoiceId?: string;
  error?: string;
}

@Injectable()
export class TelegramPaymentService {
  private readonly logger = new Logger(TelegramPaymentService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  /**
   * Создать платеж через Telegram Payment API
   */
  async createTelegramPayment(paymentData: TelegramPaymentRequest): Promise<TelegramPaymentResponse> {
    this.logger.log(`Создание Telegram платежа: ${paymentData.amount} ${paymentData.currency}`, {
      botId: paymentData.botId,
      userId: paymentData.userId,
      courseId: paymentData.courseId,
    });

    try {
      // Получаем данные бота
      const bot = await this.prisma.courseBots.findUnique({
        where: { id: paymentData.botId },
      });

      if (!bot) {
        throw new BadRequestException('Бот не найден');
      }

      // Создаем платеж в нашей системе
      const payment = await this.createPaymentRecord(paymentData);

      // Создаем инвойс в Telegram
      const invoice = await this.createTelegramInvoice(bot.botToken, {
        title: paymentData.description,
        description: `Оплата за курс: ${paymentData.description}`,
        payload: payment.id,
        provider_token: paymentData.providerToken,
        currency: paymentData.currency,
        prices: [
          {
            label: paymentData.description,
            amount: Math.round(paymentData.amount * 100), // Telegram использует копейки
          },
        ],
        start_parameter: paymentData.startParameter,
      });

      // Обновляем платеж с данными Telegram
      await this.updatePaymentWithTelegramData(payment.id, invoice);

      this.logger.log(`Telegram платеж создан: ${payment.id} (${invoice.invoice_id})`);

      return {
        success: true,
        paymentUrl: `https://t.me/${bot.botUsername}?start=pay_${payment.id}`,
        invoiceId: invoice.invoice_id,
      };
    } catch (error) {
      this.logger.error(`Ошибка создания Telegram платежа: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Обработать успешный платеж от Telegram
   */
  async handleSuccessfulPayment(
    botId: string,
    telegramPayment: any,
    preCheckoutQuery?: any
  ): Promise<void> {
    this.logger.log(`Обработка успешного платежа: ${telegramPayment.invoice_payload}`);

    try {
      // Находим платеж по payload
      const payment = await this.prisma.payment.findUnique({
        where: { id: telegramPayment.invoice_payload },
        include: { subscription: true },
      });

      if (!payment) {
        throw new BadRequestException('Платеж не найден');
      }

      // Обновляем статус платежа
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          completedAt: new Date(),
          providerData: {
            ...payment.providerData as any,
            telegramPayment,
            preCheckoutQuery,
          },
          statusHistory: [
            ...(payment.statusHistory as any[]),
            {
              status: 'SUCCEEDED',
              timestamp: new Date().toISOString(),
              comment: 'Payment completed via Telegram',
            },
          ],
        },
      });

      // Предоставляем доступ к курсу/уроку
      await this.grantCourseAccess(payment.userId, payment.courseId, payment.lessonId);

      // Отправляем уведомление пользователю
      await this.sendPaymentSuccessNotification(botId, payment.userId, payment);

      this.logger.log(`Платеж успешно обработан: ${payment.id}`);
    } catch (error) {
      this.logger.error(`Ошибка обработки платежа: ${error.message}`);
      throw error;
    }
  }

  /**
   * Обработать неуспешный платеж
   */
  async handleFailedPayment(
    botId: string,
    paymentId: string,
    errorMessage: string
  ): Promise<void> {
    this.logger.log(`Обработка неуспешного платежа: ${paymentId}`);

    try {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          statusHistory: [
            ...(await this.prisma.payment.findUnique({
              where: { id: paymentId },
              select: { statusHistory: true },
            }))?.statusHistory as any[] || [],
            {
              status: 'FAILED',
              timestamp: new Date().toISOString(),
              comment: `Payment failed: ${errorMessage}`,
            },
          ],
        },
      });

      // Отправляем уведомление пользователю
      await this.sendPaymentFailureNotification(botId, paymentId, errorMessage);

      this.logger.log(`Неуспешный платеж обработан: ${paymentId}`);
    } catch (error) {
      this.logger.error(`Ошибка обработки неуспешного платежа: ${error.message}`);
    }
  }

  /**
   * Получить статистику платежей бота
   */
  async getBotPaymentStats(botId: string, period: '1d' | '7d' | '30d' = '7d') {
    const days = { '1d': 1, '7d': 7, '30d': 30 }[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new BadRequestException('Бот не найден');
    }

    const stats = await this.prisma.payment.aggregate({
      where: {
        courseId: bot.courseId,
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const successfulPayments = await this.prisma.payment.count({
      where: {
        courseId: bot.courseId,
        status: 'SUCCEEDED',
        createdAt: { gte: startDate },
      },
    });

    const failedPayments = await this.prisma.payment.count({
      where: {
        courseId: bot.courseId,
        status: { in: ['FAILED', 'CANCELLED'] },
        createdAt: { gte: startDate },
      },
    });

    return {
      totalRevenue: Number(stats._sum.amount || 0),
      totalTransactions: stats._count._all,
      successfulPayments,
      failedPayments,
      successRate: stats._count._all > 0 ? (successfulPayments / stats._count._all) * 100 : 0,
      averageAmount: stats._count._all > 0 ? Number(stats._sum.amount || 0) / stats._count._all : 0,
    };
  }

  // Приватные методы

  private async createPaymentRecord(paymentData: TelegramPaymentRequest) {
    return this.prisma.payment.create({
      data: {
        orderNumber: await this.generateOrderNumber(),
        userId: paymentData.userId,
        courseId: paymentData.courseId,
        lessonId: paymentData.lessonId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        paymentMethod: 'TELEGRAM',
        provider: 'TELEGRAM',
        status: 'PENDING',
        metadata: {
          botId: paymentData.botId,
          startParameter: paymentData.startParameter,
          payload: paymentData.payload,
        },
        statusHistory: [
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            comment: 'Telegram payment created',
          },
        ],
      },
    });
  }

  private async createTelegramInvoice(botToken: string, invoiceData: any) {
    const response = await firstValueFrom(
      this.httpService.post(`https://api.telegram.org/bot${botToken}/sendInvoice`, invoiceData)
    );

    if (!response.data.ok) {
      throw new BadRequestException(`Telegram API error: ${response.data.description}`);
    }

    return response.data.result;
  }

  private async updatePaymentWithTelegramData(paymentId: string, invoice: any) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        externalId: invoice.invoice_id,
        providerData: {
          telegramInvoice: invoice,
        },
        statusHistory: [
          ...(await this.prisma.payment.findUnique({
            where: { id: paymentId },
            select: { statusHistory: true },
          }))?.statusHistory as any[] || [],
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            comment: `Telegram invoice created: ${invoice.invoice_id}`,
          },
        ],
      },
    });
  }

  private async grantCourseAccess(userId: string, courseId: string, lessonId?: string) {
    // Создаем запись о доступе к курсу
    await this.prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        hasAccess: true,
        accessGrantedAt: new Date(),
      },
      create: {
        userId,
        courseId,
        hasAccess: true,
        accessGrantedAt: new Date(),
        enrolledAt: new Date(),
      },
    });

    // Если это доступ к конкретному уроку
    if (lessonId) {
      await this.prisma.lessonAccess.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          hasAccess: true,
          accessGrantedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          hasAccess: true,
          accessGrantedAt: new Date(),
        },
      });
    }

    this.logger.log(`Доступ предоставлен: ${userId} -> ${courseId}${lessonId ? ` -> ${lessonId}` : ''}`);
  }

  private async sendPaymentSuccessNotification(botId: string, userId: string, payment: any) {
    try {
      const bot = await this.prisma.courseBots.findUnique({
        where: { id: botId },
      });

      if (!bot) return;

      const message = `✅ *Платеж успешно выполнен!*

💰 Сумма: ${payment.amount} ${payment.currency}
📚 Курс: ${payment.description}
📅 Дата: ${new Date().toLocaleDateString('ru-RU')}

Теперь у вас есть доступ к курсу! Используйте /start для продолжения обучения.`;

      // Отправляем сообщение через Telegram API
      await firstValueFrom(
        this.httpService.post(`https://api.telegram.org/bot${bot.botToken}/sendMessage`, {
          chat_id: userId,
          text: message,
          parse_mode: 'Markdown',
        })
      );

      this.logger.log(`Уведомление об успешном платеже отправлено: ${userId}`);
    } catch (error) {
      this.logger.error(`Ошибка отправки уведомления: ${error.message}`);
    }
  }

  private async sendPaymentFailureNotification(botId: string, paymentId: string, errorMessage: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) return;

      const bot = await this.prisma.courseBots.findUnique({
        where: { id: botId },
      });

      if (!bot) return;

      const message = `❌ *Платеж не выполнен*

💰 Сумма: ${payment.amount} ${payment.currency}
📚 Курс: ${payment.description}
⚠️ Причина: ${errorMessage}

Попробуйте еще раз или обратитесь в поддержку.`;

      await firstValueFrom(
        this.httpService.post(`https://api.telegram.org/bot${bot.botToken}/sendMessage`, {
          chat_id: payment.userId,
          text: message,
          parse_mode: 'Markdown',
        })
      );

      this.logger.log(`Уведомление о неуспешном платеже отправлено: ${payment.userId}`);
    } catch (error) {
      this.logger.error(`Ошибка отправки уведомления о неуспешном платеже: ${error.message}`);
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TG-${timestamp}-${random}`;
  }
}
