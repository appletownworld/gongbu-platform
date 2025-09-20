import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface UserContext {
  userId: string;
  telegramId: number;
  role: string;
  permissions: string[];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:3001';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.debug('No Bearer token provided');
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Validate token with Auth Service
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/api/auth/validate`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000, // 5 second timeout
        })
      );

      if (!response.data?.valid || !response.data?.user) {
        this.logger.debug('Token validation failed: invalid response from auth service');
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user context to request
      const userContext: UserContext = {
        userId: response.data.user.id,
        telegramId: response.data.user.telegramId,
        role: response.data.user.role,
        permissions: response.data.user.permissions || [],
      };

      request.user = userContext;
      
      this.logger.debug(`Authenticated user: ${userContext.userId} (${userContext.role})`);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        this.logger.debug('Token validation failed: unauthorized');
        throw new UnauthorizedException('Invalid or expired token');
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.error('Auth service unavailable', error.message);
        throw new UnauthorizedException('Authentication service unavailable');
      }

      this.logger.error('Token validation error', error.message);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
