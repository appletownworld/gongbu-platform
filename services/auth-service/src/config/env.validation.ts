import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3001;

  @IsUrl({ require_tld: false })
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  REDIS_DB?: number = 0;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '15m';

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_EXPIRES_IN?: string = '30d';

  @IsString()
  @IsOptional()
  TELEGRAM_BOT_TOKEN?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string = 'http://localhost:3000,http://localhost:5173';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  RATE_LIMIT_WINDOW_MS?: number = 900000; // 15 minutes

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  RATE_LIMIT_MAX_REQUESTS?: number = 1000;

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string = 'info';

  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}
