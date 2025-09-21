import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('APIGateway');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    cors: true, // Enable CORS for all origins by default
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false, // Allow iframe embedding for Telegram Mini Apps
  }));
  app.use(compression());

  // CORS configuration
  const corsOrigin = configService.get('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'X-Request-ID',
      'X-Forwarded-For',
      'X-Real-IP',
      'User-Agent',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Per-Page', 
      'X-Response-Time',
      'X-Gateway-Request-ID',
      'X-Gateway-Service',
      'X-Gateway-Time',
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
      'health/services',
      'health/metrics',
      'services',
      'favicon.ico'
    ],
  });

  // Swagger API documentation
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
  const swaggerPath = configService.get<string>('SWAGGER_PATH', 'api');

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Gongbu API Gateway')
      .setDescription('Unified API Gateway for Gongbu Learning Platform - all microservices accessible through this single endpoint')
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
      .addTag('Gateway', 'API Gateway management and service information')
      .addTag('Health', 'Health checks and monitoring endpoints')
      .addTag('Auth', 'Authentication and authorization (proxied to Auth Service)')
      .addTag('Courses', 'Course management (proxied to Course Service)')
      .addTag('Files', 'File upload and management (proxied to Course Service)')
      .addTag('Bot', 'Telegram bot management (proxied to Bot Service)')
      .addTag('Payment', 'Payment processing (proxied to Payment Service)')
      .addTag('Notifications', 'Notification system (proxied to Notification Service)')
      .addTag('Analytics', 'Analytics and reporting (proxied to Analytics Service)')
      .addTag('Plugins', 'Plugin system (proxied to Plugin Service)')
      .addServer(`http://localhost:${port}`, 'Development')
      .addServer('https://api.gongbu.app', 'Production')
      .addServer(`http://${host}:${port}`, 'Local Docker')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
      customSiteTitle: 'Gongbu API Gateway Documentation',
      customfavIcon: '/favicon.ico',
      customCssUrl: '/swagger-custom.css',
    });

    logger.log(`📚 Swagger documentation available at: http://${host}:${port}/${swaggerPath}`);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      await app.close();
      logger.log('✅ Application closed gracefully');
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
  logger.log('🚀 Gongbu API Gateway started successfully!');
  logger.log(`📡 Server running at: http://${host}:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🏥 Health check: http://${host}:${port}/health`);
  logger.log(`📊 Metrics: http://${host}:${port}/health/metrics`);
  logger.log(`🔗 Services status: http://${host}:${port}/services`);

  if (swaggerEnabled) {
    logger.log(`📚 API Documentation: http://${host}:${port}/${swaggerPath}`);
  }

  // Log service URLs
  logger.log('🎯 Proxying to microservices:');
  logger.log(`  📍 Auth Service: ${configService.get('AUTH_SERVICE_URL')}`);
  logger.log(`  📍 Course Service: ${configService.get('COURSE_SERVICE_URL')}`);
  logger.log(`  📍 Bot Service: ${configService.get('BOT_SERVICE_URL')}`);
  
  const optionalServices = [
    { name: 'Payment Service', url: configService.get('PAYMENT_SERVICE_URL') },
    { name: 'Notification Service', url: configService.get('NOTIFICATION_SERVICE_URL') },
    { name: 'Analytics Service', url: configService.get('ANALYTICS_SERVICE_URL') },
    { name: 'Plugin Service', url: configService.get('PLUGIN_SERVICE_URL') },
  ];

  optionalServices.forEach(service => {
    if (service.url) {
      logger.log(`  📍 ${service.name}: ${service.url}`);
    } else {
      logger.log(`  ⭕ ${service.name}: Not configured`);
    }
  });

  logger.log('✅ API Gateway is ready to serve requests!');
}

bootstrap().catch(err => {
  const logger = new Logger('APIGateway');
  logger.error('❌ Failed to start API Gateway:', err);
  process.exit(1);
});
