import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Headers,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import {
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  UpdateProfileDto,
  UpdateUserRoleDto,
  RevokeSessionDto,
  ServiceTokenDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  UserProfileResponseDto,
  TokenPairResponseDto,
  ServiceTokenResponseDto,
  UserSessionDto,
  UserListResponseDto,
  UserStatsResponseDto,
} from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { UserContext } from './jwt-token.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  private transformUserProfile(profile: any): UserProfileResponseDto {
    return {
      ...profile,
      subscriptionExpiresAt: profile.subscriptionExpiresAt?.toISOString(),
      lastLoginAt: profile.lastLoginAt?.toISOString(),
      createdAt: profile.createdAt?.toISOString(),
      updatedAt: profile.updatedAt?.toISOString(),
      // Add missing fields with defaults
      status: profile.status || 'ACTIVE',
      isVerified: profile.isVerified || false,
      language: profile.language || 'en',
      timezone: profile.timezone || 'UTC',
      loginCount: profile.loginCount || 0,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with Telegram WebApp data' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid authentication data' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.debug('POST /auth/login');
    
    const result = await this.authService.loginWithTelegram(
      loginDto.initData,
      loginDto.deviceInfo,
      loginDto.ipAddress,
      loginDto.userAgent,
    );

    return {
      ...result,
      user: this.transformUserProfile(result.user),
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    this.logger.debug('POST /auth/refresh');
    
    const result = await this.authService.refreshTokens(refreshDto.refreshToken);
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (invalidate refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: LogoutDto): Promise<{ message: string }> {
    this.logger.debug('POST /auth/logout');
    
    await this.authService.logout(logoutDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Logged out from all sessions' })
  @HttpCode(HttpStatus.OK)
  async logoutAll(@GetUser() user: UserContext): Promise<{ message: string }> {
    this.logger.debug('POST /auth/logout-all');
    
    await this.authService.logoutAll(user.userId);
    return { message: 'Logged out from all sessions' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserProfileResponseDto,
  })
  async getProfile(@GetUser() user: UserContext): Promise<UserProfileResponseDto> {
    this.logger.debug('GET /auth/me');
    
    const profile = await this.userService.getUserProfile(user.userId);
    return this.transformUserProfile(profile);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  async updateProfile(
    @GetUser() user: UserContext,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    this.logger.debug('PUT /auth/me');
    
    const profile = await this.userService.updateUserProfile(user.userId, updateDto);
    return this.transformUserProfile(profile);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@GetUser() user: UserContext): Promise<{ message: string }> {
    this.logger.debug('DELETE /auth/me');
    
    await this.userService.deleteUserAccount(user.userId);
    return { message: 'Account deleted successfully' };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get active user sessions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved',
    type: [UserSessionDto],
  })
  async getActiveSessions(@GetUser() user: UserContext): Promise<UserSessionDto[]> {
    this.logger.debug('GET /auth/sessions');
    
    const sessions = await this.authService.getUserActiveSessions(user.userId);
    return sessions.map(session => ({
      ...session,
      lastUsedAt: session.lastUsedAt?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
      expiresAt: session.expiresAt?.toISOString(),
    }));
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'sessionId', description: 'Session ID to revoke' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @GetUser() user: UserContext,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string }> {
    this.logger.debug(`DELETE /auth/sessions/${sessionId}`);
    
    await this.authService.revokeSession(user.userId, sessionId);
    return { message: 'Session revoked successfully' };
  }

  // Admin endpoints

  @Get('users')
  @ApiOperation({ summary: 'Get users list (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved',
    type: UserListResponseDto,
  })
  async getUsers(
    @GetUser() user: UserContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ): Promise<UserListResponseDto> {
    this.logger.debug('GET /auth/users');
    
    const result = await this.userService.getUsers(
      {
        page: page || 1,
        limit: limit || 20,
        role,
        search,
      },
      user.userId,
    );
    
    return {
      ...result,
      users: result.users.map(u => this.transformUserProfile(u)),
    };
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved',
    type: UserStatsResponseDto,
  })
  async getUserStats(@GetUser() user: UserContext): Promise<UserStatsResponseDto> {
    this.logger.debug('GET /auth/users/stats');
    
    return await this.userService.getUserStatistics(user.userId);
  }

  @Put('users/:userId/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User role updated',
    type: UserProfileResponseDto,
  })
  async updateUserRole(
    @GetUser() admin: UserContext,
    @Param('userId') userId: string,
    @Body() roleDto: UpdateUserRoleDto,
  ): Promise<UserProfileResponseDto> {
    this.logger.debug(`PUT /auth/users/${userId}/role`);
    
    const result = await this.userService.updateUserRole(userId, roleDto.role, admin.userId);
    return this.transformUserProfile(result);
  }

  @Put('users/:userId/ban')
  @ApiOperation({ summary: 'Ban user (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
    type: UserProfileResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async banUser(
    @GetUser() admin: UserContext,
    @Param('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<UserProfileResponseDto> {
    this.logger.debug(`PUT /auth/users/${userId}/ban`);
    
    const result = await this.userService.banUser(userId, reason, admin.userId);
    return this.transformUserProfile(result);
  }

  @Delete('users/:userId/ban')
  @ApiOperation({ summary: 'Unban user (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
    type: UserProfileResponseDto,
  })
  async unbanUser(
    @GetUser() admin: UserContext,
    @Param('userId') userId: string,
  ): Promise<UserProfileResponseDto> {
    this.logger.debug(`DELETE /auth/users/${userId}/ban`);
    
    const result = await this.userService.unbanUser(userId, admin.userId);
    return this.transformUserProfile(result);
  }

  // Service endpoints

  @Post('service-token')
  @ApiOperation({ summary: 'Generate service token (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Service token generated',
    type: ServiceTokenResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async generateServiceToken(
    @Body() serviceDto: ServiceTokenDto,
  ): Promise<ServiceTokenResponseDto> {
    this.logger.debug('POST /auth/service-token');
    
    const token = await this.authService.generateServiceToken(
      serviceDto.serviceName,
      serviceDto.permissions,
    );

    return {
      token,
      expiresIn: 3600, // 1 hour
    };
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate access token' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  async validateToken(@Headers('authorization') authHeader: string): Promise<{
    valid: boolean;
    user?: {
      id: string;
      telegramId: number;
      role: string;
      permissions: string[];
    };
  }> {
    this.logger.debug('GET /auth/validate');

    if (!authHeader?.startsWith('Bearer ')) {
      throw new BadRequestException('Bearer token required');
    }

    try {
      const token = authHeader.substring(7);
      const userContext = await this.authService.validateAccessToken(token);

      return {
        valid: true,
        user: {
          id: userContext.userId,
          telegramId: userContext.telegramId,
          role: userContext.role,
          permissions: userContext.permissions,
        },
      };
    } catch (error) {
      return { valid: false };
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup expired sessions (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredSessions(): Promise<{ deletedSessions: number }> {
    this.logger.debug('POST /auth/cleanup');
    
    const deletedCount = await this.authService.cleanupExpiredSessions();
    return { deletedSessions: deletedCount };
  }
}
