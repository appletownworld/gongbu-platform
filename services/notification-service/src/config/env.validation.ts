import * as Joi from 'joi';

export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // Database
  NOTIFICATION_SERVICE_DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // External Services
  AUTH_SERVICE_URL: string;
  COURSE_SERVICE_URL: string;
  PAYMENT_SERVICE_URL?: string;

  // Email Configuration
  EMAIL_PROVIDER: 'sendgrid' | 'mailgun' | 'smtp' | 'ses';
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;
  EMAIL_REPLY_TO?: string;

  // SendGrid
  SENDGRID_API_KEY?: string;
  SENDGRID_WEBHOOK_SECRET?: string;

  // Mailgun
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_WEBHOOK_SECRET?: string;

  // Amazon SES
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_SES_REGION?: string;

  // SMTP Configuration
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;

  // Push Notifications
  PUSH_PROVIDER: 'firebase' | 'apn' | 'web-push' | 'disabled';
  
  // Firebase (for Android/iOS push)
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_SERVICE_ACCOUNT_PATH?: string;

  // Apple Push Notifications (APN)
  APN_KEY_ID?: string;
  APN_TEAM_ID?: string;
  APN_PRIVATE_KEY_PATH?: string;
  APN_BUNDLE_ID?: string;
  APN_PRODUCTION?: boolean;

  // Web Push
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;

  // Telegram
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;

  // SMS Configuration
  SMS_PROVIDER: 'twilio' | 'vonage' | 'disabled';
  
  // Twilio
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;

  // Vonage (formerly Nexmo)
  VONAGE_API_KEY?: string;
  VONAGE_API_SECRET?: string;
  VONAGE_PHONE_NUMBER?: string;

  // Queue Configuration (Bull/Redis)
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  QUEUE_REDIS_DB?: number;

  // Queue Settings
  QUEUE_CONCURRENCY: number;
  QUEUE_MAX_ATTEMPTS: number;
  QUEUE_RETRY_DELAY: number;
  QUEUE_REMOVE_ON_COMPLETE: number;
  QUEUE_REMOVE_ON_FAIL: number;

  // Rate Limiting
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  EMAIL_RATE_LIMIT: number;
  PUSH_RATE_LIMIT: number;
  SMS_RATE_LIMIT: number;

  // Template Configuration
  TEMPLATE_CACHE_TTL: number;
  TEMPLATE_STORAGE: 'database' | 'filesystem' | 's3';
  TEMPLATE_BASE_PATH?: string;

  // File Storage (for attachments)
  STORAGE_PROVIDER: 'local' | 's3' | 'gcs';
  STORAGE_BUCKET?: string;
  STORAGE_BASE_PATH?: string;

  // Analytics and Tracking
  ANALYTICS_ENABLED: boolean;
  ANALYTICS_BATCH_SIZE: number;
  ANALYTICS_BATCH_INTERVAL: number;
  TRACKING_DOMAIN?: string;
  TRACKING_ENABLED: boolean;

  // Webhook Configuration
  WEBHOOK_TIMEOUT: number;
  WEBHOOK_RETRY_ATTEMPTS: number;
  WEBHOOK_SIGNATURE_SECRET: string;

  // Security
  ENCRYPTION_KEY: string;
  WEBHOOK_SIGNATURE_TOLERANCE: number;

  // Logging
  LOG_LEVEL: string;
  LOG_EMAIL_CONTENT?: boolean;
  LOG_SENSITIVE_DATA?: boolean;

  // Monitoring and Health
  HEALTH_CHECK_TIMEOUT: number;
  METRICS_ENABLED: boolean;

  // Scheduling
  SCHEDULER_ENABLED: boolean;
  SCHEDULER_INTERVAL: number;
  CLEANUP_OLD_NOTIFICATIONS_DAYS: number;
  CLEANUP_ANALYTICS_DAYS: number;

  // Default Settings
  DEFAULT_TIMEZONE: string;
  DEFAULT_LANGUAGE: string;
  DEFAULT_EMAIL_TEMPLATE?: string;
  DEFAULT_PUSH_TEMPLATE?: string;

  // Feature Flags
  ENABLE_EMAIL_TRACKING: boolean;
  ENABLE_CLICK_TRACKING: boolean;
  ENABLE_UNSUBSCRIBE_LINKS: boolean;
  ENABLE_PERSONALIZATION: boolean;

  // Development/Testing
  EMAIL_TEST_MODE?: boolean;
  PUSH_TEST_MODE?: boolean;
  SMS_TEST_MODE?: boolean;
  TEST_EMAIL_RECIPIENT?: string;
}

export const envValidationSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3005),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  NOTIFICATION_SERVICE_DATABASE_URL: Joi.string().uri().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),

  // External Services
  AUTH_SERVICE_URL: Joi.string().uri().default('http://auth-service:3001'),
  COURSE_SERVICE_URL: Joi.string().uri().default('http://course-service:3002'),
  PAYMENT_SERVICE_URL: Joi.string().uri().optional(),

  // Email Configuration
  EMAIL_PROVIDER: Joi.string().valid('sendgrid', 'mailgun', 'smtp', 'ses').default('sendgrid'),
  EMAIL_FROM: Joi.string().email().default('notifications@gongbu.app'),
  EMAIL_FROM_NAME: Joi.string().default('Gongbu Learning Platform'),
  EMAIL_REPLY_TO: Joi.string().email().optional(),

  // SendGrid
  SENDGRID_API_KEY: Joi.string().when('EMAIL_PROVIDER', {
    is: 'sendgrid',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SENDGRID_WEBHOOK_SECRET: Joi.string().optional(),

  // Mailgun
  MAILGUN_API_KEY: Joi.string().when('EMAIL_PROVIDER', {
    is: 'mailgun',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MAILGUN_DOMAIN: Joi.string().when('EMAIL_PROVIDER', {
    is: 'mailgun',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MAILGUN_WEBHOOK_SECRET: Joi.string().optional(),

  // Amazon SES
  AWS_ACCESS_KEY_ID: Joi.string().when('EMAIL_PROVIDER', {
    is: 'ses',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('EMAIL_PROVIDER', {
    is: 'ses',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_REGION: Joi.string().when('EMAIL_PROVIDER', {
    is: 'ses',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_SES_REGION: Joi.string().optional(),

  // SMTP Configuration
  SMTP_HOST: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PORT: Joi.number().port().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_SECURE: Joi.boolean().default(true),
  SMTP_USER: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASSWORD: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Push Notifications
  PUSH_PROVIDER: Joi.string().valid('firebase', 'apn', 'web-push', 'disabled').default('firebase'),

  // Firebase
  FIREBASE_PROJECT_ID: Joi.string().when('PUSH_PROVIDER', {
    is: 'firebase',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  FIREBASE_PRIVATE_KEY: Joi.string().optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string().optional(),

  // Apple Push Notifications
  APN_KEY_ID: Joi.string().when('PUSH_PROVIDER', {
    is: 'apn',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  APN_TEAM_ID: Joi.string().when('PUSH_PROVIDER', {
    is: 'apn',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  APN_PRIVATE_KEY_PATH: Joi.string().optional(),
  APN_BUNDLE_ID: Joi.string().optional(),
  APN_PRODUCTION: Joi.boolean().default(false),

  // Web Push
  VAPID_PUBLIC_KEY: Joi.string().when('PUSH_PROVIDER', {
    is: 'web-push',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VAPID_PRIVATE_KEY: Joi.string().when('PUSH_PROVIDER', {
    is: 'web-push',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VAPID_SUBJECT: Joi.string().email().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: Joi.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: Joi.string().optional(),

  // SMS Configuration
  SMS_PROVIDER: Joi.string().valid('twilio', 'vonage', 'disabled').default('disabled'),

  // Twilio
  TWILIO_ACCOUNT_SID: Joi.string().when('SMS_PROVIDER', {
    is: 'twilio',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  TWILIO_AUTH_TOKEN: Joi.string().when('SMS_PROVIDER', {
    is: 'twilio',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),

  // Vonage
  VONAGE_API_KEY: Joi.string().when('SMS_PROVIDER', {
    is: 'vonage',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VONAGE_API_SECRET: Joi.string().when('SMS_PROVIDER', {
    is: 'vonage',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VONAGE_PHONE_NUMBER: Joi.string().optional(),

  // Queue Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().integer().min(0).default(3),
  QUEUE_REDIS_DB: Joi.number().integer().min(0).default(4),

  // Queue Settings
  QUEUE_CONCURRENCY: Joi.number().integer().min(1).default(10),
  QUEUE_MAX_ATTEMPTS: Joi.number().integer().min(1).default(3),
  QUEUE_RETRY_DELAY: Joi.number().integer().min(100).default(2000),
  QUEUE_REMOVE_ON_COMPLETE: Joi.number().integer().min(0).default(100),
  QUEUE_REMOVE_ON_FAIL: Joi.number().integer().min(0).default(50),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  EMAIL_RATE_LIMIT: Joi.number().default(100), // per minute
  PUSH_RATE_LIMIT: Joi.number().default(1000), // per minute
  SMS_RATE_LIMIT: Joi.number().default(10), // per minute

  // Template Configuration
  TEMPLATE_CACHE_TTL: Joi.number().default(3600), // 1 hour
  TEMPLATE_STORAGE: Joi.string().valid('database', 'filesystem', 's3').default('database'),
  TEMPLATE_BASE_PATH: Joi.string().optional(),

  // File Storage
  STORAGE_PROVIDER: Joi.string().valid('local', 's3', 'gcs').default('local'),
  STORAGE_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: Joi.valid('s3', 'gcs'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STORAGE_BASE_PATH: Joi.string().optional(),

  // Analytics and Tracking
  ANALYTICS_ENABLED: Joi.boolean().default(true),
  ANALYTICS_BATCH_SIZE: Joi.number().integer().min(1).default(1000),
  ANALYTICS_BATCH_INTERVAL: Joi.number().integer().min(1000).default(300000), // 5 minutes
  TRACKING_DOMAIN: Joi.string().domain().optional(),
  TRACKING_ENABLED: Joi.boolean().default(true),

  // Webhook Configuration
  WEBHOOK_TIMEOUT: Joi.number().default(30000),
  WEBHOOK_RETRY_ATTEMPTS: Joi.number().default(3),
  WEBHOOK_SIGNATURE_SECRET: Joi.string().min(32).required(),

  // Security
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  WEBHOOK_SIGNATURE_TOLERANCE: Joi.number().default(300), // 5 minutes

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  LOG_EMAIL_CONTENT: Joi.boolean().default(false),
  LOG_SENSITIVE_DATA: Joi.boolean().default(false),

  // Monitoring and Health
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000),
  METRICS_ENABLED: Joi.boolean().default(true),

  // Scheduling
  SCHEDULER_ENABLED: Joi.boolean().default(true),
  SCHEDULER_INTERVAL: Joi.number().integer().min(1000).default(60000), // 1 minute
  CLEANUP_OLD_NOTIFICATIONS_DAYS: Joi.number().integer().min(1).default(90),
  CLEANUP_ANALYTICS_DAYS: Joi.number().integer().min(1).default(365),

  // Default Settings
  DEFAULT_TIMEZONE: Joi.string().default('Europe/Moscow'),
  DEFAULT_LANGUAGE: Joi.string().length(2).default('ru'),
  DEFAULT_EMAIL_TEMPLATE: Joi.string().optional(),
  DEFAULT_PUSH_TEMPLATE: Joi.string().optional(),

  // Feature Flags
  ENABLE_EMAIL_TRACKING: Joi.boolean().default(true),
  ENABLE_CLICK_TRACKING: Joi.boolean().default(true),
  ENABLE_UNSUBSCRIBE_LINKS: Joi.boolean().default(true),
  ENABLE_PERSONALIZATION: Joi.boolean().default(true),

  // Development/Testing
  EMAIL_TEST_MODE: Joi.boolean().default(false),
  PUSH_TEST_MODE: Joi.boolean().default(false),
  SMS_TEST_MODE: Joi.boolean().default(false),
  TEST_EMAIL_RECIPIENT: Joi.string().email().optional(),
});

export const validateEnv = (config: Record<string, unknown>): EnvironmentVariables => {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Notification Service environment validation error: ${error.message}`);
  }

  return value;
};
