import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramLoginDto {
  @ApiProperty({
    description: 'Telegram WebApp initData string with HMAC signature',
    example: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22john_doe%22%7D&auth_date=1641234567&hash=abc123def456...',
  })
  @IsString()
  initData: string;

  @ApiPropertyOptional({
    description: 'Device information for session tracking',
    example: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      platform: 'ios',
      version: '1.0.0',
      isTelegramWebApp: true,
    },
  })
  @IsOptional()
  @IsObject()
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    version?: string;
    isTelegramWebApp?: boolean;
  };

  @ApiPropertyOptional({
    description: 'User IP address (will be automatically detected in production)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

// Legacy DTO for backward compatibility
export class TelegramLoginLegacyDto {
  @ApiProperty({
    description: 'Telegram user information',
    example: {
      id: 123456789,
      first_name: 'John',
      last_name: 'Doe',
      username: 'john_doe',
      language_code: 'en',
      photo_url: 'https://t.me/i/userpic/...',
      is_premium: false,
    },
  })
  @IsObject()
  telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Init data from Telegram WebApp (optional, used for validation)',
    example: {
      query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
      auth_date: 1641234567,
      hash: 'abc123def456...',
    },
  })
  @IsOptional()
  @IsObject()
  initData?: {
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };

  @ApiProperty({
    description: 'Authentication source',
    enum: ['webapp', 'bot'],
    example: 'webapp',
  })
  @IsString()
  source: 'webapp' | 'bot';
}
