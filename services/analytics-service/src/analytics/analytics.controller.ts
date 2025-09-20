import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ValidationPipe,
  ParseDatePipe,
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
  AnalyticsService,
  TrackEventRequest,
  SessionInfo,
  LearningActivityRequest,
  AnalyticsQuery 
} from './analytics.service';
import { 
  EventCategory,
  MetricCategory,
  MasteryLevel 
} from '@prisma/client';
import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsDateString, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTOs
class TrackEventDto implements TrackEventRequest {
  @IsString()
  eventName: string;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  properties?: Record<string, any>;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  pageUrl?: string;

  @IsOptional()
  @IsString()
  pagePath?: string;

  @IsOptional()
  @IsString()
  pageTitle?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  assignmentId?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  progressValue?: number;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  loadTime?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  duration?: number;

  @IsOptional()
  @IsString()
  experimentId?: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  revenue?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

class StartSessionDto implements SessionInfo {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmContent?: string;

  @IsOptional()
  @IsString()
  utmTerm?: string;
}

class TrackLearningDto implements LearningActivityRequest {
  @IsString()
  userId: string;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  assignmentId?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  timeSpent: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  progress: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  completionRate?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  score?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  attemptsCount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  hintsUsed?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  pausesCount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  rewindsCount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  speedAdjustments?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  focusTime?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  distractionEvents?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  notesTaken?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  questionsAsked?: number;

  @IsOptional()
  @IsBoolean()
  strugglingIndicator?: boolean;

  @IsOptional()
  @IsEnum(MasteryLevel)
  masteryLevel?: MasteryLevel;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  learningSession?: string;

  @IsOptional()
  @IsString()
  studyGroup?: string;
}

class AnalyticsQueryDto implements AnalyticsQuery {
  @IsDateString()
  dateFrom: Date;

  @IsDateString()
  dateTo: Date;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @IsString()
  groupBy?: 'hour' | 'day' | 'week' | 'month';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @IsOptional()
  filters?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

@ApiTags('Analytics')
@Controller('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Track user event',
    description: 'Records a user interaction event for analytics processing'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Event tracked successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        eventName: { type: 'string' },
        category: { type: 'string' },
        action: { type: 'string' },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async trackEvent(@Body() eventDto: TrackEventDto, @Request() req: any) {
    this.logger.log(`Tracking event: ${eventDto.eventName}`, {
      category: eventDto.category,
      action: eventDto.action,
      userId: eventDto.userId,
    });

    // Extract IP address from request if not provided
    if (!eventDto.ipAddress) {
      eventDto.ipAddress = req.ip || req.connection?.remoteAddress;
    }

    // Extract User-Agent if not provided
    if (!eventDto.userAgent) {
      eventDto.userAgent = req.headers['user-agent'];
    }

    const event = await this.analyticsService.trackEvent(eventDto);
    
    return {
      id: event.id,
      eventName: event.eventName,
      category: event.category,
      action: event.action,
      userId: event.userId,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
    };
  }

  @Post('sessions/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Start user session',
    description: 'Initiates a new user session for tracking'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Session started successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        sessionId: { type: 'string' },
        userId: { type: 'string' },
        startTime: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid session data' })
  async startSession(@Body() sessionDto: StartSessionDto, @Request() req: any) {
    this.logger.log(`Starting session: ${sessionDto.sessionId}`, {
      userId: sessionDto.userId,
    });

    // Extract IP address and User-Agent from request
    if (!sessionDto.ipAddress) {
      sessionDto.ipAddress = req.ip || req.connection?.remoteAddress;
    }
    if (!sessionDto.userAgent) {
      sessionDto.userAgent = req.headers['user-agent'];
    }

    const session = await this.analyticsService.startSession(sessionDto);
    
    return {
      id: session.id,
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
    };
  }

  @Post('sessions/:sessionId/end')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'End user session',
    description: 'Terminates a user session and calculates session metrics'
  })
  @ApiParam({ name: 'sessionId', description: 'Session identifier' })
  @ApiResponse({ status: 204, description: 'Session ended successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async endSession(
    @Param('sessionId') sessionId: string,
    @Body('exitPage') exitPage?: string
  ) {
    this.logger.log(`Ending session: ${sessionId}`);
    
    await this.analyticsService.endSession(sessionId, exitPage);
  }

  @Post('learning')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Track learning activity',
    description: 'Records detailed learning analytics for a student'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Learning activity tracked successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        courseId: { type: 'string' },
        lessonId: { type: 'string' },
        progress: { type: 'number' },
        timeSpent: { type: 'number' },
        masteryLevel: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid learning data' })
  async trackLearningActivity(@Body() learningDto: TrackLearningDto) {
    this.logger.log(`Tracking learning activity for user ${learningDto.userId}`, {
      courseId: learningDto.courseId,
      lessonId: learningDto.lessonId,
      progress: learningDto.progress,
    });

    const learningAnalytics = await this.analyticsService.trackLearningActivity(learningDto);
    
    return {
      id: learningAnalytics.id,
      userId: learningAnalytics.userId,
      courseId: learningAnalytics.courseId,
      lessonId: learningAnalytics.lessonId,
      progress: learningAnalytics.progress,
      timeSpent: learningAnalytics.timeSpent,
      masteryLevel: learningAnalytics.masteryLevel,
      createdAt: learningAnalytics.createdAt,
    };
  }

  @Get('data')
  @ApiOperation({ 
    summary: 'Get analytics data',
    description: 'Retrieves analytics data with flexible filtering and aggregation options'
  })
  @ApiQuery({ name: 'dateFrom', type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiQuery({ name: 'lessonId', required: false, description: 'Filter by lesson ID' })
  @ApiQuery({ name: 'eventName', required: false, description: 'Filter by event name' })
  @ApiQuery({ name: 'category', required: false, enum: EventCategory })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['hour', 'day', 'week', 'month'] })
  @ApiQuery({ name: 'metrics', required: false, description: 'Comma-separated list of metrics to calculate' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Maximum number of results' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Number of results to skip' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        total: { type: 'number' },
        aggregations: { type: 'object' },
        metadata: { type: 'object' },
      }
    }
  })
  async getAnalytics(@Query() query: AnalyticsQueryDto) {
    this.logger.log(`Getting analytics data`, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      userId: query.userId,
      courseId: query.courseId,
    });

    // Parse metrics if provided as comma-separated string
    if (query.metrics && typeof query.metrics === 'string') {
      query.metrics = (query.metrics as string).split(',').map(m => m.trim());
    }

    return this.analyticsService.getAnalytics(query);
  }

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard overview',
    description: 'Retrieves comprehensive dashboard data with key metrics and trends'
  })
  @ApiQuery({ name: 'dateFrom', type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by specific user (admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            totalSessions: { type: 'number' },
            avgSessionDuration: { type: 'number' },
            bounceRate: { type: 'number' },
            pageViews: { type: 'number' },
            uniquePageViews: { type: 'number' },
          }
        },
        learning: {
          type: 'object',
          properties: {
            coursesAccessed: { type: 'number' },
            lessonsViewed: { type: 'number' },
            lessonsCompleted: { type: 'number' },
            avgCompletionRate: { type: 'number' },
            avgTimePerLesson: { type: 'number' },
            strugglingStudents: { type: 'number' },
          }
        },
        engagement: {
          type: 'object',
          properties: {
            totalEngagements: { type: 'number' },
            likesCount: { type: 'number' },
            commentsCount: { type: 'number' },
            sharesCount: { type: 'number' },
            searchQueries: { type: 'number' },
          }
        },
        conversion: {
          type: 'object',
          properties: {
            conversionRate: { type: 'number' },
            revenue: { type: 'number' },
            averageOrderValue: { type: 'number' },
            coursePurchases: { type: 'number' },
          }
        },
        trends: {
          type: 'object',
          properties: {
            userGrowth: { type: 'array', items: { type: 'number' } },
            sessionTrend: { type: 'array', items: { type: 'number' } },
            learningTrend: { type: 'array', items: { type: 'number' } },
            revenueTrend: { type: 'array', items: { type: 'number' } },
          }
        },
      }
    }
  })
  async getDashboard(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('userId') userId?: string
  ) {
    this.logger.log(`Getting dashboard data`, {
      dateFrom,
      dateTo,
      userId,
    });

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    return this.analyticsService.getDashboardData(startDate, endDate, userId);
  }

  @Get('events/:eventId')
  @ApiOperation({ 
    summary: 'Get event details',
    description: 'Retrieves detailed information about a specific event'
  })
  @ApiParam({ name: 'eventId', description: 'Event identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        eventName: { type: 'string' },
        category: { type: 'string' },
        action: { type: 'string' },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        properties: { type: 'object' },
        metadata: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' },
        session: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('eventId') eventId: string) {
    // This would be implemented to get individual event details
    // For now, return a basic structure
    return {
      message: `Event ${eventId} details would be returned here`,
    };
  }

  @Get('users/:userId/journey')
  @ApiOperation({ 
    summary: 'Get user journey',
    description: 'Retrieves the complete journey/timeline for a specific user'
  })
  @ApiParam({ name: 'userId', description: 'User identifier' })
  @ApiQuery({ name: 'dateFrom', required: false, type: 'string', format: 'date' })
  @ApiQuery({ name: 'dateTo', required: false, type: 'string', format: 'date' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Maximum number of events' })
  @ApiResponse({ 
    status: 200, 
    description: 'User journey retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        totalEvents: { type: 'number' },
        sessions: { type: 'number' },
        firstSeen: { type: 'string', format: 'date-time' },
        lastSeen: { type: 'string', format: 'date-time' },
        events: { type: 'array' },
        learningProgress: { type: 'object' },
        engagementMetrics: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserJourney(
    @Param('userId') userId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: number
  ) {
    this.logger.log(`Getting user journey for ${userId}`, {
      dateFrom,
      dateTo,
      limit,
    });

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const query: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      query.dateFrom = dateFilter.gte;
      query.dateTo = dateFilter.lte;
    }
    if (limit) query.limit = limit;

    const analytics = await this.analyticsService.getAnalytics(query);

    return {
      userId,
      totalEvents: analytics.total,
      events: analytics.data,
      metadata: analytics.metadata,
    };
  }

  @Get('courses/:courseId/analytics')
  @ApiOperation({ 
    summary: 'Get course analytics',
    description: 'Retrieves detailed analytics for a specific course'
  })
  @ApiParam({ name: 'courseId', description: 'Course identifier' })
  @ApiQuery({ name: 'dateFrom', required: false, type: 'string', format: 'date' })
  @ApiQuery({ name: 'dateTo', required: false, type: 'string', format: 'date' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        overview: {
          type: 'object',
          properties: {
            totalStudents: { type: 'number' },
            activeStudents: { type: 'number' },
            completionRate: { type: 'number' },
            avgTimeToComplete: { type: 'number' },
            avgScore: { type: 'number' },
            strugglingStudents: { type: 'number' },
          }
        },
        lessons: { type: 'array' },
        engagement: { type: 'object' },
        performance: { type: 'object' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseAnalytics(
    @Param('courseId') courseId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    this.logger.log(`Getting course analytics for ${courseId}`, {
      dateFrom,
      dateTo,
    });

    // Build query
    const query: any = { courseId };
    if (dateFrom) query.dateFrom = new Date(dateFrom);
    if (dateTo) query.dateTo = new Date(dateTo);

    const analytics = await this.analyticsService.getAnalytics(query);

    return {
      courseId,
      overview: {
        totalEvents: analytics.total,
        // Additional course-specific metrics would be calculated here
      },
      events: analytics.data,
      metadata: analytics.metadata,
    };
  }

  @Get('health/analytics')
  @ApiOperation({ 
    summary: 'Get analytics health status',
    description: 'Returns the health status of the analytics system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        eventsProcessed24h: { type: 'number' },
        sessionsActive: { type: 'number' },
        dataLatency: { type: 'number' },
        lastProcessed: { type: 'string', format: 'date-time' },
        systemLoad: { type: 'object' },
      }
    }
  })
  async getAnalyticsHealth() {
    // Calculate health metrics
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const analytics = await this.analyticsService.getAnalytics({
      dateFrom: yesterday,
      dateTo: new Date(),
      metrics: ['count'],
    });

    return {
      status: 'healthy',
      eventsProcessed24h: analytics.total,
      sessionsActive: 0, // Would calculate active sessions
      dataLatency: 0, // Would calculate processing latency
      lastProcessed: new Date(),
      systemLoad: {
        cpu: 0.3,
        memory: 0.6,
        disk: 0.4,
      },
    };
  }
}
