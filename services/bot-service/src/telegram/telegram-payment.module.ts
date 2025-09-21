import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelegramPaymentService } from './telegram-payment.service';
import { TelegramPaymentController } from './telegram-payment.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [TelegramPaymentController],
  providers: [TelegramPaymentService, PrismaService],
  exports: [TelegramPaymentService],
})
export class TelegramPaymentModule {}
