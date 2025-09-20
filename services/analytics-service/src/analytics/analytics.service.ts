import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  EventCategory,
  Event,
  SessionTracking,
  LearningAnalytics,
  UserBehavior,
  Metric,
  MetricCategory,
  MetricType,
  MasteryLevel 
} from '@prisma/client';
import { EnvironmentVariables } from '../config/env.validation';
import * as geoip from 'geoip-lite';
import * as useragent from 'useragent';

export interface TrackEventRequest {
  eventName: string;
  category: EventCategory;
  action: string;
  label?: string;
  userId?: string;
  sessionId: string;
  deviceId?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  pageUrl?: string;
  pagePath?: string;
  pageTitle?: string;
  referrer?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  progressValue?: number;
  userAgent?: string;
  ipAddress?: string;
  loadTime?: number;
  duration?: number;
  experimentId?: string;
  variant?: string;
  revenue?: number;
  currency?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface LearningActivityRequest {
  userId: string;
  courseId: string;
  lessonId?: string;
  assignmentId?: string;
  timeSpent: number;
  progress: number;
  completionRate?: number;
  score?: number;
  maxScore?: number;
  attemptsCount?: number;
  hintsUsed?: number;
  pausesCount?: number;
  rewindsCount?: number;
  speedAdjustments?: number;
  focusTime?: number;
  distractionEvents?: number;
  notesTaken?: number;
  questionsAsked?: number;
  strugglingIndicator?: boolean;
  masteryLevel?: MasteryLevel;
  deviceType?: string;
  learningSession?: string;
  studyGroup?: string;
}

export interface AnalyticsQuery {
  dateFrom: Date;
  dateTo: Date;
  userId?: string;
  courseId?: string;
  lessonId?: string;
  eventName?: string;
  category?: EventCategory;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface AnalyticsResult {
  data: any[];
  total: number;
  aggregations?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
    pageViews: number;
    uniquePageViews: number;
  };
  learning: {
    coursesAccessed: number;
    lessonsViewed: number;
    lessonsCompleted: number;
    avgCompletionRate: number;
    avgTimePerLesson: number;
    strugglingStudents: number;
  };
  engagement: {
    totalEngagements: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    searchQueries: number;
  };
  conversion: {
    conversionRate: number;
    revenue: number;
    averageOrderValue: number;
    coursePurchases: number;
  };
  trends: {
    userGrowth: number[];
    sessionTrend: number[];
    learningTrend: number[];
    revenueTrend: number[];
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly anonymizeIp: boolean;
  private readonly enableGeolocation: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.anonymizeIp = this.configService.get('ANONYMIZE_IP_ADDRESSES', true);
    this.enableGeolocation = this.configService.get('ENABLE_GEOLOCATION', true);
  }

  /**
   * Track a user event
   */
  async trackEvent(request: TrackEventRequest): Promise<Event> {
    this.logger.debug(`Tracking event: ${request.eventName}`, {
      category: request.category,
      action: request.action,
      userId: request.userId,
      sessionId: request.sessionId,
    });

    try {
      // Process user agent and location
      const deviceInfo = this.parseUserAgent(request.userAgent);
      const locationInfo = this.getLocationInfo(request.ipAddress);

      // Create event
      const event = await this.prisma.event.create({
        data: {
          eventName: request.eventName,
          category: request.category,
          action: request.action,
          label: request.label,
          userId: request.userId,
          sessionId: request.sessionId,
          deviceId: request.deviceId,
          properties: request.properties || {},
          metadata: {
            ...request.metadata,
            device: deviceInfo,
          },
          pageUrl: request.pageUrl,
          pagePath: request.pagePath,
          pageTitle: request.pageTitle,
          referrer: request.referrer,
          courseId: request.courseId,
          lessonId: request.lessonId,
          assignmentId: request.assignmentId,
          progressValue: request.progressValue,
          userAgent: request.userAgent,
          ipAddress: this.anonymizeIp ? this.anonymizeIpAddress(request.ipAddress) : request.ipAddress,
          country: locationInfo.country,
          city: locationInfo.city,
          timezone: locationInfo.timezone,
          language: deviceInfo.language,
          loadTime: request.loadTime,
          duration: request.duration,
          experimentId: request.experimentId,
          variant: request.variant,
          revenue: request.revenue,
          currency: request.currency,
        },
      });

      // Update session tracking
      if (request.sessionId) {
        await this.updateSessionTracking(request.sessionId, event);
      }

      // Emit event for real-time processing
      this.eventEmitter.emit('analytics.event.tracked', {
        event,
        request,
      });

      this.logger.debug(`✅ Event tracked successfully: ${event.id}`);

      return event;
    } catch (error) {
      this.logger.error('❌ Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Start a new session
   */
  async startSession(sessionInfo: SessionInfo): Promise<SessionTracking> {
    this.logger.debug(`Starting session: ${sessionInfo.sessionId}`, {
      userId: sessionInfo.userId,
      deviceId: sessionInfo.deviceId,
    });

    try {
      // Parse user agent and location
      const deviceInfo = this.parseUserAgent(sessionInfo.userAgent);
      const locationInfo = this.getLocationInfo(sessionInfo.ipAddress);
      const utmParams = this.parseUtmParameters(sessionInfo.referrer);

      const session = await this.prisma.sessionTracking.create({
        data: {
          sessionId: sessionInfo.sessionId,
          userId: sessionInfo.userId,
          deviceId: sessionInfo.deviceId,
          userAgent: sessionInfo.userAgent,
          device: deviceInfo,
          ipAddress: this.anonymizeIp ? this.anonymizeIpAddress(sessionInfo.ipAddress) : sessionInfo.ipAddress,
          country: locationInfo.country,
          region: locationInfo.region,
          city: locationInfo.city,
          timezone: locationInfo.timezone,
          startTime: new Date(),
          referrer: sessionInfo.referrer,
          utmSource: sessionInfo.utmSource || utmParams.source,
          utmMedium: sessionInfo.utmMedium || utmParams.medium,
          utmCampaign: sessionInfo.utmCampaign || utmParams.campaign,
          utmContent: sessionInfo.utmContent || utmParams.content,
          utmTerm: sessionInfo.utmTerm || utmParams.term,
        },
      });

      this.logger.log(`✅ Session started: ${session.id}`);

      return session;
    } catch (error) {
      this.logger.error('❌ Failed to start session:', error);
      throw error;
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, exitPage?: string): Promise<void> {
    try {
      const session = await this.prisma.sessionTracking.findUnique({
        where: { sessionId },
      });

      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return;
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

      await this.prisma.sessionTracking.update({
        where: { sessionId },
        data: {
          endTime,
          duration,
          exitPage,
          bounceRate: session.pageViews <= 1,
          engaged: duration > 30 && session.pageViews > 1, // Basic engagement heuristic
        },
      });

      this.logger.log(`✅ Session ended: ${sessionId}, duration: ${duration}s`);
    } catch (error) {
      this.logger.error('❌ Failed to end session:', error);
    }
  }

  /**
   * Track learning activity
   */
  async trackLearningActivity(request: LearningActivityRequest): Promise<LearningAnalytics> {
    this.logger.debug(`Tracking learning activity for user ${request.userId}`, {
      courseId: request.courseId,
      lessonId: request.lessonId,
      progress: request.progress,
    });

    try {
      const learningAnalytics = await this.prisma.learningAnalytics.create({
        data: {
          userId: request.userId,
          courseId: request.courseId,
          lessonId: request.lessonId,
          assignmentId: request.assignmentId,
          timeSpent: request.timeSpent,
          progress: request.progress,
          completionRate: request.completionRate,
          score: request.score,
          maxScore: request.maxScore,
          attemptsCount: request.attemptsCount || 1,
          hintsUsed: request.hintsUsed || 0,
          pausesCount: request.pausesCount || 0,
          rewindsCount: request.rewindsCount || 0,
          speedAdjustments: request.speedAdjustments || 0,
          focusTime: request.focusTime || request.timeSpent,
          distractionEvents: request.distractionEvents || 0,
          notesTaken: request.notesTaken || 0,
          questionsAsked: request.questionsAsked || 0,
          strugglingIndicator: request.strugglingIndicator || false,
          masteryLevel: request.masteryLevel || MasteryLevel.BEGINNER,
          learningVelocity: await this.calculateLearningVelocity(request.userId, request.courseId),
          deviceType: request.deviceType,
          learningSession: request.learningSession,
          studyGroup: request.studyGroup,
        },
      });

      // Update daily user behavior
      await this.updateUserBehavior(request.userId, {
        lessonsViewed: request.lessonId ? 1 : 0,
        lessonsCompleted: request.completionRate === 1 ? 1 : 0,
        timeSpent: request.timeSpent,
      });

      this.logger.log(`✅ Learning activity tracked: ${learningAnalytics.id}`);

      return learningAnalytics;
    } catch (error) {
      this.logger.error('❌ Failed to track learning activity:', error);
      throw error;
    }
  }

  /**
   * Get analytics data with flexible querying
   */
  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    this.logger.debug('Getting analytics data', {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      metrics: query.metrics,
    });

    try {
      const where: any = {
        timestamp: {
          gte: query.dateFrom,
          lte: query.dateTo,
        },
      };

      if (query.userId) where.userId = query.userId;
      if (query.courseId) where.courseId = query.courseId;
      if (query.lessonId) where.lessonId = query.lessonId;
      if (query.eventName) where.eventName = query.eventName;
      if (query.category) where.category = query.category;

      // Apply additional filters
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          where[key] = value;
        });
      }

      const [data, total] = await Promise.all([
        this.prisma.event.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: query.limit || 1000,
          skip: query.offset || 0,
          include: {
            session: query.metrics?.includes('session'),
          },
        }),
        this.prisma.event.count({ where }),
      ]);

      // Calculate aggregations if requested
      const aggregations = query.metrics ? await this.calculateAggregations(where, query.metrics) : undefined;

      return {
        data,
        total,
        aggregations,
        metadata: {
          query,
          executedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to get analytics data:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview data
   */
  async getDashboardData(dateFrom: Date, dateTo: Date, userId?: string): Promise<DashboardData> {
    this.logger.debug('Getting dashboard data', { dateFrom, dateTo, userId });

    try {
      const where: any = {
        timestamp: {
          gte: dateFrom,
          lte: dateTo,
        },
      };

      if (userId) where.userId = userId;

      // Parallel queries for dashboard data
      const [
        totalUsers,
        totalSessions,
        events,
        learningData,
        userBehaviorData,
      ] = await Promise.all([
        this.prisma.event.findMany({
          where,
          distinct: ['userId'],
          select: { userId: true },
        }).then(users => users.filter(u => u.userId).length),
        
        this.prisma.sessionTracking.count({
          where: {
            startTime: {
              gte: dateFrom,
              lte: dateTo,
            },
            ...(userId && { userId }),
          },
        }),

        this.prisma.event.findMany({
          where,
          select: {
            category: true,
            action: true,
            revenue: true,
            duration: true,
            pageUrl: true,
          },
        }),

        this.prisma.learningAnalytics.aggregate({
          where: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
            ...(userId && { userId }),
          },
          _count: { id: true },
          _avg: { progress: true, timeSpent: true },
        }),

        this.prisma.userBehavior.aggregate({
          where: {
            date: {
              gte: dateFrom,
              lte: dateTo,
            },
            ...(userId && { userId }),
          },
          _sum: {
            pageViews: true,
            likes: true,
            comments: true,
            shares: true,
            searchQueries: true,
          },
        }),
      ]);

      // Process data
      const pageViews = events.length;
      const uniquePageViews = new Set(events.map(e => e.pageUrl)).size;
      const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
      const avgSessionDuration = totalSessions > 0 ? 
        events.reduce((sum, e) => sum + (e.duration || 0), 0) / totalSessions : 0;

      return {
        overview: {
          totalUsers,
          activeUsers: totalUsers, // Simplified - could be more sophisticated
          totalSessions,
          avgSessionDuration: Math.round(avgSessionDuration / 1000), // Convert to seconds
          bounceRate: 0.3, // Would calculate from session data
          pageViews,
          uniquePageViews,
        },
        learning: {
          coursesAccessed: new Set(events.filter(e => e.category === EventCategory.LEARNING).map(e => (e as any).courseId)).size,
          lessonsViewed: events.filter(e => e.action === 'lesson_viewed').length,
          lessonsCompleted: events.filter(e => e.action === 'lesson_completed').length,
          avgCompletionRate: learningData._avg.progress || 0,
          avgTimePerLesson: Math.round((learningData._avg.timeSpent || 0) / 60), // Convert to minutes
          strugglingStudents: 0, // Would query from learning analytics
        },
        engagement: {
          totalEngagements: events.filter(e => e.category === EventCategory.ENGAGEMENT).length,
          likesCount: userBehaviorData._sum.likes || 0,
          commentsCount: userBehaviorData._sum.comments || 0,
          sharesCount: userBehaviorData._sum.shares || 0,
          searchQueries: userBehaviorData._sum.searchQueries || 0,
        },
        conversion: {
          conversionRate: 0.05, // Would calculate from funnel data
          revenue: totalRevenue,
          averageOrderValue: totalRevenue / Math.max(events.filter(e => e.revenue).length, 1),
          coursePurchases: events.filter(e => e.action === 'course_purchased').length,
        },
        trends: {
          userGrowth: [], // Would calculate daily user growth
          sessionTrend: [], // Would calculate daily session counts
          learningTrend: [], // Would calculate daily learning activity
          revenueTrend: [], // Would calculate daily revenue
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculate and store daily metrics
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async calculateDailyMetrics(): Promise<void> {
    this.logger.log('🔄 Calculating daily metrics...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

      // Calculate various metrics for yesterday
      const metrics = await Promise.all([
        this.calculateMetric('daily_active_users', MetricCategory.ENGAGEMENT, startOfDay, endOfDay),
        this.calculateMetric('total_sessions', MetricCategory.ENGAGEMENT, startOfDay, endOfDay),
        this.calculateMetric('page_views', MetricCategory.ENGAGEMENT, startOfDay, endOfDay),
        this.calculateMetric('lessons_completed', MetricCategory.LEARNING, startOfDay, endOfDay),
        this.calculateMetric('course_purchases', MetricCategory.BUSINESS, startOfDay, endOfDay),
        this.calculateMetric('total_revenue', MetricCategory.BUSINESS, startOfDay, endOfDay),
      ]);

      // Store metrics in database
      await this.prisma.metric.createMany({
        data: metrics,
      });

      this.logger.log(`✅ Daily metrics calculated: ${metrics.length} metrics stored`);
    } catch (error) {
      this.logger.error('❌ Failed to calculate daily metrics:', error);
    }
  }

  /**
   * Clean up old data based on retention policies
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldData(): Promise<void> {
    this.logger.log('🧹 Cleaning up old data...');

    try {
      const retentionDays = {
        events: this.configService.get('EVENT_RETENTION_DAYS', 365),
        sessions: this.configService.get('SESSION_RETENTION_DAYS', 180),
        learningAnalytics: this.configService.get('LEARNING_ANALYTICS_RETENTION_DAYS', 1095),
        userBehavior: this.configService.get('USER_BEHAVIOR_RETENTION_DAYS', 730),
        metrics: this.configService.get('METRICS_RETENTION_DAYS', 1095),
      };

      const cutoffDates = {
        events: new Date(Date.now() - retentionDays.events * 24 * 60 * 60 * 1000),
        sessions: new Date(Date.now() - retentionDays.sessions * 24 * 60 * 60 * 1000),
        learningAnalytics: new Date(Date.now() - retentionDays.learningAnalytics * 24 * 60 * 60 * 1000),
        userBehavior: new Date(Date.now() - retentionDays.userBehavior * 24 * 60 * 60 * 1000),
        metrics: new Date(Date.now() - retentionDays.metrics * 24 * 60 * 60 * 1000),
      };

      const deletedCounts = await Promise.all([
        this.prisma.event.deleteMany({
          where: { timestamp: { lt: cutoffDates.events } },
        }),
        this.prisma.sessionTracking.deleteMany({
          where: { startTime: { lt: cutoffDates.sessions } },
        }),
        this.prisma.learningAnalytics.deleteMany({
          where: { createdAt: { lt: cutoffDates.learningAnalytics } },
        }),
        this.prisma.userBehavior.deleteMany({
          where: { date: { lt: cutoffDates.userBehavior } },
        }),
        this.prisma.metric.deleteMany({
          where: { date: { lt: cutoffDates.metrics } },
        }),
      ]);

      const totalDeleted = deletedCounts.reduce((sum, result) => sum + result.count, 0);

      this.logger.log(`✅ Data cleanup completed: ${totalDeleted} records deleted`);
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old data:', error);
    }
  }

  // Private helper methods

  private parseUserAgent(userAgent?: string): any {
    if (!userAgent) return {};

    const agent = useragent.parse(userAgent);
    return {
      browser: agent.toAgent(),
      os: agent.os.toString(),
      device: agent.device.toString(),
      family: agent.family,
      major: agent.major,
      minor: agent.minor,
      language: userAgent.match(/language[=:]\s*([a-zA-Z-]+)/)?.[1] || 'en',
    };
  }

  private getLocationInfo(ipAddress?: string): any {
    if (!ipAddress || !this.enableGeolocation) {
      return {
        country: null,
        region: null,
        city: null,
        timezone: null,
      };
    }

    const geo = geoip.lookup(ipAddress);
    return {
      country: geo?.country || null,
      region: geo?.region || null,
      city: geo?.city || null,
      timezone: geo?.timezone || null,
    };
  }

  private anonymizeIpAddress(ipAddress?: string): string | undefined {
    if (!ipAddress) return undefined;

    // IPv4: Remove last octet (e.g., 192.168.1.1 -> 192.168.1.0)
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      parts[3] = '0';
      return parts.join('.');
    }

    // IPv6: Remove last 4 segments
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      return parts.slice(0, 4).join(':') + '::';
    }

    return ipAddress;
  }

  private parseUtmParameters(referrer?: string): any {
    if (!referrer) return {};

    try {
      const url = new URL(referrer);
      return {
        source: url.searchParams.get('utm_source'),
        medium: url.searchParams.get('utm_medium'),
        campaign: url.searchParams.get('utm_campaign'),
        content: url.searchParams.get('utm_content'),
        term: url.searchParams.get('utm_term'),
      };
    } catch {
      return {};
    }
  }

  private async updateSessionTracking(sessionId: string, event: Event): Promise<void> {
    try {
      const updateData: any = {
        events: { increment: 1 },
        updatedAt: new Date(),
      };

      if (event.pageUrl) {
        updateData.pageViews = { increment: 1 };
        
        // Set entry page if not set
        const session = await this.prisma.sessionTracking.findUnique({
          where: { sessionId },
          select: { entryPage: true },
        });

        if (!session?.entryPage) {
          updateData.entryPage = event.pageUrl;
        }

        updateData.exitPage = event.pageUrl;
      }

      if (event.courseId) {
        updateData.coursesViewed = {
          push: event.courseId,
        };
      }

      if (event.action === 'lesson_completed') {
        updateData.lessonsCompleted = { increment: 1 };
      }

      if (event.duration) {
        updateData.timeOnLearning = { increment: Math.floor(event.duration / 1000) };
      }

      if (event.revenue) {
        updateData.revenue = { increment: event.revenue };
        updateData.currency = event.currency;
        updateData.converted = true;
      }

      await this.prisma.sessionTracking.update({
        where: { sessionId },
        data: updateData,
      });
    } catch (error) {
      this.logger.error('Failed to update session tracking:', error);
    }
  }

  private async updateUserBehavior(userId: string, activity: any): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await this.prisma.userBehavior.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          lessonsViewed: { increment: activity.lessonsViewed || 0 },
          lessonsCompleted: { increment: activity.lessonsCompleted || 0 },
          totalTime: { increment: activity.timeSpent || 0 },
          updatedAt: new Date(),
        },
        create: {
          userId,
          date: today,
          lessonsViewed: activity.lessonsViewed || 0,
          lessonsCompleted: activity.lessonsCompleted || 0,
          totalTime: activity.timeSpent || 0,
        },
      });
    } catch (error) {
      this.logger.error('Failed to update user behavior:', error);
    }
  }

  private async calculateLearningVelocity(userId: string, courseId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const lessons = await this.prisma.learningAnalytics.count({
      where: {
        userId,
        courseId,
        completionRate: 1,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return lessons / 30; // Lessons per day
  }

  private async calculateAggregations(where: any, metrics: string[]): Promise<Record<string, any>> {
    const aggregations: Record<string, any> = {};

    for (const metric of metrics) {
      switch (metric) {
        case 'count':
          aggregations.count = await this.prisma.event.count({ where });
          break;
        case 'unique_users':
          const uniqueUsers = await this.prisma.event.findMany({
            where,
            distinct: ['userId'],
            select: { userId: true },
          });
          aggregations.unique_users = uniqueUsers.filter(u => u.userId).length;
          break;
        case 'avg_duration':
          const avgResult = await this.prisma.event.aggregate({
            where: { ...where, duration: { not: null } },
            _avg: { duration: true },
          });
          aggregations.avg_duration = avgResult._avg.duration || 0;
          break;
        case 'total_revenue':
          const revenueResult = await this.prisma.event.aggregate({
            where: { ...where, revenue: { not: null } },
            _sum: { revenue: true },
          });
          aggregations.total_revenue = revenueResult._sum.revenue || 0;
          break;
      }
    }

    return aggregations;
  }

  private async calculateMetric(
    name: string,
    category: MetricCategory,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    let value = 0;
    const where = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    switch (name) {
      case 'daily_active_users':
        const uniqueUsers = await this.prisma.event.findMany({
          where,
          distinct: ['userId'],
          select: { userId: true },
        });
        value = uniqueUsers.filter(u => u.userId).length;
        break;

      case 'total_sessions':
        value = await this.prisma.sessionTracking.count({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        break;

      case 'page_views':
        value = await this.prisma.event.count({
          where: {
            ...where,
            pageUrl: { not: null },
          },
        });
        break;

      case 'lessons_completed':
        value = await this.prisma.event.count({
          where: {
            ...where,
            action: 'lesson_completed',
          },
        });
        break;

      case 'course_purchases':
        value = await this.prisma.event.count({
          where: {
            ...where,
            action: 'course_purchased',
          },
        });
        break;

      case 'total_revenue':
        const revenueResult = await this.prisma.event.aggregate({
          where: {
            ...where,
            revenue: { not: null },
          },
          _sum: { revenue: true },
        });
        value = revenueResult._sum.revenue || 0;
        break;
    }

    return {
      name,
      category,
      type: MetricType.COUNTER,
      value,
      date: startDate,
      dimensions: {},
      createdAt: new Date(),
    };
  }
}
