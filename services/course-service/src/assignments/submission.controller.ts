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
  ParseUUIDPipe,
  ParseIntPipe,
  ParseFloatPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
  SubmissionService,
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  GradeSubmissionRequest,
  SubmissionQuery
} from './submission.service';
import { SubmissionStatus } from '@prisma/client';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class CreateSubmissionDto implements CreateSubmissionRequest {
  @IsString()
  assignmentId: string;

  @IsString()
  studentId: string;

  @IsObject()
  content: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

class UpdateSubmissionDto implements UpdateSubmissionRequest {
  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}

class GradeSubmissionDto implements GradeSubmissionRequest {
  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsObject()
  rubricScores?: Record<string, number>;

  @IsString()
  gradedBy: string;
}

class SubmissionQueryDto implements SubmissionQuery {
  @IsOptional()
  @IsString()
  assignmentId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsString()
  gradedBy?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minScore?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxScore?: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  submittedFrom?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  submittedTo?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  gradedFrom?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  gradedTo?: Date;

  @IsOptional()
  @IsString()
  search?: string;

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
}

@ApiTags('Submissions')
@Controller('submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SubmissionController {
  private readonly logger = new Logger(SubmissionController.name);

  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать сдачу задания',
    description: 'Создает новую сдачу задания студентом'
  })
  @ApiResponse({
    status: 201,
    description: 'Сдача успешно создана',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        assignmentId: { type: 'string' },
        studentId: { type: 'string' },
        status: { type: 'string' },
        submittedAt: { type: 'string', format: 'date-time' },
        score: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные или задание уже сдано' })
  @ApiResponse({ status: 403, description: 'Срок сдачи истек или задание не опубликовано' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Создание сдачи задания: ${createSubmissionDto.assignmentId}`, {
      studentId: user.userId,
    });

    // Устанавливаем ID студента из аутентификации
    createSubmissionDto.studentId = user.userId;

    const submission = await this.submissionService.createSubmission(createSubmissionDto);

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      status: submission.status,
      submittedAt: submission.submittedAt,
      score: submission.score,
      maxScore: submission.maxScore,
      feedback: submission.feedback,
      isPassing: submission.isPassing,
      timeSpent: submission.timeSpent,
      attachments: submission.attachments,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список сдач',
    description: 'Возвращает список сдач заданий с поддержкой фильтрации'
  })
  @ApiQuery({ name: 'assignmentId', required: false, description: 'ID задания' })
  @ApiQuery({ name: 'studentId', required: false, description: 'ID студента' })
  @ApiQuery({ name: 'status', required: false, enum: SubmissionStatus, description: 'Статус сдачи' })
  @ApiQuery({ name: 'gradedBy', required: false, description: 'Кто проверил' })
  @ApiQuery({ name: 'minScore', required: false, type: Number, description: 'Минимальная оценка' })
  @ApiQuery({ name: 'maxScore', required: false, type: Number, description: 'Максимальная оценка' })
  @ApiQuery({ name: 'submittedFrom', required: false, description: 'Дата сдачи от (ISO 8601)' })
  @ApiQuery({ name: 'submittedTo', required: false, description: 'Дата сдачи до (ISO 8601)' })
  @ApiQuery({ name: 'gradedFrom', required: false, description: 'Дата проверки от (ISO 8601)' })
  @ApiQuery({ name: 'gradedTo', required: false, description: 'Дата проверки до (ISO 8601)' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по тексту' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей (1-100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации', example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Список сдач заданий',
    schema: {
      type: 'object',
      properties: {
        submissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              assignmentId: { type: 'string' },
              studentId: { type: 'string' },
              status: { type: 'string' },
              score: { type: 'number' },
              submittedAt: { type: 'string', format: 'date-time' },
              gradedAt: { type: 'string', format: 'date-time' },
            }
          }
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      }
    }
  })
  async getSubmissions(@Query() query: SubmissionQueryDto) {
    this.logger.log('Получение списка сдач', { query });

    const result = await this.submissionService.getSubmissions(query);

    return {
      submissions: result.submissions.map(submission => ({
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        status: submission.status,
        score: submission.score,
        maxScore: submission.maxScore,
        feedback: submission.feedback,
        isPassing: submission.isPassing,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy,
        timeSpent: submission.timeSpent,
        attachments: submission.attachments,
        assignment: submission.assignment,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      })),
      total: result.total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить сдачу по ID',
    description: 'Возвращает подробную информацию о сдаче задания'
  })
  @ApiParam({ name: 'id', description: 'ID сдачи' })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация о сдаче',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        assignmentId: { type: 'string' },
        studentId: { type: 'string' },
        content: { type: 'object' },
        status: { type: 'string' },
        score: { type: 'number' },
        maxScore: { type: 'number' },
        feedback: { type: 'string' },
        submittedAt: { type: 'string', format: 'date-time' },
        gradedAt: { type: 'string', format: 'date-time' },
        assignment: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Сдача не найдена' })
  async getSubmissionById(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Получение сдачи: ${id}`);

    const submission = await this.submissionService.getSubmissionById(id);
    
    if (!submission) {
      throw new NotFoundException('Сдача не найдена');
    }

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      content: submission.content,
      status: submission.status,
      score: submission.score,
      maxScore: submission.maxScore,
      feedback: submission.feedback,
      rubricScores: submission.rubricScores,
      isPassing: submission.isPassing,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt,
      gradedBy: submission.gradedBy,
      timeSpent: submission.timeSpent,
      attachments: submission.attachments,
      metadata: submission.metadata,
      assignment: submission.assignment,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Обновить сдачу задания',
    description: 'Обновляет существующую сдачу задания (только до проверки)'
  })
  @ApiParam({ name: 'id', description: 'ID сдачи' })
  @ApiResponse({
    status: 200,
    description: 'Сдача успешно обновлена',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 403, description: 'Нет прав или сдача уже проверена' })
  @ApiResponse({ status: 404, description: 'Сдача не найдена' })
  async updateSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Обновление сдачи: ${id}`, { userId: user.userId });

    const submission = await this.submissionService.updateSubmission(
      id,
      updateSubmissionDto,
      user.userId
    );

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      status: submission.status,
      score: submission.score,
      maxScore: submission.maxScore,
      updatedAt: submission.updatedAt,
    };
  }

  @Post(':id/grade')
  @ApiOperation({
    summary: 'Проверить сдачу задания',
    description: 'Выставляет оценку и отзыв для сдачи задания (только для преподавателей)'
  })
  @ApiParam({ name: 'id', description: 'ID сдачи' })
  @ApiResponse({
    status: 200,
    description: 'Сдача успешно проверена',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        score: { type: 'number' },
        maxScore: { type: 'number' },
        feedback: { type: 'string' },
        isPassing: { type: 'boolean' },
        gradedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные или сдача уже проверена' })
  @ApiResponse({ status: 404, description: 'Сдача не найдена' })
  async gradeSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() gradeSubmissionDto: GradeSubmissionDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Проверка сдачи: ${id}`, {
      score: gradeSubmissionDto.score,
      graderId: user.userId,
    });

    // Устанавливаем ID проверяющего из аутентификации
    gradeSubmissionDto.gradedBy = user.userId;

    const submission = await this.submissionService.gradeSubmission(id, gradeSubmissionDto);

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      score: submission.score,
      maxScore: submission.maxScore,
      feedback: submission.feedback,
      rubricScores: submission.rubricScores,
      isPassing: submission.isPassing,
      status: submission.status,
      gradedBy: submission.gradedBy,
      gradedAt: submission.gradedAt,
    };
  }

  @Post(':id/auto-grade')
  @ApiOperation({
    summary: 'Автоматическая проверка сдачи',
    description: 'Выполняет автоматическую проверку для поддерживаемых типов заданий'
  })
  @ApiParam({ name: 'id', description: 'ID сдачи' })
  @ApiResponse({
    status: 200,
    description: 'Автопроверка успешно выполнена',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        score: { type: 'number' },
        maxScore: { type: 'number' },
        feedback: { type: 'string' },
        isPassing: { type: 'boolean' },
        gradedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Автопроверка не поддерживается для этого типа задания' })
  @ApiResponse({ status: 404, description: 'Сдача не найдена' })
  async autoGradeSubmission(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Автопроверка сдачи: ${id}`);

    const submission = await this.submissionService.autoGradeSubmission(id);

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      score: submission.score,
      maxScore: submission.maxScore,
      feedback: submission.feedback,
      isPassing: submission.isPassing,
      status: submission.status,
      gradedBy: submission.gradedBy,
      gradedAt: submission.gradedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить сдачу задания',
    description: 'Удаляет сдачу задания (только до проверки)'
  })
  @ApiParam({ name: 'id', description: 'ID сдачи' })
  @ApiResponse({ status: 204, description: 'Сдача успешно удалена' })
  @ApiResponse({ status: 403, description: 'Нет прав или сдача уже проверена' })
  @ApiResponse({ status: 404, description: 'Сдача не найдена' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Удаление сдачи: ${id}`, { userId: user.userId });

    await this.submissionService.deleteSubmission(id, user.userId);
  }

  @Get('assignment/:assignmentId/stats')
  @ApiOperation({
    summary: 'Получить статистику по сдачам задания',
    description: 'Возвращает статистику по всем сдачам конкретного задания'
  })
  @ApiParam({ name: 'assignmentId', description: 'ID задания' })
  @ApiResponse({
    status: 200,
    description: 'Статистика по сдачам задания',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество сдач' },
        submitted: { type: 'number', description: 'Количество сданных работ' },
        graded: { type: 'number', description: 'Количество проверенных работ' },
        pending: { type: 'number', description: 'Количество ожидающих работ' },
        averageScore: { type: 'number', description: 'Средняя оценка' },
        passingRate: { type: 'number', description: 'Процент успешных сдач' },
      }
    }
  })
  async getSubmissionStats(@Param('assignmentId', ParseUUIDPipe) assignmentId: string) {
    this.logger.log(`Получение статистики сдач для задания: ${assignmentId}`);

    const stats = await this.submissionService.getSubmissionStats(assignmentId);

    return {
      assignmentId,
      total: stats.total,
      submitted: stats.submitted,
      graded: stats.graded,
      pending: stats.pending,
      averageScore: Math.round(stats.averageScore * 100) / 100, // Округляем до 2 знаков
      passingRate: Math.round(stats.passingRate * 100) / 100, // Округляем до 2 знаков
    };
  }
}