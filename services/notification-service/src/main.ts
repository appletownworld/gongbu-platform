import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3005);
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
    origin: ['http://localhost:3000', 'https://gongbu.app', 'https://api.gongbu.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
      'X-Signature',
      'X-Event-Type',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Response-Time',
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
      'webhooks/*', // Webhooks should be accessible without prefix
      'favicon.ico'
    ],
  });

  // Swagger API documentation
  const swaggerEnabled = nodeEnv !== 'production';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Gongbu Notification Service API')
      .setDescription(`
        **Notification microservice for the Gongbu learning platform**

        This service handles multi-channel notifications including:
        - 📧 **Email notifications** (SendGrid, Mailgun, SMTP, AWS SES)
        - 📱 **Push notifications** (Firebase, Apple APNs, Web Push)  
        - 🤖 **Telegram notifications** (Bot API integration)
        - 📲 **SMS notifications** (Twilio, Vonage)
        
        **Features:**
        - Template-based messaging with personalization
        - Bulk notifications with batch processing
        - Delivery tracking and analytics
        - User notification preferences
        - Webhook integrations for delivery events
        - Queue-based processing for scalability
        - Multi-provider failover support

        **Notification Types:**
        - User lifecycle (welcome, verification, etc.)
        - Course-related (enrollment, completion, etc.)
        - Learning progress (reminders, achievements)
        - Payment-related (success, failure, subscriptions)
        - Marketing (new courses, offers, newsletters)
        - System notifications (maintenance, security)
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
      .addTag('Notifications', 'Core notification management')
      .addTag('Email', 'Email-specific operations')
      .addTag('Push', 'Push notification operations')
      .addTag('Templates', 'Notification templates')
      .addTag('Preferences', 'User notification preferences')
      .addTag('Analytics', 'Notification analytics and reporting')
      .addTag('Health', 'Health checks and monitoring')
      .addServer(`http://localhost:${port}/${apiPrefix}`, 'Development')
      .addServer('https://api.gongbu.app/notifications', 'Production')
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
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Gongbu Notification Service API',
      customfavIcon: '/favicon.ico',
      customCssUrl: '/swagger-custom.css',
    });

    logger.log(`📚 Swagger documentation available at: http://${host}:${port}/api`);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // TODO: Close queue connections, finish pending jobs, etc.
      await app.close();
      logger.log('✅ Notification service closed gracefully');
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
  logger.log('🚀 Gongbu Notification Service started successfully!');
  logger.log(`📡 Server running at: http://${host}:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🏥 Health check: http://${host}:${port}/health`);
  logger.log(`📊 Metrics: http://${host}:${port}/health/metrics`);

  if (swaggerEnabled) {
    logger.log(`📚 API Documentation: http://${host}:${port}/api`);
  }

  // Log configuration
  const emailProvider = configService.get('EMAIL_PROVIDER', 'sendgrid');
  const pushProvider = configService.get('PUSH_PROVIDER', 'firebase');
  const smsProvider = configService.get('SMS_PROVIDER', 'disabled');
  const queueEnabled = !!configService.get('REDIS_HOST');

  logger.log('🔧 Service Configuration:');
  logger.log(`  📧 Email Provider: ${emailProvider}`);
  logger.log(`  📱 Push Provider: ${pushProvider}`);
  logger.log(`  📲 SMS Provider: ${smsProvider}`);
  logger.log(`  🔄 Queue System: ${queueEnabled ? 'Enabled (Redis)' : 'Disabled'}`);
  logger.log(`  📊 Analytics: ${configService.get('ANALYTICS_ENABLED', true) ? 'Enabled' : 'Disabled'}`);
  logger.log(`  📝 Template Storage: ${configService.get('TEMPLATE_STORAGE', 'database')}`);

  // Performance and feature flags
  logger.log('🚀 Performance & Features:');
  logger.log(`  ⚡ Queue Concurrency: ${configService.get('QUEUE_CONCURRENCY', 10)}`);
  logger.log(`  📧 Email Rate Limit: ${configService.get('EMAIL_RATE_LIMIT', 100)}/min`);
  logger.log(`  📱 Push Rate Limit: ${configService.get('PUSH_RATE_LIMIT', 1000)}/min`);
  logger.log(`  🎯 Email Tracking: ${configService.get('ENABLE_EMAIL_TRACKING', true) ? 'Enabled' : 'Disabled'}`);
  logger.log(`  📊 Click Tracking: ${configService.get('ENABLE_CLICK_TRACKING', true) ? 'Enabled' : 'Disabled'}`);
  logger.log(`  🔗 Unsubscribe Links: ${configService.get('ENABLE_UNSUBSCRIBE_LINKS', true) ? 'Enabled' : 'Disabled'}`);

  // Test mode warnings
  if (configService.get('EMAIL_TEST_MODE', false)) {
    logger.warn(`🧪 EMAIL TEST MODE ENABLED - All emails will be sent to: ${configService.get('TEST_EMAIL_RECIPIENT')}`);
  }
  if (configService.get('PUSH_TEST_MODE', false)) {
    logger.warn('🧪 PUSH TEST MODE ENABLED - Push notifications are in test mode');
  }
  if (configService.get('SMS_TEST_MODE', false)) {
    logger.warn('🧪 SMS TEST MODE ENABLED - SMS messages are in test mode');
  }

  logger.log('✅ Notification Service is ready to handle notifications!');

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
}

bootstrap().catch(err => {
  const logger = new Logger('NotificationService');
  logger.error('❌ Failed to start Notification Service:', err);
  process.exit(1);
});
