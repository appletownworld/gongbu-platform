import { Module } from '@nestjs/common';
import { BotInstanceManager } from './bot-instance-manager.service';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { MessageTemplatesService } from './message-templates.service';
import { BotBusinessLogic } from './bot-business-logic.service';
import { WebhookService } from './webhook.service';
import { TelegramPaymentService } from '../telegram/telegram-payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [BotsController],
  providers: [
    PrismaService,
    BotsService,
    BotInstanceManager,
    MessageTemplatesService,
    BotBusinessLogic,
    WebhookService,
    TelegramPaymentService,
  ],
  exports: [
    BotsService,
    BotInstanceManager,
    MessageTemplatesService,
    BotBusinessLogic,
    TelegramPaymentService,
  ],
})
export class BotsModule {}
