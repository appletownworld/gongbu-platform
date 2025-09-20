import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TelegramWebAppInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
  };
  receiver?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
  };
  chat?: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class TelegramHmacValidatorService {
  private readonly logger = new Logger(TelegramHmacValidatorService.name);
  private readonly botToken: string;
  private readonly secretKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    // В development режиме разрешаем dummy токен
    if (!this.botToken) {
      if (nodeEnv === 'development') {
        this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN отсутствует, использую dummy токен для разработки');
        this.botToken = 'dummy_development_token_for_local_testing_only';
      } else {
        throw new Error('TELEGRAM_BOT_TOKEN is required for HMAC validation');
      }
    }
    
    // Create secret key from bot token
    this.secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();
  }

  /**
   * Validates Telegram WebApp initData HMAC signature
   * According to: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
   */
  validateInitData(initData: string): TelegramWebAppInitData | null {
    try {
      // Parse URL-encoded data
      const urlParams = new URLSearchParams(initData);
      const data: Record<string, string> = {};
      
      for (const [key, value] of urlParams.entries()) {
        data[key] = value;
      }

      const hash = data.hash;
      if (!hash) {
        this.logger.warn('No hash found in initData');
        return null;
      }

      // Remove hash from data for validation
      delete data.hash;

      // Create data-check-string
      const dataCheckString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');

      // Calculate expected hash
      const expectedHash = crypto
        .createHmac('sha256', this.secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Compare hashes
      if (hash !== expectedHash) {
        this.logger.warn('HMAC validation failed', {
          received: hash,
          expected: expectedHash,
          dataCheckString
        });
        return null;
      }

      // Check auth_date (data should not be older than 1 hour)
      const authDate = parseInt(data.auth_date);
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 3600; // 1 hour

      if (now - authDate > maxAge) {
        this.logger.warn('InitData is too old', {
          authDate,
          now,
          age: now - authDate
        });
        return null;
      }

      // Parse user data
      const result: TelegramWebAppInitData = {
        auth_date: authDate,
        hash
      };

      if (data.query_id) {
        result.query_id = data.query_id;
      }

      if (data.user) {
        try {
          result.user = JSON.parse(data.user);
        } catch (error) {
          this.logger.error('Failed to parse user data', error);
          return null;
        }
      }

      if (data.receiver) {
        try {
          result.receiver = JSON.parse(data.receiver);
        } catch (error) {
          this.logger.error('Failed to parse receiver data', error);
          return null;
        }
      }

      if (data.chat) {
        try {
          result.chat = JSON.parse(data.chat);
        } catch (error) {
          this.logger.error('Failed to parse chat data', error);
          return null;
        }
      }

      if (data.chat_type) result.chat_type = data.chat_type;
      if (data.chat_instance) result.chat_instance = data.chat_instance;
      if (data.start_param) result.start_param = data.start_param;

      this.logger.debug('HMAC validation successful', {
        userId: result.user?.id,
        authDate: result.auth_date
      });

      return result;
    } catch (error) {
      this.logger.error('HMAC validation error', error);
      return null;
    }
  }

  /**
   * Simple validation for development/testing
   * Only checks basic structure without HMAC
   */
  validateInitDataDev(initData: string): TelegramWebAppInitData | null {
    try {
      const urlParams = new URLSearchParams(initData);
      const data: Record<string, string> = {};
      
      for (const [key, value] of urlParams.entries()) {
        data[key] = value;
      }

      // For development, just check if we have required fields
      if (!data.auth_date) {
        this.logger.warn('DEV: No auth_date in initData');
        return null;
      }

      const result: TelegramWebAppInitData = {
        auth_date: parseInt(data.auth_date),
        hash: data.hash || 'dev-hash'
      };

      if (data.user) {
        try {
          result.user = JSON.parse(data.user);
        } catch (error) {
          this.logger.error('DEV: Failed to parse user data', error);
          return null;
        }
      }

      this.logger.debug('DEV: Init data validation bypassed for development');
      return result;
    } catch (error) {
      this.logger.error('DEV: Init data parsing error', error);
      return null;
    }
  }

  /**
   * Validates based on environment (production uses HMAC, dev bypasses)
   */
  validateInitDataSafe(initData: string): TelegramWebAppInitData | null {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      this.logger.debug('Running in development mode, using relaxed validation');
      return this.validateInitDataDev(initData);
    }

    return this.validateInitData(initData);
  }
}
