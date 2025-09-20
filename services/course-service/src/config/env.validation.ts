import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3002),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().uri().required(),
  
  // Redis Cache
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().min(0).max(15).default(1),

  // Authentication (for JWT validation)
  JWT_SECRET: Joi.string().min(1).optional(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  
  // Auth Service Integration
  AUTH_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  AUTH_SERVICE_TOKEN: Joi.string().optional(),
  
  // File Storage
  STORAGE_PROVIDER: Joi.string().valid('local', 's3', 'gcs').default('local'),
  UPLOAD_MAX_SIZE: Joi.number().default(100 * 1024 * 1024), // 100MB
  FILE_STORAGE_PATH: Joi.string().default('/app/uploads'),
  BASE_URL: Joi.string().uri().default('http://localhost:3002'),
  
  // AWS S3 (if using S3 storage)
  AWS_ACCESS_KEY_ID: Joi.string().when('STORAGE_PROVIDER', { is: 's3', then: Joi.required() }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', { is: 's3', then: Joi.required() }),
  AWS_REGION: Joi.string().when('STORAGE_PROVIDER', { is: 's3', then: Joi.required() }),
  AWS_BUCKET_NAME: Joi.string().when('STORAGE_PROVIDER', { is: 's3', then: Joi.required() }),
  
  // Content Delivery
  CDN_URL: Joi.string().uri().optional(),
  
  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  
  // Video Processing
  ENABLE_VIDEO_PROCESSING: Joi.boolean().default(false),
  FFMPEG_PATH: Joi.string().optional(),
  
  // Inter-service Communication (duplicate removed)
  
  // Search (Elasticsearch)
  ELASTICSEARCH_URL: Joi.string().uri().default('http://localhost:9200'),
  ELASTICSEARCH_INDEX_PREFIX: Joi.string().default('gongbu-courses'),
  
  // Email/Notifications
  NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),
  
  // Monitoring
  ENABLE_METRICS: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().port().default(9092),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});

export function validateEnv(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}
