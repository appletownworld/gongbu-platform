import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AnalyticsService');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3007);
  const host = configService.get<string>('HOST', '0.0.0.0');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000', // API Gateway
      'http://localhost:3001', // Auth Service
      'http://localhost:3002', // Course Service
      'http://localhost:3003', // Bot Service
      'http://localhost:3006', // Notification Service
      'https://gongbu.app', 
      'https://api.gongbu.app',
      'https://app.gongbu.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
      'X-Session-ID',
      'X-User-ID',
      'X-Experiment-ID',
      'X-Variant',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Response-Time',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global prefix for API routes
  const apiPrefix = 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      'health', 
      'health/live', 
      'health/ready', 
      'health/metrics',
      'analytics/health/*',
      'webhooks/*', // Webhooks should be accessible without prefix
      'favicon.ico'
    ],
  });

  // Swagger API documentation
  const swaggerEnabled = nodeEnv !== 'production';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Gongbu Analytics Service API')
      .setDescription(`
        **Analytics and Business Intelligence microservice for the Gongbu learning platform**

        This service provides comprehensive analytics and data processing capabilities:
        
        ## 📊 **Core Features**
        - 🎯 **Event Tracking** - User interactions, learning activities, system events
        - 👥 **User Analytics** - Behavior tracking, journey mapping, segmentation
        - 📚 **Learning Analytics** - Progress tracking, mastery assessment, performance insights
        - 📈 **Business Intelligence** - Revenue tracking, conversion funnels, cohort analysis
        - 📱 **Session Management** - User sessions, device tracking, engagement metrics
        - 🔬 **A/B Testing** - Experiment tracking and statistical analysis
        - 📋 **Real-time Dashboards** - Live metrics and KPI monitoring
        
        ## 🎯 **Analytics Types**
        
        **User Behavior:**
        - Page views, clicks, navigation patterns
        - Feature usage and adoption
        - Search queries and content discovery
        - Engagement metrics (time on site, bounce rate)
        
        **Learning Analytics:**
        - Course progress and completion rates
        - Lesson-level performance tracking
        - Time spent learning, focus metrics
        - Mastery assessment and struggling student identification
        - Learning velocity and path optimization
        
        **Business Metrics:**
        - User acquisition and retention
        - Conversion rates and revenue tracking
        - Customer lifetime value (LTV)
        - Subscription and payment analytics
        
        ## 🔧 **Technical Capabilities**
        - **High Performance:** Processes millions of events per day
        - **Real-time Processing:** Low-latency analytics pipeline
        - **Flexible Querying:** SQL-like filtering and aggregation
        - **Data Export:** CSV, JSON, and API exports
        - **Privacy Compliant:** GDPR-ready with data anonymization
        - **Machine Learning Ready:** Features for ML model training
        
        ## 🚀 **Integrations**
        - **Mixpanel** - Advanced user analytics
        - **Google Analytics** - Web traffic analysis  
        - **Segment** - Customer data platform
        - **InfluxDB** - Time series data storage
        - **ClickHouse** - High-performance analytics database
        
        ## 📈 **Dashboard Insights**
        - User growth and retention curves
        - Learning effectiveness metrics
        - Revenue and conversion funnels  
        - Real-time activity monitoring
        - Predictive analytics and forecasting
      `)
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Analytics', 'Core analytics tracking and data collection')
      .addTag('Dashboard', 'Real-time dashboards and KPI monitoring')
      .addTag('Reports', 'Custom report generation and scheduling')
      .addTag('Insights', 'Machine learning insights and predictions')
      .addTag('Experiments', 'A/B testing and experimentation')
      .addTag('Cohorts', 'User cohort analysis and segmentation')
      .addTag('Funnels', 'Conversion funnel analysis')
      .addTag('Health', 'System health and monitoring')
      .addServer(`http://localhost:${port}/${apiPrefix}`, 'Development')
      .addServer('https://api.gongbu.app/analytics', 'Production')
      .addServer(`http://${host}:${port}/${apiPrefix}`, 'Local Docker')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    });
    
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Gongbu Analytics Service API',
      customfavIcon: '/favicon.ico',
      customCssUrl: '/swagger-custom.css',
    });

    logger.log(`📚 Swagger documentation available at: http://${host}:${port}/api`);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // TODO: Close database connections, flush buffers, finish processing jobs
      await app.close();
      logger.log('✅ Analytics service closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Start the server
  await app.listen(port, host);

  // Startup logs
  logger.log('🚀 Gongbu Analytics Service started successfully!');
  logger.log(`📊 Server running at: http://${host}:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🏥 Health check: http://${host}:${port}/health`);
  logger.log(`📈 Analytics health: http://${host}:${port}/analytics/health/analytics`);

  if (swaggerEnabled) {
    logger.log(`📚 API Documentation: http://${host}:${port}/api`);
  }

  // Log feature configuration
  const features = {
    realTimeProcessing: configService.get('ENABLE_REAL_TIME_PROCESSING', true),
    abTesting: configService.get('ENABLE_AB_TESTING', true),
    userJourney: configService.get('ENABLE_USER_JOURNEY_TRACKING', true),
    cohortAnalysis: configService.get('ENABLE_COHORT_ANALYSIS', true),
    funnelAnalysis: configService.get('ENABLE_FUNNEL_ANALYSIS', true),
    retentionAnalysis: configService.get('ENABLE_RETENTION_ANALYSIS', true),
    revenueTracking: configService.get('ENABLE_REVENUE_TRACKING', true),
    learningInsights: configService.get('ENABLE_LEARNING_INSIGHTS', true),
    geolocation: configService.get('ENABLE_GEOLOCATION', true),
    websockets: configService.get('ENABLE_WEBSOCKET', true),
  };

  logger.log('🔧 Analytics Features:');
  Object.entries(features).forEach(([feature, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    const name = feature.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    logger.log(`  ${icon} ${name}: ${enabled ? 'Enabled' : 'Disabled'}`);
  });

  // Log integrations
  const integrations = {
    mixpanel: configService.get('MIXPANEL_ENABLED', false),
    googleAnalytics: configService.get('GOOGLE_ANALYTICS_ENABLED', false),
    segment: configService.get('SEGMENT_ENABLED', false),
    influxdb: configService.get('INFLUXDB_ENABLED', false),
    clickhouse: configService.get('CLICKHOUSE_ENABLED', false),
  };

  logger.log('🔌 External Integrations:');
  Object.entries(integrations).forEach(([integration, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    const name = integration.replace(/([A-Z])/g, ' $1').toUpperCase();
    logger.log(`  ${icon} ${name}: ${enabled ? 'Connected' : 'Disabled'}`);
  });

  // Log data retention policies
  const retentionDays = {
    events: configService.get('EVENT_RETENTION_DAYS', 365),
    sessions: configService.get('SESSION_RETENTION_DAYS', 180),
    learningAnalytics: configService.get('LEARNING_ANALYTICS_RETENTION_DAYS', 1095),
    userBehavior: configService.get('USER_BEHAVIOR_RETENTION_DAYS', 730),
    metrics: configService.get('METRICS_RETENTION_DAYS', 1095),
  };

  logger.log('🗂️ Data Retention Policies:');
  Object.entries(retentionDays).forEach(([dataType, days]) => {
    const months = Math.round(days / 30);
    const name = dataType.replace(/([A-Z])/g, ' $1').toLowerCase();
    logger.log(`  📅 ${name}: ${days} days (${months} months)`);
  });

  // Log performance settings
  const performance = {
    batchSize: configService.get('BATCH_SIZE', 1000),
    maxEventsPerBatch: configService.get('MAX_EVENTS_PER_BATCH', 1000),
    processingInterval: configService.get('PROCESSING_INTERVAL', 30000),
    maxConcurrentJobs: configService.get('MAX_CONCURRENT_JOBS', 10),
    queryCaching: configService.get('ENABLE_QUERY_CACHING', true),
    cacheTTL: configService.get('CACHE_TTL', 3600),
  };

  logger.log('⚡ Performance Configuration:');
  logger.log(`  📦 Batch Size: ${performance.batchSize} events`);
  logger.log(`  ⏱️ Processing Interval: ${performance.processingInterval / 1000}s`);
  logger.log(`  🔄 Max Concurrent Jobs: ${performance.maxConcurrentJobs}`);
  logger.log(`  💾 Query Caching: ${performance.queryCaching ? 'Enabled' : 'Disabled'}`);
  if (performance.queryCaching) {
    logger.log(`  ⏳ Cache TTL: ${performance.cacheSSL / 60} minutes`);
  }

  // Privacy and compliance
  const privacy = {
    anonymizeIp: configService.get('ANONYMIZE_IP_ADDRESSES', true),
    gdprMode: configService.get('GDPR_COMPLIANCE_MODE', true),
    consentTracking: configService.get('CONSENT_TRACKING_ENABLED', true),
    dataSubjectRequests: configService.get('DATA_SUBJECT_REQUESTS_ENABLED', true),
  };

  logger.log('🔒 Privacy & Compliance:');
  Object.entries(privacy).forEach(([feature, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    const name = feature.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/([a-z])([A-Z])/g, '$1 $2');
    logger.log(`  ${icon} ${name}: ${enabled ? 'Enabled' : 'Disabled'}`);
  });

  // Test mode warnings
  if (configService.get('ANALYTICS_TEST_MODE', false)) {
    logger.warn('🧪 ANALYTICS TEST MODE ENABLED - Data may be modified for testing');
  }
  if (configService.get('FAKE_DATA_GENERATION', false)) {
    logger.warn('🎭 FAKE DATA GENERATION ENABLED - Synthetic data will be generated');
  }

  logger.log('✅ Analytics Service is ready to process data!');

  // Health check validation
  try {
    const healthResponse = await fetch(`http://localhost:${port}/health`);
    if (healthResponse.ok) {
      logger.log('✅ Health check endpoint is responding correctly');
    } else {
      logger.warn('⚠️ Health check endpoint returned non-200 status');
    }
  } catch (error) {
    logger.warn('⚠️ Could not validate health check endpoint:', error.message);
  }

  // Performance monitoring setup
  if (configService.get('ENABLE_PERFORMANCE_MONITORING', true)) {
    logger.log('📊 Performance monitoring enabled');
    
    // Set up basic memory and CPU monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      };
      
      const cpuUsage = process.cpuUsage();
      
      // Log memory usage if high
      if (memUsageMB.heapUsed > 512) { // 512MB threshold
        logger.warn(`⚠️ High memory usage: ${memUsageMB.heapUsed}MB heap used`);
      }
      
      // You could emit metrics here to external monitoring systems
    }, 60000); // Check every minute
  }
}

bootstrap().catch(err => {
  const logger = new Logger('AnalyticsService');
  logger.error('❌ Failed to start Analytics Service:', err);
  process.exit(1);
});
