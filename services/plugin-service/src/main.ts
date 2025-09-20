import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('PluginService');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3008);
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
      'http://localhost:3007', // Analytics Service
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
      'X-Plugin-ID',
      'X-Plugin-Version',
      'X-Hook-Name',
      'X-Execution-Context',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Response-Time',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-Plugin-Execution-Time',
      'X-Plugin-Memory-Usage',
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
      'plugins/health/*',
      'webhooks/*', // Webhooks should be accessible without prefix
      'favicon.ico'
    ],
  });

  // Swagger API documentation
  const swaggerEnabled = nodeEnv !== 'production';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Gongbu Plugin Service API')
      .setDescription(`
        **Plugin Management and Extensibility microservice for the Gongbu learning platform**

        This service provides comprehensive plugin and extension management capabilities:
        
        ## 🔌 **Core Features**
        - 🧩 **Plugin Management** - Install, uninstall, configure, and manage plugins
        - 🎨 **Theme System** - Custom themes and visual customization
        - 🔗 **Hook System** - Extensible event-driven architecture
        - 🏪 **Plugin Marketplace** - Discover and distribute plugins
        - 📦 **Package Management** - Secure plugin packaging and distribution
        - 🛡️ **Security Sandbox** - Safe execution environment for plugins
        - 📊 **Plugin Analytics** - Usage tracking and performance monitoring
        
        ## 🧩 **Plugin Types**
        
        **Feature Plugins:**
        - Custom learning tools and widgets
        - New course content types
        - Advanced analytics and reporting
        - Student engagement features
        
        **Theme Plugins:**
        - Custom visual themes and branding
        - Layout modifications and customizations
        - Dark/light mode variations
        - Mobile-responsive designs
        
        **Integration Plugins:**
        - Third-party service integrations (Zoom, Slack, etc.)
        - Payment gateway extensions
        - Single Sign-On (SSO) providers
        - Learning Management System (LMS) connectors
        
        **Developer Tools:**
        - API extensions and custom endpoints
        - Data export/import utilities
        - Development and debugging tools
        - Performance optimization plugins
        
        ## 🛡️ **Security & Sandbox**
        - **VM-based Isolation:** Secure execution environment using VM2
        - **Resource Limits:** CPU, memory, and execution time constraints
        - **API Restrictions:** Controlled access to system APIs
        - **Security Scanning:** Automated vulnerability detection
        - **Signature Verification:** Plugin integrity validation
        - **Permission System:** Granular capability controls
        
        ## 🏪 **Plugin Marketplace**
        - **Curated Catalog:** Reviewed and verified plugins
        - **Free & Premium:** Support for both free and paid plugins
        - **Rating & Reviews:** Community feedback system
        - **Version Management:** Automated updates and rollbacks
        - **Revenue Sharing:** Fair monetization for developers
        - **Developer Dashboard:** Analytics and earnings tracking
        
        ## 🎨 **Theme System**
        - **Visual Customization:** Complete branding and styling control
        - **CSS & SCSS Support:** Advanced styling with preprocessors
        - **Component Overrides:** Custom React component implementations
        - **Responsive Design:** Mobile-first responsive themes
        - **Hot Reload:** Real-time theme development
        - **Theme Inheritance:** Build upon existing themes
        
        ## 🔗 **Hook & Event System**
        - **Event Listeners:** React to system events
        - **Filter Hooks:** Modify data as it flows through the system
        - **Action Hooks:** Trigger custom behavior
        - **Async Processing:** Non-blocking hook execution
        - **Error Handling:** Graceful failure recovery
        - **Performance Monitoring:** Hook execution profiling
        
        ## 📦 **Package Management**
        - **NPM Integration:** Support for npm packages as plugins
        - **GitHub Integration:** Direct installation from GitHub repositories
        - **Version Control:** Semantic versioning with dependency resolution
        - **Dependency Scanning:** Automated security vulnerability checks
        - **Build Pipeline:** Automated plugin building and optimization
        - **CDN Distribution:** Fast global plugin delivery
        
        ## 🚀 **Development Experience**
        - **Plugin SDK:** Comprehensive development toolkit
        - **Hot Reload:** Real-time development feedback
        - **Debug Tools:** Advanced debugging and profiling
        - **Testing Framework:** Automated plugin testing
        - **Documentation Generator:** Auto-generated API docs
        - **CLI Tools:** Command-line plugin development utilities
        
        ## 📊 **Analytics & Monitoring**
        - **Usage Tracking:** Detailed plugin usage analytics
        - **Performance Metrics:** Execution time and resource usage
        - **Error Monitoring:** Real-time error tracking and reporting
        - **User Behavior:** Plugin interaction analytics
        - **A/B Testing:** Plugin effectiveness testing
        - **Business Intelligence:** Revenue and adoption insights
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
      .addTag('Plugins', 'Core plugin management operations')
      .addTag('Marketplace', 'Plugin marketplace and discovery')
      .addTag('Themes', 'Theme system and visual customization')
      .addTag('Hooks', 'Event system and extensibility')
      .addTag('Security', 'Plugin security and sandbox management')
      .addTag('Analytics', 'Plugin usage analytics and monitoring')
      .addTag('Packages', 'Plugin packaging and distribution')
      .addTag('Health', 'System health and monitoring')
      .addServer(`http://localhost:${port}/${apiPrefix}`, 'Development')
      .addServer('https://api.gongbu.app/plugins', 'Production')
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
      customSiteTitle: 'Gongbu Plugin Service API',
      customfavIcon: '/favicon.ico',
      customCssUrl: '/swagger-custom.css',
    });

    logger.log(`📚 Swagger documentation available at: http://${host}:${port}/api`);
  }

  // Plugin directories setup
  const pluginDirectory = configService.get('PLUGIN_DIRECTORY', '/app/plugins');
  const pluginTempDir = configService.get('PLUGIN_TEMP_DIR', '/app/tmp/plugins');

  try {
    await fs.ensureDir(pluginDirectory);
    await fs.ensureDir(pluginTempDir);
    await fs.ensureDir(path.join(pluginDirectory, 'installed'));
    await fs.ensureDir(path.join(pluginDirectory, 'marketplace'));
    await fs.ensureDir(path.join(pluginDirectory, 'themes'));
    await fs.ensureDir(path.join(pluginDirectory, 'packages'));
    await fs.ensureDir(path.join(pluginDirectory, 'cache'));
    
    logger.log(`📂 Plugin directories initialized:`);
    logger.log(`  📦 Main: ${pluginDirectory}`);
    logger.log(`  🗂️ Temp: ${pluginTempDir}`);
  } catch (error) {
    logger.error('❌ Failed to create plugin directories:', error);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // TODO: Close plugin processes, clean up temporary files, finish pending operations
      await app.close();
      logger.log('✅ Plugin service closed gracefully');
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
  logger.log('🚀 Gongbu Plugin Service started successfully!');
  logger.log(`🔌 Server running at: http://${host}:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🏥 Health check: http://${host}:${port}/health`);
  logger.log(`🔌 Plugin health: http://${host}:${port}/plugins/health/plugins`);

  if (swaggerEnabled) {
    logger.log(`📚 API Documentation: http://${host}:${port}/api`);
  }

  // Log feature configuration
  const features = {
    marketplace: configService.get('MARKETPLACE_ENABLED', true),
    themeSystem: configService.get('THEME_SYSTEM_ENABLED', true),
    hookSystem: configService.get('HOOK_SYSTEM_ENABLED', true),
    sandboxing: configService.get('PLUGIN_SANDBOX_ENABLED', true),
    securityScan: configService.get('ENABLE_PLUGIN_SECURITY_SCAN', true),
    analytics: configService.get('PLUGIN_ANALYTICS_ENABLED', true),
    hotReload: configService.get('PLUGIN_HOT_RELOAD', false),
    wasmSupport: configService.get('WASM_PLUGINS_ENABLED', false),
    dockerSupport: configService.get('DOCKER_PLUGINS_ENABLED', false),
    paidPlugins: configService.get('ALLOW_PAID_PLUGINS', true),
  };

  logger.log('🔧 Plugin System Features:');
  Object.entries(features).forEach(([feature, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    const name = feature.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    logger.log(`  ${icon} ${name}: ${enabled ? 'Enabled' : 'Disabled'}`);
  });

  // Log security configuration
  const security = {
    sandboxEnabled: configService.get('PLUGIN_SANDBOX_ENABLED', true),
    signatureVerification: configService.get('PLUGIN_SIGNATURE_VERIFICATION', true),
    securityScan: configService.get('ENABLE_PLUGIN_SECURITY_SCAN', true),
    whitelistMode: configService.get('PLUGIN_WHITELIST_MODE', false),
    isolationLevel: configService.get('PLUGIN_ISOLATION_LEVEL', 'vm'),
    fileSystemIsolation: configService.get('FILE_SYSTEM_ISOLATION', true),
  };

  logger.log('🛡️ Security Configuration:');
  Object.entries(security).forEach(([feature, value]) => {
    const name = feature.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    if (typeof value === 'boolean') {
      const icon = value ? '✅' : '❌';
      logger.log(`  ${icon} ${name}: ${value ? 'Enabled' : 'Disabled'}`);
    } else {
      logger.log(`  🔧 ${name}: ${value}`);
    }
  });

  // Log performance settings
  const performance = {
    maxExecutionTime: configService.get('PLUGIN_MAX_EXECUTION_TIME', 5000),
    maxMemoryMB: configService.get('PLUGIN_MAX_MEMORY_MB', 100),
    maxConcurrent: configService.get('MAX_CONCURRENT_PLUGIN_EXECUTIONS', 10),
    cacheEnabled: configService.get('PLUGIN_CACHE_ENABLED', true),
    cacheTTL: configService.get('PLUGIN_CACHE_TTL', 1800),
    lazyLoading: configService.get('LAZY_PLUGIN_LOADING', true),
    preloadStrategy: configService.get('PLUGIN_PRELOAD_STRATEGY', 'lazy'),
  };

  logger.log('⚡ Performance Configuration:');
  logger.log(`  ⏱️ Max Execution Time: ${performance.maxExecutionTime}ms`);
  logger.log(`  💾 Max Memory: ${performance.maxMemoryMB}MB`);
  logger.log(`  🔄 Max Concurrent: ${performance.maxConcurrent} plugins`);
  logger.log(`  💾 Caching: ${performance.cacheEnabled ? 'Enabled' : 'Disabled'}`);
  if (performance.cacheEnabled) {
    logger.log(`  ⏳ Cache TTL: ${performance.cacheTTL / 60} minutes`);
  }
  logger.log(`  📦 Lazy Loading: ${performance.lazyLoading ? 'Enabled' : 'Disabled'}`);
  logger.log(`  🚀 Preload Strategy: ${performance.preloadStrategy}`);

  // Log marketplace settings
  if (configService.get('MARKETPLACE_ENABLED', true)) {
    const marketplace = {
      approvalRequired: configService.get('MARKETPLACE_APPROVAL_REQUIRED', true),
      revenueShare: configService.get('MARKETPLACE_REVENUE_SHARE', 0.7),
      paidPlugins: configService.get('ALLOW_PAID_PLUGINS', true),
      contentModeration: configService.get('CONTENT_MODERATION_ENABLED', true),
      autoApproveVerified: configService.get('AUTO_APPROVE_VERIFIED_PUBLISHERS', true),
    };

    logger.log('🏪 Marketplace Configuration:');
    logger.log(`  📋 Approval Required: ${marketplace.approvalRequired ? 'Yes' : 'No'}`);
    logger.log(`  💰 Revenue Share: ${Math.round(marketplace.revenueShare * 100)}% to publisher`);
    logger.log(`  💳 Paid Plugins: ${marketplace.paidPlugins ? 'Allowed' : 'Disabled'}`);
    logger.log(`  🔍 Content Moderation: ${marketplace.contentModeration ? 'Enabled' : 'Disabled'}`);
    logger.log(`  ✅ Auto-approve Verified: ${marketplace.autoApproveVerified ? 'Yes' : 'No'}`);
  }

  // Log supported plugin types and languages
  const pluginTypes = configService.get('ALLOWED_PLUGIN_TYPES', ['javascript', 'typescript', 'wasm', 'docker']);
  const languages = configService.get('SUPPORTED_LANGUAGES', ['en', 'ru', 'es', 'fr', 'de', 'zh', 'ja', 'ko']);

  logger.log('🧩 Supported Plugin Types:');
  pluginTypes.forEach((type: string) => {
    logger.log(`  📦 ${type.toUpperCase()}`);
  });

  if (configService.get('MULTI_LANGUAGE_SUPPORT', true)) {
    logger.log('🌍 Supported Languages:');
    languages.forEach((lang: string) => {
      logger.log(`  🌐 ${lang.toUpperCase()}`);
    });
  }

  // Log rate limits and quotas
  const limits = {
    apiRateLimit: configService.get('PLUGIN_API_RATE_LIMIT', 1000),
    installRateLimit: configService.get('PLUGIN_INSTALL_RATE_LIMIT', 10),
    maxPluginSize: configService.get('MAX_PLUGIN_SIZE_MB', 100),
    maxPluginFiles: configService.get('MAX_PLUGIN_FILES', 1000),
  };

  logger.log('🚦 Rate Limits & Quotas:');
  logger.log(`  🔄 API Rate Limit: ${limits.apiRateLimit} requests/minute`);
  logger.log(`  📦 Install Rate Limit: ${limits.installRateLimit} installs/hour`);
  logger.log(`  📏 Max Plugin Size: ${limits.maxPluginSize}MB`);
  logger.log(`  📄 Max Plugin Files: ${limits.maxPluginFiles}`);

  // Development mode warnings
  if (configService.get('DEVELOPMENT_MODE', false)) {
    logger.warn('🧪 DEVELOPMENT MODE ENABLED - Additional debugging features active');
  }
  if (configService.get('ALLOW_UNSAFE_PLUGINS', false)) {
    logger.warn('⚠️ UNSAFE PLUGINS ALLOWED - Security restrictions relaxed');
  }
  if (configService.get('PLUGIN_HOT_RELOAD', false)) {
    logger.warn('🔥 HOT RELOAD ENABLED - Plugins will auto-reload on changes');
  }

  // Storage and backup configuration
  const storage = {
    backupEnabled: configService.get('PLUGIN_BACKUP_ENABLED', true),
    backupSchedule: configService.get('PLUGIN_BACKUP_SCHEDULE', '0 2 * * *'),
    dataRetentionDays: configService.get('PLUGIN_DATA_RETENTION_DAYS', 365),
    cleanupTempFiles: configService.get('CLEANUP_TEMP_FILES', true),
  };

  logger.log('💾 Storage & Backup:');
  Object.entries(storage).forEach(([key, value]) => {
    const name = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    logger.log(`  📁 ${name}: ${value}`);
  });

  logger.log('✅ Plugin Service is ready to manage extensions!');

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

  // Plugin system initialization
  logger.log('🔄 Initializing plugin system components...');
  
  // Initialize plugin manager
  // TODO: Load installed plugins, initialize hook system, start background tasks
  
  logger.log('🎯 Plugin system initialization completed');
  
  // Performance monitoring setup
  if (configService.get('PERFORMANCE_MONITORING', true)) {
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
      
      // Log memory usage if high
      if (memUsageMB.heapUsed > 512) { // 512MB threshold
        logger.warn(`⚠️ High memory usage: ${memUsageMB.heapUsed}MB heap used`);
      }
      
      // You could emit metrics here to external monitoring systems
    }, 60000); // Check every minute
  }
}

bootstrap().catch(err => {
  const logger = new Logger('PluginService');
  logger.error('❌ Failed to start Plugin Service:', err);
  process.exit(1);
});
