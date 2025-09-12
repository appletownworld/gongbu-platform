import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('BotService');

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Bot-Api-Secret-Token'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Gongbu Bot Service API')
    .setDescription('Telegram Bot microservice for the Gongbu learning platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Bot', 'Bot management and configuration')
    .addTag('Webhooks', 'Telegram webhook handling')
    .addTag('Commands', 'Bot command system')
    .addTag('Analytics', 'Bot usage analytics')
    .addTag('Notifications', 'Bot notification system')
    .addServer(`http://localhost:${process.env.PORT || 3003}/${apiPrefix}`, 'Development')
    .addServer(`https://bot.gongbu.app/${apiPrefix}`, 'Production')
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
      service: 'bot-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      bot: {
        connected: true, // This would be dynamic in real implementation
        webhook: process.env.TELEGRAM_BOT_WEBHOOK_URL ? 'enabled' : 'polling',
      },
    });
  });

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.log(`🤖 Bot Service is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  logger.log(`❤️  Health Check: http://localhost:${port}/health`);
  logger.log(`📡 Webhook Path: http://localhost:${port}${process.env.TELEGRAM_BOT_WEBHOOK_PATH || '/webhook'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Bot Service:', error);
  process.exit(1);
});
