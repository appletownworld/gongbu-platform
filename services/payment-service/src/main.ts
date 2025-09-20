import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('PaymentService');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Middleware для parsing body (особенно важно для webhooks)
  app.use(json({ 
    limit: '50mb',
    verify: (req: any, res, buf) => {
      // Сохраняем raw body для проверки webhook подписей
      req.rawBody = buf;
    }
  }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // API prefix
  const apiPrefix = 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'stripe-signature'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Gongbu Payment Service API')
    .setDescription(`
      🏦 **Payment Service** - Микросервис платежей для Gongbu Learning Platform

      ## 🚀 **Основные возможности:**
      
      ### 💳 **Платежи**
      - Создание и обработка платежей
      - Поддержка Stripe и YooKassa
      - Множественные способы оплаты (карты, электронные кошельки, банковские переводы)
      - Безопасные транзакции с шифрованием

      ### 🔄 **Возвраты**
      - Полные и частичные возвраты
      - Автоматическая обработка
      - История всех операций

      ### 📊 **Подписки**
      - Рекурентные платежи
      - Управление жизненным циклом подписок
      - Пробные периоды и скидки

      ### 🔗 **Webhook'и**
      - Автоматическая обработка событий от провайдеров
      - Защищенные endpoints с проверкой подписи
      - Retry-механизмы и дедупликация

      ### 📈 **Аналитика**
      - Подробная статистика платежей
      - Отчеты по доходам
      - Анализ конверсии

      ## 🛡️ **Безопасность**
      - JWT аутентификация
      - Webhook signature verification
      - PCI DSS совместимость через Stripe/YooKassa
      - Шифрование чувствительных данных

      ## 🔧 **Интеграции**
      - Stripe (международные платежи)
      - YooKassa (платежи в России)
      - Auth Service (аутентификация)
      - Course Service (связь с курсами)
      - Notification Service (уведомления)

      ---
      **Окружение:** ${process.env.NODE_ENV || 'development'}
    `)
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Payments', '💳 Управление платежами')
    .addTag('Subscriptions', '🔄 Подписки и рекурентные платежи')
    .addTag('Refunds', '💸 Возвраты и отмены')
    .addTag('Webhooks', '🔗 Webhook endpoints для платежных провайдеров')
    .addTag('Analytics', '📊 Статистика и аналитика платежей')
    .addTag('Health', '❤️ Мониторинг состояния сервиса')
    .addServer(`http://localhost:${process.env.PORT || 3004}/${apiPrefix}`, 'Development')
    .addServer(`https://api.gongbu.app/${apiPrefix}`, 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    customSiteTitle: 'Gongbu Payment Service API',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #059669; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health/live', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  });

  // Readiness check endpoint
  app.getHttpAdapter().get('/health/ready', (req, res) => {
    // Здесь можно добавить проверки готовности (БД, внешние сервисы и т.д.)
    res.status(200).json({
      status: 'ready',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok', // TODO: реальная проверка БД
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
        yookassa: process.env.YOOKASSA_SECRET_KEY ? 'configured' : 'not_configured',
      },
    });
  });

  const port = process.env.PORT || 3004;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  logger.log(`🏦 Payment Service запущен на ${host}:${port}`);
  logger.log(`📚 API документация: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`❤️ Health check: http://localhost:${port}/health/live`);
  logger.log(`🔄 Readiness check: http://localhost:${port}/health/ready`);

  // Логируем конфигурацию
  logger.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ настроен' : '❌ не настроен'}`);
  logger.log(`🏦 YooKassa: ${process.env.YOOKASSA_SECRET_KEY ? '✅ настроен' : '❌ не настроен'}`);
  logger.log(`📊 База данных: ${process.env.PAYMENT_SERVICE_DATABASE_URL ? '✅ настроена' : '❌ не настроена'}`);

  if (process.env.NODE_ENV !== 'production') {
    logger.warn('⚠️ Сервис работает в режиме разработки');
  }
}

bootstrap().catch((error) => {
  console.error('❌ Ошибка запуска Payment Service:', error);
  process.exit(1);
});
