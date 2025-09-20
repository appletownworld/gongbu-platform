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
  CertificateService, 
  CertificateRequest,
  CertificateQuery
} from './certificate.service';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class IssueCertificateDto implements CertificateRequest {
  @IsString()
  userId: string;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  customData?: Record<string, any>;
}

class SelfIssueCertificateDto {
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  customData?: Record<string, any>;
}

class CertificateQueryDto implements CertificateQuery {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'REVOKED', 'EXPIRED'])
  status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';

  @IsOptional()
  @IsDateString()
  issuedAfter?: Date;

  @IsOptional()
  @IsDateString()
  issuedBefore?: Date;

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

  @IsOptional()
  @IsString()
  orderBy?: 'issuedAt' | 'updatedAt' | 'expiresAt';

  @IsOptional()
  @IsString()
  orderDirection?: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeMetadata?: boolean;
}

class RevokeCertificateDto {
  @IsString()
  reason: string;
}

@ApiTags('Certificates')
@Controller('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CertificateController {
  private readonly logger = new Logger(CertificateController.name);

  constructor(private readonly certificateService: CertificateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Выдать сертификат',
    description: 'Выдает сертификат о завершении курса (только для преподавателей и админов)'
  })
  @ApiResponse({
    status: 201,
    description: 'Сертификат успешно выдан',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        certificateId: { type: 'string' },
        certificateNumber: { type: 'string' },
        studentId: { type: 'string' },
        courseId: { type: 'string' },
        issuedAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
        status: { type: 'string' },
        course: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Курс не завершен или сертификат уже выдан' })
  @ApiResponse({ status: 403, description: 'Нет прав для выдачи сертификатов' })
  @ApiResponse({ status: 404, description: 'Курс не найден' })
  async issueCertificate(
    @Body() issueCertificateDto: IssueCertificateDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Выдача сертификата: ${issueCertificateDto.userId} -> ${issueCertificateDto.courseId}`, {
      requesterId: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут выдавать сертификаты
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для выдачи сертификатов');
    }

    const certificate = await this.certificateService.issueCertificate(issueCertificateDto);

    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      userId: certificate.userId, // studentId не существует, используем userId
      courseId: certificate.courseId,
      issuedAt: certificate.issueDate, // issuedAt не существует, используем issueDate
      expiresAt: certificate.expiryDate, // expiresAt не существует, используем expiryDate
      status: certificate.status,
      // fingerprint: certificate.fingerprint, // Поле не существует в Prisma модели
      // templateId: certificate.templateId, // Поле не существует в Prisma модели
      // templateData: certificate.templateData, // Поле не существует в Prisma модели
      // metadata: certificate.metadata, // Поле не существует в Prisma модели
      enrollmentId: certificate.enrollmentId, // enrollment не существует, используем enrollmentId
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }

  @Post('self-issue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Получить сертификат самостоятельно',
    description: 'Студент получает сертификат о завершении курса самостоятельно'
  })
  @ApiResponse({
    status: 201,
    description: 'Сертификат успешно получен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        certificateId: { type: 'string' },
        certificateNumber: { type: 'string' },
        courseId: { type: 'string' },
        issuedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string' },
        course: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Курс не завершен или сертификат уже получен' })
  @ApiResponse({ status: 403, description: 'Доступно только для студентов' })
  async selfIssueCertificate(
    @Body() selfIssueCertificateDto: SelfIssueCertificateDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Самостоятельное получение сертификата: ${user.userId} -> ${selfIssueCertificateDto.courseId}`);

    // Только студенты могут использовать этот endpoint
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Этот endpoint доступен только для студентов');
    }

    const certificateData: CertificateRequest = {
      userId: user.userId,
      courseId: selfIssueCertificateDto.courseId,
      templateId: selfIssueCertificateDto.templateId,
      customData: selfIssueCertificateDto.customData,
    };

    const certificate = await this.certificateService.issueCertificate(certificateData);

    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      courseId: certificate.courseId,
      issuedAt: certificate.issueDate, // issuedAt не существует, используем issueDate
      expiresAt: certificate.expiryDate, // expiresAt не существует, используем expiryDate
      status: certificate.status,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список сертификатов',
    description: 'Возвращает список сертификатов с поддержкой фильтрации'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID студента' })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], description: 'Статус сертификата' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по номеру сертификата или названию курса' })
  @ApiQuery({ name: 'issuedAfter', required: false, description: 'Выданы после даты' })
  @ApiQuery({ name: 'issuedBefore', required: false, description: 'Выданы до даты' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей (1-100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации', example: 0 })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Поле сортировки', enum: ['issuedAt', 'updatedAt', 'expiresAt'] })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Направление сортировки', enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'includeTemplate', required: false, type: Boolean, description: 'Включить данные шаблона' })
  @ApiQuery({ name: 'includeMetadata', required: false, type: Boolean, description: 'Включить метаданные' })
  @ApiResponse({
    status: 200,
    description: 'Список сертификатов',
    schema: {
      type: 'object',
      properties: {
        certificates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              certificateId: { type: 'string' },
              certificateNumber: { type: 'string' },
              studentId: { type: 'string' },
              courseId: { type: 'string' },
              issuedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
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
  async getCertificates(
    @Query() query: CertificateQueryDto,
    @GetUser() user: UserContext
  ) {
    this.logger.debug('Получение списка сертификатов', { 
      query,
      requesterId: user.userId,
      role: user.role,
    });

    let result;

    if (user.role === 'STUDENT') {
      // Студенты видят только свои сертификаты
      result = await this.certificateService.getStudentCertificates(user.userId, query);
    } else {
      // Преподаватели и админы могут видеть сертификаты по своим курсам
      if (query.courseId) {
        result = await this.certificateService.getCourseCertificates(query.courseId, user.userId, query);
      } else {
        // Если courseId не указан, показываем сертификаты студента (для универсальности)
        result = await this.certificateService.getStudentCertificates(user.userId, query);
      }
    }

    return {
      certificates: result.certificates.map(certificate => ({
        id: certificate.id,
        certificateId: certificate.certificateId,
        certificateNumber: certificate.certificateNumber,
        userId: certificate.userId, // studentId не существует, используем userId
        courseId: certificate.courseId,
        issuedAt: certificate.issueDate, // issuedAt не существует, используем issueDate
        expiresAt: certificate.expiryDate, // expiresAt не существует, используем expiryDate
        status: certificate.status,
        // fingerprint: certificate.fingerprint, // Поле не существует в Prisma модели
        // templateId: certificate.templateId, // Поле не существует в Prisma модели
        templateData: query.includeMetadata ? certificate.templateData : undefined,
        metadata: query.includeMetadata ? certificate.metadata : undefined,
        enrollmentId: certificate.enrollmentId, // enrollment не существует, используем enrollmentId
        // revokedAt: certificate.revokedAt, // Поле не существует в Prisma модели
        // revokedBy: certificate.revokedBy, // Поле не существует в Prisma модели
        // revocationReason: certificate.revocationReason, // Поле не существует в Prisma модели
        createdAt: certificate.createdAt,
        updatedAt: certificate.updatedAt,
      })),
      total: result.total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  @Get('my')
  @ApiOperation({
    summary: 'Получить мои сертификаты',
    description: 'Возвращает все сертификаты текущего студента'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], description: 'Статус сертификата' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по номеру сертификата или названию курса' })
  @ApiResponse({
    status: 200,
    description: 'Мои сертификаты',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          certificateId: { type: 'string' },
          certificateNumber: { type: 'string' },
          courseId: { type: 'string' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          course: { type: 'object' },
        }
      }
    }
  })
  async getMyCertificates(
    @Query() query: Omit<CertificateQueryDto, 'userId'>,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение сертификатов студента: ${user.userId}`);

    // Только студенты могут использовать этот endpoint
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Этот endpoint доступен только для студентов');
    }

    const result = await this.certificateService.getStudentCertificates(user.userId, query);

    return result.certificates.map(certificate => ({
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      courseId: certificate.courseId,
      issuedAt: certificate.issueDate, // issuedAt не существует, используем issueDate
      expiresAt: certificate.expiryDate, // expiresAt не существует, используем expiryDate
      status: certificate.status,
      enrollmentId: certificate.enrollmentId, // enrollment не существует, используем enrollmentId
    }));
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Получить сертификаты курса',
    description: 'Возвращает все сертификаты конкретного курса (только для создателя курса)'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], description: 'Статус сертификата' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID студента' })
  @ApiResponse({
    status: 200,
    description: 'Сертификаты курса',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          certificateId: { type: 'string' },
          certificateNumber: { type: 'string' },
          studentId: { type: 'string' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав доступа к этому курсу' })
  async getCourseCertificates(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: Omit<CertificateQueryDto, 'courseId'>,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение сертификатов курса: ${courseId}`, {
      creatorId: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут видеть сертификаты курсов
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для просмотра сертификатов курса');
    }

    const result = await this.certificateService.getCourseCertificates(courseId, user.userId, query);

    return result.certificates.map(certificate => ({
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      userId: certificate.userId, // studentId не существует, используем userId
      issuedAt: certificate.issueDate, // issuedAt не существует, используем issueDate
      expiresAt: certificate.expiryDate, // expiresAt не существует, используем expiryDate
      status: certificate.status,
      // fingerprint: certificate.fingerprint, // Поле не существует в Prisma модели
      // templateData: certificate.templateData, // Поле не существует в Prisma модели
      // metadata: certificate.metadata, // Поле не существует в Prisma модели
      enrollmentId: certificate.enrollmentId, // enrollment не существует, используем enrollmentId
      // revokedAt: certificate.revokedAt, // Поле не существует в Prisma модели
      // revokedBy: certificate.revokedBy, // Поле не существует в Prisma модели
      // revocationReason: certificate.revocationReason, // Поле не существует в Prisma модели
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    }));
  }

  @Get('validate/:certificateId')
  @ApiOperation({
    summary: 'Валидировать сертификат',
    description: 'Проверяет подлинность и действительность сертификата (публичный endpoint)'
  })
  @ApiParam({ name: 'certificateId', description: 'ID сертификата' })
  @ApiResponse({
    status: 200,
    description: 'Результат валидации сертификата',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        certificate: { type: 'object' },
        errors: { type: 'array', items: { type: 'string' } },
        validatedAt: { type: 'string', format: 'date-time' },
        fingerprint: { type: 'string' },
      }
    }
  })
  async validateCertificate(@Param('certificateId') certificateId: string) {
    this.logger.debug(`Валидация сертификата: ${certificateId}`);

    const validation = await this.certificateService.validateCertificate(certificateId);

    return {
      isValid: validation.isValid,
      certificate: validation.certificate ? {
        certificateId: validation.certificate.certificateId,
        certificateNumber: validation.certificate.certificateNumber,
        userId: validation.certificate.userId, // studentId не существует, используем userId
        courseId: validation.certificate.courseId,
        issuedAt: validation.certificate.issueDate, // issuedAt не существует, используем issueDate
        expiresAt: validation.certificate.expiryDate, // expiresAt не существует, используем expiryDate
        status: validation.certificate.status,
        // templateData: validation.certificate.templateData, // Поле не существует в Prisma модели
        // metadata: validation.certificate.metadata, // Поле не существует в Prisma модели
      } : undefined,
      errors: validation.errors,
      validatedAt: validation.validatedAt,
      fingerprint: validation.fingerprint,
    };
  }

  @Get(':certificateId')
  @ApiOperation({
    summary: 'Получить сертификат по ID',
    description: 'Возвращает подробную информацию о сертификате'
  })
  @ApiParam({ name: 'certificateId', description: 'ID сертификата' })
  @ApiQuery({ name: 'includeTemplate', required: false, type: Boolean, description: 'Включить данные шаблона' })
  @ApiQuery({ name: 'includeMetadata', required: false, type: Boolean, description: 'Включить метаданные' })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация о сертификате',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        certificateId: { type: 'string' },
        certificateNumber: { type: 'string' },
        studentId: { type: 'string' },
        courseId: { type: 'string' },
        issuedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string' },
        course: { type: 'object' },
        templateData: { type: 'object' },
        metadata: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для просмотра этого сертификата' })
  @ApiResponse({ status: 404, description: 'Сертификат не найден' })
  async getCertificate(
    @Param('certificateId') certificateId: string,
    @GetUser() user: UserContext,
    @Query('includeTemplate') includeTemplate?: boolean,
    @Query('includeMetadata') includeMetadata?: boolean
  ) {
    this.logger.debug(`Получение сертификата: ${certificateId}`, { requesterId: user.userId });

    const certificate = await this.certificateService.getCertificate(certificateId, user.userId, {
      includeTemplate,
      includeMetadata,
    });

    if (!certificate) {
      throw new NotFoundException('Сертификат не найден');
    }

    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      userId: certificate.userId, // studentId не существует, используем userId
      courseId: certificate.courseId,
      issuedAt: certificate.issueDate, // issuedAt не существует, используем issueDate
      expiresAt: certificate.expiryDate, // expiresAt не существует, используем expiryDate
      status: certificate.status,
      // fingerprint: certificate.fingerprint, // Поле не существует в Prisma модели
      // templateId: certificate.templateId, // Поле не существует в Prisma модели
      // templateData: includeMetadata ? certificate.templateData : undefined, // Поле не существует в Prisma модели
      // metadata: includeMetadata ? certificate.metadata : undefined, // Поле не существует в Prisma модели
      enrollmentId: certificate.enrollmentId, // enrollment не существует, используем enrollmentId
      // issuerInfo: certificate.issuerInfo, // Поле не существует в Prisma модели
      // revokedAt: certificate.revokedAt, // Поле не существует в Prisma модели
      // revokedBy: certificate.revokedBy, // Поле не существует в Prisma модели
      // revocationReason: certificate.revocationReason, // Поле не существует в Prisma модели
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }

  @Put(':certificateId/revoke')
  @ApiOperation({
    summary: 'Отозвать сертификат',
    description: 'Отзывает активный сертификат (только для создателя курса)'
  })
  @ApiParam({ name: 'certificateId', description: 'ID сертификата' })
  @ApiResponse({
    status: 200,
    description: 'Сертификат успешно отозван',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        certificateId: { type: 'string' },
        status: { type: 'string' },
        revokedAt: { type: 'string', format: 'date-time' },
        revokedBy: { type: 'string' },
        revocationReason: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Можно отозвать только активные сертификаты' })
  @ApiResponse({ status: 403, description: 'Нет прав для отзыва сертификата' })
  @ApiResponse({ status: 404, description: 'Сертификат не найден' })
  async revokeCertificate(
    @Param('certificateId') certificateId: string,
    @Body() revokeCertificateDto: RevokeCertificateDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Отзыв сертификата: ${certificateId}`, { 
      reason: revokeCertificateDto.reason,
      revokedBy: user.userId,
    });

    // Проверяем права: только преподаватели и админы могут отзывать сертификаты
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для отзыва сертификатов');
    }

    const certificate = await this.certificateService.revokeCertificate(
      certificateId,
      revokeCertificateDto.reason,
      user.userId
    );

    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
      // revokedAt: certificate.revokedAt, // Поле не существует в Prisma модели
      // revokedBy: certificate.revokedBy, // Поле не существует в Prisma модели
      // revocationReason: certificate.revocationReason, // Поле не существует в Prisma модели
      updatedAt: certificate.updatedAt,
    };
  }

  @Put(':certificateId/restore')
  @ApiOperation({
    summary: 'Восстановить сертификат',
    description: 'Восстанавливает отозванный сертификат (только для создателя курса)'
  })
  @ApiParam({ name: 'certificateId', description: 'ID сертификата' })
  @ApiResponse({
    status: 200,
    description: 'Сертификат успешно восстановлен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        certificateId: { type: 'string' },
        status: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Можно восстановить только отозванные сертификаты' })
  @ApiResponse({ status: 403, description: 'Нет прав для восстановления сертификата' })
  @ApiResponse({ status: 404, description: 'Сертификат не найден' })
  async restoreCertificate(
    @Param('certificateId') certificateId: string,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Восстановление сертификата: ${certificateId}`, { restoredBy: user.userId });

    // Проверяем права: только преподаватели и админы могут восстанавливать сертификаты
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для восстановления сертификатов');
    }

    const certificate = await this.certificateService.restoreCertificate(certificateId, user.userId);

    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
      // revokedAt: certificate.revokedAt, // Поле не существует в Prisma модели
      // revokedBy: certificate.revokedBy, // Поле не существует в Prisma модели
      // revocationReason: certificate.revocationReason, // Поле не существует в Prisma модели
      updatedAt: certificate.updatedAt,
    };
  }

  @Get('stats/:courseId')
  @ApiOperation({
    summary: 'Получить статистику сертификатов курса',
    description: 'Возвращает подробную статистику сертификатов для курса (только для создателя)'
  })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  @ApiResponse({
    status: 200,
    description: 'Статистика сертификатов',
    schema: {
      type: 'object',
      properties: {
        totalIssued: { type: 'number' },
        activeCount: { type: 'number' },
        revokedCount: { type: 'number' },
        expiredCount: { type: 'number' },
        thisMonthIssued: { type: 'number' },
        thisYearIssued: { type: 'number' },
        averageCompletionTime: { type: 'number' },
        topCourses: { type: 'array' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав доступа к статистике' })
  async getCertificateStats(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение статистики сертификатов: ${courseId}`, { creatorId: user.userId });

    // Проверяем права: только преподаватели и админы могут видеть статистику
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Нет прав для просмотра статистики сертификатов');
    }

    const stats = await this.certificateService.getCertificateStats(courseId, user.userId);

    return {
      courseId,
      totalIssued: stats.totalIssued,
      activeCount: stats.activeCount,
      revokedCount: stats.revokedCount,
      expiredCount: stats.expiredCount,
      thisMonthIssued: stats.thisMonthIssued,
      thisYearIssued: stats.thisYearIssued,
      averageCompletionTime: Math.round(stats.averageCompletionTime * 100) / 100, // дни
      topCourses: stats.topCourses,
    };
  }
}
