import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { TelegramOAuthService } from './telegram-oauth.service';
import { JwtTokenService } from './jwt-token.service';
import { UserService } from '../users/user.service';
import { UserRepository } from '../users/user.repository';
import { UserRole, UserStatus, SubscriptionPlan } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let telegramOAuth: jest.Mocked<TelegramOAuthService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let userService: jest.Mocked<UserService>;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    telegramId: BigInt(123456789),
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: null,
    phone: null,
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    isVerified: false,
    subscriptionPlan: SubscriptionPlan.FREE,
    subscriptionExpiresAt: null,
    language: 'en',
    timezone: 'UTC',
    notificationPrefs: {},
    loginCount: 1,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTelegramData = {
    user: {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      photo_url: 'https://example.com/photo.jpg',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    },
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'valid_hash',
  };

  const mockTokenPair = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    expiresIn: 900,
    tokenType: 'Bearer',
  };

  beforeEach(async () => {
    const mockTelegramOAuthService = {
      validateWebAppData: jest.fn(),
      extractUserInfo: jest.fn(),
    };

    const mockJwtTokenService = {
      generateTokenPair: jest.fn(),
      generateSessionId: jest.fn(),
      validateRefreshToken: jest.fn(),
    };

    const mockUserService = {
      authenticateOrCreateUser: jest.fn(),
      getUserPermissions: jest.fn(),
    };

    const mockUserRepository = {
      createSession: jest.fn(),
      findSessionByRefreshToken: jest.fn(),
      findById: jest.fn(),
      deleteSession: jest.fn(),
      deleteAllUserSessions: jest.fn(),
      cleanupExpiredSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TelegramOAuthService,
          useValue: mockTelegramOAuthService,
        },
        {
          provide: JwtTokenService,
          useValue: mockJwtTokenService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    telegramOAuth = module.get(TelegramOAuthService);
    jwtTokenService = module.get(JwtTokenService);
    userService = module.get(UserService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithTelegram', () => {
    it('should successfully login with valid Telegram data', async () => {
      // Arrange
      const initData = 'user=%7B%22id%22%3A123456789%7D&auth_date=1640995200&hash=valid_hash';
      const userInfo = {
        telegramId: 123456789,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        photoUrl: 'https://example.com/photo.jpg',
        authDate: new Date(),
      };
      const sessionId = 'session_123';

      telegramOAuth.validateWebAppData.mockReturnValue(mockTelegramData);
      telegramOAuth.extractUserInfo.mockReturnValue(userInfo);
      userService.authenticateOrCreateUser.mockResolvedValue(mockUser);
      userService.getUserPermissions.mockReturnValue(['user:read', 'user:update']);
      jwtTokenService.generateSessionId.mockReturnValue(sessionId);
      jwtTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      userRepository.createSession.mockResolvedValue({
        id: sessionId,
        userId: mockUser.id,
        refreshToken: mockTokenPair.refreshToken,
        deviceInfo: {},
        ipAddress: undefined,
        userAgent: undefined,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastUsedAt: new Date(),
      });

      // Act
      const result = await service.loginWithTelegram(initData);

      // Assert
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          telegramId: mockUser.telegramId.toString(),
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          role: mockUser.role,
          subscriptionPlan: mockUser.subscriptionPlan,
        },
        tokens: mockTokenPair,
      });

      expect(telegramOAuth.validateWebAppData).toHaveBeenCalledWith(initData);
      expect(userService.authenticateOrCreateUser).toHaveBeenCalledWith(userInfo);
      expect(jwtTokenService.generateTokenPair).toHaveBeenCalledWith(
        mockUser,
        sessionId,
        ['user:read', 'user:update']
      );
    });

    it('should throw UnauthorizedException for banned user', async () => {
      // Arrange
      const initData = 'user=%7B%22id%22%3A123456789%7D&auth_date=1640995200&hash=valid_hash';
      const bannedUser = { ...mockUser, status: UserStatus.BANNED };
      
      telegramOAuth.validateWebAppData.mockReturnValue(mockTelegramData);
      telegramOAuth.extractUserInfo.mockReturnValue({
        telegramId: 123456789,
        firstName: 'Test',
        authDate: new Date(),
      });
      userService.authenticateOrCreateUser.mockResolvedValue(bannedUser);

      // Act & Assert
      await expect(service.loginWithTelegram(initData)).rejects.toThrow(
        new UnauthorizedException('User account is banned')
      );
    });

    it('should throw UnauthorizedException for invalid Telegram data', async () => {
      // Arrange
      const initData = 'invalid_data';
      
      telegramOAuth.validateWebAppData.mockImplementation(() => {
        throw new UnauthorizedException('Invalid Telegram data');
      });

      // Act & Assert
      await expect(service.loginWithTelegram(initData)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid_refresh_token';
      const sessionData = {
        userId: mockUser.id,
        sessionId: 'session_123',
      };
      const mockSession = {
        id: 'session_123',
        userId: mockUser.id,
        refreshToken,
        deviceInfo: {},
        ipAddress: null,
        userAgent: null,
        expiresAt: new Date(Date.now() + 1000000),
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      jwtTokenService.validateRefreshToken.mockResolvedValue(sessionData);
      userRepository.findSessionByRefreshToken.mockResolvedValue(mockSession);
      userRepository.findById.mockResolvedValue(mockUser);
      userService.getUserPermissions.mockReturnValue(['user:read', 'user:update']);
      jwtTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      userRepository.deleteSession.mockResolvedValue();
      userRepository.createSession.mockResolvedValue(mockSession);

      // Act
      const result = await service.refreshTokens(refreshToken);

      // Assert
      expect(result).toEqual({ tokens: mockTokenPair });
      expect(jwtTokenService.validateRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(userRepository.findSessionByRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      // Arrange
      const refreshToken = 'expired_refresh_token';
      const expiredSession = {
        id: 'session_123',
        userId: mockUser.id,
        refreshToken,
        deviceInfo: {},
        ipAddress: null,
        userAgent: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      jwtTokenService.validateRefreshToken.mockResolvedValue({
        userId: mockUser.id,
        sessionId: 'session_123',
      });
      userRepository.findSessionByRefreshToken.mockResolvedValue(expiredSession);
      userRepository.deleteSession.mockResolvedValue();

      // Act & Assert
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token expired')
      );

      expect(userRepository.deleteSession).toHaveBeenCalledWith(expiredSession.id);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const refreshToken = 'valid_refresh_token';
      const mockSession = {
        id: 'session_123',
        userId: mockUser.id,
        refreshToken,
        deviceInfo: {},
        ipAddress: null,
        userAgent: null,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      userRepository.findSessionByRefreshToken.mockResolvedValue(mockSession);
      userRepository.deleteSession.mockResolvedValue();

      // Act
      await service.logout(refreshToken);

      // Assert
      expect(userRepository.findSessionByRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(userRepository.deleteSession).toHaveBeenCalledWith(mockSession.id);
    });

    it('should not throw error if session not found', async () => {
      // Arrange
      const refreshToken = 'invalid_refresh_token';
      
      userRepository.findSessionByRefreshToken.mockResolvedValue(null);

      // Act & Assert
      await expect(service.logout(refreshToken)).resolves.not.toThrow();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      // Arrange
      const deletedCount = 5;
      userRepository.cleanupExpiredSessions.mockResolvedValue(deletedCount);

      // Act
      const result = await service.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(deletedCount);
      expect(userRepository.cleanupExpiredSessions).toHaveBeenCalled();
    });
  });
});
