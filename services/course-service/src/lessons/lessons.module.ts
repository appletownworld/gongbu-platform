import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonRepository } from './lesson.repository';
import { PrismaModule } from '../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonRepository],
  exports: [LessonsService, LessonRepository],
})
export class LessonsModule {}
