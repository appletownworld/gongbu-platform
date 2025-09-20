import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly httpClient: AxiosInstance;
  private readonly authServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3001');
    
    this.httpClient = axios.create({
      baseURL: this.authServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`AuthService initialized with URL: ${this.authServiceUrl}`);
  }

  async validateToken(token: string): Promise<any> {
    try {
      const response = await this.httpClient.post('/auth/validate', { token });
      return response.data;
    } catch (error) {
      this.logger.error('Token validation failed:', error.message);
      throw new Error('Invalid token');
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user:', error.message);
      throw new Error('User not found');
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/users/telegram/${telegramId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user by telegram ID:', error.message);
      return null;
    }
  }
}
