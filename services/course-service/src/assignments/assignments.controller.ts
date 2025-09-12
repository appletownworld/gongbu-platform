import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';

@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get assignments for a course' })
  async getAssignmentsByCourse(@Param('courseId') courseId: string) {
    return this.assignmentsService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  async getAssignment(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }
}
