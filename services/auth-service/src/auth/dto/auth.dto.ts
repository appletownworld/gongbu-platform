import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested, IsEmail, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @ApiProperty({
    description: 'Telegram WebApp init data string',
    example: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%7D&auth_date=1640995200&hash=abc123...',
  })
  @IsString()
  @IsNotEmpty()
  initData: string;

  @ApiPropertyOptional({
    description: 'Device information object',
    example: { type: 'mobile', os: 'iOS', version: '15.0' },
  })
  @IsOptional()
  @IsObject()
  deviceInfo?: any;

  @ApiPropertyOptional({
    description: 'Client IP address',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token to invalidate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Language preference',
    example: 'en',
    enum: ['en', 'ru', 'ko'],
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Notification preferences',
    example: { email: true, push: false, telegram: true },
  })
  @IsOptional()
  @IsObject()
  notificationPreferences?: any;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New user role',
    enum: UserRole,
    example: UserRole.CREATOR,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class RevokeSessionDto {
  @ApiProperty({
    description: 'Session ID to revoke',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;
}

export class ServiceTokenDto {
  @ApiProperty({
    description: 'Service name',
    example: 'course-service',
  })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiPropertyOptional({
    description: 'Service permissions',
    example: ['course:read', 'course:write'],
  })
  @IsOptional()
  @IsString({ each: true })
  permissions?: string[];
}

// Response DTOs

export class UserProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123456789' })
  telegramId: string;

  @ApiPropertyOptional({ example: 'john_doe' })
  username?: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://t.me/i/userpic/320/john_doe.jpg' })
  avatarUrl?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  role: UserRole;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiProperty({ example: 'FREE' })
  subscriptionPlan: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  subscriptionExpiresAt?: string;

  @ApiProperty({ example: 'en' })
  language: string;

  @ApiProperty({ example: 'UTC' })
  timezone: string;

  @ApiPropertyOptional({ example: '2023-12-01T10:30:00.000Z' })
  lastLoginAt?: string;

  @ApiProperty({ example: 42 })
  loginCount: number;

  @ApiProperty({ example: '2023-11-15T09:20:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-12-01T10:30:00.000Z' })
  updatedAt: string;
}

export class TokenPairResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: UserProfileResponseDto })
  @Type(() => UserProfileResponseDto)
  @ValidateNested()
  user: UserProfileResponseDto;

  @ApiProperty({ type: TokenPairResponseDto })
  @Type(() => TokenPairResponseDto)
  @ValidateNested()
  tokens: TokenPairResponseDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ type: TokenPairResponseDto })
  @Type(() => TokenPairResponseDto)
  @ValidateNested()
  tokens: TokenPairResponseDto;
}

export class ServiceTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ example: 3600 })
  expiresIn: number;
}

export class UserSessionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: { type: 'mobile', os: 'iOS' } })
  deviceInfo: any;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  userAgent?: string;

  @ApiProperty({ example: '2023-12-01T10:30:00.000Z' })
  lastUsedAt: string;

  @ApiProperty({ example: '2023-11-15T09:20:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-12-15T09:20:00.000Z' })
  expiresAt: string;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserProfileResponseDto] })
  @Type(() => UserProfileResponseDto)
  @ValidateNested({ each: true })
  users: UserProfileResponseDto[];

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 8 })
  pages: number;
}

export class UserStatsResponseDto {
  @ApiProperty({ example: 1500 })
  totalUsers: number;

  @ApiProperty({ example: 1200 })
  activeUsers: number;

  @ApiProperty({ example: 25 })
  newUsersToday: number;

  @ApiProperty({ 
    example: { STUDENT: 1200, CREATOR: 250, ADMIN: 50 },
    description: 'User count by role',
  })
  usersByRole: Record<string, number>;
}
