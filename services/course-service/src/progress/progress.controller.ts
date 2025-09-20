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
  ValidationPipe,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { 
  ProgressService, 
  EnrollmentData, 
  ProgressUpdateData, 
  ProgressSummary,
  DetailedProgressAnalytics,
  StudentAnalytics,
  CourseAnalytics,
  LearningPathAnalytics
} from './progress.service';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Progress & Enrollment')
@Controller('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Get(':studentId/:courseId/analytics')
  @ApiOperation({ 
    summary: 'Получить детальную аналитику прогресса студента',
    description: 'Возвращает подробную аналитику прогресса студента по конкретному курсу, включая анализ уроков, заданий, производительности и достижений'
  })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiResponse({ 
    status: 200, 
    description: 'Детальная аналитика прогресса получена успешно',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        studentId: { type: 'string' },
        overview: {
          type: 'object',
          properties: {
            enrolledAt: { type: 'string', format: 'date-time' },
            lastAccessedAt: { type: 'string', format: 'date-time' },
            totalTimeSpent: { type: 'number' },
            progressPercentage: { type: 'number' },
            status: { type: 'string' },
            certificateIssued: { type: 'boolean' }
          }
        },
        lessons: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            completed: { type: 'number' },
            inProgress: { type: 'number' },
            notStarted: { type: 'number' },
            averageWatchTime: { type: 'number' },
            progressDetails: { type: 'array' }
          }
        },
        assignments: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            submitted: { type: 'number' },
            graded: { type: 'number' },
            pending: { type: 'number' },
            averageScore: { type: 'number' },
            passedCount: { type: 'number' },
            assignmentDetails: { type: 'array' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            streaks: { type: 'object' },
            learningVelocity: { type: 'number' },
            timeDistribution: { type: 'object' }
          }
        },
        achievements: {
          type: 'object',
          properties: {
            milestones: { type: 'array' },
            badges: { type: 'array' },
            certificates: { type: 'array' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Студент не записан на курс или курс не найден' })
  async getDetailedProgressAnalytics(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext
  ): Promise<DetailedProgressAnalytics> {
    this.logger.log(`Получение детальной аналитики прогресса: student=${studentId}, course=${courseId}`, {
      requestedBy: user.userId,
    });

    // Проверяем права доступа: студент может видеть только свою аналитику
    if (user.role === 'STUDENT' && user.userId !== studentId) {
      throw new NotFoundException('Доступ запрещен');
    }

    return this.progressService.getDetailedProgressAnalytics(studentId, courseId);
  }

  @Get('students/:studentId/analytics')
  @ApiOperation({ 
    summary: 'Получить общую аналитику студента',
    description: 'Возвращает общую аналитику студента по всем курсам, включая статистику обучения и тренды производительности'
  })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiResponse({ 
    status: 200, 
    description: 'Общая аналитика студента получена успешно',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        coursesOverview: {
          type: 'object',
          properties: {
            enrolled: { type: 'number' },
            completed: { type: 'number' },
            inProgress: { type: 'number' },
            dropped: { type: 'number' },
            certificatesEarned: { type: 'number' }
          }
        },
        learningStats: {
          type: 'object',
          properties: {
            totalTimeSpent: { type: 'number' },
            averageSessionDuration: { type: 'number' },
            totalLessonsCompleted: { type: 'number' },
            totalAssignmentsSubmitted: { type: 'number' },
            overallAverageScore: { type: 'number' },
            streakDays: { type: 'number' }
          }
        },
        recentActivity: { type: 'array' },
        performanceTrends: { type: 'array' }
      }
    }
  })
  async getStudentAnalytics(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @GetUser() user: UserContext
  ): Promise<StudentAnalytics> {
    this.logger.log(`Получение общей аналитики студента: ${studentId}`, {
      requestedBy: user.userId,
    });

    // Проверяем права доступа: студент может видеть только свою аналитику
    if (user.role === 'STUDENT' && user.userId !== studentId) {
      throw new NotFoundException('Доступ запрещен');
    }

    return this.progressService.getStudentAnalytics(studentId);
  }

  @Get('courses/:courseId/analytics')
  @ApiOperation({ 
    summary: 'Получить аналитику курса',
    description: 'Возвращает детальную аналитику курса, включая обзор студентов, вовлеченность, производительность и тренды (доступно только для преподавателей и админов)'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiResponse({ 
    status: 200, 
    description: 'Аналитика курса получена успешно',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        studentsOverview: {
          type: 'object',
          properties: {
            totalEnrolled: { type: 'number' },
            activeStudents: { type: 'number' },
            completedStudents: { type: 'number' },
            droppedStudents: { type: 'number' },
            averageProgress: { type: 'number' }
          }
        },
        engagement: {
          type: 'object',
          properties: {
            averageTimePerStudent: { type: 'number' },
            averageSessionDuration: { type: 'number' },
            completionRate: { type: 'number' },
            dropoutRate: { type: 'number' },
            mostEngagingLessons: { type: 'array' },
            leastEngagingLessons: { type: 'array' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            averageScore: { type: 'number' },
            passRate: { type: 'number' },
            difficultAssignments: { type: 'array' },
            topPerformers: { type: 'array' },
            strugglingStudents: { type: 'array' }
          }
        },
        trends: {
          type: 'object',
          properties: {
            enrollmentTrend: { type: 'array' },
            progressTrend: { type: 'array' },
            performanceTrend: { type: 'array' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен - только для преподавателей и админов' })
  @ApiResponse({ status: 404, description: 'Курс не найден' })
  async getCourseAnalytics(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext
  ): Promise<CourseAnalytics> {
    this.logger.log(`Получение аналитики курса: ${courseId}`, {
      requestedBy: user.userId,
      role: user.role,
    });

    // Проверяем права доступа: только преподаватели и админы могут видеть аналитику курса
    if (user.role === 'STUDENT') {
      throw new NotFoundException('Доступ запрещен');
    }

    return this.progressService.getCourseAnalytics(courseId);
  }

  @Get(':studentId/:courseId/learning-path')
  @ApiOperation({ 
    summary: 'Получить адаптивный анализ обучающего пути',
    description: 'Возвращает персонализированные рекомендации и анализ обучающего пути для студента по конкретному курсу'
  })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiResponse({ 
    status: 200, 
    description: 'Анализ обучающего пути получен успешно',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        courseId: { type: 'string' },
        learningPath: {
          type: 'object',
          properties: {
            currentStep: { type: 'number' },
            totalSteps: { type: 'number' },
            estimatedTimeToComplete: { type: 'number' },
            recommendedNextActions: { type: 'array' },
            strugglingAreas: { type: 'array' },
            strengths: { type: 'array' }
          }
        },
        adaptiveRecommendations: {
          type: 'object',
          properties: {
            recommendedLessons: { type: 'array' },
            suggestedPracticeAreas: { type: 'array' },
            difficultyAdjustments: { type: 'array' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Студент не записан на курс или курс не найден' })
  async getLearningPathAnalytics(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext
  ): Promise<LearningPathAnalytics> {
    this.logger.log(`Получение анализа обучающего пути: student=${studentId}, course=${courseId}`, {
      requestedBy: user.userId,
    });

    // Проверяем права доступа: студент может видеть только свой анализ пути
    if (user.role === 'STUDENT' && user.userId !== studentId) {
      throw new NotFoundException('Доступ запрещен');
    }

    return this.progressService.getLearningPathAnalytics(studentId, courseId);
  }

  @Put(':studentId/:courseId/assignment/:assignmentId')
  @ApiOperation({ 
    summary: 'Обновить прогресс по заданию',
    description: 'Обновляет прогресс студента после выполнения или проверки задания'
  })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiParam({ name: 'assignmentId', description: 'ID задания' })
  @ApiResponse({ 
    status: 200, 
    description: 'Прогресс по заданию обновлен успешно'
  })
  @ApiResponse({ status: 404, description: 'Студент не записан на курс или задание не найдено' })
  async updateAssignmentProgress(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() submissionData: {
      score?: number;
      timeSpent?: number;
      completed: boolean;
    },
    @GetUser() user: UserContext
  ): Promise<ProgressSummary> {
    this.logger.log(`Обновление прогресса по заданию: student=${studentId}, course=${courseId}, assignment=${assignmentId}`, {
      requestedBy: user.userId,
    });

    return this.progressService.updateAssignmentProgress(
      studentId,
      courseId,
      assignmentId,
      submissionData
    );
  }
}