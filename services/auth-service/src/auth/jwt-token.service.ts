import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { User, UserRole, SubscriptionPlan } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // User ID
  telegram_id: number;
  email?: string;
  role: UserRole;
  subscription_plan: SubscriptionPlan;
  permissions: string[];
  session_id: string;
  
  // Standard JWT claims
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  session_id: string;
  type: 'refresh';
  
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserContext {
  userId: string;
  telegramId: number;
  email?: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  permissions: string[];
  sessionId: string;
}

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates access and refresh token pair
   */
  async generateTokenPair(user: User, sessionId: string, permissions: string[] = []): Promise<TokenPair> {
    this.logger.debug(`Generating token pair for user: ${user.id}`);

    const accessToken = await this.generateAccessToken(user, sessionId, permissions);
    const refreshToken = await this.generateRefreshToken(user.id, sessionId);
    
    const expiresIn = this.getAccessTokenExpirationSeconds();

    this.logger.debug(`Generated tokens for user ${user.id}, session ${sessionId}`);
    
    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Generates JWT access token
   */
  async generateAccessToken(user: User, sessionId: string, permissions: string[] = []): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.getAccessTokenExpirationSeconds();

    const payload: AccessTokenPayload = {
      sub: user.id,
      telegram_id: user.telegramId,
      email: user.email || undefined,
      role: user.role,
      subscription_plan: user.subscriptionPlan,
      permissions,
      session_id: sessionId,
      iat: now,
      exp: now + expiresIn,
      iss: 'gongbu.app',
      aud: 'gongbu-api',
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generates refresh token
   */
  async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.getRefreshTokenExpirationSeconds();

    const payload: RefreshTokenPayload = {
      sub: userId,
      session_id: sessionId,
      type: 'refresh',
      iat: now,
      exp: now + expiresIn,
      iss: 'gongbu.app',
      aud: 'gongbu-api',
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validates and decodes access token
   */
  async validateAccessToken(token: string): Promise<UserContext> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      
      if (!payload.sub || !payload.session_id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Check if token is not expired (additional safety check)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new UnauthorizedException('Token expired');
      }

      const userContext: UserContext = {
        userId: payload.sub,
        telegramId: payload.telegram_id,
        email: payload.email,
        role: payload.role,
        subscriptionPlan: payload.subscription_plan,
        permissions: payload.permissions || [],
        sessionId: payload.session_id,
      };

      this.logger.debug(`Validated access token for user: ${userContext.userId}`);
      return userContext;
    } catch (error) {
      this.logger.error('Access token validation failed', error);
      
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (error.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active');
      }
      
      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Validates and decodes refresh token
   */
  async validateRefreshToken(token: string): Promise<{ userId: string; sessionId: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token);
      
      if (!payload.sub || !payload.session_id || payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      // Check if token is not expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new UnauthorizedException('Refresh token expired');
      }

      this.logger.debug(`Validated refresh token for user: ${payload.sub}`);
      return {
        userId: payload.sub,
        sessionId: payload.session_id,
      };
    } catch (error) {
      this.logger.error('Refresh token validation failed', error);
      
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generates a secure random session ID
   */
  generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Extracts token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Creates token for internal service-to-service communication
   */
  async generateServiceToken(serviceName: string, permissions: string[] = []): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour for service tokens

    const payload = {
      sub: `service:${serviceName}`,
      type: 'service',
      permissions,
      iat: now,
      exp: now + expiresIn,
      iss: 'gongbu.app',
      aud: 'gongbu-internal',
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validates service token for internal API calls
   */
  async validateServiceToken(token: string): Promise<{ serviceName: string; permissions: string[] }> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      if (!payload.sub?.startsWith('service:') || payload.type !== 'service') {
        throw new UnauthorizedException('Invalid service token');
      }

      return {
        serviceName: payload.sub.substring(8), // Remove 'service:' prefix
        permissions: payload.permissions || [],
      };
    } catch (error) {
      this.logger.error('Service token validation failed', error);
      throw new UnauthorizedException('Invalid service token');
    }
  }

  /**
   * Get access token expiration time in seconds
   */
  private getAccessTokenExpirationSeconds(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    return this.parseExpirationTime(expiresIn);
  }

  /**
   * Get refresh token expiration time in seconds
   */
  private getRefreshTokenExpirationSeconds(): number {
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '30d');
    return this.parseExpirationTime(expiresIn);
  }

  /**
   * Parse expiration time string (e.g., '15m', '1h', '30d') to seconds
   */
  private parseExpirationTime(timeString: string): number {
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration time format: ${timeString}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}
