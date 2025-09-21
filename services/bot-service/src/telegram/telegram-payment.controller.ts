import { Controller, Post, Body, Param, Logger, BadRequestException } from '@nestjs/common';
import { TelegramPaymentService, TelegramPaymentRequest } from './telegram-payment.service';

@Controller('telegram-payment')
export class TelegramPaymentController {
  private readonly logger = new Logger(TelegramPaymentController.name);

  constructor(private readonly telegramPaymentService: TelegramPaymentService) {}

  @Post('create')
  async createPayment(@Body() paymentData: TelegramPaymentRequest) {
    this.logger.log(`Создание Telegram платежа для бота: ${paymentData.botId}`);
    
    try {
      const result = await this.telegramPaymentService.createTelegramPayment(paymentData);
      
      if (!result.success) {
        throw new BadRequestException(result.error);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Ошибка создания платежа: ${error.message}`);
      throw error;
    }
  }

  @Post('success/:botId')
  async handleSuccessfulPayment(
    @Param('botId') botId: string,
    @Body() body: { telegramPayment: any; preCheckoutQuery?: any }
  ) {
    this.logger.log(`Обработка успешного платежа для бота: ${botId}`);
    
    try {
      await this.telegramPaymentService.handleSuccessfulPayment(
        botId,
        body.telegramPayment,
        body.preCheckoutQuery
      );

      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка обработки успешного платежа: ${error.message}`);
      throw error;
    }
  }

  @Post('failed/:botId')
  async handleFailedPayment(
    @Param('botId') botId: string,
    @Body() body: { paymentId: string; errorMessage: string }
  ) {
    this.logger.log(`Обработка неуспешного платежа для бота: ${botId}`);
    
    try {
      await this.telegramPaymentService.handleFailedPayment(
        botId,
        body.paymentId,
        body.errorMessage
      );

      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка обработки неуспешного платежа: ${error.message}`);
      throw error;
    }
  }

  @Post('stats/:botId')
  async getBotPaymentStats(
    @Param('botId') botId: string,
    @Body() body: { period?: '1d' | '7d' | '30d' }
  ) {
    this.logger.log(`Получение статистики платежей для бота: ${botId}`);
    
    try {
      const stats = await this.telegramPaymentService.getBotPaymentStats(
        botId,
        body.period || '7d'
      );

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw error;
    }
  }
}
