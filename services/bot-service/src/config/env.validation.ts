import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3003),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().uri().required(),
  
  // Redis Cache
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().min(0).max(15).default(2),

  // Telegram Bot Configuration
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
  TELEGRAM_BOT_WEBHOOK_URL: Joi.string().uri().optional(),
  TELEGRAM_BOT_WEBHOOK_PATH: Joi.string().default('/webhook'),
  TELEGRAM_BOT_WEBHOOK_SECRET: Joi.string().optional(),
  
  // Bot Settings
  BOT_USERNAME: Joi.string().optional(),
  BOT_DESCRIPTION: Joi.string().default('Gongbu Learning Platform Bot'),
  BOT_SHORT_DESCRIPTION: Joi.string().default('AI-powered learning assistant'),
  
  // Webhook Settings
  WEBHOOK_DOMAIN: Joi.string().domain().optional(),
  WEBHOOK_PORT: Joi.number().port().optional(),
  WEBHOOK_HOST: Joi.string().ip().default('0.0.0.0'),
  
  // Service Integration
  AUTH_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  COURSE_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  PAYMENT_SERVICE_URL: Joi.string().uri().default('http://localhost:3004'),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().default('http://localhost:3006'),
  
  // Service Authentication
  SERVICE_JWT_SECRET: Joi.string().min(32).optional(),
  INTERNAL_API_KEY: Joi.string().optional(),
  
  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(50),
  
  // Bot Rate Limiting (per user)
  BOT_RATE_LIMIT_MESSAGES_PER_MINUTE: Joi.number().default(20),
  BOT_RATE_LIMIT_COMMANDS_PER_MINUTE: Joi.number().default(10),
  
  // Session Management
  SESSION_TTL: Joi.number().default(3600), // 1 hour
  SESSION_CLEANUP_INTERVAL: Joi.number().default(300), // 5 minutes
  
  // Message Processing
  MESSAGE_QUEUE_SIZE: Joi.number().default(1000),
  MESSAGE_PROCESSING_TIMEOUT: Joi.number().default(30000), // 30 seconds
  
  // Analytics
  ENABLE_ANALYTICS: Joi.boolean().default(true),
  ANALYTICS_BATCH_SIZE: Joi.number().default(100),
  ANALYTICS_FLUSH_INTERVAL: Joi.number().default(60), // 1 minute
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().default(20 * 1024 * 1024), // 20MB
  ALLOWED_FILE_TYPES: Joi.string().default('image/*,audio/*,video/*,application/pdf'),
  
  // Language and Localization
  DEFAULT_LANGUAGE: Joi.string().default('ru'),
  SUPPORTED_LANGUAGES: Joi.string().default('ru,en,ko'),
  
  // Command Settings
  COMMAND_PREFIX: Joi.string().default('/'),
  ENABLE_INLINE_QUERIES: Joi.boolean().default(true),
  
  // Error Handling
  ERROR_REPORTING_ENABLED: Joi.boolean().default(true),
  ERROR_WEBHOOK_URL: Joi.string().uri().optional(),
  
  // Monitoring
  ENABLE_METRICS: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().port().default(9093),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_TELEGRAM_UPDATES: Joi.boolean().default(false), // Security: don't log in production
});

export function validateEnv(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Bot Service environment validation failed: ${error.message}`);
  }

  return value;
}
