import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProviderModule } from '../providers/provider.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    ProviderModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
  ],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
