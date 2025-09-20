import { Module } from '@nestjs/common';
import { PrismaModule } from '../config/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
