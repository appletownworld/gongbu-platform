import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority, 
  NotificationStatus,
  Notification,
  NotificationTemplate 
} from '@prisma/client';
import { EnvironmentVariables } from '../config/env.validation';

export interface CreateNotificationRequest {
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

export interface NotificationResult {
  id: string;
  status: NotificationStatus;
  channels: NotificationChannel[];
  scheduledFor?: Date;
  estimatedDeliveryTime?: Date;
}

export interface BulkNotificationRequest {
  userIds: string[];
  type: NotificationType;
  channel: NotificationChannel | NotificationChannel[];
  title: string;
  content: string;
  priority?: NotificationPriority;
  templateId?: string;
  templateData?: Record<string, any>;
  batchSize?: number;
  delayBetweenBatches?: number; // in milliseconds
}

export interface NotificationStats {
  total: number;
  pending: number;
  queued: number;
  processing: number;
  sent: number;
  delivered: number;
  failed: number;
  cancelled: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create and send a single notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<NotificationResult> {
    this.logger.debug(`Creating notification for user ${request.userId}`, {
      type: request.type,
      channels: Array.isArray(request.channel) ? request.channel : [request.channel],
    });

    try {
      // Validate request
      this.validateNotificationRequest(request);

      // Check user notification preferences
      const userPrefs = await this.getUserPreferences(request.userId);
      const allowedChannels = this.filterChannelsByPreferences(
        Array.isArray(request.channel) ? request.channel : [request.channel],
        request.type,
        userPrefs
      );

      if (allowedChannels.length === 0) {
        this.logger.warn(`All channels blocked by user preferences`, {
          userId: request.userId,
          type: request.type,
          requestedChannels: Array.isArray(request.channel) ? request.channel : [request.channel],
        });
        
        throw new BadRequestException('All notification channels are disabled for this user');
      }

      // Process template if provided
      let finalTitle = request.title;
      let finalContent = request.content;
      let finalContentPlain = request.contentPlain;

      if (request.templateId && request.templateData) {
        const processedTemplate = await this.processTemplate(
          request.templateId,
          request.templateData,
          allowedChannels[0] // Use first allowed channel for template
        );
        
        finalTitle = processedTemplate.subject || finalTitle;
        finalContent = processedTemplate.htmlContent || finalContent;
        finalContentPlain = processedTemplate.textContent || finalContentPlain;
      }

      // Create notifications for each allowed channel
      const notifications: Notification[] = [];
      
      for (const channel of allowedChannels) {
        const notification = await this.prisma.notification.create({
          data: {
            userId: request.userId,
            type: request.type,
            channel,
            title: finalTitle,
            content: finalContent,
            contentPlain: finalContentPlain,
            priority: request.priority || NotificationPriority.NORMAL,
            status: NotificationStatus.PENDING,
            scheduledFor: request.scheduledFor || new Date(),
            templateId: request.templateId,
            context: request.context || {},
            metadata: request.metadata || {},
            personalizations: request.templateData || {},
            recipientEmail: channel === NotificationChannel.EMAIL ? (request.recipientEmail || await this.getUserEmail(request.userId)) : undefined,
            recipientPhone: channel === NotificationChannel.SMS ? request.recipientPhone : undefined,
            telegramChatId: channel === NotificationChannel.TELEGRAM ? request.telegramChatId : undefined,
            expiresAt: request.expiresAt,
            trackingId: this.generateTrackingId(),
          },
        });

        notifications.push(notification);
      }

      // Queue notifications for delivery
      for (const notification of notifications) {
        await this.queueNotification(notification);
      }

      // Emit event
      this.eventEmitter.emit('notification.created', {
        notifications,
        userId: request.userId,
        type: request.type,
      });

      this.logger.log(`✅ Created ${notifications.length} notifications for user ${request.userId}`, {
        type: request.type,
        channels: allowedChannels,
        notificationIds: notifications.map(n => n.id),
      });

      return {
        id: notifications[0].id, // Return primary notification ID
        status: NotificationStatus.PENDING,
        channels: allowedChannels,
        scheduledFor: request.scheduledFor,
        estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(allowedChannels),
      };
    } catch (error) {
      this.logger.error('❌ Failed to create notification:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(request: BulkNotificationRequest): Promise<NotificationResult[]> {
    this.logger.log(`Creating bulk notifications for ${request.userIds.length} users`, {
      type: request.type,
      channels: Array.isArray(request.channel) ? request.channel : [request.channel],
    });

    const batchSize = request.batchSize || 100;
    const delayBetweenBatches = request.delayBetweenBatches || 1000;
    const results: NotificationResult[] = [];

    // Process users in batches
    for (let i = 0; i < request.userIds.length; i += batchSize) {
      const batch = request.userIds.slice(i, i + batchSize);
      
      this.logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(request.userIds.length / batchSize)}`, {
        batchSize: batch.length,
      });

      // Create notifications for batch
      const batchPromises = batch.map(userId => 
        this.createNotification({
          userId,
          type: request.type,
          channel: request.channel,
          title: request.title,
          content: request.content,
          priority: request.priority,
          templateId: request.templateId,
          templateData: request.templateData,
        }).catch(error => {
          this.logger.warn(`Failed to create notification for user ${userId}:`, error.message);
          return null; // Continue with other notifications
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as NotificationResult[]);

      // Delay between batches to avoid overwhelming the system
      if (i + batchSize < request.userIds.length && delayBetweenBatches > 0) {
        await this.delay(delayBetweenBatches);
      }
    }

    this.logger.log(`✅ Created ${results.length}/${request.userIds.length} bulk notifications`, {
      type: request.type,
      successRate: `${((results.length / request.userIds.length) * 100).toFixed(1)}%`,
    });

    return results;
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        template: true,
        deliveries: true,
        interactions: true,
      },
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      channel?: NotificationChannel;
      type?: NotificationType;
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
      includeRead?: boolean;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const where: any = { userId };

    if (options?.channel) where.channel = options.channel;
    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;
    if (options?.includeRead === false) {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          template: true,
          deliveries: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    if (notification.readAt) {
      return; // Already read
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { 
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    // Track interaction
    await this.prisma.notificationInteraction.create({
      data: {
        notificationId,
        userId,
        type: 'OPENED',
        channel: notification.channel,
      },
    });

    // Emit event
    this.eventEmitter.emit('notification.read', {
      notificationId,
      userId,
      type: notification.type,
      channel: notification.channel,
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string, userId?: string): Promise<void> {
    const where: any = { id: notificationId };
    if (userId) where.userId = userId;

    const notification = await this.prisma.notification.findFirst({ where });
    
    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    if (notification.status === NotificationStatus.SENT || 
        notification.status === NotificationStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel already sent notification');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    // Remove from queue if queued
    await this.removeFromQueue(notificationId);

    this.eventEmitter.emit('notification.cancelled', {
      notificationId,
      userId: notification.userId,
      type: notification.type,
    });

    this.logger.log(`✅ Cancelled notification ${notificationId}`);
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    userId?: string,
    dateFrom?: Date,
    dateTo?: Date,
    type?: NotificationType,
    channel?: NotificationChannel
  ): Promise<NotificationStats> {
    const where: any = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [
      total,
      pending,
      queued,
      processing,
      sent,
      delivered,
      failed,
      cancelled,
    ] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.PENDING } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.QUEUED } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.PROCESSING } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.SENT } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.DELIVERED } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.FAILED } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.CANCELLED } }),
    ]);

    return {
      total,
      pending,
      queued,
      processing,
      sent,
      delivered,
      failed,
      cancelled,
    };
  }

  /**
   * Resend failed notification
   */
  async resendNotification(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    if (notification.status !== NotificationStatus.FAILED) {
      throw new BadRequestException('Only failed notifications can be resent');
    }

    // Reset notification status
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.PENDING,
        attempts: 0,
        lastError: null,
        nextRetryAt: null,
        updatedAt: new Date(),
      },
    });

    // Queue for delivery
    await this.queueNotification(notification);

    this.logger.log(`✅ Queued notification ${notificationId} for resending`);
  }

  // Private helper methods

  private validateNotificationRequest(request: CreateNotificationRequest): void {
    if (!request.userId?.trim()) {
      throw new BadRequestException('User ID is required');
    }

    if (!request.title?.trim()) {
      throw new BadRequestException('Title is required');
    }

    if (!request.content?.trim()) {
      throw new BadRequestException('Content is required');
    }

    const channels = Array.isArray(request.channel) ? request.channel : [request.channel];
    if (channels.length === 0) {
      throw new BadRequestException('At least one channel is required');
    }

    // Validate channel-specific requirements
    for (const channel of channels) {
      if (channel === NotificationChannel.EMAIL && !request.recipientEmail) {
        // Will try to get from user data
      }
      if (channel === NotificationChannel.SMS && !request.recipientPhone) {
        throw new BadRequestException('Recipient phone is required for SMS notifications');
      }
      if (channel === NotificationChannel.TELEGRAM && !request.telegramChatId) {
        throw new BadRequestException('Telegram chat ID is required for Telegram notifications');
      }
    }
  }

  private async getUserPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Return default preferences if not found
    if (!prefs) {
      return {
        emailEnabled: true,
        pushEnabled: true,
        telegramEnabled: true,
        smsEnabled: false,
        emailMarketing: true,
        emailTransactional: true,
        emailReminders: true,
        pushMarketing: false,
        pushReminders: true,
        pushProgress: true,
        telegramMarketing: false,
        telegramReminders: true,
        telegramProgress: true,
        typePreferences: {},
      };
    }

    return prefs;
  }

  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    type: NotificationType,
    preferences: any
  ): NotificationChannel[] {
    return channels.filter(channel => {
      // Check global channel preferences
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (!preferences.emailEnabled) return false;
          // Check type-specific preferences
          if (this.isMarketingType(type) && !preferences.emailMarketing) return false;
          if (this.isTransactionalType(type) && !preferences.emailTransactional) return false;
          if (this.isReminderType(type) && !preferences.emailReminders) return false;
          break;
        
        case NotificationChannel.PUSH:
          if (!preferences.pushEnabled) return false;
          if (this.isMarketingType(type) && !preferences.pushMarketing) return false;
          if (this.isReminderType(type) && !preferences.pushReminders) return false;
          if (this.isProgressType(type) && !preferences.pushProgress) return false;
          break;
        
        case NotificationChannel.TELEGRAM:
          if (!preferences.telegramEnabled) return false;
          if (this.isMarketingType(type) && !preferences.telegramMarketing) return false;
          if (this.isReminderType(type) && !preferences.telegramReminders) return false;
          if (this.isProgressType(type) && !preferences.telegramProgress) return false;
          break;
        
        case NotificationChannel.SMS:
          if (!preferences.smsEnabled) return false;
          break;
        
        default:
          return true;
      }

      // Check type-specific preferences
      const typePrefs = preferences.typePreferences[type];
      if (typePrefs && typePrefs[channel] === false) {
        return false;
      }

      return true;
    });
  }

  private isMarketingType(type: NotificationType): boolean {
    return [
      NotificationType.NEW_COURSE_AVAILABLE,
      NotificationType.DISCOUNT_OFFER,
      NotificationType.NEWSLETTER,
      NotificationType.PRODUCT_UPDATE,
    ].includes(type);
  }

  private isTransactionalType(type: NotificationType): boolean {
    return [
      NotificationType.WELCOME,
      NotificationType.EMAIL_VERIFICATION,
      NotificationType.PASSWORD_RESET,
      NotificationType.COURSE_PURCHASED,
      NotificationType.PAYMENT_SUCCESS,
      NotificationType.PAYMENT_FAILED,
      NotificationType.SUBSCRIPTION_RENEWED,
    ].includes(type);
  }

  private isReminderType(type: NotificationType): boolean {
    return [
      NotificationType.LEARNING_REMINDER,
    ].includes(type);
  }

  private isProgressType(type: NotificationType): boolean {
    return [
      NotificationType.LESSON_COMPLETED,
      NotificationType.COURSE_COMPLETED,
      NotificationType.STREAK_MILESTONE,
      NotificationType.ACHIEVEMENT_UNLOCKED,
      NotificationType.PROGRESS_SUMMARY,
    ].includes(type);
  }

  private async processTemplate(
    templateId: string,
    data: Record<string, any>,
    channel: NotificationChannel
  ): Promise<{ subject: string; htmlContent: string; textContent: string }> {
    // Implementation would use template engine (Handlebars, etc.)
    // For now, return the template as-is
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new BadRequestException('Template not found');
    }

    // TODO: Process template with Handlebars or similar engine
    return {
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
    };
  }

  private async getUserEmail(userId: string): Promise<string | undefined> {
    // TODO: Call Auth Service to get user email
    // For now, return undefined
    return undefined;
  }

  private generateTrackingId(): string {
    return `gongbu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEstimatedDeliveryTime(channels: NotificationChannel[]): Date {
    // Simple estimation based on channel priority
    const now = new Date();
    
    if (channels.includes(NotificationChannel.PUSH)) {
      return new Date(now.getTime() + 30 * 1000); // 30 seconds for push
    }
    
    if (channels.includes(NotificationChannel.EMAIL)) {
      return new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes for email
    }
    
    return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes default
  }

  private async queueNotification(notification: Notification): Promise<void> {
    // TODO: Add notification to Bull queue
    // For now, just update status
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: NotificationStatus.QUEUED },
    });
  }

  private async removeFromQueue(notificationId: string): Promise<void> {
    // TODO: Remove notification from Bull queue
    // For now, just update status in database
    await this.prisma.notificationQueue.updateMany({
      where: { notificationId },
      data: { status: 'FAILED' },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
