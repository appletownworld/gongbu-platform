import { Module } from '@nestjs/common';
import { MLController } from './ml.controller';
import { RecommendationService } from './recommendation.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MLController],
  providers: [RecommendationService],
  exports: [RecommendationService]
})
export class MLModule {}
