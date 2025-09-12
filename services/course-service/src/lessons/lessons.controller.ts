import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get lessons for a course' })
  async getLessonsByCourse(@Param('courseId') courseId: string) {
    return this.lessonsService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  async getLesson(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new lesson' })
  async createLesson(@Body() createLessonDto: any) {
    return this.lessonsService.create(createLessonDto);
  }
}
