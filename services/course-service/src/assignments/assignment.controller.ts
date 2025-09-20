import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseEnumPipe,
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
  AssignmentService,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentQuery
} from './assignment.service';
import { AssignmentType } from '@prisma/client';
import { AssignmentUtils } from './assignment-types';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class CreateAssignmentDto implements CreateAssignmentRequest {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  instructions: string;

  @IsEnum(AssignmentType)
  type: AssignmentType;

  @IsObject()
  content: Record<string, any>;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

class UpdateAssignmentDto implements UpdateAssignmentRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

class AssignmentQueryDto implements AssignmentQuery {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsEnum(AssignmentType)
  type?: AssignmentType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'order' | 'createdAt' | 'title' | 'dueDate';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(0)
  offset?: number;
}

class DuplicateAssignmentDto {
  @IsOptional()
  @IsString()
  newTitle?: string;
}

@ApiTags('Assignments')
@Controller('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  private readonly logger = new Logger(AssignmentController.name);

  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать новое задание',
    description: 'Создает новое задание для курса, урока или модуля'
  })
  @ApiResponse({
    status: 201,
    description: 'Задание успешно создано',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string' },
        courseId: { type: 'string' },
        maxScore: { type: 'number' },
        isPublished: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные задания' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав на создание задания в курсе' })
  async createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Создание задания: ${createAssignmentDto.title}`, {
      type: createAssignmentDto.type,
      courseId: createAssignmentDto.courseId,
      userId: user.userId,
    });

    const assignment = await this.assignmentService.createAssignment(
      createAssignmentDto,
      user.userId
    );

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      courseId: assignment.courseId,
      moduleId: assignment.moduleId,
      lessonId: assignment.lessonId,
      maxScore: assignment.maxScore,
      passingScore: assignment.passingScore,
      timeLimit: assignment.timeLimit,
      dueDate: assignment.dueDate,
      order: assignment.order,
      isPublished: assignment.isPublished,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список заданий',
    description: 'Возвращает список заданий с поддержкой фильтрации и поиска'
  })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiQuery({ name: 'moduleId', required: false, description: 'ID модуля' })
  @ApiQuery({ name: 'lessonId', required: false, description: 'ID урока' })
  @ApiQuery({ name: 'type', required: false, enum: AssignmentType })
  @ApiQuery({ name: 'isPublished', required: false, type: 'boolean' })
  @ApiQuery({ name: 'search', required: false, description: 'Поисковый запрос' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['order', 'createdAt', 'title', 'dueDate'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Количество результатов' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Смещение результатов' })
  @ApiResponse({
    status: 200,
    description: 'Список заданий получен успешно',
    schema: {
      type: 'object',
      properties: {
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              maxScore: { type: 'number' },
              dueDate: { type: 'string', format: 'date-time' },
              isPublished: { type: 'boolean' },
              submissionsCount: { type: 'number' },
            }
          }
        },
        total: { type: 'number' },
      }
    }
  })
  async getAssignments(@Query() query: AssignmentQueryDto) {
    this.logger.log('Получение списка заданий', query);

    const result = await this.assignmentService.getAssignments(query);

    return {
      assignments: result.assignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        courseId: assignment.courseId,
        moduleId: assignment.moduleId,
        lessonId: assignment.lessonId,
        maxScore: assignment.maxScore,
        passingScore: assignment.passingScore,
        timeLimit: assignment.timeLimit,
        dueDate: assignment.dueDate,
        order: assignment.order,
        isPublished: assignment.isPublished,
        course: assignment.course,
        module: assignment.module,
        lesson: assignment.lesson,
        submissionsCount: assignment._count?.submissions || 0,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })),
      total: result.total,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить задание по ID',
    description: 'Возвращает подробную информацию о задании'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiQuery({ name: 'includeSubmissions', required: false, type: 'boolean', description: 'Включить подачи студентов' })
  @ApiQuery({ name: 'includeStats', required: false, type: 'boolean', description: 'Включить статистику' })
  @ApiResponse({
    status: 200,
    description: 'Задание найдено',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        instructions: { type: 'string' },
        type: { type: 'string' },
        content: { type: 'object' },
        maxScore: { type: 'number' },
        passingScore: { type: 'number' },
        timeLimit: { type: 'number' },
        dueDate: { type: 'string', format: 'date-time' },
        isPublished: { type: 'boolean' },
        course: { type: 'object' },
        stats: { type: 'object' },
        submissions: { type: 'array' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async getAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeSubmissions') includeSubmissions?: boolean,
    @Query('includeStats') includeStats?: boolean
  ) {
    this.logger.log(`Получение задания: ${id}`);

    const assignment = await this.assignmentService.getAssignment(
      id,
      includeSubmissions,
      includeStats
    );

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      type: assignment.type,
      content: assignment.content,
      courseId: assignment.courseId,
      moduleId: assignment.moduleId,
      lessonId: assignment.lessonId,
      maxScore: assignment.maxScore,
      passingScore: assignment.passingScore,
      timeLimit: assignment.timeLimit,
      dueDate: assignment.dueDate,
      order: assignment.order,
      isPublished: assignment.isPublished,
      settings: assignment.settings,
      course: assignment.course,
      module: assignment.module,
      lesson: assignment.lesson,
      files: assignment.files,
      submissions: assignment.submissions,
      stats: assignment.stats,
      submissionsCount: assignment._count?.submissions || 0,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Обновить задание',
    description: 'Обновляет существующее задание'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Задание успешно обновлено',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string' },
        maxScore: { type: 'number' },
        isPublished: { type: 'boolean' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 403, description: 'Нет прав на изменение задания' })
  async updateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Обновление задания: ${id}`, { userId: user.userId });

    const assignment = await this.assignmentService.updateAssignment(
      id,
      updateAssignmentDto,
      user.userId
    );

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      maxScore: assignment.maxScore,
      passingScore: assignment.passingScore,
      timeLimit: assignment.timeLimit,
      dueDate: assignment.dueDate,
      isPublished: assignment.isPublished,
      updatedAt: assignment.updatedAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить задание',
    description: 'Выполняет мягкое удаление задания'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({ status: 204, description: 'Задание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 403, description: 'Нет прав на удаление задания' })
  async deleteAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Удаление задания: ${id}`, { userId: user.userId });

    await this.assignmentService.deleteAssignment(id, user.userId);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Опубликовать задание',
    description: 'Делает задание доступным для студентов'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Задание успешно опубликовано',
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
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 403, description: 'Нет прав на публикацию задания' })
  async publishAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Публикация задания: ${id}`, { userId: user.userId });

    const assignment = await this.assignmentService.publishAssignment(id, user.userId);

    return {
      id: assignment.id,
      title: assignment.title,
      isPublished: assignment.isPublished,
      updatedAt: assignment.updatedAt,
    };
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Снять с публикации',
    description: 'Скрывает задание от студентов'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Задание снято с публикации',
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
  async unpublishAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Снятие с публикации задания: ${id}`, { userId: user.userId });

    const assignment = await this.assignmentService.unpublishAssignment(id, user.userId);

    return {
      id: assignment.id,
      title: assignment.title,
      isPublished: assignment.isPublished,
      updatedAt: assignment.updatedAt,
    };
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Дублировать задание',
    description: 'Создает копию существующего задания'
  })
  @ApiParam({ name: 'id', description: 'ID задания для дублирования' })
  @ApiResponse({
    status: 201,
    description: 'Задание успешно продублировано',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string' },
        courseId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Задание для дублирования не найдено' })
  @ApiResponse({ status: 403, description: 'Нет прав на дублирование задания' })
  async duplicateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicateDto: DuplicateAssignmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Дублирование задания: ${id}`, {
      newTitle: duplicateDto.newTitle,
      userId: user.userId,
    });

    const assignment = await this.assignmentService.duplicateAssignment(
      id,
      user.userId,
      duplicateDto.newTitle
    );

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      courseId: assignment.courseId,
      maxScore: assignment.maxScore,
      isPublished: assignment.isPublished,
      createdAt: assignment.createdAt,
    };
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Получить аналитику задания',
    description: 'Возвращает детальную статистику по заданию'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Аналитика задания получена',
    schema: {
      type: 'object',
      properties: {
        totalSubmissions: { type: 'number' },
        uniqueSubmissions: { type: 'number' },
        averageScore: { type: 'number' },
        completionRate: { type: 'number' },
        onTimeSubmissions: { type: 'number' },
        lateSubmissions: { type: 'number' },
        gradingProgress: { type: 'number' },
        scoreDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              range: { type: 'string' },
              count: { type: 'number' }
            }
          }
        },
        submissionTrend: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              count: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async getAssignmentAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Получение аналитики задания: ${id}`);

    return this.assignmentService.getAssignmentAnalytics(id);
  }

  @Get('templates/:type')
  @ApiOperation({
    summary: 'Получить шаблон задания',
    description: 'Возвращает шаблон для создания задания определенного типа'
  })
  @ApiParam({ name: 'type', description: 'Тип задания', enum: AssignmentType })
  @ApiQuery({ name: 'language', required: false, description: 'Язык программирования (для заданий типа CODE)' })
  @ApiResponse({
    status: 200,
    description: 'Шаблон задания получен',
    schema: {
      type: 'object',
      properties: {
        template: { type: 'object' },
        supportedTypes: { type: 'array', items: { type: 'string' } },
        defaultSettings: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неподдерживаемый тип задания' })
  async getAssignmentTemplate(
    @Param('type', new ParseEnumPipe(AssignmentType)) type: AssignmentType,
    @Query('language') language?: string
  ) {
    this.logger.log(`Получение шаблона задания типа: ${type}`, { language });

    const template = await this.assignmentService.createAssignmentTemplate(type, language);
    
    return {
      type,
      template,
      supportsAutoGrading: this.assignmentService.supportsAutoGrading(type),
      defaultSettings: AssignmentUtils.getDefaultSettings(type),
      supportedTypes: AssignmentUtils.getSupportedTypes?.() || ['QUIZ', 'CODE', 'ESSAY', 'PROJECT', 'UPLOAD', 'PEER_REVIEW'],
    };
  }

  @Get(':id/student-view')
  @ApiOperation({
    summary: 'Получить задание для студента',
    description: 'Возвращает задание, подготовленное для выполнения студентом (без правильных ответов, с перемешанными вопросами и т.д.)'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Задание подготовлено для студента',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        instructions: { type: 'string' },
        type: { type: 'string' },
        content: { type: 'object' },
        maxScore: { type: 'number' },
        timeLimit: { type: 'number' },
        dueDate: { type: 'string', format: 'date-time' },
        course: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 403, description: 'Задание не опубликовано' })
  async getAssignmentForStudent(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Получение задания для студента: ${id}`);

    const assignment = await this.assignmentService.getAssignment(id);
    
    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    if (!assignment.isPublished) {
      throw new ForbiddenException('Задание не опубликовано');
    }

    // Подготавливаем контент для студента
    const studentContent = this.assignmentService.prepareAssignmentForStudent(assignment);

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      type: assignment.type,
      content: studentContent,
      maxScore: assignment.maxScore,
      passingScore: assignment.passingScore,
      timeLimit: assignment.timeLimit,
      dueDate: assignment.dueDate,
      order: assignment.order,
      settings: assignment.settings,
      course: assignment.course,
      files: assignment.files,
      supportsAutoGrading: this.assignmentService.supportsAutoGrading(assignment.type),
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  @Get(':id/template')
  @ApiOperation({
    summary: 'Получить шаблон сдачи задания',
    description: 'Возвращает шаблон структуры для сдачи задания в зависимости от типа'
  })
  @ApiParam({ name: 'id', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Шаблон сдачи задания',
    schema: {
      type: 'object',
      properties: {
        assignmentId: { type: 'string' },
        type: { type: 'string' },
        fields: { type: 'array' },
        metadata: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async getAssignmentSubmissionTemplate(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Получение шаблона сдачи для задания: ${id}`);

    const assignment = await this.assignmentService.getAssignmentById(id);
    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    return AssignmentUtils.generateSubmissionTemplate(assignment);
  }
}
