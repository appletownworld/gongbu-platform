import * as Joi from 'joi';

export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // Database
  PAYMENT_SERVICE_DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // External Services
  AUTH_SERVICE_URL: string;
  COURSE_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL?: string;

  // Stripe Configuration
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_API_VERSION: string;

  // YooKassa Configuration
  YOOKASSA_SHOP_ID?: string;
  YOOKASSA_SECRET_KEY?: string;
  YOOKASSA_WEBHOOK_SECRET?: string;

  // PayPal Configuration (optional)
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;

  // Currency and Pricing
  DEFAULT_CURRENCY: string;
  MIN_PAYMENT_AMOUNT: number;
  MAX_PAYMENT_AMOUNT: number;

  // Subscription Settings
  TRIAL_PERIOD_DAYS: number;
  GRACE_PERIOD_DAYS: number;
  
  // Fees and Commissions
  PLATFORM_FEE_PERCENTAGE: number;
  PAYMENT_PROCESSING_FEE_PERCENTAGE: number;

  // Caching (Redis)
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;

  // Rate Limiting
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;

  // Logging
  LOG_LEVEL: string;

  // File Storage (for invoices/receipts)
  STORAGE_PROVIDER: 'local' | 's3' | 'gcs';
  STORAGE_BUCKET?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;

  // Email Service (for receipts/invoices)
  EMAIL_SERVICE_URL?: string;
  EMAIL_FROM: string;

  // Webhook Configuration
  WEBHOOK_TIMEOUT: number;
  WEBHOOK_RETRY_ATTEMPTS: number;
  WEBHOOK_RETRY_DELAY: number;

  // Security
  ENCRYPTION_KEY: string;
  WEBHOOK_SIGNATURE_TOLERANCE: number;

  // Monitoring and Health
  HEALTH_CHECK_TIMEOUT: number;
  ENABLE_METRICS: boolean;

  // Invoice Generation
  COMPANY_NAME: string;
  COMPANY_ADDRESS: string;
  COMPANY_TAX_ID?: string;
  INVOICE_TEMPLATE?: string;

  // Development/Testing
  ENABLE_TEST_PAYMENTS?: boolean;
  TEST_WEBHOOK_URL?: string;
}

export const envValidationSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3004),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  PAYMENT_SERVICE_DATABASE_URL: Joi.string().uri().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),

  // External Services
  AUTH_SERVICE_URL: Joi.string().uri().default('http://auth-service:3001'),
  COURSE_SERVICE_URL: Joi.string().uri().default('http://course-service:3002'),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),

  // Stripe Configuration (Required)
  STRIPE_SECRET_KEY: Joi.string().pattern(/^sk_/).required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().pattern(/^pk_/).required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().pattern(/^whsec_/).required(),
  STRIPE_API_VERSION: Joi.string().default('2023-10-16'),

  // YooKassa Configuration (Optional - for Russian market)
  YOOKASSA_SHOP_ID: Joi.string().optional(),
  YOOKASSA_SECRET_KEY: Joi.string().when('YOOKASSA_SHOP_ID', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  YOOKASSA_WEBHOOK_SECRET: Joi.string().optional(),

  // PayPal Configuration (Optional)
  PAYPAL_CLIENT_ID: Joi.string().optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().when('PAYPAL_CLIENT_ID', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  PAYPAL_WEBHOOK_ID: Joi.string().optional(),

  // Currency and Pricing
  DEFAULT_CURRENCY: Joi.string().length(3).uppercase().default('USD'),
  MIN_PAYMENT_AMOUNT: Joi.number().positive().default(0.5), // $0.50 minimum
  MAX_PAYMENT_AMOUNT: Joi.number().positive().default(10000), // $10,000 maximum

  // Subscription Settings
  TRIAL_PERIOD_DAYS: Joi.number().integer().min(0).default(7),
  GRACE_PERIOD_DAYS: Joi.number().integer().min(0).default(3),

  // Fees and Commissions
  PLATFORM_FEE_PERCENTAGE: Joi.number().min(0).max(50).default(5), // 5% platform fee
  PAYMENT_PROCESSING_FEE_PERCENTAGE: Joi.number().min(0).max(10).default(2.9), // 2.9% Stripe fee

  // Caching (Redis)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().integer().min(0).default(2),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60), // seconds
  THROTTLE_LIMIT: Joi.number().default(100), // requests per TTL

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),

  // File Storage
  STORAGE_PROVIDER: Joi.string().valid('local', 's3', 'gcs').default('local'),
  STORAGE_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: Joi.valid('s3', 'gcs'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_ACCESS_KEY_ID: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Email Service
  EMAIL_SERVICE_URL: Joi.string().uri().optional(),
  EMAIL_FROM: Joi.string().email().default('payments@gongbu.app'),

  // Webhook Configuration
  WEBHOOK_TIMEOUT: Joi.number().default(30000), // milliseconds
  WEBHOOK_RETRY_ATTEMPTS: Joi.number().default(3),
  WEBHOOK_RETRY_DELAY: Joi.number().default(1000), // milliseconds

  // Security
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  WEBHOOK_SIGNATURE_TOLERANCE: Joi.number().default(300), // 5 minutes in seconds

  // Monitoring and Health
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000), // milliseconds
  ENABLE_METRICS: Joi.boolean().default(true),

  // Invoice Generation
  COMPANY_NAME: Joi.string().default('Gongbu Learning Platform'),
  COMPANY_ADDRESS: Joi.string().default('Moscow, Russia'),
  COMPANY_TAX_ID: Joi.string().optional(),
  INVOICE_TEMPLATE: Joi.string().optional(),

  // Development/Testing
  ENABLE_TEST_PAYMENTS: Joi.boolean().default(false),
  TEST_WEBHOOK_URL: Joi.string().uri().optional(),
});

export const validateEnv = (config: Record<string, unknown>): EnvironmentVariables => {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Payment Service environment validation error: ${error.message}`);
  }

  return value;
};
