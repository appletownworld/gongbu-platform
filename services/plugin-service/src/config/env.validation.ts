import * as Joi from 'joi';

export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // Database
  PLUGIN_SERVICE_DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // External Services
  AUTH_SERVICE_URL: string;
  COURSE_SERVICE_URL?: string;
  NOTIFICATION_SERVICE_URL?: string;
  ANALYTICS_SERVICE_URL?: string;

  // Redis Configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  CACHE_TTL: number;

  // Plugin Storage
  PLUGIN_DIRECTORY: string;
  PLUGIN_REGISTRY_URL?: string;
  PLUGIN_CDN_URL?: string;
  MAX_PLUGIN_SIZE_MB: number;
  ALLOWED_PLUGIN_TYPES: string[];

  // Plugin Execution
  PLUGIN_SANDBOX_ENABLED: boolean;
  PLUGIN_MAX_EXECUTION_TIME: number; // milliseconds
  PLUGIN_MAX_MEMORY_MB: number;
  PLUGIN_MAX_FILE_SIZE_KB: number;
  PLUGIN_ISOLATION_LEVEL: 'vm' | 'container' | 'process';

  // Security
  ENABLE_PLUGIN_SECURITY_SCAN: boolean;
  SECURITY_SCAN_API_URL?: string;
  SECURITY_SCAN_API_KEY?: string;
  PLUGIN_SIGNATURE_VERIFICATION: boolean;
  TRUSTED_PUBLISHERS: string[];
  PLUGIN_WHITELIST_MODE: boolean;
  PLUGIN_BLACKLIST: string[];

  // Marketplace
  MARKETPLACE_ENABLED: boolean;
  MARKETPLACE_APPROVAL_REQUIRED: boolean;
  MARKETPLACE_REVENUE_SHARE: number; // 0.0 to 1.0
  ALLOW_PAID_PLUGINS: boolean;
  STRIPE_SECRET_KEY?: string;
  PAYMENT_WEBHOOK_SECRET?: string;

  // Package Management
  NPM_REGISTRY_URL?: string;
  GITHUB_TOKEN?: string;
  PACKAGE_VALIDATION_ENABLED: boolean;
  ALLOW_EXTERNAL_DEPENDENCIES: boolean;
  DEPENDENCY_SCAN_ENABLED: boolean;

  // Theme System
  THEME_SYSTEM_ENABLED: boolean;
  DEFAULT_THEME: string;
  CUSTOM_CSS_ENABLED: boolean;
  SASS_COMPILATION: boolean;
  THEME_HOT_RELOAD: boolean;

  // Hook System
  HOOK_SYSTEM_ENABLED: boolean;
  MAX_HOOK_EXECUTION_TIME: number;
  HOOK_ERROR_THRESHOLD: number;
  HOOK_CIRCUIT_BREAKER: boolean;

  // Development
  PLUGIN_HOT_RELOAD: boolean;
  DEVELOPMENT_MODE: boolean;
  ALLOW_UNSAFE_PLUGINS: boolean;
  DEBUG_PLUGIN_EXECUTION: boolean;
  PLUGIN_PROFILING: boolean;

  // Performance
  MAX_CONCURRENT_PLUGIN_EXECUTIONS: number;
  PLUGIN_CACHE_ENABLED: boolean;
  PLUGIN_CACHE_TTL: number;
  LAZY_PLUGIN_LOADING: boolean;
  PLUGIN_PRELOAD_STRATEGY: 'eager' | 'lazy' | 'on-demand';

  // Monitoring and Analytics
  PLUGIN_ANALYTICS_ENABLED: boolean;
  TRACK_PLUGIN_PERFORMANCE: boolean;
  ERROR_REPORTING_ENABLED: boolean;
  USAGE_ANALYTICS_ENDPOINT?: string;
  PERFORMANCE_MONITORING: boolean;

  // File System
  FILE_SYSTEM_ISOLATION: boolean;
  PLUGIN_TEMP_DIR: string;
  CLEANUP_TEMP_FILES: boolean;
  MAX_PLUGIN_FILES: number;
  ALLOWED_FILE_EXTENSIONS: string[];

  // API Rate Limiting
  PLUGIN_API_RATE_LIMIT: number; // requests per minute
  PLUGIN_API_BURST_LIMIT: number;
  PLUGIN_INSTALL_RATE_LIMIT: number; // installs per hour
  
  // Backup and Recovery
  PLUGIN_BACKUP_ENABLED: boolean;
  PLUGIN_BACKUP_SCHEDULE: string;
  PLUGIN_RECOVERY_MODE: boolean;

  // Compliance and Legal
  GDPR_COMPLIANCE_MODE: boolean;
  PLUGIN_DATA_RETENTION_DAYS: number;
  PRIVACY_POLICY_REQUIRED: boolean;
  TERMS_OF_SERVICE_REQUIRED: boolean;

  // Content Moderation
  CONTENT_MODERATION_ENABLED: boolean;
  AUTO_APPROVE_VERIFIED_PUBLISHERS: boolean;
  MANUAL_REVIEW_REQUIRED: boolean;
  CONTENT_FILTERING_RULES: string[];

  // Internationalization
  MULTI_LANGUAGE_SUPPORT: boolean;
  DEFAULT_LANGUAGE: string;
  SUPPORTED_LANGUAGES: string[];
  AUTO_TRANSLATE_DESCRIPTIONS: boolean;

  // WebAssembly Support
  WASM_PLUGINS_ENABLED: boolean;
  WASM_RUNTIME: string; // 'wasmtime' | 'wasmer' | 'node'
  WASM_MEMORY_LIMIT_MB: number;

  // Container Support
  DOCKER_PLUGINS_ENABLED: boolean;
  DOCKER_REGISTRY_URL?: string;
  DOCKER_MEMORY_LIMIT: string;
  DOCKER_CPU_LIMIT: string;

  // Logging
  LOG_LEVEL: string;
  LOG_PLUGIN_EXECUTION: boolean;
  LOG_PLUGIN_ERRORS: boolean;
  STRUCTURED_LOGGING: boolean;
}

export const envValidationSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3008),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  PLUGIN_SERVICE_DATABASE_URL: Joi.string().uri().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),

  // External Services
  AUTH_SERVICE_URL: Joi.string().uri().default('http://auth-service:3001'),
  COURSE_SERVICE_URL: Joi.string().uri().optional(),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),
  ANALYTICS_SERVICE_URL: Joi.string().uri().optional(),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().integer().min(0).default(6),
  CACHE_TTL: Joi.number().integer().min(60).default(3600), // 1 hour

  // Plugin Storage
  PLUGIN_DIRECTORY: Joi.string().default('/app/plugins'),
  PLUGIN_REGISTRY_URL: Joi.string().uri().optional(),
  PLUGIN_CDN_URL: Joi.string().uri().optional(),
  MAX_PLUGIN_SIZE_MB: Joi.number().integer().min(1).default(100),
  ALLOWED_PLUGIN_TYPES: Joi.string().default('javascript,typescript,wasm,docker').custom((value) => {
    return value.split(',').map((type: string) => type.trim());
  }),

  // Plugin Execution
  PLUGIN_SANDBOX_ENABLED: Joi.boolean().default(true),
  PLUGIN_MAX_EXECUTION_TIME: Joi.number().integer().min(1000).default(5000), // 5 seconds
  PLUGIN_MAX_MEMORY_MB: Joi.number().integer().min(10).default(100),
  PLUGIN_MAX_FILE_SIZE_KB: Joi.number().integer().min(1).default(1024), // 1MB
  PLUGIN_ISOLATION_LEVEL: Joi.string().valid('vm', 'container', 'process').default('vm'),

  // Security
  ENABLE_PLUGIN_SECURITY_SCAN: Joi.boolean().default(true),
  SECURITY_SCAN_API_URL: Joi.string().uri().optional(),
  SECURITY_SCAN_API_KEY: Joi.string().optional(),
  PLUGIN_SIGNATURE_VERIFICATION: Joi.boolean().default(true),
  TRUSTED_PUBLISHERS: Joi.string().default('').custom((value) => {
    return value ? value.split(',').map((id: string) => id.trim()) : [];
  }),
  PLUGIN_WHITELIST_MODE: Joi.boolean().default(false),
  PLUGIN_BLACKLIST: Joi.string().default('').custom((value) => {
    return value ? value.split(',').map((id: string) => id.trim()) : [];
  }),

  // Marketplace
  MARKETPLACE_ENABLED: Joi.boolean().default(true),
  MARKETPLACE_APPROVAL_REQUIRED: Joi.boolean().default(true),
  MARKETPLACE_REVENUE_SHARE: Joi.number().min(0).max(1).default(0.7), // 70% to publisher
  ALLOW_PAID_PLUGINS: Joi.boolean().default(true),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  PAYMENT_WEBHOOK_SECRET: Joi.string().optional(),

  // Package Management
  NPM_REGISTRY_URL: Joi.string().uri().default('https://registry.npmjs.org'),
  GITHUB_TOKEN: Joi.string().optional(),
  PACKAGE_VALIDATION_ENABLED: Joi.boolean().default(true),
  ALLOW_EXTERNAL_DEPENDENCIES: Joi.boolean().default(true),
  DEPENDENCY_SCAN_ENABLED: Joi.boolean().default(true),

  // Theme System
  THEME_SYSTEM_ENABLED: Joi.boolean().default(true),
  DEFAULT_THEME: Joi.string().default('gongbu-default'),
  CUSTOM_CSS_ENABLED: Joi.boolean().default(true),
  SASS_COMPILATION: Joi.boolean().default(true),
  THEME_HOT_RELOAD: Joi.boolean().default(false),

  // Hook System
  HOOK_SYSTEM_ENABLED: Joi.boolean().default(true),
  MAX_HOOK_EXECUTION_TIME: Joi.number().integer().min(100).default(2000), // 2 seconds
  HOOK_ERROR_THRESHOLD: Joi.number().integer().min(1).default(5),
  HOOK_CIRCUIT_BREAKER: Joi.boolean().default(true),

  // Development
  PLUGIN_HOT_RELOAD: Joi.boolean().default(false),
  DEVELOPMENT_MODE: Joi.boolean().default(false),
  ALLOW_UNSAFE_PLUGINS: Joi.boolean().default(false),
  DEBUG_PLUGIN_EXECUTION: Joi.boolean().default(false),
  PLUGIN_PROFILING: Joi.boolean().default(false),

  // Performance
  MAX_CONCURRENT_PLUGIN_EXECUTIONS: Joi.number().integer().min(1).default(10),
  PLUGIN_CACHE_ENABLED: Joi.boolean().default(true),
  PLUGIN_CACHE_TTL: Joi.number().integer().min(60).default(1800), // 30 minutes
  LAZY_PLUGIN_LOADING: Joi.boolean().default(true),
  PLUGIN_PRELOAD_STRATEGY: Joi.string().valid('eager', 'lazy', 'on-demand').default('lazy'),

  // Monitoring and Analytics
  PLUGIN_ANALYTICS_ENABLED: Joi.boolean().default(true),
  TRACK_PLUGIN_PERFORMANCE: Joi.boolean().default(true),
  ERROR_REPORTING_ENABLED: Joi.boolean().default(true),
  USAGE_ANALYTICS_ENDPOINT: Joi.string().uri().optional(),
  PERFORMANCE_MONITORING: Joi.boolean().default(true),

  // File System
  FILE_SYSTEM_ISOLATION: Joi.boolean().default(true),
  PLUGIN_TEMP_DIR: Joi.string().default('/app/tmp/plugins'),
  CLEANUP_TEMP_FILES: Joi.boolean().default(true),
  MAX_PLUGIN_FILES: Joi.number().integer().min(1).default(1000),
  ALLOWED_FILE_EXTENSIONS: Joi.string().default('js,ts,json,css,scss,html,md,txt,yml,yaml').custom((value) => {
    return value.split(',').map((ext: string) => ext.trim());
  }),

  // API Rate Limiting
  PLUGIN_API_RATE_LIMIT: Joi.number().integer().min(1).default(1000), // per minute
  PLUGIN_API_BURST_LIMIT: Joi.number().integer().min(1).default(100),
  PLUGIN_INSTALL_RATE_LIMIT: Joi.number().integer().min(1).default(10), // per hour

  // Backup and Recovery
  PLUGIN_BACKUP_ENABLED: Joi.boolean().default(true),
  PLUGIN_BACKUP_SCHEDULE: Joi.string().default('0 2 * * *'), // Daily at 2 AM
  PLUGIN_RECOVERY_MODE: Joi.boolean().default(false),

  // Compliance and Legal
  GDPR_COMPLIANCE_MODE: Joi.boolean().default(true),
  PLUGIN_DATA_RETENTION_DAYS: Joi.number().integer().min(1).default(365),
  PRIVACY_POLICY_REQUIRED: Joi.boolean().default(true),
  TERMS_OF_SERVICE_REQUIRED: Joi.boolean().default(true),

  // Content Moderation
  CONTENT_MODERATION_ENABLED: Joi.boolean().default(true),
  AUTO_APPROVE_VERIFIED_PUBLISHERS: Joi.boolean().default(true),
  MANUAL_REVIEW_REQUIRED: Joi.boolean().default(false),
  CONTENT_FILTERING_RULES: Joi.string().default('spam,malicious,inappropriate').custom((value) => {
    return value.split(',').map((rule: string) => rule.trim());
  }),

  // Internationalization
  MULTI_LANGUAGE_SUPPORT: Joi.boolean().default(true),
  DEFAULT_LANGUAGE: Joi.string().default('en'),
  SUPPORTED_LANGUAGES: Joi.string().default('en,ru,es,fr,de,zh,ja,ko').custom((value) => {
    return value.split(',').map((lang: string) => lang.trim());
  }),
  AUTO_TRANSLATE_DESCRIPTIONS: Joi.boolean().default(false),

  // WebAssembly Support
  WASM_PLUGINS_ENABLED: Joi.boolean().default(false),
  WASM_RUNTIME: Joi.string().valid('wasmtime', 'wasmer', 'node').default('node'),
  WASM_MEMORY_LIMIT_MB: Joi.number().integer().min(1).default(32),

  // Container Support
  DOCKER_PLUGINS_ENABLED: Joi.boolean().default(false),
  DOCKER_REGISTRY_URL: Joi.string().uri().optional(),
  DOCKER_MEMORY_LIMIT: Joi.string().default('128m'),
  DOCKER_CPU_LIMIT: Joi.string().default('0.5'),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  LOG_PLUGIN_EXECUTION: Joi.boolean().default(false),
  LOG_PLUGIN_ERRORS: Joi.boolean().default(true),
  STRUCTURED_LOGGING: Joi.boolean().default(true),
});

export const validateEnv = (config: Record<string, unknown>): EnvironmentVariables => {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Plugin Service environment validation error: ${error.message}`);
  }

  return value;
};
