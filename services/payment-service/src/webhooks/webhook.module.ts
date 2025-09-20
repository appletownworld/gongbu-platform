import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PaymentModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
