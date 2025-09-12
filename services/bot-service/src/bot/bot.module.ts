import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot.service';
import { PrismaModule } from '../config/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
