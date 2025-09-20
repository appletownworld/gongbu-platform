import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User, UserSession } from '@prisma/client';
import { TelegramOAuthService, TelegramWebAppInitData } from './telegram-oauth.service';
import { TelegramHmacValidatorService } from './telegram-hmac-validator.service';
import { JwtTokenService, TokenPair } from './jwt-token.service';
import { UserService, CreateUserFromTelegramData } from '../users/user.service';
import { UserRepository, CreateSessionData } from '../users/user.repository';

export interface LoginResult {
  user: {
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role: string;
    subscriptionPlan: string;
  };
  tokens: TokenPair;
}

export interface RefreshResult {
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly telegramOAuth: TelegramOAuthService,
    private readonly telegramHmacValidator: TelegramHmacValidatorService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Authenticates user with Telegram WebApp data
   */
  async loginWithTelegram(
    initData: string,
    deviceInfo?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    this.logger.debug('Processing Telegram login');

    try {
      // Step 1: Validate Telegram WebApp data
      const telegramData = this.telegramOAuth.validateWebAppData(initData);
      
      if (!telegramData.user) {
        throw new UnauthorizedException('No user data in Telegram init data');
      }

      // Step 2: Extract user info
      const userInfo = this.telegramOAuth.extractUserInfo(telegramData);

      // Step 3: Create or update user
      const userData: CreateUserFromTelegramData = {
        telegramId: userInfo.telegramId,
        username: userInfo.username,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        photoUrl: userInfo.photoUrl,
        authDate: userInfo.authDate,
      };

      const user = await this.userService.authenticateOrCreateUser(userData);

      // Step 4: Check if user is active
      if (user.status === 'BANNED') {
        throw new UnauthorizedException('User account is banned');
      }

      if (user.status === 'INACTIVE') {
        throw new UnauthorizedException('User account is inactive');
      }

      // Step 5: Generate session and tokens
      const sessionId = this.jwtTokenService.generateSessionId();
      const permissions = this.userService.getUserPermissions(user);
      const tokens = await this.jwtTokenService.generateTokenPair(user, sessionId, permissions);

      // Step 6: Create session record
      const sessionData: CreateSessionData = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        deviceInfo: deviceInfo || {},
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await this.userRepository.createSession(sessionData);

      // Step 7: Prepare response
      const result: LoginResult = {
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          username: user.username || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          email: user.email || undefined,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
        },
        tokens,
      };

      this.logger.debug(`Successfully authenticated user: ${user.id}`);
      return result;
    } catch (error) {
      this.logger.error('Telegram login failed', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Authentication failed');
    }
  }

  /**
   * Refreshes access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RefreshResult> {
    this.logger.debug('Processing token refresh');

    try {
      // Step 1: Validate refresh token
      const tokenData = await this.jwtTokenService.validateRefreshToken(refreshToken);

      // Step 2: Find and validate session
      const session = await this.userRepository.findSessionByRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await this.userRepository.deleteSession(session.id);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Step 3: Get user data
      const user = await this.userRepository.findById(session.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Step 4: Check user status
      if (user.status === 'BANNED' || user.status === 'INACTIVE') {
        // Delete session for banned/inactive users
        await this.userRepository.deleteSession(session.id);
        throw new UnauthorizedException('User account is not active');
      }

      // Step 5: Generate new tokens
      const permissions = this.userService.getUserPermissions(user);
      const tokens = await this.jwtTokenService.generateTokenPair(
        user, 
        session.id, 
        permissions
      );

      // Step 6: Update session with new refresh token
      await this.userRepository.deleteSession(session.id);
      const newSessionData: CreateSessionData = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
      await this.userRepository.createSession(newSessionData);

      this.logger.debug(`Successfully refreshed tokens for user: ${user.id}`);
      return { tokens };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Token refresh failed');
    }
  }

  /**
   * Logs out user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    this.logger.debug('Processing logout');

    try {
      const session = await this.userRepository.findSessionByRefreshToken(refreshToken);
      if (session) {
        await this.userRepository.deleteSession(session.id);
        this.logger.debug(`Successfully logged out user: ${session.userId}`);
      }
    } catch (error) {
      this.logger.error('Logout failed', error);
      // Don't throw error on logout failure - it's not critical
    }
  }

  /**
   * Logs out user from all sessions
   */
  async logoutAll(userId: string): Promise<void> {
    this.logger.debug(`Logging out user from all sessions: ${userId}`);

    try {
      await this.userRepository.deleteAllUserSessions(userId);
      this.logger.debug(`Successfully logged out user from all sessions: ${userId}`);
    } catch (error) {
      this.logger.error('Logout all failed', error);
      throw new BadRequestException('Failed to logout from all sessions');
    }
  }

  /**
   * Validates access token and returns user context
   */
  async validateAccessToken(token: string) {
    return this.jwtTokenService.validateAccessToken(token);
  }

  /**
   * Validates user session
   */
  async validateSession(sessionId: string): Promise<User | null> {
    try {
      const session = await this.userRepository.findSessionByRefreshToken(sessionId);
      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Update last used time
      await this.userRepository.updateSessionLastUsed(session.id);

      return this.userRepository.findById(session.userId);
    } catch (error) {
      this.logger.error('Session validation failed', error);
      return null;
    }
  }

  /**
   * Gets user's active sessions
   */
  async getUserActiveSessions(userId: string): Promise<Array<{
    id: string;
    deviceInfo: any;
    ipAddress?: string;
    userAgent?: string;
    lastUsedAt: Date;
    createdAt: Date;
    expiresAt: Date;
  }>> {
    // This would require a new method in UserRepository
    // For now, return empty array
    return [];
  }

  /**
   * Revokes a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    this.logger.debug(`Revoking session ${sessionId} for user ${userId}`);

    try {
      await this.userRepository.deleteSession(sessionId);
      this.logger.debug(`Successfully revoked session: ${sessionId}`);
    } catch (error) {
      this.logger.error('Session revocation failed', error);
      throw new BadRequestException('Failed to revoke session');
    }
  }

  /**
   * Generates service token for internal API calls
   */
  async generateServiceToken(serviceName: string, permissions: string[] = []): Promise<string> {
    return this.jwtTokenService.generateServiceToken(serviceName, permissions);
  }

  /**
   * Validates service token
   */
  async validateServiceToken(token: string) {
    return this.jwtTokenService.validateServiceToken(token);
  }

  /**
   * Authenticates or creates user with Telegram WebApp initData (with HMAC validation)
   */
  async authenticateOrCreateTelegramUser(
    initData: string,
    deviceInfo?: any,
    ipAddress?: string
  ): Promise<LoginResult> {
    this.logger.debug('Authenticating user with Telegram WebApp initData');

    try {
      // Step 1: Validate Telegram WebApp initData with HMAC
      const validatedData = this.telegramHmacValidator.validateInitDataSafe(initData);
      
      if (!validatedData || !validatedData.user) {
        throw new UnauthorizedException('Invalid Telegram WebApp data or HMAC validation failed');
      }

      // Step 2: Extract user info from validated data
      const telegramUser = validatedData.user;
      const userData: CreateUserFromTelegramData = {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        authDate: validatedData.auth_date,
      };

      // Step 3: Create or update user
      const user = await this.userService.authenticateOrCreateUser(userData);

      // Step 4: Check if user is active
      if (user.status === 'BANNED') {
        throw new UnauthorizedException('User account is banned');
      }

      if (user.status === 'INACTIVE') {
        throw new UnauthorizedException('User account is inactive');
      }

      // Step 5: Generate session and tokens
      const sessionId = this.jwtTokenService.generateSessionId();
      const permissions = this.userService.getUserPermissions(user);
      const tokens = await this.jwtTokenService.generateTokenPair(user, sessionId, permissions);

      // Step 6: Create session record
      const sessionData: CreateSessionData = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        deviceInfo: deviceInfo || {},
        ipAddress,
        userAgent: deviceInfo?.userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await this.userRepository.createSession(sessionData);

      // Step 7: Prepare response
      const result: LoginResult = {
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          username: user.username || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          email: user.email || undefined,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
        },
        tokens,
      };

      this.logger.debug(`Successfully authenticated Telegram user: ${user.id}`);
      return result;
    } catch (error) {
      this.logger.error('Telegram WebApp authentication failed', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Telegram WebApp authentication failed');
    }
  }

  /**
   * Legacy method for backward compatibility (without HMAC validation)
   */
  async authenticateOrCreateTelegramUserLegacy(userData: CreateUserFromTelegramData): Promise<LoginResult> {
    this.logger.debug('Legacy Telegram authentication (without HMAC validation)');

    try {
      const user = await this.userService.authenticateOrCreateUser(userData);

      if (user.status === 'BANNED') {
        throw new UnauthorizedException('User account is banned');
      }

      if (user.status === 'INACTIVE') {
        throw new UnauthorizedException('User account is inactive');
      }

      const sessionId = this.jwtTokenService.generateSessionId();
      const permissions = this.userService.getUserPermissions(user);
      const tokens = await this.jwtTokenService.generateTokenPair(user, sessionId, permissions);

      const sessionData: CreateSessionData = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        deviceInfo: {},
        ipAddress: undefined,
        userAgent: undefined,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await this.userRepository.createSession(sessionData);

      const result: LoginResult = {
        user: {
          id: user.id,
          telegramId: user.telegramId.toString(),
          username: user.username || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          email: user.email || undefined,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
        },
        tokens,
      };

      return result;
    } catch (error) {
      this.logger.error('Legacy Telegram authentication failed', error);
      throw new BadRequestException('Authentication failed');
    }
  }

  /**
   * Cleanup expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    this.logger.debug('Cleaning up expired sessions');
    
    try {
      const deletedCount = await this.userRepository.cleanupExpiredSessions();
      this.logger.debug(`Cleaned up ${deletedCount} expired sessions`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Session cleanup failed', error);
      return 0;
    }
  }
}
