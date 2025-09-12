import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { BotModule } from '../bot/bot.module';
import { PrismaModule } from '../config/prisma.module';

@Module({
  imports: [ConfigModule, BotModule, PrismaModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
