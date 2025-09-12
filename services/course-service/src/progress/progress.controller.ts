import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam
} from '@nestjs/swagger';
import { ProgressService, EnrollmentData, ProgressUpdateData, ProgressSummary } from './progress.service';

@ApiTags('Progress & Enrollment')
@Controller('progress')
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(private readonly progressService: ProgressService) {}

  @Post('enroll')
  @ApiOperation({ 
    summary: 'Enroll student in course',
    description: 'Enroll a student in a specific course'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Student enrolled successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid enrollment data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async enrollStudent(@Body() enrollmentData: EnrollmentData) {
    this.logger.debug('POST /progress/enroll', enrollmentData);
    return this.progressService.enrollStudent(enrollmentData);
  }

  @Put(':userId/:courseId/lesson')
  @ApiOperation({ 
    summary: 'Update lesson progress',
    description: 'Update student progress for a specific lesson'
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Progress updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Enrollment or lesson not found' })
  @ApiBearerAuth()
  async updateLessonProgress(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @Body() progressData: ProgressUpdateData
  ): Promise<ProgressSummary> {
    this.logger.debug(`PUT /progress/${userId}/${courseId}/lesson`, progressData);
    return this.progressService.updateLessonProgress(userId, courseId, progressData);
  }

  @Get(':userId/:courseId')
  @ApiOperation({ 
    summary: 'Get student progress',
    description: 'Get progress summary for a student in a specific course'
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Progress retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  async getStudentProgress(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string
  ): Promise<ProgressSummary | null> {
    this.logger.debug(`GET /progress/${userId}/${courseId}`);
    return this.progressService.getStudentProgress(userId, courseId);
  }

  @Get(':userId/:courseId/lessons')
  @ApiOperation({ 
    summary: 'Get lesson progress',
    description: 'Get detailed progress for all lessons in a course'
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson progress retrieved successfully'
  })
  async getLessonProgress(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string
  ): Promise<any[]> {
    this.logger.debug(`GET /progress/${userId}/${courseId}/lessons`);
    return this.progressService.getLessonProgress(userId, courseId);
  }

  @Get('users/:userId/courses')
  @ApiOperation({ 
    summary: 'Get user courses',
    description: 'Get all courses for a specific user (enrolled, completed, in progress)'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User courses retrieved successfully'
  })
  async getUserCourses(@Param('userId') userId: string): Promise<{
    enrolled: any[];
    completed: any[];
    inProgress: any[];
  }> {
    this.logger.debug(`GET /progress/users/${userId}/courses`);
    return this.progressService.getUserCourses(userId);
  }

  @Post(':userId/:courseId/certificate')
  @ApiOperation({ 
    summary: 'Issue certificate',
    description: 'Issue a course completion certificate'
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Certificate issued successfully'
  })
  @ApiResponse({ status: 400, description: 'Course not completed or certificate already issued' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async issueCertificate(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string
  ): Promise<any> {
    this.logger.debug(`POST /progress/${userId}/${courseId}/certificate`);
    return this.progressService.issueCertificate(userId, courseId);
  }

  @Delete(':userId/:courseId')
  @ApiOperation({ 
    summary: 'Unenroll student',
    description: 'Remove student enrollment from a course'
  })
  @ApiParam({ name: 'userId', description: 'Student user ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Student unenrolled successfully'
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiBearerAuth()
  async unenrollStudent(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string
  ): Promise<{ message: string }> {
    this.logger.debug(`DELETE /progress/${userId}/${courseId}`);
    await this.progressService.unenrollStudent(userId, courseId);
    return { message: 'Student unenrolled successfully' };
  }
}