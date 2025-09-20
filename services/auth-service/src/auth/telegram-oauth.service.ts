import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  start_param?: string;
  auth_date: number;
  hash: string;
  query_id?: string;
}

@Injectable()
export class TelegramOAuthService {
  private readonly logger = new Logger(TelegramOAuthService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validates Telegram WebApp init data
   * @param initData - Raw init data string from Telegram WebApp
   * @returns Parsed and validated user data
   */
  validateWebAppData(initData: string): TelegramWebAppInitData {
    this.logger.debug(`Validating Telegram WebApp data: ${initData.substring(0, 50)}...`);

    try {
      // Parse URL-encoded data
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) {
        throw new UnauthorizedException('Missing hash in Telegram data');
      }

      // Remove hash from validation data
      urlParams.delete('hash');
      
      // Sort parameters and create check string
      const dataCheckArray: string[] = [];
      for (const [key, value] of Array.from(urlParams.entries()).sort()) {
        dataCheckArray.push(`${key}=${value}`);
      }
      const dataCheckString = dataCheckArray.join('\n');

      // Validate hash
      if (!this.verifyHash(dataCheckString, hash)) {
        throw new UnauthorizedException('Invalid Telegram data hash');
      }

      // Check data freshness (should not be older than 24 hours)
      const authDate = parseInt(urlParams.get('auth_date') || '0');
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 24 * 60 * 60; // 24 hours in seconds

      if (currentTime - authDate > maxAge) {
        throw new UnauthorizedException('Telegram data is too old');
      }

      // Parse user data
      const userData = urlParams.get('user');
      let user: TelegramUser | undefined;
      
      if (userData) {
        try {
          user = JSON.parse(userData);
        } catch (error) {
          this.logger.error('Failed to parse user data from Telegram', error);
          throw new UnauthorizedException('Invalid user data format');
        }
      }

      const result: TelegramWebAppInitData = {
        user,
        chat_instance: urlParams.get('chat_instance') || undefined,
        chat_type: urlParams.get('chat_type') || undefined,
        start_param: urlParams.get('start_param') || undefined,
        auth_date: authDate,
        hash,
        query_id: urlParams.get('query_id') || undefined,
      };

      this.logger.debug(`Successfully validated Telegram data for user: ${user?.id}`);
      return result;
    } catch (error) {
      this.logger.error('Telegram WebApp data validation failed', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Telegram WebApp data format');
    }
  }

  /**
   * Validates Telegram Bot webhook data
   * @param initData - Init data string
   * @param providedHash - Hash from Telegram
   * @returns boolean indicating validity
   */
  validateBotData(initData: string, providedHash: string): boolean {
    this.logger.debug('Validating Telegram Bot data');

    try {
      return this.verifyHash(initData, providedHash);
    } catch (error) {
      this.logger.error('Telegram Bot data validation failed', error);
      return false;
    }
  }

  /**
   * Creates a deep link for Telegram Bot
   * @param botUsername - Bot username
   * @param startParam - Optional start parameter
   * @returns Deep link URL
   */
  createDeepLink(botUsername: string, startParam?: string): string {
    const baseUrl = `https://t.me/${botUsername}`;
    return startParam ? `${baseUrl}?start=${startParam}` : baseUrl;
  }

  /**
   * Verifies HMAC-SHA256 hash
   * @param data - Data to verify
   * @param hash - Hash to verify against
   * @returns boolean indicating validity
   */
  private verifyHash(data: string, hash: string): boolean {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured - skipping hash verification');
      return true; // Allow in development without bot token
    }

    try {
      // Create secret key from bot token
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Calculate expected hash
      const expectedHash = createHmac('sha256', secretKey)
        .update(data)
        .digest('hex');

      // Compare hashes in constant time to prevent timing attacks
      return this.constantTimeEqual(hash, expectedHash);
    } catch (error) {
      this.logger.error('Hash verification failed', error);
      return false;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Extracts user info from Telegram data for registration/login
   */
  extractUserInfo(telegramData: TelegramWebAppInitData): {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    authDate: number;
  } {
    if (!telegramData.user) {
      throw new UnauthorizedException('No user data in Telegram init data');
    }

    const user = telegramData.user;
    return {
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      authDate: telegramData.auth_date,
    };
  }
}
