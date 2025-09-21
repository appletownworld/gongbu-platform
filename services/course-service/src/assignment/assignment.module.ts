import { Module } from '@nestjs/common';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AssignmentController],
  providers: [AssignmentService, PrismaService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
