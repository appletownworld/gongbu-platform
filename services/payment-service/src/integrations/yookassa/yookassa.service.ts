import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env.validation';
import { createHash, createHmac } from 'crypto';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Interfaces
export interface YooKassaPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
  capture?: boolean;
  confirmation?: {
    type: 'redirect';
    return_url?: string;
  };
  receipt?: {
    customer: {
      email: string;
    };
    items: Array<{
      description: string;
      amount: {
        value: string;
        currency: string;
      };
      vat_code: number;
      quantity: string;
    }>;
  };
}

export interface YooKassaPaymentResponse {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  recipient: {
    account_id: string;
    gateway_id: string;
  };
  payment_method?: {
    type: string;
    id: string;
  };
  confirmation?: {
    type: string;
    confirmation_url: string;
  };
  created_at: string;
  metadata?: Record<string, any>;
}

export interface YooKassaRefundRequest {
  paymentId: string;
  amount: number;
  currency?: string;
  description?: string;
  receipt?: any;
}

export interface YooKassaRefundResponse {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  created_at: string;
  payment_id: string;
  description?: string;
}

export interface YooKassaWebhookEvent {
  type: 'notification';
  event: 'payment.succeeded' | 'payment.canceled' | 'payment.waiting_for_capture' | 'refund.succeeded';
  object: YooKassaPaymentResponse | YooKassaRefundResponse;
}

@Injectable()
export class YooKassaService {
  private readonly logger = new Logger(YooKassaService.name);
  private readonly client: AxiosInstance;
  private readonly shopId: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    this.shopId = this.configService.get('YOOKASSA_SHOP_ID', '');
    this.secretKey = this.configService.get('YOOKASSA_SECRET_KEY', '');
    this.webhookSecret = this.configService.get('YOOKASSA_WEBHOOK_SECRET', '');

    if (!this.shopId || !this.secretKey) {
      this.logger.warn('YooKassa credentials not configured - service disabled');
      return;
    }

    this.client = axios.create({
      baseURL: 'https://api.yookassa.ru/v3',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': () => this.generateIdempotenceKey(),
      },
      auth: {
        username: this.shopId,
        password: this.secretKey,
      },
      timeout: 30000,
    });

    // Request interceptor для добавления Idempotence-Key
    this.client.interceptors.request.use((config) => {
      if (config.method === 'post' && !config.headers['Idempotence-Key']) {
        config.headers['Idempotence-Key'] = this.generateIdempotenceKey();
      }
      return config;
    });

    // Response interceptor для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('YooKassa API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.response?.status === 401) {
          throw new BadRequestException('Неверные учетные данные YooKassa');
        }

        if (error.response?.status === 422) {
          const errorMessage = error.response.data?.description || 'Неверные данные запроса';
          throw new BadRequestException(`YooKassa error: ${errorMessage}`);
        }

        throw new InternalServerErrorException('Ошибка YooKassa API');
      }
    );

    this.logger.log('✅ YooKassa service initialized');
  }

  /**
   * Проверить доступность сервиса
   */
  isEnabled(): boolean {
    return !!this.shopId && !!this.secretKey;
  }

  /**
   * Создать платеж
   */
  async createPayment(request: YooKassaPaymentRequest): Promise<YooKassaPaymentResponse> {
    if (!this.isEnabled()) {
      throw new BadRequestException('YooKassa не настроена');
    }

    try {
      this.logger.debug(`Создание YooKassa платежа на ${request.amount} ${request.currency}`, {
        description: request.description,
      });

      const paymentData = {
        amount: {
          value: request.amount.toFixed(2),
          currency: request.currency.toUpperCase(),
        },
        description: request.description,
        confirmation: request.confirmation || {
          type: 'redirect',
          return_url: request.returnUrl || 'https://gongbu.app/payment/success',
        },
        capture: request.capture !== false, // По умолчанию true
        metadata: request.metadata || {},
        ...(request.receipt && { receipt: request.receipt }),
      };

      const response: AxiosResponse<YooKassaPaymentResponse> = await this.client.post(
        '/payments',
        paymentData
      );

      this.logger.log(`✅ YooKassa платеж создан: ${response.data.id}`);

      return response.data;
    } catch (error) {
      this.logger.error('❌ Ошибка создания YooKassa платежа:', error);
      throw error;
    }
  }

  /**
   * Получить информацию о платеже
   */
  async getPayment(paymentId: string): Promise<YooKassaPaymentResponse> {
    if (!this.isEnabled()) {
      throw new BadRequestException('YooKassa не настроена');
    }

    try {
      const response: AxiosResponse<YooKassaPaymentResponse> = await this.client.get(
        `/payments/${paymentId}`
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Ошибка получения платежа ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Подтвердить платеж (capture)
   */
  async capturePayment(paymentId: string, amount?: number): Promise<YooKassaPaymentResponse> {
    if (!this.isEnabled()) {
      throw new BadRequestException('YooKassa не настроена');
    }

    try {
      this.logger.debug(`Подтверждение YooKassa платежа: ${paymentId}`);

      const captureData = amount ? {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB', // По умолчанию - можно параметризовать
        },
      } : {};

      const response: AxiosResponse<YooKassaPaymentResponse> = await this.client.post(
        `/payments/${paymentId}/capture`,
        captureData
      );

      this.logger.log(`✅ YooKassa платеж подтвержден: ${paymentId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Ошибка подтверждения платежа ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Отменить платеж
   */
  async cancelPayment(paymentId: string): Promise<YooKassaPaymentResponse> {
    if (!this.isEnabled()) {
      throw new BadRequestException('YooKassa не настроена');
    }

    try {
      this.logger.debug(`Отмена YooKassa платежа: ${paymentId}`);

      const response: AxiosResponse<YooKassaPaymentResponse> = await this.client.post(
        `/payments/${paymentId}/cancel`
      );

      this.logger.log(`✅ YooKassa платеж отменен: ${paymentId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Ошибка отмены платежа ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Создать возврат
   */
  async createRefund(request: YooKassaRefundRequest): Promise<YooKassaRefundResponse> {
    if (!this.isEnabled()) {
      throw new BadRequestException('YooKassa не настроена');
    }

    try {
      this.logger.debug(`Создание возврата YooKassa для платежа: ${request.paymentId}`);

      const refundData = {
        payment_id: request.paymentId,
        amount: {
          value: request.amount.toFixed(2),
          currency: request.currency || 'RUB',
        },
        ...(request.description && { description: request.description }),
        ...(request.receipt && { receipt: request.receipt }),
      };

      const response: AxiosResponse<YooKassaRefundResponse> = await this.client.post(
        '/refunds',
        refundData
      );

      this.logger.log(`✅ YooKassa возврат создан: ${response.data.id}`);

      return response.data;
    } catch (error) {
      this.logger.error('❌ Ошибка создания возврата YooKassa:', error);
      throw error;
    }
  }

  /**
   * Получить информацию о возврате
   */
  async getRefund(refundId: string): Promise<YooKassaRefundResponse> {
    if (!this.isEnabled()) {
      throw new BadRequestException('YooKassa не настроена');
    }

    try {
      const response: AxiosResponse<YooKassaRefundResponse> = await this.client.get(
        `/refunds/${refundId}`
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Ошибка получения возврата ${refundId}:`, error);
      throw error;
    }
  }

  /**
   * Валидировать webhook подпись
   */
  verifyWebhookSignature(body: any, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('YooKassa webhook secret не настроен - пропускаем валидацию');
      return true; // В dev режиме можно пропускать
    }

    try {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const expectedSignature = createHmac('sha256', this.webhookSecret)
        .update(bodyString)
        .digest('hex');

      const receivedSignature = signature.toLowerCase();
      const isValid = receivedSignature === expectedSignature;

      if (!isValid) {
        this.logger.warn('YooKassa webhook signature mismatch', {
          received: receivedSignature,
          expected: expectedSignature,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Ошибка валидации YooKassa webhook подписи:', error);
      return false;
    }
  }

  /**
   * Обработать webhook событие
   */
  async processWebhookEvent(event: YooKassaWebhookEvent): Promise<void> {
    this.logger.log(`Обработка YooKassa webhook: ${event.event}`);

    switch (event.event) {
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(event.object as YooKassaPaymentResponse);
        break;

      case 'payment.canceled':
        await this.handlePaymentCanceled(event.object as YooKassaPaymentResponse);
        break;

      case 'payment.waiting_for_capture':
        await this.handlePaymentWaitingForCapture(event.object as YooKassaPaymentResponse);
        break;

      case 'refund.succeeded':
        await this.handleRefundSucceeded(event.object as YooKassaRefundResponse);
        break;

      default:
        this.logger.debug(`Необработанное YooKassa событие: ${event.event}`);
    }
  }

  /**
   * Создать чек для платежа
   */
  createReceiptForCourse(
    courseTitle: string,
    amount: number,
    currency: string,
    customerEmail: string
  ): any {
    return {
      customer: {
        email: customerEmail,
      },
      items: [
        {
          description: `Доступ к курсу: ${courseTitle}`,
          amount: {
            value: amount.toFixed(2),
            currency: currency.toUpperCase(),
          },
          vat_code: 1, // НДС 20% - можно настроить
          quantity: '1',
        },
      ],
    };
  }

  // Private methods

  private generateIdempotenceKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handlePaymentSucceeded(payment: YooKassaPaymentResponse): Promise<void> {
    this.logger.log(`YooKassa платеж успешен: ${payment.id}`);
    // Здесь будет интеграция с PaymentService для обновления статуса
  }

  private async handlePaymentCanceled(payment: YooKassaPaymentResponse): Promise<void> {
    this.logger.log(`YooKassa платеж отменен: ${payment.id}`);
    // Здесь будет интеграция с PaymentService для обновления статуса
  }

  private async handlePaymentWaitingForCapture(payment: YooKassaPaymentResponse): Promise<void> {
    this.logger.log(`YooKassa платеж ожидает подтверждения: ${payment.id}`);
    // Можно автоматически подтверждать или оставить для ручной обработки
    
    // Автоматическое подтверждение:
    try {
      await this.capturePayment(payment.id);
    } catch (error) {
      this.logger.error(`Ошибка автоподтверждения платежа ${payment.id}:`, error);
    }
  }

  private async handleRefundSucceeded(refund: YooKassaRefundResponse): Promise<void> {
    this.logger.log(`YooKassa возврат успешен: ${refund.id}`);
    // Здесь будет интеграция с PaymentService для обновления статуса
  }

  /**
   * Получить поддерживаемые валюты
   */
  getSupportedCurrencies(): string[] {
    return ['RUB']; // YooKassa в основном работает с рублями
  }

  /**
   * Получить минимальную сумму платежа
   */
  getMinimumAmount(currency = 'RUB'): number {
    switch (currency) {
      case 'RUB':
        return 1.00; // 1 рубль минимум
      default:
        return 1.00;
    }
  }

  /**
   * Проверить лимиты платежа
   */
  validatePaymentAmount(amount: number, currency = 'RUB'): { isValid: boolean; error?: string } {
    const minAmount = this.getMinimumAmount(currency);
    const maxAmount = 999999; // Максимум для YooKassa

    if (amount < minAmount) {
      return {
        isValid: false,
        error: `Минимальная сумма платежа: ${minAmount} ${currency}`,
      };
    }

    if (amount > maxAmount) {
      return {
        isValid: false,
        error: `Максимальная сумма платежа: ${maxAmount} ${currency}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Форматировать сумму для YooKassa
   */
  formatAmount(amount: number): string {
    return Number(amount).toFixed(2);
  }

  /**
   * Получить URL для тестовых платежей
   */
  getTestCardUrl(): string | null {
    if (this.configService.get('NODE_ENV') === 'development') {
      return 'https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing';
    }
    return null;
  }
}
