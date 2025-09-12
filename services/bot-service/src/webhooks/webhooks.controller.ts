import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BotService } from '../bot/bot.service';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

@ApiTags('Webhooks')
@Controller()
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly botService: BotService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaClient,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Telegram webhook updates' })
  @ApiHeader({
    name: 'X-Telegram-Bot-Api-Secret-Token',
    description: 'Telegram webhook secret token',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  @ApiResponse({ status: 401, description: 'Invalid secret token' })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ): Promise<{ ok: boolean }> {
    const startTime = Date.now();

    try {
      // Validate webhook secret if configured
      const expectedSecret = this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_SECRET');
      if (expectedSecret && secretToken !== expectedSecret) {
        this.logger.warn('Invalid webhook secret token');
        throw new UnauthorizedException('Invalid secret token');
      }

      // Basic validation
      if (!update || typeof update.update_id !== 'number') {
        throw new BadRequestException('Invalid update format');
      }

      this.logger.debug(`Processing webhook update: ${update.update_id}`, {
        updateType: this.getUpdateType(update),
        userId: this.extractUserId(update),
        chatId: this.extractChatId(update),
      });

      // Store webhook data for debugging
      await this.storeWebhookData(update, startTime);

      // Process update through bot service
      await this.botService.handleWebhook(update);

      // Update webhook processing status
      await this.updateWebhookStatus(update.update_id, true, Date.now() - startTime);

      this.logger.debug(`Webhook ${update.update_id} processed successfully in ${Date.now() - startTime}ms`);

      return { ok: true };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Webhook processing failed: ${error.message}`, {
        updateId: update?.update_id,
        processingTime,
        error: error.stack,
      });

      // Update webhook status with error
      if (update?.update_id) {
        await this.updateWebhookStatus(update.update_id, false, processingTime, error.message);
      }

      // Don't throw error to Telegram - return 200 to prevent retries
      return { ok: false };
    }
  }

  @Post('webhook/test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  @HttpCode(HttpStatus.OK)
  async testWebhook(): Promise<{
    status: string;
    timestamp: string;
    config: {
      webhookUrl: string;
      secretConfigured: boolean;
    };
  }> {
    const webhookUrl = this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_URL');
    const webhookPath = this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_PATH', '/webhook');
    const secretConfigured = !!this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_SECRET');

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        webhookUrl: webhookUrl ? `${webhookUrl}${webhookPath}` : 'Not configured',
        secretConfigured,
      },
    };
  }

  private async storeWebhookData(update: any, startTime: number): Promise<void> {
    try {
      await this.prisma.botWebhook.create({
        data: {
          updateId: BigInt(update.update_id),
          updateType: this.getUpdateType(update),
          telegramId: this.extractUserId(update) ? BigInt(this.extractUserId(update)) : null,
          chatId: this.extractChatId(update) ? BigInt(this.extractChatId(update)) : null,
          chatType: this.extractChatType(update),
          rawData: update,
          isProcessed: false,
        },
      });
    } catch (error) {
      // Don't fail webhook processing if storage fails
      this.logger.error('Failed to store webhook data:', error);
    }
  }

  private async updateWebhookStatus(
    updateId: number,
    success: boolean,
    processingTime: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.botWebhook.update({
        where: { updateId: BigInt(updateId) },
        data: {
          isProcessed: true,
          processingTime,
          errorMessage,
          responseData: success ? { success: true } : { error: errorMessage },
          responseTime: processingTime,
        },
      });
    } catch (error) {
      this.logger.error('Failed to update webhook status:', error);
    }
  }

  private getUpdateType(update: any): string {
    if (update.message) return 'message';
    if (update.edited_message) return 'edited_message';
    if (update.channel_post) return 'channel_post';
    if (update.edited_channel_post) return 'edited_channel_post';
    if (update.inline_query) return 'inline_query';
    if (update.chosen_inline_result) return 'chosen_inline_result';
    if (update.callback_query) return 'callback_query';
    if (update.shipping_query) return 'shipping_query';
    if (update.pre_checkout_query) return 'pre_checkout_query';
    if (update.poll) return 'poll';
    if (update.poll_answer) return 'poll_answer';
    if (update.my_chat_member) return 'my_chat_member';
    if (update.chat_member) return 'chat_member';
    if (update.chat_join_request) return 'chat_join_request';
    return 'unknown';
  }

  private extractUserId(update: any): number | null {
    if (update.message?.from?.id) return update.message.from.id;
    if (update.edited_message?.from?.id) return update.edited_message.from.id;
    if (update.callback_query?.from?.id) return update.callback_query.from.id;
    if (update.inline_query?.from?.id) return update.inline_query.from.id;
    if (update.chosen_inline_result?.from?.id) return update.chosen_inline_result.from.id;
    if (update.shipping_query?.from?.id) return update.shipping_query.from.id;
    if (update.pre_checkout_query?.from?.id) return update.pre_checkout_query.from.id;
    if (update.poll_answer?.user?.id) return update.poll_answer.user.id;
    if (update.my_chat_member?.from?.id) return update.my_chat_member.from.id;
    if (update.chat_member?.from?.id) return update.chat_member.from.id;
    if (update.chat_join_request?.from?.id) return update.chat_join_request.from.id;
    return null;
  }

  private extractChatId(update: any): number | null {
    if (update.message?.chat?.id) return update.message.chat.id;
    if (update.edited_message?.chat?.id) return update.edited_message.chat.id;
    if (update.channel_post?.chat?.id) return update.channel_post.chat.id;
    if (update.edited_channel_post?.chat?.id) return update.edited_channel_post.chat.id;
    if (update.callback_query?.message?.chat?.id) return update.callback_query.message.chat.id;
    if (update.my_chat_member?.chat?.id) return update.my_chat_member.chat.id;
    if (update.chat_member?.chat?.id) return update.chat_member.chat.id;
    if (update.chat_join_request?.chat?.id) return update.chat_join_request.chat.id;
    return null;
  }

  private extractChatType(update: any): string | null {
    if (update.message?.chat?.type) return update.message.chat.type;
    if (update.edited_message?.chat?.type) return update.edited_message.chat.type;
    if (update.channel_post?.chat?.type) return update.channel_post.chat.type;
    if (update.edited_channel_post?.chat?.type) return update.edited_channel_post.chat.type;
    if (update.callback_query?.message?.chat?.type) return update.callback_query.message.chat.type;
    if (update.my_chat_member?.chat?.type) return update.my_chat_member.chat.type;
    if (update.chat_member?.chat?.type) return update.chat_member.chat.type;
    if (update.chat_join_request?.chat?.type) return update.chat_join_request.chat.type;
    return null;
  }
}
