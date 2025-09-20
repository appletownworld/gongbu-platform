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

export interface GatewayUserContext {
  userId: string;
  telegramId: number;
  role: string;
  permissions: string[];
}

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3001');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.debug('No Bearer token provided to Gateway');
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
      const userContext: GatewayUserContext = {
        userId: response.data.user.id,
        telegramId: response.data.user.telegramId,
        role: response.data.user.role,
        permissions: response.data.user.permissions || [],
      };

      request.user = userContext;
      request.gatewayAuth = {
        validated: true,
        validatedAt: new Date().toISOString(),
        validatedBy: 'gongbu-api-gateway',
      };
      
      this.logger.debug(`Gateway auth success: ${userContext.userId} (${userContext.role})`);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        this.logger.debug('Token validation failed: unauthorized');
        throw new UnauthorizedException('Invalid or expired token');
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.error('Auth service unavailable for token validation', error.message);
        throw new UnauthorizedException('Authentication service unavailable');
      }

      this.logger.error('Gateway auth error', error.message);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}

@Injectable()
export class GatewayOptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayOptionalAuthGuard.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3001');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If no auth header, allow request but don't attach user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.debug('No Bearer token provided - proceeding as anonymous');
      request.user = null;
      request.gatewayAuth = {
        validated: false,
        anonymous: true,
        validatedAt: new Date().toISOString(),
      };
      return true;
    }

    try {
      const token = authHeader.substring(7);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/api/auth/validate`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        })
      );

      if (response.data?.valid && response.data?.user) {
        const userContext: GatewayUserContext = {
          userId: response.data.user.id,
          telegramId: response.data.user.telegramId,
          role: response.data.user.role,
          permissions: response.data.user.permissions || [],
        };

        request.user = userContext;
        request.gatewayAuth = {
          validated: true,
          validatedAt: new Date().toISOString(),
          validatedBy: 'gongbu-api-gateway',
        };
        
        this.logger.debug(`Gateway optional auth success: ${userContext.userId}`);
      } else {
        // Invalid token, proceed as anonymous
        request.user = null;
        request.gatewayAuth = {
          validated: false,
          invalidToken: true,
          validatedAt: new Date().toISOString(),
        };
        
        this.logger.debug('Invalid token provided - proceeding as anonymous');
      }

      return true;
    } catch (error) {
      // Any error - proceed as anonymous
      request.user = null;
      request.gatewayAuth = {
        validated: false,
        error: error.message,
        validatedAt: new Date().toISOString(),
      };
      
      this.logger.debug('Auth validation error - proceeding as anonymous:', error.message);
      return true;
    }
  }
}
