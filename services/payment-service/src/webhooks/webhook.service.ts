import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../database/prisma.service';
import { PaymentStatus, PaymentProvider, SubscriptionStatus } from '@prisma/client';

interface WebhookResult {
  eventId: string;
  eventType: string;
  processed: boolean;
  message?: string;
}

interface TestWebhookRequest {
  provider: 'stripe' | 'yookassa';
  eventType: string;
  paymentId?: string;
  data?: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private stripe?: Stripe;
  private stripeWebhookSecret?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {
    // Инициализируем Stripe, если настроен
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    this.stripeWebhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      this.logger.log('✅ Stripe webhook handler инициализирован');
    }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult> {
    if (!this.stripe || !this.stripeWebhookSecret) {
      throw new BadRequestException('Stripe не настроен');
    }

    let event: Stripe.Event;

    try {
      // Проверяем подпись webhook'а
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeWebhookSecret
      );
    } catch (err) {
      this.logger.error(`❌ Ошибка проверки подписи Stripe webhook: ${err.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    this.logger.debug(`📥 Stripe webhook событие: ${event.type}`, {
      eventId: event.id,
      livemode: event.livemode,
    });

    try {
      // Сохраняем событие в БД для дедупликации
      await this.saveWebhookEvent(event.id, event.type, PaymentProvider.STRIPE, event);

      let processed = false;

      switch (event.type) {
        case 'payment_intent.succeeded':
          processed = await this.handleStripePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          processed = await this.handleStripePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          processed = await this.handleStripePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.dispute.created':
          processed = await this.handleStripeChargeDispute(event.data.object as Stripe.Dispute);
          break;

        case 'invoice.payment_succeeded':
          processed = await this.handleStripeInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          processed = await this.handleStripeInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.created':
          processed = await this.handleStripeSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          processed = await this.handleStripeSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          processed = await this.handleStripeSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          this.logger.log(`ℹ️ Неизвестное Stripe событие: ${event.type}. Игнорируем.`);
          processed = false;
      }

      // Обновляем статус обработки события
      await this.updateWebhookEvent(event.id, processed);

      return {
        eventId: event.id,
        eventType: event.type,
        processed,
        message: processed ? 'Событие обработано успешно' : 'Событие проигнорировано',
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe webhook ${event.type}:`, error);
      await this.updateWebhookEvent(event.id, false, error.message);
      throw new InternalServerErrorException('Ошибка обработки webhook');
    }
  }

  async handleYooKassaWebhook(body: any, headers: Record<string, string>): Promise<WebhookResult> {
    this.logger.debug('📥 YooKassa webhook событие', {
      type: body.event,
      objectId: body.object?.id,
    });

    try {
      const eventId = `yookassa_${body.object?.id || Date.now()}_${body.event}`;
      
      // Сохраняем событие в БД для дедупликации
      await this.saveWebhookEvent(eventId, body.event, PaymentProvider.YOOKASSA, body);

      let processed = false;

      switch (body.event) {
        case 'payment.succeeded':
          processed = await this.handleYooKassaPaymentSucceeded(body.object);
          break;

        case 'payment.canceled':
          processed = await this.handleYooKassaPaymentCanceled(body.object);
          break;

        case 'payment.waiting_for_capture':
          processed = await this.handleYooKassaPaymentWaitingForCapture(body.object);
          break;

        case 'refund.succeeded':
          processed = await this.handleYooKassaRefundSucceeded(body.object);
          break;

        case 'refund.canceled':
          processed = await this.handleYooKassaRefundCanceled(body.object);
          break;

        default:
          this.logger.log(`ℹ️ Неизвестное YooKassa событие: ${body.event}. Игнорируем.`);
          processed = false;
      }

      // Обновляем статус обработки события
      await this.updateWebhookEvent(eventId, processed);

      return {
        eventId,
        eventType: body.event,
        processed,
        message: processed ? 'Событие обработано успешно' : 'Событие проигнорировано',
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки YooKassa webhook:`, error);
      throw new InternalServerErrorException('Ошибка обработки webhook');
    }
  }

  async handleTestWebhook(request: TestWebhookRequest): Promise<WebhookResult> {
    this.logger.log(`🧪 Обработка test webhook: ${request.provider} - ${request.eventType}`);

    const eventId = `test_${Date.now()}_${request.eventType}`;

    try {
      await this.saveWebhookEvent(eventId, request.eventType, 
        request.provider === 'stripe' ? PaymentProvider.STRIPE : PaymentProvider.YOOKASSA, 
        request.data
      );

      let processed = false;

      // Имитируем обработку различных событий
      if (request.eventType === 'payment.succeeded' && request.paymentId) {
        // Обновляем статус тестового платежа
        await this.prisma.payment.updateMany({
          where: { 
            OR: [
              { id: request.paymentId },
              { externalId: request.paymentId },
              { orderNumber: request.paymentId },
            ]
          },
          data: {
            status: PaymentStatus.COMPLETED,
            completedAt: new Date(),
            providerData: {
              ...request.data,
              testWebhook: true,
            },
          },
        });

        this.logger.log(`✅ Test: Платеж ${request.paymentId} отмечен как успешный`);
        processed = true;
      }

      await this.updateWebhookEvent(eventId, processed);

      return {
        eventId,
        eventType: request.eventType,
        processed,
        message: processed ? 'Test webhook обработан успешно' : 'Test webhook проигнорирован',
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки test webhook:`, error);
      await this.updateWebhookEvent(eventId, false, error.message);
      throw new InternalServerErrorException('Ошибка обработки test webhook');
    }
  }

  // Stripe Event Handlers
  private async handleStripePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<boolean> {
    try {
      const updated = await this.prisma.payment.updateMany({
        where: { externalId: paymentIntent.id },
        data: {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(),
          providerData: paymentIntent as any,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`✅ Stripe: Платеж ${paymentIntent.id} помечен как успешный`);
        
        // Можно добавить дополнительную логику (отправка email, активация курса и т.д.)
        await this.onPaymentSuccess(paymentIntent.id);
        
        return true;
      } else {
        this.logger.warn(`⚠️ Stripe: Платеж ${paymentIntent.id} не найден в БД`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe payment.succeeded:`, error);
      throw error;
    }
  }

  private async handleStripePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<boolean> {
    try {
      const updated = await this.prisma.payment.updateMany({
        where: { externalId: paymentIntent.id },
        data: {
          status: PaymentStatus.FAILED,
          providerData: paymentIntent as any,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`❌ Stripe: Платеж ${paymentIntent.id} помечен как неуспешный`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe payment.failed:`, error);
      throw error;
    }
  }

  private async handleStripePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<boolean> {
    try {
      const updated = await this.prisma.payment.updateMany({
        where: { externalId: paymentIntent.id },
        data: {
          status: PaymentStatus.CANCELLED,
          providerData: paymentIntent as any,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`🚫 Stripe: Платеж ${paymentIntent.id} отменен`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe payment.canceled:`, error);
      throw error;
    }
  }

  private async handleStripeChargeDispute(dispute: Stripe.Dispute): Promise<boolean> {
    try {
      // Создаем запись о диспуте/чарджбеке
      this.logger.warn(`⚠️ Stripe: Создан диспут для charge ${dispute.charge}`, {
        disputeId: dispute.id,
        amount: dispute.amount,
        reason: dispute.reason,
      });

      // Можно добавить логику уведомлений админов
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe dispute:`, error);
      throw error;
    }
  }

  private async handleStripeInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<boolean> {
    try {
      if (invoice.subscription) {
        // Обновляем статус подписки при успешной оплате инвойса
        await this.prisma.subscription.updateMany({
          where: { externalId: invoice.subscription as string },
          data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(invoice.period_start * 1000),
            currentPeriodEnd: new Date(invoice.period_end * 1000),
          },
        });

        this.logger.log(`✅ Stripe: Подписка ${invoice.subscription} активирована через инвойс`);
      }
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe invoice.payment_succeeded:`, error);
      throw error;
    }
  }

  private async handleStripeInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<boolean> {
    try {
      if (invoice.subscription) {
        // Помечаем подписку как просроченную при неуспешной оплате инвойса
        await this.prisma.subscription.updateMany({
          where: { externalId: invoice.subscription as string },
          data: {
            status: SubscriptionStatus.PAST_DUE,
          },
        });

        this.logger.warn(`⚠️ Stripe: Подписка ${invoice.subscription} просрочена из-за неуспешной оплаты инвойса`);
      }
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe invoice.payment_failed:`, error);
      throw error;
    }
  }

  private async handleStripeSubscriptionCreated(subscription: Stripe.Subscription): Promise<boolean> {
    try {
      await this.prisma.subscription.updateMany({
        where: { externalId: subscription.id },
        data: {
          status: subscription.status === 'active' ? SubscriptionStatus.ACTIVE : 
                 subscription.status === 'trialing' ? SubscriptionStatus.TRIALING :
                 subscription.status === 'past_due' ? SubscriptionStatus.PAST_DUE :
                 subscription.status === 'canceled' ? SubscriptionStatus.CANCELLED :
                 subscription.status === 'unpaid' ? SubscriptionStatus.UNPAID : SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          providerData: subscription as any,
        },
      });

      this.logger.log(`✅ Stripe: Подписка ${subscription.id} создана/обновлена`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe subscription.created:`, error);
      throw error;
    }
  }

  private async handleStripeSubscriptionUpdated(subscription: Stripe.Subscription): Promise<boolean> {
    return this.handleStripeSubscriptionCreated(subscription); // Аналогичная логика
  }

  private async handleStripeSubscriptionDeleted(subscription: Stripe.Subscription): Promise<boolean> {
    try {
      await this.prisma.subscription.updateMany({
        where: { externalId: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          canceledAt: new Date(),
          providerData: subscription as any,
        },
      });

      this.logger.log(`🚫 Stripe: Подписка ${subscription.id} отменена`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки Stripe subscription.deleted:`, error);
      throw error;
    }
  }

  // YooKassa Event Handlers
  private async handleYooKassaPaymentSucceeded(payment: any): Promise<boolean> {
    try {
      const updated = await this.prisma.payment.updateMany({
        where: { externalId: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(),
          providerData: payment,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`✅ YooKassa: Платеж ${payment.id} помечен как успешный`);
        
        await this.onPaymentSuccess(payment.id);
        
        return true;
      } else {
        this.logger.warn(`⚠️ YooKassa: Платеж ${payment.id} не найден в БД`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки YooKassa payment.succeeded:`, error);
      throw error;
    }
  }

  private async handleYooKassaPaymentCanceled(payment: any): Promise<boolean> {
    try {
      const updated = await this.prisma.payment.updateMany({
        where: { externalId: payment.id },
        data: {
          status: PaymentStatus.CANCELLED,
          providerData: payment,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`🚫 YooKassa: Платеж ${payment.id} отменен`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки YooKassa payment.canceled:`, error);
      throw error;
    }
  }

  private async handleYooKassaPaymentWaitingForCapture(payment: any): Promise<boolean> {
    try {
      const updated = await this.prisma.payment.updateMany({
        where: { externalId: payment.id },
        data: {
          status: PaymentStatus.PROCESSING,
          providerData: payment,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`⏳ YooKassa: Платеж ${payment.id} ожидает подтверждения`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки YooKassa payment.waiting_for_capture:`, error);
      throw error;
    }
  }

  private async handleYooKassaRefundSucceeded(refund: any): Promise<boolean> {
    try {
      const updated = await this.prisma.refund.updateMany({
        where: { externalId: refund.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          providerData: refund,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`✅ YooKassa: Возврат ${refund.id} выполнен успешно`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки YooKassa refund.succeeded:`, error);
      throw error;
    }
  }

  private async handleYooKassaRefundCanceled(refund: any): Promise<boolean> {
    try {
      const updated = await this.prisma.refund.updateMany({
        where: { externalId: refund.id },
        data: {
          status: 'FAILED',
          providerData: refund,
        },
      });

      if (updated.count > 0) {
        this.logger.log(`❌ YooKassa: Возврат ${refund.id} отменен`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки YooKassa refund.canceled:`, error);
      throw error;
    }
  }

  // Utility Methods
  private async saveWebhookEvent(
    eventId: string,
    eventType: string,
    provider: PaymentProvider,
    data: any
  ): Promise<void> {
    try {
      // Проверяем, не обрабатывали ли мы уже это событие (дедупликация)
      const existingEvent = await this.prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent) {
        this.logger.log(`ℹ️ Webhook событие ${eventId} уже было обработано`);
        return;
      }

      await this.prisma.webhookEvent.create({
        data: {
          eventId,
          eventType,
          provider,
          data,
          processed: false,
          receivedAt: new Date(),
        },
      });

      this.logger.debug(`📝 Webhook событие ${eventId} сохранено`);
    } catch (error) {
      this.logger.error(`❌ Ошибка сохранения webhook события:`, error);
      // Не бросаем ошибку, чтобы не блокировать обработку
    }
  }

  private async updateWebhookEvent(
    eventId: string,
    processed: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: {
          processed,
          processedAt: processed ? new Date() : null,
          errorMessage: errorMessage || null,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`🔄 Webhook событие ${eventId} обновлено: processed=${processed}`);
    } catch (error) {
      this.logger.error(`❌ Ошибка обновления webhook события:`, error);
      // Не бросаем ошибку, чтобы не блокировать обработку
    }
  }

  private async onPaymentSuccess(externalPaymentId: string): Promise<void> {
    try {
      // Дополнительная логика при успешном платеже
      // Например: отправка email, активация курса, уведомления и т.д.
      
      const payment = await this.prisma.payment.findFirst({
        where: { externalId: externalPaymentId },
        include: {
          course: true,
        },
      });

      if (payment) {
        this.logger.log(`🎉 Платеж успешно завершен: ${payment.orderNumber}`, {
          userId: payment.userId,
          amount: payment.amount,
          currency: payment.currency,
          courseId: payment.courseId,
        });

        // Здесь можно добавить:
        // - Отправку email уведомлений
        // - Активацию доступа к курсу
        // - Запись в системе аналитики
        // - Webhook'и на другие сервисы
      }
    } catch (error) {
      this.logger.error(`❌ Ошибка в onPaymentSuccess:`, error);
      // Не бросаем ошибку, чтобы не блокировать основную обработку webhook'а
    }
  }
}
