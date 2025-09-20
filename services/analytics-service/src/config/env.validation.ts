import * as Joi from 'joi';

export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // Database
  ANALYTICS_SERVICE_DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // External Services
  AUTH_SERVICE_URL: string;
  COURSE_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL?: string;
  PAYMENT_SERVICE_URL?: string;

  // Redis Configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  CACHE_TTL: number;

  // Data Processing
  BATCH_SIZE: number;
  PROCESSING_INTERVAL: number;
  MAX_EVENT_AGE_DAYS: number;
  ENABLE_REAL_TIME_PROCESSING: boolean;

  // Analytics Integrations
  
  // Mixpanel
  MIXPANEL_TOKEN?: string;
  MIXPANEL_SECRET?: string;
  MIXPANEL_ENABLED: boolean;

  // Google Analytics 4
  GOOGLE_ANALYTICS_MEASUREMENT_ID?: string;
  GOOGLE_ANALYTICS_API_SECRET?: string;
  GOOGLE_ANALYTICS_PROPERTY_ID?: string;
  GOOGLE_ANALYTICS_SERVICE_ACCOUNT?: string;
  GOOGLE_ANALYTICS_ENABLED: boolean;

  // Segment
  SEGMENT_WRITE_KEY?: string;
  SEGMENT_ENABLED: boolean;

  // Time Series Databases
  
  // InfluxDB
  INFLUXDB_URL?: string;
  INFLUXDB_TOKEN?: string;
  INFLUXDB_ORG?: string;
  INFLUXDB_BUCKET?: string;
  INFLUXDB_ENABLED: boolean;

  // ClickHouse
  CLICKHOUSE_URL?: string;
  CLICKHOUSE_USERNAME?: string;
  CLICKHOUSE_PASSWORD?: string;
  CLICKHOUSE_DATABASE?: string;
  CLICKHOUSE_ENABLED: boolean;

  // Data Export
  ENABLE_DATA_EXPORT: boolean;
  DATA_EXPORT_FORMAT: 'json' | 'csv' | 'parquet';
  DATA_EXPORT_S3_BUCKET?: string;
  DATA_EXPORT_SCHEDULE: string;

  // Machine Learning
  ML_ENABLED: boolean;
  ML_API_URL?: string;
  ML_API_KEY?: string;
  PREDICTION_MODEL_VERSION?: string;

  // A/B Testing
  ENABLE_AB_TESTING: boolean;
  AB_TEST_CACHE_TTL: number;
  AB_TEST_SAMPLE_SIZE_MIN: number;
  AB_TEST_CONFIDENCE_LEVEL: number;

  // Real-time Analytics
  ENABLE_WEBSOCKET: boolean;
  WEBSOCKET_PORT?: number;
  REAL_TIME_DASHBOARD_UPDATE_INTERVAL: number;

  // Data Retention
  EVENT_RETENTION_DAYS: number;
  SESSION_RETENTION_DAYS: number;
  LEARNING_ANALYTICS_RETENTION_DAYS: number;
  USER_BEHAVIOR_RETENTION_DAYS: number;
  METRICS_RETENTION_DAYS: number;

  // Privacy and Compliance
  ANONYMIZE_IP_ADDRESSES: boolean;
  GDPR_COMPLIANCE_MODE: boolean;
  DATA_SUBJECT_REQUESTS_ENABLED: boolean;
  CONSENT_TRACKING_ENABLED: boolean;

  // Performance
  MAX_EVENTS_PER_BATCH: number;
  MAX_CONCURRENT_JOBS: number;
  ENABLE_QUERY_CACHING: boolean;
  QUERY_CACHE_TTL: number;

  // Monitoring and Alerting
  ENABLE_PERFORMANCE_MONITORING: boolean;
  ALERT_EMAIL_RECIPIENTS?: string;
  ALERT_SLACK_WEBHOOK?: string;
  ERROR_RATE_THRESHOLD: number;
  LATENCY_THRESHOLD: number;

  // Feature Flags
  ENABLE_USER_JOURNEY_TRACKING: boolean;
  ENABLE_COHORT_ANALYSIS: boolean;
  ENABLE_FUNNEL_ANALYSIS: boolean;
  ENABLE_RETENTION_ANALYSIS: boolean;
  ENABLE_REVENUE_TRACKING: boolean;
  ENABLE_LEARNING_INSIGHTS: boolean;

  // Geographic Analytics
  ENABLE_GEOLOCATION: boolean;
  GEOIP_DATABASE_PATH?: string;
  
  // Report Generation
  REPORT_GENERATION_ENABLED: boolean;
  PDF_GENERATION_ENABLED: boolean;
  CHART_GENERATION_TIMEOUT: number;
  MAX_REPORT_SIZE_MB: number;

  // Logging
  LOG_LEVEL: string;
  LOG_ANALYTICS_EVENTS: boolean;
  LOG_SENSITIVE_DATA: boolean;

  // Development/Testing
  ANALYTICS_TEST_MODE: boolean;
  FAKE_DATA_GENERATION: boolean;
  TEST_USER_ID?: string;
}

export const envValidationSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3007),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  ANALYTICS_SERVICE_DATABASE_URL: Joi.string().uri().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),

  // External Services
  AUTH_SERVICE_URL: Joi.string().uri().default('http://auth-service:3001'),
  COURSE_SERVICE_URL: Joi.string().uri().default('http://course-service:3002'),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),
  PAYMENT_SERVICE_URL: Joi.string().uri().optional(),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().integer().min(0).default(5),
  CACHE_TTL: Joi.number().integer().min(60).default(3600), // 1 hour

  // Data Processing
  BATCH_SIZE: Joi.number().integer().min(100).default(1000),
  PROCESSING_INTERVAL: Joi.number().integer().min(1000).default(30000), // 30 seconds
  MAX_EVENT_AGE_DAYS: Joi.number().integer().min(1).default(7),
  ENABLE_REAL_TIME_PROCESSING: Joi.boolean().default(true),

  // Analytics Integrations
  MIXPANEL_TOKEN: Joi.string().optional(),
  MIXPANEL_SECRET: Joi.string().optional(),
  MIXPANEL_ENABLED: Joi.boolean().default(false),

  GOOGLE_ANALYTICS_MEASUREMENT_ID: Joi.string().optional(),
  GOOGLE_ANALYTICS_API_SECRET: Joi.string().optional(),
  GOOGLE_ANALYTICS_PROPERTY_ID: Joi.string().optional(),
  GOOGLE_ANALYTICS_SERVICE_ACCOUNT: Joi.string().optional(),
  GOOGLE_ANALYTICS_ENABLED: Joi.boolean().default(false),

  SEGMENT_WRITE_KEY: Joi.string().optional(),
  SEGMENT_ENABLED: Joi.boolean().default(false),

  // Time Series Databases
  INFLUXDB_URL: Joi.string().uri().optional(),
  INFLUXDB_TOKEN: Joi.string().optional(),
  INFLUXDB_ORG: Joi.string().optional(),
  INFLUXDB_BUCKET: Joi.string().optional(),
  INFLUXDB_ENABLED: Joi.boolean().default(false),

  CLICKHOUSE_URL: Joi.string().uri().optional(),
  CLICKHOUSE_USERNAME: Joi.string().optional(),
  CLICKHOUSE_PASSWORD: Joi.string().optional(),
  CLICKHOUSE_DATABASE: Joi.string().default('analytics'),
  CLICKHOUSE_ENABLED: Joi.boolean().default(false),

  // Data Export
  ENABLE_DATA_EXPORT: Joi.boolean().default(true),
  DATA_EXPORT_FORMAT: Joi.string().valid('json', 'csv', 'parquet').default('json'),
  DATA_EXPORT_S3_BUCKET: Joi.string().optional(),
  DATA_EXPORT_SCHEDULE: Joi.string().default('0 2 * * *'), // Daily at 2 AM

  // Machine Learning
  ML_ENABLED: Joi.boolean().default(false),
  ML_API_URL: Joi.string().uri().optional(),
  ML_API_KEY: Joi.string().optional(),
  PREDICTION_MODEL_VERSION: Joi.string().default('v1.0'),

  // A/B Testing
  ENABLE_AB_TESTING: Joi.boolean().default(true),
  AB_TEST_CACHE_TTL: Joi.number().integer().min(60).default(1800), // 30 minutes
  AB_TEST_SAMPLE_SIZE_MIN: Joi.number().integer().min(10).default(100),
  AB_TEST_CONFIDENCE_LEVEL: Joi.number().min(80).max(99).default(95),

  // Real-time Analytics
  ENABLE_WEBSOCKET: Joi.boolean().default(true),
  WEBSOCKET_PORT: Joi.number().port().optional(),
  REAL_TIME_DASHBOARD_UPDATE_INTERVAL: Joi.number().integer().min(1000).default(5000), // 5 seconds

  // Data Retention
  EVENT_RETENTION_DAYS: Joi.number().integer().min(30).default(365),
  SESSION_RETENTION_DAYS: Joi.number().integer().min(30).default(180),
  LEARNING_ANALYTICS_RETENTION_DAYS: Joi.number().integer().min(90).default(1095), // 3 years
  USER_BEHAVIOR_RETENTION_DAYS: Joi.number().integer().min(30).default(730), // 2 years
  METRICS_RETENTION_DAYS: Joi.number().integer().min(30).default(1095), // 3 years

  // Privacy and Compliance
  ANONYMIZE_IP_ADDRESSES: Joi.boolean().default(true),
  GDPR_COMPLIANCE_MODE: Joi.boolean().default(true),
  DATA_SUBJECT_REQUESTS_ENABLED: Joi.boolean().default(true),
  CONSENT_TRACKING_ENABLED: Joi.boolean().default(true),

  // Performance
  MAX_EVENTS_PER_BATCH: Joi.number().integer().min(100).max(10000).default(1000),
  MAX_CONCURRENT_JOBS: Joi.number().integer().min(1).max(100).default(10),
  ENABLE_QUERY_CACHING: Joi.boolean().default(true),
  QUERY_CACHE_TTL: Joi.number().integer().min(60).default(900), // 15 minutes

  // Monitoring and Alerting
  ENABLE_PERFORMANCE_MONITORING: Joi.boolean().default(true),
  ALERT_EMAIL_RECIPIENTS: Joi.string().optional(),
  ALERT_SLACK_WEBHOOK: Joi.string().uri().optional(),
  ERROR_RATE_THRESHOLD: Joi.number().min(0).max(1).default(0.05), // 5%
  LATENCY_THRESHOLD: Joi.number().integer().min(100).default(2000), // 2 seconds

  // Feature Flags
  ENABLE_USER_JOURNEY_TRACKING: Joi.boolean().default(true),
  ENABLE_COHORT_ANALYSIS: Joi.boolean().default(true),
  ENABLE_FUNNEL_ANALYSIS: Joi.boolean().default(true),
  ENABLE_RETENTION_ANALYSIS: Joi.boolean().default(true),
  ENABLE_REVENUE_TRACKING: Joi.boolean().default(true),
  ENABLE_LEARNING_INSIGHTS: Joi.boolean().default(true),

  // Geographic Analytics
  ENABLE_GEOLOCATION: Joi.boolean().default(true),
  GEOIP_DATABASE_PATH: Joi.string().optional(),

  // Report Generation
  REPORT_GENERATION_ENABLED: Joi.boolean().default(true),
  PDF_GENERATION_ENABLED: Joi.boolean().default(true),
  CHART_GENERATION_TIMEOUT: Joi.number().integer().min(5000).default(30000), // 30 seconds
  MAX_REPORT_SIZE_MB: Joi.number().min(1).default(50),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  LOG_ANALYTICS_EVENTS: Joi.boolean().default(false),
  LOG_SENSITIVE_DATA: Joi.boolean().default(false),

  // Development/Testing
  ANALYTICS_TEST_MODE: Joi.boolean().default(false),
  FAKE_DATA_GENERATION: Joi.boolean().default(false),
  TEST_USER_ID: Joi.string().optional(),
});

export const validateEnv = (config: Record<string, unknown>): EnvironmentVariables => {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Analytics Service environment validation error: ${error.message}`);
  }

  return value;
};
