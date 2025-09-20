import {
  Controller,
  Get,
  Post,
  Put,
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
  PaymentService, 
  CreatePaymentRequest,
  PaymentQuery,
  ProcessRefundRequest,
  CreateSubscriptionRequest,
} from './payment.service';
import { PaymentStatus, PaymentProvider, PaymentMethod } from '@prisma/client';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  IsDateString, 
  IsBoolean, 
  IsEmail,
  Min, 
  Max 
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class CreatePaymentDto implements CreatePaymentRequest {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsNumber()
  @Min(0.01)
  @Max(100000)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @IsOptional()
  receiptData?: Record<string, any>;
}

class SelfPaymentDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsNumber()
  @Min(0.01)
  @Max(100000)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;
}

class PaymentQueryDto implements PaymentQuery {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsDateString()
  createdAfter?: Date;

  @IsOptional()
  @IsDateString()
  createdBefore?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amountMin?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amountMax?: number;

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
  orderBy?: 'createdAt' | 'updatedAt' | 'amount';

  @IsOptional()
  @IsString()
  orderDirection?: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeRefunds?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTransactions?: boolean;
}

class RefundDto implements ProcessRefundRequest {
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsString()
  reason: string;

  @IsString()
  refundedBy: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

class CreateSubscriptionDto implements CreateSubscriptionRequest {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trialPeriodDays?: number;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать платеж',
    description: 'Создает новый платеж (только для админов и преподавателей)'
  })
  @ApiResponse({
    status: 201,
    description: 'Платеж успешно создан',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        orderNumber: { type: 'string' },
        userId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        status: { type: 'string' },
        provider: { type: 'string' },
        confirmationUrl: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные платежа' })
  @ApiResponse({ status: 403, description: 'Нет прав для создания платежей' })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Создание платежа: ${createPaymentDto.amount} ${createPaymentDto.currency}`, {
      requesterId: user.userId,
      userId: createPaymentDto.userId,
    });

    // Проверяем права: только админы и преподаватели могут создавать платежи для других
    if (user.role === 'STUDENT' && createPaymentDto.userId !== user.userId) {
      throw new ForbiddenException('Студенты могут создавать платежи только для себя');
    }

    const payment = await this.paymentService.createPayment(createPaymentDto);

    return {
      id: payment.id,
      orderNumber: payment.orderNumber,
      externalId: payment.externalId,
      userId: payment.userId,
      courseId: payment.courseId,
      subscriptionId: payment.subscriptionId,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      provider: payment.provider,
      paymentMethod: payment.paymentMethod,
      confirmationUrl: payment.confirmationUrl,
      returnUrl: payment.returnUrl,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  @Post('self-payment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать платеж для себя',
    description: 'Пользователь создает платеж для себя (доступно всем авторизованным пользователям)'
  })
  @ApiResponse({
    status: 201,
    description: 'Платеж успешно создан',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        orderNumber: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        status: { type: 'string' },
        provider: { type: 'string' },
        confirmationUrl: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные платежа' })
  async createSelfPayment(
    @Body() selfPaymentDto: SelfPaymentDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Самостоятельное создание платежа: ${selfPaymentDto.amount} ${selfPaymentDto.currency}`, {
      userId: user.userId,
    });

    const paymentData: CreatePaymentRequest = {
      ...selfPaymentDto,
      userId: user.userId,
      metadata: {
        createdBy: 'self',
        userRole: user.role,
      },
    };

    const payment = await this.paymentService.createPayment(paymentData);

    return {
      id: payment.id,
      orderNumber: payment.orderNumber,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      provider: payment.provider,
      confirmationUrl: payment.confirmationUrl,
      createdAt: payment.createdAt,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список платежей',
    description: 'Возвращает список платежей с поддержкой фильтрации'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID пользователя' })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiQuery({ name: 'subscriptionId', required: false, description: 'ID подписки' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Статус платежа' })
  @ApiQuery({ name: 'provider', required: false, enum: PaymentProvider, description: 'Провайдер платежей' })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: PaymentMethod, description: 'Способ оплаты' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по номеру заказа или описанию' })
  @ApiQuery({ name: 'createdAfter', required: false, description: 'Созданы после даты' })
  @ApiQuery({ name: 'createdBefore', required: false, description: 'Созданы до даты' })
  @ApiQuery({ name: 'amountMin', required: false, type: Number, description: 'Минимальная сумма' })
  @ApiQuery({ name: 'amountMax', required: false, type: Number, description: 'Максимальная сумма' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей (1-100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации', example: 0 })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Поле сортировки', enum: ['createdAt', 'updatedAt', 'amount'] })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Направление сортировки', enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'includeRefunds', required: false, type: Boolean, description: 'Включить возвраты' })
  @ApiQuery({ name: 'includeTransactions', required: false, type: Boolean, description: 'Включить транзакции' })
  @ApiResponse({
    status: 200,
    description: 'Список платежей',
    schema: {
      type: 'object',
      properties: {
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              orderNumber: { type: 'string' },
              userId: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
              status: { type: 'string' },
              provider: { type: 'string' },
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
  async getPayments(
    @Query() query: PaymentQueryDto,
    @GetUser() user: UserContext
  ) {
    this.logger.debug('Получение списка платежей', { 
      query,
      requesterId: user.userId,
      role: user.role,
    });

    let result;

    if (user.role === 'STUDENT') {
      // Студенты видят только свои платежи
      result = await this.paymentService.getUserPayments(user.userId, query);
    } else {
      // Админы и преподаватели могут видеть платежи с фильтрацией
      if (query.userId) {
        result = await this.paymentService.getUserPayments(query.userId, query);
      } else {
        // Если userId не указан, показываем свои платежи
        result = await this.paymentService.getUserPayments(user.userId, query);
      }
    }

    return {
      payments: result.payments.map(payment => ({
        id: payment.id,
        orderNumber: payment.orderNumber,
        externalId: payment.externalId,
        userId: payment.userId,
        courseId: payment.courseId,
        subscriptionId: payment.subscriptionId,
        amount: Number(payment.amount),
        currency: payment.currency,
        description: payment.description,
        status: payment.status,
        provider: payment.provider,
        paymentMethod: payment.paymentMethod,
        confirmationUrl: payment.confirmationUrl,
        returnUrl: payment.returnUrl,
        completedAt: payment.completedAt,
        metadata: payment.metadata,
        refunds: query.includeRefunds ? payment.refunds : undefined,
        transactions: query.includeTransactions ? payment.transactions : undefined,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
      total: result.total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  @Get('my')
  @ApiOperation({
    summary: 'Получить мои платежи',
    description: 'Возвращает все платежи текущего пользователя'
  })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Статус платежа' })
  @ApiQuery({ name: 'provider', required: false, enum: PaymentProvider, description: 'Провайдер платежей' })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiResponse({
    status: 200,
    description: 'Мои платежи',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderNumber: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          provider: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        }
      }
    }
  })
  async getMyPayments(
    @Query() query: Omit<PaymentQueryDto, 'userId'>,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение платежей пользователя: ${user.userId}`);

    const result = await this.paymentService.getUserPayments(user.userId, query);

    return result.payments.map(payment => ({
      id: payment.id,
      orderNumber: payment.orderNumber,
      externalId: payment.externalId,
      courseId: payment.courseId,
      subscriptionId: payment.subscriptionId,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      provider: payment.provider,
      paymentMethod: payment.paymentMethod,
      confirmationUrl: payment.confirmationUrl,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
    }));
  }

  @Get('order/:orderNumber')
  @ApiOperation({
    summary: 'Получить платеж по номеру заказа',
    description: 'Возвращает платеж по номеру заказа (публичный endpoint)'
  })
  @ApiParam({ name: 'orderNumber', description: 'Номер заказа' })
  @ApiResponse({
    status: 200,
    description: 'Информация о платеже',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        orderNumber: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        provider: { type: 'string' },
        confirmationUrl: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  async getPaymentByOrderNumber(@Param('orderNumber') orderNumber: string) {
    this.logger.debug(`Получение платежа по номеру заказа: ${orderNumber}`);

    const payment = await this.paymentService.getPaymentByOrderNumber(orderNumber);

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return {
      id: payment.id,
      orderNumber: payment.orderNumber,
      externalId: payment.externalId,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      provider: payment.provider,
      paymentMethod: payment.paymentMethod,
      confirmationUrl: payment.confirmationUrl,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить платеж по ID',
    description: 'Возвращает подробную информацию о платеже'
  })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация о платеже',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        orderNumber: { type: 'string' },
        userId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        provider: { type: 'string' },
        statusHistory: { type: 'array' },
        metadata: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для просмотра платежа' })
  @ApiResponse({ status: 404, description: 'Платеж не найден' })
  async getPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение платежа: ${id}`, { requesterId: user.userId });

    const payment = await this.paymentService.getPayment(id, user.userId);

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return {
      id: payment.id,
      orderNumber: payment.orderNumber,
      externalId: payment.externalId,
      userId: payment.userId,
      courseId: payment.courseId,
      subscriptionId: payment.subscriptionId,
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      provider: payment.provider,
      paymentMethod: payment.paymentMethod,
      confirmationUrl: payment.confirmationUrl,
      returnUrl: payment.returnUrl,
      statusHistory: payment.statusHistory,
      providerData: payment.providerData,
      receiptData: payment.receiptData,
      metadata: payment.metadata,
      completedAt: payment.completedAt,
      refunds: payment.refunds || [],
      transactions: payment.transactions || [],
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать возврат',
    description: 'Создает возврат для успешного платежа (только для админов)'
  })
  @ApiParam({ name: 'id', description: 'ID платежа' })
  @ApiResponse({
    status: 201,
    description: 'Возврат успешно создан',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        paymentId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        status: { type: 'string' },
        reason: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные возврата или платеж не найден' })
  @ApiResponse({ status: 403, description: 'Нет прав для создания возвратов' })
  async createRefund(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() refundDto: Omit<RefundDto, 'paymentId' | 'refundedBy'>,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Создание возврата для платежа: ${paymentId}`, {
      amount: refundDto.amount,
      reason: refundDto.reason,
      refundedBy: user.userId,
    });

    // Проверяем права: только админы могут создавать возвраты
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Нет прав для создания возвратов');
    }

    const refundData: ProcessRefundRequest = {
      ...refundDto,
      paymentId,
      refundedBy: user.userId,
    };

    const refund = await this.paymentService.processRefund(refundData);

    return {
      id: refund.id,
      paymentId: refund.paymentId,
      externalId: refund.externalId,
      amount: Number(refund.amount),
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      requestedBy: refund.requestedBy,
      processedAt: refund.processedAt,
      metadata: refund.metadata,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
    };
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать подписку',
    description: 'Создает новую подписку для пользователя (только для админов и преподавателей)'
  })
  @ApiResponse({
    status: 201,
    description: 'Подписка успешно создана',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        planId: { type: 'string' },
        status: { type: 'string' },
        currentPeriodStart: { type: 'string', format: 'date-time' },
        currentPeriodEnd: { type: 'string', format: 'date-time' },
        provider: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Неверные данные подписки' })
  @ApiResponse({ status: 403, description: 'Нет прав для создания подписок' })
  @ApiResponse({ status: 409, description: 'У пользователя уже есть активная подписка' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @GetUser() user: UserContext
  ) {
    this.logger.log(`Создание подписки: ${createSubscriptionDto.planId}`, {
      requesterId: user.userId,
      userId: createSubscriptionDto.userId,
    });

    // Проверяем права: только админы и преподаватели могут создавать подписки для других
    if (user.role === 'STUDENT' && createSubscriptionDto.userId !== user.userId) {
      throw new ForbiddenException('Студенты могут создавать подписки только для себя');
    }

    const subscription = await this.paymentService.createSubscription(createSubscriptionDto);

    return {
      id: subscription.id,
      externalId: subscription.externalId,
      userId: subscription.userId,
      planId: subscription.planId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      canceledAt: subscription.canceledAt,
      provider: subscription.provider,
      metadata: subscription.metadata,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  @Get('stats/overview')
  @ApiOperation({
    summary: 'Получить статистику платежей',
    description: 'Возвращает общую статистику платежей (только для админов)'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Начальная дата' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Конечная дата' })
  @ApiQuery({ name: 'courseId', required: false, description: 'ID курса' })
  @ApiResponse({
    status: 200,
    description: 'Статистика платежей',
    schema: {
      type: 'object',
      properties: {
        totalRevenue: { type: 'number' },
        totalTransactions: { type: 'number' },
        successfulPayments: { type: 'number' },
        failedPayments: { type: 'number' },
        refundedAmount: { type: 'number' },
        averagePaymentAmount: { type: 'number' },
        revenueByMonth: { type: 'array' },
        topCourses: { type: 'array' },
        paymentMethodDistribution: { type: 'array' },
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Нет прав для просмотра статистики' })
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('courseId') courseId?: string,
    @GetUser() user: UserContext
  ) {
    this.logger.debug(`Получение статистики платежей`, { 
      requesterId: user.userId,
      startDate,
      endDate,
      courseId,
    });

    // Проверяем права: только админы могут видеть общую статистику
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Нет прав для просмотра статистики платежей');
    }

    const stats = await this.paymentService.getPaymentStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      courseId,
      undefined
    );

    return stats;
  }
}
