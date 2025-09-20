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
  EnrollmentService, 
  EnrollmentRequest, 
  EnrollmentUpdateRequest,
  EnrollmentQuery,
  BulkEnrollmentRequest
} from './enrollment.service';
import { EnrollmentStatus } from '@prisma/client';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class CreateEnrollmentDto implements EnrollmentRequest {
  @IsString()
  studentId: string;

  @IsString()
  courseId: string;

  @IsEnum(['FREE', 'PAID'])
  enrollmentType: 'FREE' | 'PAID';

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  settings?: Record<string, any>;
}

class UpdateEnrollmentDto implements EnrollmentUpdateRequest {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  settings?: Record<string, any>;
}

class EnrollmentQueryDto implements EnrollmentQuery {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  enrolledAfter?: Date;

  @IsOptional()
  @IsDateString()
  enrolledBefore?: Date;

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
  orderBy?: 'enrolledAt' | 'updatedAt' | 'completedAt';

  @IsOptional()
  @IsString()
  orderDirection?: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeProgress?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includePayment?: boolean;
}

class BulkEnrollmentDto implements BulkEnrollmentRequest {
  @IsString()
  courseId: string;

  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @IsEnum(['FREE', 'PAID'])
  enrollmentType: 'FREE' | 'PAID';

  @IsOptional()
  settings?: Record<string, any>;
}

class SelfEnrollmentDto {
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;
}

@ApiTags('Enrollments')
@Controller('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EnrollmentController {
  private readonly logger = new Logger(EnrollmentController.name);

  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать запись на курс',
    description: 'Записывает студента на курс (только для преподавателей и админов)'
  })
  @ApiResponse({
    status: 201,
    description: 'Студент успешно записан на курс',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        studentId: { type: 'string' },
        courseId: { type: 'string' },
        status: { type: 'string' },
        enrolledAt: { type: 'string', format: 'date-time' },
        course: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные или студент уже записан' })
  @ApiResponse({ status: 403, description: 'Нет прав для записи студентов' })
  @ApiResponse({ status: 404, description: 'Курс не найден' })
  async createEnrollment(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Запись студента на курс: ${createEnrollmentDto.studentId} -> ${createEnrollmentDto.courseId}`, {
      creatorId: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут записывать студентов
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для записи студентов на курсы');
    }

    const enrollment = await this.enrollmentService.enrollStudent(createEnrollmentDto);

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      paymentId: enrollment.paymentId,
      discountCode: enrollment.discountCode,
      paidAmount: enrollment.paidAmount ? Number(enrollment.paidAmount) : undefined,
      settings: enrollment.settings,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }

  @Post('self-enroll')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Самостоятельная запись на курс',
    description: 'Студент записывается на курс самостоятельно'
  })
  @ApiResponse({
    status: 201,
    description: 'Успешная запись на курс',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        courseId: { type: 'string' },
        status: { type: 'string' },
        enrolledAt: { type: 'string', format: 'date-time' },
        course: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные или студент уже записан' })
  @ApiResponse({ status: 403, description: 'Курс требует оплаты' })
  @ApiResponse({ status: 404, description: 'Курс не найден' })
  async selfEnroll(
    @Body() selfEnrollmentDto: SelfEnrollmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Самостоятельная запись студента: ${user.userId} -> ${selfEnrollmentDto.courseId}`);

    // Только студенты могут использовать этот endpoint
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Этот endpoint доступен только для студентов');
    }

    const enrollmentData: EnrollmentRequest = {
      studentId: user.userId,
      courseId: selfEnrollmentDto.courseId,
      enrollmentType: selfEnrollmentDto.paidAmount ? 'PAID' : 'FREE',
      paymentId: selfEnrollmentDto.paymentId,
      discountCode: selfEnrollmentDto.discountCode,
      paidAmount: selfEnrollmentDto.paidAmount,
    };

    const enrollment = await this.enrollmentService.enrollStudent(enrollmentData);

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Массовая запись студентов',
    description: 'Записывает несколько студентов на курс одновременно (только для преподавателей и админов)'
  })
  @ApiResponse({
    status: 201,
    description: 'Массовая запись выполнена',
    schema: {
      type: 'object',
      properties: {
        successful: {
          type: 'array',
          items: { type: 'object' }
        },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'string' },
              error: { type: 'string' },
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            successful: { type: 'number' },
            failed: { type: 'number' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для массовой записи' })
  async bulkEnrollment(
    @Body() bulkEnrollmentDto: BulkEnrollmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Массовая запись студентов на курс: ${bulkEnrollmentDto.courseId}`, {
      studentCount: bulkEnrollmentDto.studentIds.length,
      creatorId: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут выполнять массовую запись
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для массовой записи студентов');
    }

    const result = await this.enrollmentService.bulkEnrollStudents(bulkEnrollmentDto, user.userId);

    return {
      successful: result.successful.map(enrollment => ({
        id: enrollment.id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      })),
      failed: result.failed,
      summary: {
        total: bulkEnrollmentDto.studentIds.length,
        successful: result.successful.length,
        failed: result.failed.length,
      },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список записей',
    description: 'Возвращает список записей на курсы с поддержкой фильтрации'
  })
  @ApiQuery({ name: 'studentId', required: false, description: 'ID студента' })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiQuery({ name: 'status', required: false, enum: EnrollmentStatus, description: 'Статус записи' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию курса' })
  @ApiQuery({ name: 'enrolledAfter', required: false, description: 'Записаны после даты' })
  @ApiQuery({ name: 'enrolledBefore', required: false, description: 'Записаны до даты' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей (1-100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации', example: 0 })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Поле сортировки', enum: ['enrolledAt', 'updatedAt', 'completedAt'] })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Направление сортировки', enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'includeProgress', required: false, type: Boolean, description: 'Включить прогресс' })
  @ApiQuery({ name: 'includePayment', required: false, type: Boolean, description: 'Включить информацию об оплате' })
  @ApiResponse({
    status: 200,
    description: 'Список записей на курсы',
    schema: {
      type: 'object',
      properties: {
        enrollments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              studentId: { type: 'string' },
              courseId: { type: 'string' },
              status: { type: 'string' },
              enrolledAt: { type: 'string', format: 'date-time' },
              course: { type: 'object' },
            }
          }
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      }
    }
  })
  async getEnrollments(
    @Query() query: EnrollmentQueryDto,
    @GetUser() user: UserContext
  ) {
    this.logger.debug('Получение списка записей на курсы', { 
      query,
      requesterId: user.userId,
      role: user.role,
    });

    let result;

    if (user.role === 'STUDENT') {
      // Студенты видят только свои записи
      result = await this.enrollmentService.getStudentEnrollments(user.userId, query);
    } else {
      // Преподаватели и админы могут видеть записи на свои курсы
      if (query.courseId) {
        result = await this.enrollmentService.getCourseEnrollments(query.courseId, user.userId, query);
      } else {
        // Если courseId не указан, показываем записи только на курсы этого преподавателя
        // Здесь нужно будет добавить логику фильтрации по курсам создателя
        result = await this.enrollmentService.getStudentEnrollments(user.userId, query);
      }
    }

    return {
      enrollments: result.enrollments.map(enrollment => ({
        id: enrollment.id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        paymentId: enrollment.paymentId,
        discountCode: enrollment.discountCode,
        paidAmount: enrollment.paidAmount ? Number(enrollment.paidAmount) : undefined,
        settings: enrollment.settings,
        // progress: enrollment.progress?.[0] || null, // Field doesn't exist
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
      })),
      total: result.total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  @Get('my')
  @ApiOperation({
    summary: 'Получить мои записи на курсы',
    description: 'Возвращает все записи текущего студента на курсы'
  })
  @ApiQuery({ name: 'status', required: false, enum: EnrollmentStatus, description: 'Статус записи' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию курса' })
  @ApiQuery({ name: 'includeProgress', required: false, type: Boolean, description: 'Включить прогресс' })
  @ApiResponse({
    status: 200,
    description: 'Мои записи на курсы',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          courseId: { type: 'string' },
          status: { type: 'string' },
          enrolledAt: { type: 'string', format: 'date-time' },
          course: { type: 'object' },
          progress: { type: 'object' },
        }
      }
    }
  })
  async getMyEnrollments(
    @Query() query: Omit<EnrollmentQueryDto, 'studentId'>,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение записей студента: ${user.userId}`);

    // Только студенты могут использовать этот endpoint
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Этот endpoint доступен только для студентов');
    }

    const result = await this.enrollmentService.getStudentEnrollments(user.userId, query);

    return result.enrollments.map(enrollment => ({
      id: enrollment.id,
      courseId: enrollment.courseId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      // progress: enrollment.progress?.[0] || null, // Field doesn't exist
    }));
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Получить записи на курс',
    description: 'Возвращает все записи на конкретный курс (только для создателя курса)'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiQuery({ name: 'status', required: false, enum: EnrollmentStatus, description: 'Статус записи' })
  @ApiQuery({ name: 'includeProgress', required: false, type: Boolean, description: 'Включить прогресс' })
  @ApiResponse({
    status: 200,
    description: 'Записи на курс',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          studentId: { type: 'string' },
          status: { type: 'string' },
          enrolledAt: { type: 'string', format: 'date-time' },
          progress: { type: 'object' },
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав доступа к этому курсу' })
  async getCourseEnrollments(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: Omit<EnrollmentQueryDto, 'courseId'>,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение записей на курс: ${courseId}`, {
      creatorId: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут видеть записи на курсы
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для просмотра записей на курс');
    }

    const result = await this.enrollmentService.getCourseEnrollments(courseId, user.userId, query);

    return result.enrollments.map(enrollment => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      paymentId: enrollment.paymentId,
      discountCode: enrollment.discountCode,
      paidAmount: enrollment.paidAmount ? Number(enrollment.paidAmount) : undefined,
      settings: enrollment.settings,
      // progress: enrollment.progress?.[0] || null, // Field doesn't exist
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить запись на курс по ID',
    description: 'Возвращает подробную информацию о записи на курс'
  })
  @ApiParam({ name: 'id', description: 'ID записи' })
  @ApiQuery({ name: 'includeProgress', required: false, type: Boolean, description: 'Включить прогресс' })
  @ApiQuery({ name: 'includePayment', required: false, type: Boolean, description: 'Включить информацию об оплате' })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация о записи',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        studentId: { type: 'string' },
        courseId: { type: 'string' },
        status: { type: 'string' },
        enrolledAt: { type: 'string', format: 'date-time' },
        course: { type: 'object' },
        progress: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для просмотра этой записи' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async getEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext,
    @Query('includeProgress') includeProgress?: boolean,
    @Query('includePayment') includePayment?: boolean
  ) {
    this.logger.debug(`Получение записи: ${id}`, { requesterId: user.userId });

    const enrollment = await this.enrollmentService.getEnrollment(id, user.userId, {
      includeProgress,
      includePayment,
    });

    if (!enrollment) {
      throw new NotFoundException('Запись на курс не найдена');
    }

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      paymentId: enrollment.paymentId,
      discountCode: enrollment.discountCode,
      paidAmount: enrollment.paidAmount ? Number(enrollment.paidAmount) : undefined,
      settings: enrollment.settings,
      // progress: enrollment.progress?.[0] || null, // Field doesn't exist
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Обновить запись на курс',
    description: 'Обновляет статус или настройки записи на курс'
  })
  @ApiParam({ name: 'id', description: 'ID записи' })
  @ApiResponse({
    status: 200,
    description: 'Запись успешно обновлена',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для обновления записи' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  async updateEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Обновление записи: ${id}`, { 
      requesterId: user.userId,
      status: updateEnrollmentDto.status,
    });

    const enrollment = await this.enrollmentService.updateEnrollment(id, updateEnrollmentDto, user.userId);

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      settings: enrollment.settings,
      updatedAt: enrollment.updatedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Отписаться от курса',
    description: 'Отписывает студента от курса (изменяет статус на DROPPED)'
  })
  @ApiParam({ name: 'id', description: 'ID записи' })
  @ApiResponse({ status: 204, description: 'Студент успешно отписан' })
  @ApiResponse({ status: 403, description: 'Нет прав для отписки' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unenrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Отписка от курса: ${id}`, { requesterId: user.userId });

    await this.enrollmentService.unenrollStudent(id, user.userId);
  }

  @Get('stats/:courseId')
  @ApiOperation({
    summary: 'Получить статистику записей на курс',
    description: 'Возвращает подробную статистику записей для курса (только для создателя)'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiResponse({
    status: 200,
    description: 'Статистика записей',
    schema: {
      type: 'object',
      properties: {
        totalEnrollments: { type: 'number' },
        activeEnrollments: { type: 'number' },
        completedEnrollments: { type: 'number' },
        droppedEnrollments: { type: 'number' },
        pausedEnrollments: { type: 'number' },
        completionRate: { type: 'number' },
        dropoutRate: { type: 'number' },
        revenueGenerated: { type: 'number' },
        averageCompletionTime: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав доступа к статистике' })
  async getEnrollmentStats(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение статистики записей: ${courseId}`, { creatorId: user.userId });

    // Проверяем права: только преподаватели и админы могут видеть статистику
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для просмотра статистики записей');
    }

    const stats = await this.enrollmentService.getEnrollmentStats(courseId, user.userId);

    return {
      courseId,
      totalEnrollments: stats.totalEnrollments,
      activeEnrollments: stats.activeEnrollments,
      completedEnrollments: stats.completedEnrollments,
      droppedEnrollments: stats.droppedEnrollments,
      pausedEnrollments: stats.pausedEnrollments,
      averageCompletionTime: Math.round(stats.averageCompletionTime * 100) / 100, // дни
      completionRate: Math.round(stats.completionRate * 100) / 100, // %
      dropoutRate: Math.round(stats.dropoutRate * 100) / 100, // %
      revenueGenerated: stats.revenueGenerated,
      freeEnrollments: stats.freeEnrollments,
      paidEnrollments: stats.paidEnrollments,
    };
  }

  @Get('check/:courseId')
  @ApiOperation({
    summary: 'Проверить запись на курс',
    description: 'Проверяет, записан ли текущий пользователь на курс'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiResponse({
    status: 200,
    description: 'Результат проверки записи',
    schema: {
      type: 'object',
      properties: {
        isEnrolled: { type: 'boolean' },
        enrollment: { type: 'object' },
      }
    }
  })
  async checkEnrollment(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Проверка записи на курс: ${courseId}`, { studentId: user.userId });

    // Только студенты могут использовать этот endpoint
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Этот endpoint доступен только для студентов');
    }

    const isEnrolled = await this.enrollmentService.isStudentEnrolled(user.userId, courseId);
    const enrollment = isEnrolled 
      ? await this.enrollmentService.getActiveEnrollment(user.userId, courseId)
      : null;

    return {
      isEnrolled,
      enrollment: enrollment ? {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        courseId: enrollment.courseId,
        // progress: enrollment.progress?.[0] || null, // Field doesn't exist
      } : null,
    };
  }
}
