import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
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
import { NotificationService, CreateNotificationRequest, BulkNotificationRequest } from './notification.service';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority, 
  NotificationStatus 
} from '@prisma/client';

// DTOs
class CreateNotificationDto implements CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel | NotificationChannel[];
  title: string;
  content: string;
  contentPlain?: string;
  priority?: NotificationPriority;
  scheduledFor?: Date;
  templateId?: string;
  templateData?: Record<string, any>;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
  recipientEmail?: string;
  recipientPhone?: string;
  telegramChatId?: string;
  expiresAt?: Date;
}

class BulkNotificationDto implements BulkNotificationRequest {
  userIds: string[];
  type: NotificationType;
  channel: NotificationChannel | NotificationChannel[];
  title: string;
  content: string;
  priority?: NotificationPriority;
  templateId?: string;
  templateData?: Record<string, any>;
  batchSize?: number;
  delayBetweenBatches?: number;
}

class SendEmailDto {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

class SendPushDto {
  tokens: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  icon?: string;
  clickAction?: string;
  priority?: 'low' | 'normal' | 'high';
  ttl?: number;
}

class NotificationQueryDto {
  channel?: NotificationChannel;
  type?: NotificationType;
  status?: NotificationStatus;
  limit?: number;
  offset?: number;
  includeRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create and send a notification',
    description: 'Creates a new notification and queues it for delivery through specified channels'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Notification created and queued successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        channels: { type: 'array', items: { type: 'string' } },
        scheduledFor: { type: 'string', format: 'date-time' },
        estimatedDeliveryTime: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Failed to create notification' })
  async createNotification(@Body() createDto: CreateNotificationDto) {
    this.logger.log(`Creating notification for user ${createDto.userId}`, {
      type: createDto.type,
      channels: Array.isArray(createDto.channel) ? createDto.channel : [createDto.channel],
    });

    return this.notificationService.createNotification(createDto);
  }

  @Post('bulk')
  @ApiOperation({ 
    summary: 'Create bulk notifications',
    description: 'Creates notifications for multiple users in batches'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Bulk notifications created successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          channels: { type: 'array', items: { type: 'string' } },
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Failed to create bulk notifications' })
  async createBulkNotifications(@Body() bulkDto: BulkNotificationDto) {
    this.logger.log(`Creating bulk notifications for ${bulkDto.userIds.length} users`, {
      type: bulkDto.type,
      channels: Array.isArray(bulkDto.channel) ? bulkDto.channel : [bulkDto.channel],
    });

    return this.notificationService.createBulkNotifications(bulkDto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get notification by ID',
    description: 'Retrieves detailed information about a specific notification'
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        type: { type: 'string' },
        channel: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        sentAt: { type: 'string', format: 'date-time' },
        deliveredAt: { type: 'string', format: 'date-time' },
        readAt: { type: 'string', format: 'date-time' },
        template: { type: 'object' },
        deliveries: { type: 'array' },
        interactions: { type: 'array' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotification(@Param('id') notificationId: string) {
    return this.notificationService.getNotification(notificationId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user notifications',
    description: 'Retrieves notifications for the authenticated user with optional filtering'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID (admin only)' })
  @ApiQuery({ name: 'channel', required: false, enum: NotificationChannel })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Maximum number of results' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Number of results to skip' })
  @ApiQuery({ name: 'includeRead', required: false, type: 'boolean', description: 'Include read notifications' })
  @ApiResponse({ 
    status: 200, 
    description: 'User notifications',
    schema: {
      type: 'object',
      properties: {
        notifications: { type: 'array' },
        total: { type: 'number' },
      }
    }
  })
  async getUserNotifications(
    @Query() query: NotificationQueryDto,
    @Request() req: any
  ) {
    // TODO: Extract user ID from JWT token
    const userId = query.userId || req.user?.id || 'temp-user-id';
    
    return this.notificationService.getUserNotifications(userId, {
      channel: query.channel,
      type: query.type,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
      includeRead: query.includeRead,
    });
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Mark notification as read',
    description: 'Marks a notification as read by the user'
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') notificationId: string,
    @Request() req: any
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'temp-user-id';
    
    await this.notificationService.markAsRead(notificationId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Cancel notification',
    description: 'Cancels a pending or scheduled notification'
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel already sent notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async cancelNotification(
    @Param('id') notificationId: string,
    @Request() req: any
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'temp-user-id';
    
    await this.notificationService.cancelNotification(notificationId, userId);
  }

  @Post(':id/resend')
  @ApiOperation({ 
    summary: 'Resend failed notification',
    description: 'Resends a failed notification'
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification queued for resending' })
  @ApiResponse({ status: 400, description: 'Only failed notifications can be resent' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async resendNotification(@Param('id') notificationId: string) {
    await this.notificationService.resendNotification(notificationId);
    
    return {
      message: 'Notification queued for resending',
      notificationId,
    };
  }

  @Get('stats/overview')
  @ApiOperation({ 
    summary: 'Get notification statistics',
    description: 'Retrieves notification statistics with optional filtering'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID filter' })
  @ApiQuery({ name: 'dateFrom', required: false, type: 'string', format: 'date', description: 'Start date' })
  @ApiQuery({ name: 'dateTo', required: false, type: 'string', format: 'date', description: 'End date' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'channel', required: false, enum: NotificationChannel })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        pending: { type: 'number' },
        queued: { type: 'number' },
        processing: { type: 'number' },
        sent: { type: 'number' },
        delivered: { type: 'number' },
        failed: { type: 'number' },
        cancelled: { type: 'number' },
      }
    }
  })
  async getNotificationStats(
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: NotificationType,
    @Query('channel') channel?: NotificationChannel
  ) {
    return this.notificationService.getNotificationStats(
      userId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      type,
      channel
    );
  }

  // Email-specific endpoints

  @Post('email/send')
  @ApiOperation({ 
    summary: 'Send email directly',
    description: 'Sends an email directly through the email service (bypasses notification system)'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Email sent successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        externalId: { type: 'string' },
        provider: { type: 'string' },
        status: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid email request' })
  @ApiResponse({ status: 500, description: 'Failed to send email' })
  async sendEmail(@Body() emailDto: SendEmailDto) {
    this.logger.log(`Sending direct email`, {
      to: Array.isArray(emailDto.to) ? emailDto.to.length : 1,
      subject: emailDto.subject.substring(0, 50),
    });

    return this.emailService.sendEmail({
      to: emailDto.to,
      cc: emailDto.cc,
      bcc: emailDto.bcc,
      subject: emailDto.subject,
      html: emailDto.html,
      text: emailDto.text,
      templateId: emailDto.templateId,
      templateData: emailDto.templateData,
      priority: emailDto.priority,
    });
  }

  @Get('email/stats')
  @ApiOperation({ 
    summary: 'Get email statistics',
    description: 'Retrieves email delivery and engagement statistics'
  })
  @ApiQuery({ name: 'dateFrom', required: true, type: 'string', format: 'date' })
  @ApiQuery({ name: 'dateTo', required: true, type: 'string', format: 'date' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Filter by template ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email statistics',
    schema: {
      type: 'object',
      properties: {
        sent: { type: 'number' },
        delivered: { type: 'number' },
        opened: { type: 'number' },
        clicked: { type: 'number' },
        bounced: { type: 'number' },
        complaints: { type: 'number' },
        unsubscribed: { type: 'number' },
      }
    }
  })
  async getEmailStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('templateId') templateId?: string
  ) {
    return this.emailService.getEmailStats(
      new Date(dateFrom),
      new Date(dateTo),
      { templateId }
    );
  }

  // Push notification-specific endpoints

  @Post('push/send')
  @ApiOperation({ 
    summary: 'Send push notification directly',
    description: 'Sends a push notification directly through the push service'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Push notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        provider: { type: 'string' },
        status: { type: 'string' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid push request' })
  @ApiResponse({ status: 500, description: 'Failed to send push notification' })
  async sendPushNotification(@Body() pushDto: SendPushDto) {
    this.logger.log(`Sending direct push notification`, {
      recipients: Array.isArray(pushDto.tokens) ? pushDto.tokens.length : 1,
      title: pushDto.title.substring(0, 50),
    });

    return this.pushService.sendPushNotification({
      tokens: pushDto.tokens,
      title: pushDto.title,
      body: pushDto.body,
      data: pushDto.data,
      imageUrl: pushDto.imageUrl,
      icon: pushDto.icon,
      clickAction: pushDto.clickAction,
      priority: pushDto.priority,
      ttl: pushDto.ttl,
    });
  }

  @Post('push/topic/:topic')
  @ApiOperation({ 
    summary: 'Send topic-based push notification',
    description: 'Sends a push notification to all users subscribed to a topic (Firebase only)'
  })
  @ApiParam({ name: 'topic', description: 'Topic name' })
  @ApiResponse({ 
    status: 201, 
    description: 'Topic notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        provider: { type: 'string' },
        status: { type: 'string' },
      }
    }
  })
  async sendTopicNotification(
    @Param('topic') topic: string,
    @Body() pushDto: Omit<SendPushDto, 'tokens'>
  ) {
    return this.pushService.sendTopicNotification(topic, {
      title: pushDto.title,
      body: pushDto.body,
      data: pushDto.data,
      imageUrl: pushDto.imageUrl,
      icon: pushDto.icon,
      clickAction: pushDto.clickAction,
      priority: pushDto.priority,
      ttl: pushDto.ttl,
    });
  }

  @Post('push/tokens/validate')
  @ApiOperation({ 
    summary: 'Validate push tokens',
    description: 'Validates push notification tokens and returns valid/invalid tokens'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tokens: { type: 'array', items: { type: 'string' } },
      },
      required: ['tokens'],
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token validation results',
    schema: {
      type: 'object',
      properties: {
        validTokens: { type: 'array', items: { type: 'string' } },
        invalidTokens: { type: 'array', items: { type: 'string' } },
        canonicalTokens: { type: 'object' },
      }
    }
  })
  async validatePushTokens(@Body('tokens') tokens: string[]) {
    return this.pushService.validateTokens(tokens);
  }

  @Get('push/stats')
  @ApiOperation({ 
    summary: 'Get push notification statistics',
    description: 'Retrieves push notification delivery and engagement statistics'
  })
  @ApiQuery({ name: 'dateFrom', required: true, type: 'string', format: 'date' })
  @ApiQuery({ name: 'dateTo', required: true, type: 'string', format: 'date' })
  @ApiQuery({ name: 'platform', required: false, enum: ['android', 'ios', 'web'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Push notification statistics',
    schema: {
      type: 'object',
      properties: {
        sent: { type: 'number' },
        delivered: { type: 'number' },
        clicked: { type: 'number' },
        dismissed: { type: 'number' },
        failed: { type: 'number' },
      }
    }
  })
  async getPushStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('platform') platform?: 'android' | 'ios' | 'web'
  ) {
    return this.pushService.getPushStats(
      new Date(dateFrom),
      new Date(dateTo),
      { platform }
    );
  }

  // Webhook endpoints

  @Post('webhooks/email/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Handle email provider webhooks',
    description: 'Processes webhook events from email providers (SendGrid, Mailgun, etc.)'
  })
  @ApiParam({ name: 'provider', description: 'Email provider name' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload' })
  async handleEmailWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Request() req: any
  ) {
    const signature = req.headers['x-signature'] || req.headers['signature'];
    const eventType = req.headers['x-event-type'] || payload.eventType || 'unknown';
    
    await this.emailService.handleWebhook(provider, eventType, payload, signature);
    
    return { success: true };
  }
}
