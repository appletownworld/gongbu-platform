import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  Logger,
  HttpStatus,
  HttpException,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @ApiOperation({
    summary: 'Stripe Webhook',
    description: 'Endpoint для обработки webhooks от Stripe'
  })
  @ApiHeader({ name: 'stripe-signature', description: 'Подпись Stripe webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook успешно обработан',
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean' },
        eventId: { type: 'string' },
        eventType: { type: 'string' },
        processed: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверная подпись webhook или данные' })
  @ApiResponse({ status: 500, description: 'Ошибка обработки webhook' })
  @ApiExcludeEndpoint() // Исключаем из публичной документации
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ) {
    this.logger.log('📥 Получен Stripe webhook');

    try {
      // Получаем raw body для проверки подписи
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(body));

      const result = await this.webhookService.handleStripeWebhook(rawBody, signature);

      this.logger.log(`✅ Stripe webhook успешно обработан: ${result.eventType}`, {
        eventId: result.eventId,
        processed: result.processed,
      });

      return res.status(HttpStatus.OK).json({
        received: true,
        eventId: result.eventId,
        eventType: result.eventType,
        processed: result.processed,
        message: result.message || 'Webhook обработан успешно',
      });
    } catch (error) {
      this.logger.error('❌ Ошибка обработки Stripe webhook:', error);

      if (error.message?.includes('signature')) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          received: false,
          error: 'Invalid webhook signature',
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        received: false,
        error: 'Webhook processing failed',
      });
    }
  }

  @Post('yookassa')
  @ApiOperation({
    summary: 'YooKassa Webhook',
    description: 'Endpoint для обработки webhooks от YooKassa (Яндекс.Касса)'
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook успешно обработан',
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean' },
        eventId: { type: 'string' },
        eventType: { type: 'string' },
        processed: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные webhook' })
  @ApiResponse({ status: 500, description: 'Ошибка обработки webhook' })
  @ApiExcludeEndpoint() // Исключаем из публичной документации
  async handleYooKassaWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    this.logger.log('📥 Получен YooKassa webhook');

    try {
      const result = await this.webhookService.handleYooKassaWebhook(body, headers);

      this.logger.log(`✅ YooKassa webhook успешно обработан: ${result.eventType}`, {
        eventId: result.eventId,
        processed: result.processed,
      });

      return res.status(HttpStatus.OK).json({
        received: true,
        eventId: result.eventId,
        eventType: result.eventType,
        processed: result.processed,
        message: result.message || 'Webhook обработан успешно',
      });
    } catch (error) {
      this.logger.error('❌ Ошибка обработки YooKassa webhook:', error);

      if (error.message?.includes('validation')) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          received: false,
          error: 'Invalid webhook data',
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        received: false,
        error: 'Webhook processing failed',
      });
    }
  }

  @Post('test')
  @ApiOperation({
    summary: 'Test Webhook',
    description: 'Endpoint для тестирования обработки webhooks в development режиме'
  })
  @ApiResponse({
    status: 200,
    description: 'Test webhook успешно обработан',
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean' },
        provider: { type: 'string' },
        eventType: { type: 'string' },
        testMode: { type: 'boolean' },
        processed: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Test webhooks доступны только в development режиме' })
  async handleTestWebhook(
    @Body() body: {
      provider: 'stripe' | 'yookassa';
      eventType: string;
      paymentId?: string;
      data?: any;
    },
    @Res() res: Response
  ) {
    // Проверяем, что мы в development режиме
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException(
        'Test webhooks are only available in development mode',
        HttpStatus.FORBIDDEN
      );
    }

    this.logger.log(`🧪 Получен TEST webhook: ${body.provider} - ${body.eventType}`);

    try {
      const result = await this.webhookService.handleTestWebhook(body);

      this.logger.log(`✅ Test webhook успешно обработан: ${body.provider} - ${body.eventType}`, {
        processed: result.processed,
      });

      return res.status(HttpStatus.OK).json({
        received: true,
        provider: body.provider,
        eventType: body.eventType,
        testMode: true,
        processed: result.processed,
        message: result.message || 'Test webhook обработан успешно',
      });
    } catch (error) {
      this.logger.error('❌ Ошибка обработки test webhook:', error);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        received: false,
        provider: body.provider,
        eventType: body.eventType,
        testMode: true,
        error: 'Test webhook processing failed',
      });
    }
  }
}
