import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../integrations/stripe/stripe.service';
import { YooKassaService } from '../integrations/yookassa/yookassa.service';
import { EnvironmentVariables } from '../config/env.validation';
import { 
  Payment, 
  PaymentStatus, 
  PaymentProvider, 
  PaymentMethod,
  TransactionType,
  Subscription,
  SubscriptionStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Interfaces
export interface CreatePaymentRequest {
  userId: string;
  courseId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  description: string;
  paymentMethod?: PaymentMethod;
  provider: PaymentProvider;
  returnUrl?: string;
  metadata?: Record<string, any>;
  receiptEmail?: string;
  receiptData?: Record<string, any>;
}

export interface PaymentQuery {
  userId?: string;
  courseId?: string;
  subscriptionId?: string;
  status?: PaymentStatus;
  provider?: PaymentProvider;
  paymentMethod?: PaymentMethod;
  createdAfter?: Date;
  createdBefore?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'amount';
  orderDirection?: 'asc' | 'desc';
  includeRefunds?: boolean;
  includeTransactions?: boolean;
}

export interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
  paymentMethod?: PaymentMethod;
  provider: PaymentProvider;
  trialPeriodDays?: number;
  discountCode?: string;
  metadata?: Record<string, any>;
}

export interface ProcessRefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason: string;
  refundedBy: string;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averagePaymentAmount: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  topCourses: Array<{
    courseId: string;
    revenue: number;
    sales: number;
  }>;
  paymentMethodDistribution: Array<{
    method: PaymentMethod;
    count: number;
    percentage: number;
  }>;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly stripeService: StripeService,
    private readonly yooKassaService: YooKassaService
  ) {}

  /**
   * Создать платеж
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    this.logger.log(`Создание платежа: ${paymentData.amount} ${paymentData.currency}`, {
      userId: paymentData.userId,
      courseId: paymentData.courseId,
      provider: paymentData.provider,
    });

    // Валидируем сумму
    const minAmount = this.configService.get('MIN_PAYMENT_AMOUNT', 0.5);
    const maxAmount = this.configService.get('MAX_PAYMENT_AMOUNT', 10000);
    
    if (paymentData.amount < minAmount || paymentData.amount > maxAmount) {
      throw new BadRequestException(
        `Сумма платежа должна быть между ${minAmount} и ${maxAmount} ${paymentData.currency}`
      );
    }

    // Генерируем номер заказа
    const orderNumber = await this.generateOrderNumber();

    // Создаем платеж в БД
    const payment = await this.prisma.payment.create({
      data: {
        orderNumber,
        userId: paymentData.userId,
        courseId: paymentData.courseId,
        subscriptionId: paymentData.subscriptionId,
        amount: new Decimal(paymentData.amount),
        currency: paymentData.currency.toUpperCase(),
        description: paymentData.description,
        paymentMethod: paymentData.paymentMethod || PaymentMethod.CARD,
        provider: paymentData.provider,
        status: PaymentStatus.PENDING,
        returnUrl: paymentData.returnUrl,
        receiptData: paymentData.receiptData || {},
        metadata: {
          ...paymentData.metadata,
          receiptEmail: paymentData.receiptEmail,
          createdBy: 'payment-service',
        },
        statusHistory: [
          {
            status: PaymentStatus.PENDING,
            timestamp: new Date().toISOString(),
            comment: 'Payment created',
          },
        ],
      },
    });

    // Создаем платеж у провайдера
    try {
      const providerResponse = await this.createProviderPayment(payment, paymentData);
      
      // Обновляем данные платежа
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: providerResponse.externalId,
          confirmationUrl: providerResponse.confirmationUrl,
          providerData: providerResponse.providerData || {},
          status: providerResponse.status || PaymentStatus.PENDING,
          statusHistory: [
            ...payment.statusHistory as any[],
            {
              status: providerResponse.status || PaymentStatus.PENDING,
              timestamp: new Date().toISOString(),
              comment: `Provider payment created: ${providerResponse.externalId}`,
            },
          ],
        },
      });

      this.logger.log(`Платеж создан: ${payment.id} (${providerResponse.externalId})`);
      return updatedPayment;
      
    } catch (error) {
      // Обновляем статус на FAILED в случае ошибки
      await this.updatePaymentStatus(payment.id, PaymentStatus.FAILED, error.message);
      throw error;
    }
  }

  /**
   * Получить платеж по ID
   */
  async getPayment(paymentId: string, requesterId?: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: true,
        refunds: true,
        transactions: true,
      },
    });

    if (!payment) return null;

    // Проверяем права доступа
    if (requesterId && payment.userId !== requesterId) {
      throw new BadRequestException('Нет прав для просмотра этого платежа');
    }

    return payment;
  }

  /**
   * Получить платеж по номеру заказа
   */
  async getPaymentByOrderNumber(orderNumber: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { orderNumber },
      include: {
        subscription: true,
        refunds: true,
        transactions: true,
      },
    });
  }

  /**
   * Получить платежи пользователя
   */
  async getUserPayments(
    userId: string,
    query: Omit<PaymentQuery, 'userId'> = {}
  ): Promise<{ payments: Payment[]; total: number }> {
    const where: any = { userId };

    if (query.courseId) where.courseId = query.courseId;
    if (query.subscriptionId) where.subscriptionId = query.subscriptionId;
    if (query.status) where.status = query.status;
    if (query.provider) where.provider = query.provider;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.createdAfter) where.createdAt = { gte: query.createdAfter };
    if (query.createdBefore) where.createdAt = { ...where.createdAt, lte: query.createdBefore };
    if (query.amountMin || query.amountMax) {
      where.amount = {};
      if (query.amountMin) where.amount.gte = new Decimal(query.amountMin);
      if (query.amountMax) where.amount.lte = new Decimal(query.amountMax);
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { externalId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const include: any = {};
    if (query.includeRefunds) include.refunds = true;
    if (query.includeTransactions) include.transactions = true;

    const orderBy: any = {};
    orderBy[query.orderBy || 'createdAt'] = query.orderDirection || 'desc';

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include,
        orderBy,
        skip: query.offset || 0,
        take: query.limit || 50,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  /**
   * Обработать возврат
   */
  async processRefund(refundData: ProcessRefundRequest): Promise<any> {
    this.logger.log(`Обработка возврата для платежа: ${refundData.paymentId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: refundData.paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Можно возвратить только успешные платежи');
    }

    // Определяем сумму возврата
    const refundAmount = refundData.amount 
      ? new Decimal(refundData.amount) 
      : payment.amount;

    // Проверяем, что сумма не превышает оплаченную
    const totalRefunded = await this.getTotalRefunded(refundData.paymentId);
    const availableForRefund = payment.amount.minus(totalRefunded);

    if (refundAmount.gt(availableForRefund)) {
      throw new BadRequestException(
        `Нельзя вернуть ${refundAmount} - доступно только ${availableForRefund}`
      );
    }

    // Создаем запись о возврате
    const refund = await this.prisma.refund.create({
      data: {
        paymentId: refundData.paymentId,
        amount: refundAmount,
        currency: payment.currency,
        reason: refundData.reason,
        status: PaymentStatus.PENDING,
        requestedBy: refundData.refundedBy,
        metadata: refundData.metadata || {},
      },
    });

    // Обрабатываем возврат у провайдера
    try {
      const providerRefund = await this.createProviderRefund(payment, refund);
      
      // Обновляем данные возврата
      const updatedRefund = await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          externalId: providerRefund.externalId,
          status: providerRefund.status || PaymentStatus.PROCESSING,
          providerData: providerRefund.providerData || {},
        },
      });

      // Обновляем статус платежа
      const isFullRefund = refundAmount.equals(payment.amount);
      const newPaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
      
      await this.updatePaymentStatus(
        refundData.paymentId, 
        newPaymentStatus,
        `${isFullRefund ? 'Full' : 'Partial'} refund: ${refundAmount}`
      );

      this.logger.log(`Возврат обработан: ${refund.id} (${providerRefund.externalId})`);
      return updatedRefund;
      
    } catch (error) {
      // Обновляем статус возврата на FAILED
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw error;
    }
  }

  /**
   * Создать подписку
   */
  async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<Subscription> {
    this.logger.log(`Создание подписки: ${subscriptionData.planId}`, {
      userId: subscriptionData.userId,
      provider: subscriptionData.provider,
    });

    // Проверяем, нет ли активной подписки
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId: subscriptionData.userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
    });

    if (existingSubscription) {
      throw new ConflictException('У пользователя уже есть активная подписка');
    }

    // Создаем подписку у провайдера
    const providerSubscription = await this.createProviderSubscription(subscriptionData);

    // Создаем подписку в БД
    const subscription = await this.prisma.subscription.create({
      data: {
        externalId: providerSubscription.externalId,
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        status: providerSubscription.status || SubscriptionStatus.ACTIVE,
        currentPeriodStart: providerSubscription.currentPeriodStart || new Date(),
        currentPeriodEnd: providerSubscription.currentPeriodEnd || new Date(),
        provider: subscriptionData.provider,
        providerData: providerSubscription.providerData || {},
        metadata: subscriptionData.metadata || {},
      },
    });

    this.logger.log(`Подписка создана: ${subscription.id} (${providerSubscription.externalId})`);
    return subscription;
  }

  /**
   * Обновить статус платежа
   */
  async updatePaymentStatus(
    paymentId: string, 
    status: PaymentStatus, 
    comment?: string
  ): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    const statusHistory = [
      ...payment.statusHistory as any[],
      {
        status,
        timestamp: new Date().toISOString(),
        comment: comment || `Status updated to ${status}`,
      },
    ];

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status, 
        statusHistory,
        ...(status === PaymentStatus.SUCCEEDED && { completedAt: new Date() }),
      },
    });
  }

  /**
   * Получить статистику платежей
   */
  async getPaymentStats(
    startDate?: Date,
    endDate?: Date,
    courseId?: string,
    userId?: string
  ): Promise<PaymentStats> {
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (courseId) where.courseId = courseId;
    if (userId) where.userId = userId;

    const [
      totalRevenue,
      totalTransactions,
      successfulPayments,
      failedPayments,
      refundedAmount,
      paymentMethodStats,
      monthlyStats,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.SUCCEEDED },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.count({ where: { ...where, status: PaymentStatus.SUCCEEDED } }),
      this.prisma.payment.count({ 
        where: { ...where, status: { in: [PaymentStatus.FAILED, PaymentStatus.CANCELLED] } } 
      }),
      this.prisma.refund.aggregate({
        where: { 
          status: PaymentStatus.SUCCEEDED,
          payment: where,
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { ...where, status: PaymentStatus.SUCCEEDED },
        _count: { _all: true },
      }),
      // Здесь можно добавить группировку по месяцам
      this.getMonthlyStats(where),
    ]);

    const avgAmount = totalTransactions > 0 ? Number(totalRevenue._sum.amount || 0) / totalTransactions : 0;

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      totalTransactions,
      successfulPayments,
      failedPayments,
      refundedAmount: Number(refundedAmount._sum.amount || 0),
      averagePaymentAmount: avgAmount,
      revenueByMonth: monthlyStats.revenueByMonth,
      topCourses: monthlyStats.topCourses,
      paymentMethodDistribution: paymentMethodStats.map((stat, index) => ({
        method: stat.paymentMethod,
        count: stat._count._all,
        percentage: (stat._count._all / totalTransactions) * 100,
      })),
    };
  }

  /**
   * Обработать webhook от провайдера
   */
  async handleProviderWebhook(
    provider: PaymentProvider,
    webhookData: any,
    signature?: string
  ): Promise<void> {
    this.logger.log(`Получен webhook от ${provider}`);

    // Валидируем подпись webhook
    const isValid = await this.validateWebhookSignature(provider, webhookData, signature);
    if (!isValid) {
      throw new BadRequestException('Неверная подпись webhook');
    }

    // Обрабатываем событие в зависимости от провайдера
    switch (provider) {
      case PaymentProvider.STRIPE:
        await this.handleStripeWebhook(webhookData);
        break;
      case PaymentProvider.YOOKASSA:
        await this.handleYooKassaWebhook(webhookData);
        break;
      default:
        this.logger.warn(`Неизвестный провайдер webhook: ${provider}`);
    }
  }

  // Private methods

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GB-${timestamp}-${random}`;
  }

  private async createProviderPayment(payment: Payment, paymentData: CreatePaymentRequest): Promise<{
    externalId: string;
    confirmationUrl?: string;
    providerData?: any;
    status?: PaymentStatus;
  }> {
    switch (payment.provider) {
      case PaymentProvider.STRIPE:
        const stripePayment = await this.stripeService.createPaymentIntent({
          amount: Number(payment.amount) * 100, // Stripe uses cents
          currency: payment.currency,
          userId: payment.userId,
          courseId: payment.courseId || undefined,
          subscriptionId: payment.subscriptionId || undefined,
          description: payment.description,
          returnUrl: payment.returnUrl || undefined,
          metadata: paymentData.metadata || {},
        });
        
        return {
          externalId: stripePayment.id,
          confirmationUrl: stripePayment.clientSecret ? 
            `https://checkout.stripe.com/pay/${stripePayment.clientSecret}` : undefined,
          providerData: { clientSecret: stripePayment.clientSecret },
          status: this.mapStripeStatus(stripePayment.status),
        };

      case PaymentProvider.YOOKASSA:
        const yookassaPayment = await this.yooKassaService.createPayment({
          amount: Number(payment.amount),
          currency: payment.currency,
          description: payment.description,
          returnUrl: payment.returnUrl,
          metadata: paymentData.metadata || {},
        });
        
        return {
          externalId: yookassaPayment.id,
          confirmationUrl: yookassaPayment.confirmation?.confirmation_url,
          providerData: yookassaPayment,
          status: this.mapYooKassaStatus(yookassaPayment.status),
        };

      default:
        throw new BadRequestException(`Неподдерживаемый провайдер: ${payment.provider}`);
    }
  }

  private async createProviderRefund(payment: Payment, refund: any): Promise<{
    externalId: string;
    providerData?: any;
    status?: PaymentStatus;
  }> {
    switch (payment.provider) {
      case PaymentProvider.STRIPE:
        if (!payment.externalId) {
          throw new BadRequestException('У платежа нет внешнего ID для возврата');
        }
        
        const stripeRefund = await this.stripeService.createRefund({
          paymentIntentId: payment.externalId,
          amount: Math.round(Number(refund.amount) * 100), // Stripe uses cents
          reason: refund.reason,
          metadata: refund.metadata || {},
        });
        
        return {
          externalId: stripeRefund.id,
          providerData: stripeRefund,
          status: this.mapStripeRefundStatus(stripeRefund.status),
        };

      case PaymentProvider.YOOKASSA:
        const yookassaRefund = await this.yooKassaService.createRefund({
          paymentId: payment.externalId!,
          amount: Number(refund.amount),
        });
        
        return {
          externalId: yookassaRefund.id,
          providerData: yookassaRefund,
          status: this.mapYooKassaStatus(yookassaRefund.status),
        };

      default:
        throw new BadRequestException(`Возврат не поддерживается для провайдера: ${payment.provider}`);
    }
  }

  private async createProviderSubscription(subscriptionData: CreateSubscriptionRequest): Promise<{
    externalId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    providerData?: any;
  }> {
    switch (subscriptionData.provider) {
      case PaymentProvider.STRIPE:
        const stripeSubscription = await this.stripeService.createSubscription({
          customerId: subscriptionData.userId,
          priceId: subscriptionData.planId,
          trialPeriodDays: subscriptionData.trialPeriodDays,
          metadata: subscriptionData.metadata || {},
        });
        
        return {
          externalId: stripeSubscription.id,
          status: this.mapStripeSubscriptionStatus(stripeSubscription.status),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          providerData: stripeSubscription,
        };

      default:
        throw new BadRequestException(`Подписки не поддерживаются для провайдера: ${subscriptionData.provider}`);
    }
  }

  private async getTotalRefunded(paymentId: string): Promise<Decimal> {
    const result = await this.prisma.refund.aggregate({
      where: {
        paymentId,
        status: PaymentStatus.SUCCEEDED,
      },
      _sum: { amount: true },
    });
    
    return new Decimal(result._sum.amount || 0);
  }

  private async validateWebhookSignature(
    provider: PaymentProvider,
    webhookData: any,
    signature?: string
  ): Promise<boolean> {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return this.stripeService.verifyWebhookSignature(webhookData, signature || '');
      case PaymentProvider.YOOKASSA:
        return this.yooKassaService.verifyWebhookSignature(webhookData, signature || '');
      default:
        return false;
    }
  }

  private async handleStripeWebhook(webhookData: any): Promise<void> {
    const { type, data } = webhookData;
    
    switch (type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(PaymentProvider.STRIPE, data.object.id);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(PaymentProvider.STRIPE, data.object.id);
        break;
      default:
        this.logger.debug(`Необработанное событие Stripe: ${type}`);
    }
  }

  private async handleYooKassaWebhook(webhookData: any): Promise<void> {
    const { event, object } = webhookData;
    
    switch (event) {
      case 'payment.succeeded':
        await this.handlePaymentSuccess(PaymentProvider.YOOKASSA, object.id);
        break;
      case 'payment.canceled':
        await this.handlePaymentFailure(PaymentProvider.YOOKASSA, object.id);
        break;
      default:
        this.logger.debug(`Необработанное событие YooKassa: ${event}`);
    }
  }

  private async handlePaymentSuccess(provider: PaymentProvider, externalId: string): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        externalId,
        provider,
      },
    });

    if (payment) {
      await this.updatePaymentStatus(payment.id, PaymentStatus.SUCCEEDED, 'Payment confirmed by provider');
      this.logger.log(`Платеж подтвержден: ${payment.id} (${externalId})`);
    }
  }

  private async handlePaymentFailure(provider: PaymentProvider, externalId: string): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        externalId,
        provider,
      },
    });

    if (payment) {
      await this.updatePaymentStatus(payment.id, PaymentStatus.FAILED, 'Payment failed at provider');
      this.logger.log(`Платеж отклонен: ${payment.id} (${externalId})`);
    }
  }

  private async getMonthlyStats(where: any): Promise<{
    revenueByMonth: Array<{ month: string; revenue: number; transactions: number }>;
    topCourses: Array<{ courseId: string; revenue: number; sales: number }>;
  }> {
    // Упрощенная версия - в реальности нужно более сложные запросы
    return {
      revenueByMonth: [],
      topCourses: [],
    };
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded': return PaymentStatus.SUCCEEDED;
      case 'processing': return PaymentStatus.PROCESSING;
      case 'canceled': return PaymentStatus.CANCELLED;
      case 'requires_payment_method': return PaymentStatus.FAILED;
      default: return PaymentStatus.PENDING;
    }
  }

  private mapYooKassaStatus(yookassaStatus: string): PaymentStatus {
    switch (yookassaStatus) {
      case 'succeeded': return PaymentStatus.SUCCEEDED;
      case 'pending': return PaymentStatus.PROCESSING;
      case 'canceled': return PaymentStatus.CANCELLED;
      default: return PaymentStatus.PENDING;
    }
  }

  private mapStripeRefundStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded': return PaymentStatus.SUCCEEDED;
      case 'pending': return PaymentStatus.PROCESSING;
      case 'failed': return PaymentStatus.FAILED;
      default: return PaymentStatus.PENDING;
    }
  }

  private mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active': return SubscriptionStatus.ACTIVE;
      case 'trialing': return SubscriptionStatus.TRIALING;
      case 'past_due': return SubscriptionStatus.PAST_DUE;
      case 'canceled': return SubscriptionStatus.CANCELLED;
      case 'unpaid': return SubscriptionStatus.UNPAID;
      default: return SubscriptionStatus.INCOMPLETE;
    }
  }
}
