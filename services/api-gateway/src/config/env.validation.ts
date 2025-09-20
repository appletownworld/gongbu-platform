import * as Joi from 'joi';

export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // Microservices URLs
  AUTH_SERVICE_URL: string;
  COURSE_SERVICE_URL: string;
  BOT_SERVICE_URL: string;
  PAYMENT_SERVICE_URL?: string;
  NOTIFICATION_SERVICE_URL?: string;
  ANALYTICS_SERVICE_URL?: string;
  PLUGIN_SERVICE_URL?: string;

  // Security
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;

  // Rate Limiting
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  THROTTLE_GLOBAL_LIMIT: number;

  // Caching (Redis)
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;

  // Logging
  LOG_LEVEL: string;
  ENABLE_REQUEST_LOGGING: boolean;
  
  // Health Checks
  HEALTH_CHECK_TIMEOUT: number;
  HEALTH_CHECK_INTERVAL: number;

  // API Documentation
  SWAGGER_ENABLED: boolean;
  SWAGGER_PATH: string;
  
  // Proxy Configuration
  PROXY_TIMEOUT: number;
  PROXY_RETRY_ATTEMPTS: number;
  PROXY_RETRY_DELAY: number;
}

export const envValidationSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  // Microservices URLs
  AUTH_SERVICE_URL: Joi.string().uri().default('http://auth-service:3001'),
  COURSE_SERVICE_URL: Joi.string().uri().default('http://course-service:3002'),
  BOT_SERVICE_URL: Joi.string().uri().default('http://bot-service:3003'),
  PAYMENT_SERVICE_URL: Joi.string().uri().optional(),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),
  ANALYTICS_SERVICE_URL: Joi.string().uri().optional(),
  PLUGIN_SERVICE_URL: Joi.string().uri().optional(),

  // Security
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  CORS_ORIGIN: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()),
    Joi.boolean()
  ).default('*'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60), // seconds
  THROTTLE_LIMIT: Joi.number().default(100), // requests per TTL per IP
  THROTTLE_GLOBAL_LIMIT: Joi.number().default(10000), // global requests per TTL

  // Caching (Redis)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  ENABLE_REQUEST_LOGGING: Joi.boolean().default(true),

  // Health Checks
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000), // milliseconds
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000), // milliseconds

  // API Documentation
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('api'),

  // Proxy Configuration
  PROXY_TIMEOUT: Joi.number().default(30000), // milliseconds
  PROXY_RETRY_ATTEMPTS: Joi.number().default(3),
  PROXY_RETRY_DELAY: Joi.number().default(1000), // milliseconds
});

export const validateEnv = (config: Record<string, unknown>): EnvironmentVariables => {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
};
