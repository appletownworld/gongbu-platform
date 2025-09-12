import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('CourseService');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Gongbu Course Service API')
    .setDescription('Course management microservice for the Gongbu learning platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Courses', 'Course management operations')
    .addTag('Lessons', 'Lesson management operations')
    .addTag('Assignments', 'Assignment management operations')
    .addTag('Progress', 'Student progress tracking')
    .addTag('Enrollments', 'Course enrollment management')
    .addServer(`http://localhost:${process.env.PORT || 3002}/${apiPrefix}`, 'Development')
    .addServer(`https://api.gongbu.app/${apiPrefix}`, 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      service: 'course-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.log(`🚀 Course Service is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  logger.log(`❤️  Health Check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Course Service:', error);
  process.exit(1);
});
