import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentRepository } from './assignment.repository';
import { PrismaModule } from '../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AssignmentRepository],
  exports: [AssignmentsService, AssignmentRepository],
})
export class AssignmentsModule {}
