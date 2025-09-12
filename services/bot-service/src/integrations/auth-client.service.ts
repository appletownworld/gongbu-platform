import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

export interface AuthUser {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  role: string;
  subscription: string;
  permissions: string[];
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLogin?: Date;
  createdAt: Date;
}

export interface AuthValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    telegramId: number;
    role: string;
    permissions: string[];
  };
}

export interface ServiceTokenResponse {
  token: string;
  expiresIn: number;
}

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private authServiceUrl: string;
  private serviceToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:3001';
    
    // Initialize service token
    this.initializeServiceToken();
  }

  private async initializeServiceToken(): Promise<void> {
    try {
      this.logger.debug('Initializing service token...');
      await this.refreshServiceToken();
    } catch (error) {
      this.logger.error('Failed to initialize service token:', error.message);
    }
  }

  private async refreshServiceToken(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ServiceTokenResponse>(
          `${this.authServiceUrl}/auth/service-token`,
          {
            serviceName: 'bot-service',
            permissions: ['user:read', 'user:create', 'user:validate'],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // При первом запросе может потребоваться admin токен
              // В production будет использоваться service-to-service аутентификация
            },
            timeout: 5000,
          }
        )
      );

      this.serviceToken = response.data.token;
      this.tokenExpiresAt = new Date(Date.now() + response.data.expiresIn * 1000);
      
      this.logger.log('✅ Service token refreshed successfully');
    } catch (error) {
      this.logger.error('❌ Failed to refresh service token:', this.getErrorMessage(error));
      throw new HttpException(
        'Failed to authenticate with Auth Service',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.serviceToken || !this.tokenExpiresAt || new Date() > this.tokenExpiresAt) {
      await this.refreshServiceToken();
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.serviceToken}`,
      'Content-Type': 'application/json',
      'X-Service-Name': 'bot-service',
    };
  }

  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error';
  }

  /**
   * Создать или получить пользователя по Telegram ID
   */
  async createOrGetUser(telegramUser: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    language_code?: string;
  }): Promise<AuthUser> {
    try {
      await this.ensureValidToken();

      // Пробуем сначала найти пользователя
      const existingUser = await this.getUserByTelegramId(telegramUser.id);
      if (existingUser) {
        return existingUser;
      }

      // Если не найден - создаем через Auth Service login endpoint
      // Здесь в реальной системе будет Telegram WebApp initData
      const mockInitData = this.createMockInitData(telegramUser);
      
      const response = await firstValueFrom(
        this.httpService.post<{ user: AuthUser }>(
          `${this.authServiceUrl}/auth/login`,
          {
            initData: mockInitData,
            deviceInfo: {
              userAgent: 'Telegram Bot',
              platform: 'telegram',
              version: '1.0.0',
            },
            ipAddress: '127.0.0.1',
          },
          {
            headers: this.getAuthHeaders(),
            timeout: 10000,
          }
        )
      );

      this.logger.debug(`User created/retrieved: ${telegramUser.id} (@${telegramUser.username})`);
      return response.data.user;

    } catch (error) {
      this.logger.error(`Failed to create/get user ${telegramUser.id}:`, this.getErrorMessage(error));
      
      // Fallback: создаем минимальную структуру пользователя
      return {
        id: `telegram_${telegramUser.id}`,
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        role: 'STUDENT',
        subscription: 'FREE',
        permissions: ['courses:read'],
        isActive: true,
        isBanned: false,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Получить пользователя по Telegram ID
   */
  async getUserByTelegramId(telegramId: number): Promise<AuthUser | null> {
    try {
      await this.ensureValidToken();

      const response = await firstValueFrom(
        this.httpService.get<AuthUser>(
          `${this.authServiceUrl}/auth/users?telegramId=${telegramId}`,
          {
            headers: this.getAuthHeaders(),
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return null;
      }
      
      this.logger.error(`Failed to get user by Telegram ID ${telegramId}:`, this.getErrorMessage(error));
      return null;
    }
  }

  /**
   * Валидация токена пользователя
   */
  async validateUserToken(token: string): Promise<AuthValidationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<AuthValidationResponse>(
          `${this.authServiceUrl}/auth/validate`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Service-Name': 'bot-service',
            },
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Token validation failed:', this.getErrorMessage(error));
      return { valid: false };
    }
  }

  /**
   * Получить профиль пользователя по ID
   */
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      await this.ensureValidToken();

      const response = await firstValueFrom(
        this.httpService.get<AuthUser>(
          `${this.authServiceUrl}/auth/users/${userId}`,
          {
            headers: this.getAuthHeaders(),
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get user profile ${userId}:`, this.getErrorMessage(error));
      return null;
    }
  }

  /**
   * Проверить здоровье Auth Service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/health`, {
          timeout: 3000,
        })
      );

      return response.status === 200;
    } catch (error) {
      this.logger.warn('Auth Service health check failed:', this.getErrorMessage(error));
      return false;
    }
  }

  /**
   * Создание mock Telegram WebApp initData для тестирования
   * В реальной системе будет передаваться реальный initData из WebApp
   */
  private createMockInitData(telegramUser: any): string {
    const userData = {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      language_code: telegramUser.language_code || 'ru',
    };

    // Простая mock implementation
    const userString = `id=${userData.id}&first_name=${encodeURIComponent(userData.first_name || '')}`;
    const authDate = Math.floor(Date.now() / 1000);
    
    return `user=${encodeURIComponent(JSON.stringify(userData))}&auth_date=${authDate}&hash=mock_hash`;
  }
}
