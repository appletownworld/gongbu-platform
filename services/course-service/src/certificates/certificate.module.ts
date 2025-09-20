import { Module } from '@nestjs/common';
import { PrismaModule } from '../config/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CertificateController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
