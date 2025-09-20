import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { 
  LessonsService, 
  CreateLessonRequest, 
  UpdateLessonRequest, 
  LessonQuery, 
  LessonProgressUpdate 
} from './lessons.service';
import { LessonContentType, LessonStatus } from '@prisma/client';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class CreateLessonDto implements CreateLessonRequest {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  settings?: Record<string, any>;

  @IsOptional()
  @IsString()
  slug?: string;

  creatorId: string; // устанавливается из JWT
}

class UpdateLessonDto implements UpdateLessonRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  settings?: Record<string, any>;
}

class LessonQueryDto implements LessonQuery {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFree?: boolean;

  @IsOptional()
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  orderBy?: 'order' | 'createdAt' | 'title';

  @IsOptional()
  @IsString()
  orderDirection?: 'asc' | 'desc';
}

class LessonProgressUpdateDto implements LessonProgressUpdate {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  watchTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}

class DuplicateLessonDto {
  @IsOptional()
  @IsString()
  newTitle?: string;

  @IsOptional()
  @IsString()
  newCourseId?: string;

  @IsOptional()
  @IsBoolean()
  includeProgress?: boolean;
}

@ApiTags('Lessons')
@Controller('lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class LessonsController {
  private readonly logger = new Logger(LessonsController.name);

  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать новый урок',
    description: 'Создает новый урок для курса (только для преподавателей и админов)'
  })
  @ApiResponse({
    status: 201,
    description: 'Урок успешно создан',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        slug: { type: 'string' },
        contentType: { type: 'string' },
        isPublished: { type: 'boolean' },
        order: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 403, description: 'Нет прав для создания урока' })
  @ApiResponse({ status: 404, description: 'Курс не найден' })
  async createLesson(
    @Body() createLessonDto: CreateLessonDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Создание урока: ${createLessonDto.title}`, {
      courseId: createLessonDto.courseId,
      creatorId: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут создавать уроки
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для создания уроков');
    }

    // Устанавливаем ID создателя из JWT
    createLessonDto.creatorId = user.userId;

    const lesson = await this.lessonsService.create(createLessonDto);

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      contentType: lesson.contentType,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId,
      order: lesson.order,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      audioUrl: lesson.audioUrl,
      attachments: lesson.attachments,
      prerequisiteIds: lesson.prerequisiteIds,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
      isFree: lesson.isFree,
      settings: lesson.settings,
      // files: lesson.files, // Field doesn't exist
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список уроков',
    description: 'Возвращает список уроков с поддержкой фильтрации и поиска'
  })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiQuery({ name: 'moduleId', required: false, description: 'ID модуля' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Опубликованные уроки' })
  @ApiQuery({ name: 'isPreview', required: false, type: Boolean, description: 'Превью уроки' })
  @ApiQuery({ name: 'isFree', required: false, type: Boolean, description: 'Бесплатные уроки' })
  @ApiQuery({ name: 'contentType', required: false, enum: LessonContentType, description: 'Тип контента' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию и содержимому' })
  @ApiQuery({ name: 'creatorId', required: false, description: 'ID создателя' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей (1-100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации', example: 0 })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Поле сортировки', enum: ['order', 'createdAt', 'title'] })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Направление сортировки', enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Список уроков',
    schema: {
      type: 'object',
      properties: {
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              contentType: { type: 'string' },
              isPublished: { type: 'boolean' },
              order: { type: 'number' },
              duration: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            }
          }
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      }
    }
  })
  async getLessons(@Query() query: LessonQueryDto) {
    this.logger.debug('Получение списка уроков', { query });

    const result = await this.lessonsService.findMany(query);

    return {
      lessons: result.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        contentType: lesson.contentType,
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        order: lesson.order,
        duration: lesson.duration,
        isPreview: lesson.isPreview,
        isPublished: lesson.isPublished,
        isFree: lesson.isFree,
        // progressCount: lesson._count?.progress || 0, // _count doesn't exist
        // assignmentCount: lesson._count?.assignments || 0, // _count doesn't exist
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      })),
      total: result.total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Получить уроки курса',
    description: 'Возвращает все уроки конкретного курса'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiQuery({ name: 'includeUnpublished', required: false, type: Boolean, description: 'Включить неопубликованные уроки (только для преподавателей)' })
  @ApiQuery({ name: 'includeProgress', required: false, type: Boolean, description: 'Включить прогресс студента' })
  @ApiResponse({
    status: 200,
    description: 'Уроки курса',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          order: { type: 'number' },
          duration: { type: 'number' },
          contentType: { type: 'string' },
          isPreview: { type: 'boolean' },
          isFree: { type: 'boolean' },
          progress: { type: 'object' },
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Курс не найден' })
  async getLessonsByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext,
    @Query('includeUnpublished') includeUnpublished?: boolean,
    @Query('includeProgress') includeProgress?: boolean
  ) {
    this.logger.debug(`Получение уроков курса: ${courseId}`, {
      userId: user.userId,
      includeUnpublished,
    });

    // Студенты могут видеть только опубликованные уроки
    const finalIncludeUnpublished = user.role !== 'STUDENT' ? includeUnpublished : false;

    const lessons = await this.lessonsService.findByCourse(courseId, {
      includeUnpublished: finalIncludeUnpublished,
      includeProgress: includeProgress && user.role === 'STUDENT',
      studentId: user.role === 'STUDENT' ? user.userId : undefined,
    });

    return lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      contentType: lesson.contentType,
      order: lesson.order,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      audioUrl: lesson.audioUrl,
      attachments: lesson.attachments,
      prerequisiteIds: lesson.prerequisiteIds,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
      isFree: lesson.isFree,
      settings: lesson.settings,
      // files: lesson.files, // Field doesn't exist
      // progress: lesson.progress?.[0] || null, // Field doesn't exist
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить урок по ID',
    description: 'Возвращает подробную информацию об уроке'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация об уроке',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        contentType: { type: 'string' },
        videoUrl: { type: 'string' },
        duration: { type: 'number' },
        isPublished: { type: 'boolean' },
        course: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  async getLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение урока: ${id}`, { userId: user.userId });

    const includeUnpublished = user.role !== 'STUDENT';
    const lesson = await this.lessonsService.findOne(id, { includeUnpublished });

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      contentType: lesson.contentType,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId,
      order: lesson.order,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      audioUrl: lesson.audioUrl,
      attachments: lesson.attachments,
      prerequisiteIds: lesson.prerequisiteIds,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
      isFree: lesson.isFree,
      settings: lesson.settings,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Обновить урок',
    description: 'Обновляет существующий урок (только для преподавателей и админов)'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Урок успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 403, description: 'Нет прав на изменение урока' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  async updateLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Обновление урока: ${id}`, { userId: user.userId });

    // Проверяем права: только преподаватели и админы могут обновлять уроки
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для обновления уроков');
    }

    const lesson = await this.lessonsService.update(id, updateLessonDto, user.userId);

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      contentType: lesson.contentType,
      isPublished: lesson.isPublished,
      updatedAt: lesson.updatedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить урок',
    description: 'Удаляет урок (только если нет активного прогресса студентов)'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({ status: 204, description: 'Урок успешно удален' })
  @ApiResponse({ status: 400, description: 'Нельзя удалить урок с активным прогрессом' })
  @ApiResponse({ status: 403, description: 'Нет прав на удаление урока' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Удаление урока: ${id}`, { userId: user.userId });

    // Проверяем права: только преподаватели и админы могут удалять уроки
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для удаления уроков');
    }

    await this.lessonsService.delete(id, user.userId);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Опубликовать урок',
    description: 'Публикует урок (делает его доступным для студентов)'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Урок успешно опубликован',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        isPublished: { type: 'boolean' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Урок не готов к публикации' })
  @ApiResponse({ status: 403, description: 'Нет прав на публикацию урока' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  async publishLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Публикация урока: ${id}`, { userId: user.userId });

    // Проверяем права: только преподаватели и админы могут публиковать уроки
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для публикации уроков');
    }

    const lesson = await this.lessonsService.publish(id, user.userId);

    return {
      id: lesson.id,
      title: lesson.title,
      isPublished: lesson.isPublished,
      updatedAt: lesson.updatedAt,
    };
  }

  @Put(':id/progress')
  @ApiOperation({
    summary: 'Обновить прогресс урока',
    description: 'Обновляет прогресс студента по уроку'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Прогресс обновлен',
    schema: {
      type: 'object',
      properties: {
        lessonId: { type: 'string' },
        studentId: { type: 'string' },
        status: { type: 'string' },
        completed: { type: 'boolean' },
        progressPercentage: { type: 'number' },
        timeSpent: { type: 'number' },
        lastAccessedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  async updateLessonProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() progressUpdateDto: Omit<LessonProgressUpdateDto, 'studentId'>,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Обновление прогресса урока: ${id}`, {
      studentId: user.userId,
      status: progressUpdateDto.status,
      completed: progressUpdateDto.completed,
    });

    // Только студенты могут обновлять свой прогресс
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Только студенты могут обновлять прогресс по урокам');
    }

    const progressUpdate: LessonProgressUpdate = {
      ...progressUpdateDto,
      studentId: user.userId,
    };

    const progress = await this.lessonsService.updateProgress(id, progressUpdate);

    return {
      lessonId: progress.lessonId,
      studentId: progress.studentId,
      status: progress.status,
      completed: progress.completed,
      progressPercentage: Number(progress.progressPercentage),
      timeSpent: progress.timeSpent,
      watchTime: progress.watchTime,
      score: progress.score ? Number(progress.score) : undefined,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
      updatedAt: progress.updatedAt,
    };
  }

  @Get(':id/progress')
  @ApiOperation({
    summary: 'Получить прогресс урока',
    description: 'Возвращает прогресс студента по уроку'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Прогресс по уроку',
    schema: {
      type: 'object',
      properties: {
        lessonId: { type: 'string' },
        studentId: { type: 'string' },
        status: { type: 'string' },
        completed: { type: 'boolean' },
        progressPercentage: { type: 'number' },
        timeSpent: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Урок не найден или нет прогресса' })
  async getLessonProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение прогресса урока: ${id}`, { studentId: user.userId });

    // Только студенты могут получать свой прогресс
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Только студенты могут получать прогресс по урокам');
    }

    const progress = await this.lessonsService.getProgress(id, user.userId);
    
    if (!progress) {
      throw new NotFoundException('Прогресс по уроку не найден');
    }

    return {
      lessonId: progress.lessonId,
      studentId: progress.studentId,
      status: progress.status,
      completed: progress.completed,
      progressPercentage: Number(progress.progressPercentage),
      timeSpent: progress.timeSpent,
      watchTime: progress.watchTime,
      score: progress.score ? Number(progress.score) : undefined,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
    };
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Получить аналитику урока',
    description: 'Возвращает статистику по уроку (только для преподавателей и админов)'
  })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Статистика урока',
    schema: {
      type: 'object',
      properties: {
        totalStudents: { type: 'number' },
        completedStudents: { type: 'number' },
        averageTimeSpent: { type: 'number' },
        averageProgress: { type: 'number' },
        completionRate: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для просмотра аналитики' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  async getLessonAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение аналитики урока: ${id}`, { userId: user.userId });

    // Только преподаватели и админы могут видеть аналитику
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для просмотра аналитики уроков');
    }

    const stats = await this.lessonsService.getLessonStats(id, user.userId);

    return {
      lessonId: id,
      totalStudents: stats.totalStudents,
      completedStudents: stats.completedStudents,
      averageTimeSpent: Math.round(stats.averageTimeSpent * 100) / 100, // Округляем до 2 знаков
      averageProgress: Math.round(stats.averageProgress * 100) / 100,
      completionRate: Math.round(stats.completionRate * 100) / 100,
    };
  }
}
