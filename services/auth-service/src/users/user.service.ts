import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { User, UserRole, UserStatus, SubscriptionPlan } from '@prisma/client';
import { UserRepository, CreateUserData, UpdateUserData, FindUsersOptions, PaginatedUsers } from './user.repository';

export interface CreateUserFromTelegramData {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  authDate: number;
}

export interface UserProfile {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date;
  language: string;
  timezone: string;
  lastLoginAt?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Creates or updates user from Telegram OAuth data
   */
  async authenticateOrCreateUser(telegramData: CreateUserFromTelegramData): Promise<User> {
    this.logger.debug(`Authenticating user with Telegram ID: ${telegramData.telegramId}`);

    // Try to find existing user
    let user = await this.userRepository.findByTelegramId(telegramData.telegramId);

    if (user) {
      // Update existing user with fresh Telegram data
      user = await this.userRepository.update(user.id, {
        username: telegramData.username,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName,
        avatarUrl: telegramData.photoUrl,
        lastLoginAt: telegramData.authDate,
      });

      // Update login info
      await this.userRepository.updateLoginInfo(user.id);
      
      this.logger.debug(`Updated existing user: ${user.id}`);
    } else {
      // Create new user
      const userData: CreateUserData = {
        telegramId: telegramData.telegramId,
        username: telegramData.username,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName,
        avatarUrl: telegramData.photoUrl,
        role: UserRole.STUDENT, // Default role
      };

      user = await this.userRepository.create(userData);
      this.logger.debug(`Created new user: ${user.id}`);
    }

    return user;
  }

  /**
   * Gets user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.mapUserToProfile(user);
  }

  /**
   * Gets user by Telegram ID
   */
  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.userRepository.findByTelegramId(telegramId);
  }

  /**
   * Gets user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Updates user profile
   */
  async updateUserProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    language?: string;
    timezone?: string;
    notificationPreferences?: any;
  }): Promise<UserProfile> {
    this.logger.debug(`Updating profile for user: ${userId}`);

    // Validate email if provided
    if (updateData.email) {
      const existingUser = await this.userRepository.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    const updatePayload: UpdateUserData = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      phone: updateData.phone,
      language: updateData.language,
      timezone: updateData.timezone,
      notificationPrefs: updateData.notificationPreferences,
    };

    const updatedUser = await this.userRepository.update(userId, updatePayload);
    return this.mapUserToProfile(updatedUser);
  }

  /**
   * Updates user role (admin only)
   */
  async updateUserRole(userId: string, newRole: UserRole, adminUserId: string): Promise<UserProfile> {
    this.logger.debug(`Updating role for user ${userId} to ${newRole} by admin ${adminUserId}`);

    // Verify admin exists and has admin role
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can update user roles');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent removing the last admin
    if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await this.countUsersByRole(UserRole.ADMIN);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin user');
      }
    }

    const updatedUser = await this.userRepository.update(userId, { role: newRole });
    return this.mapUserToProfile(updatedUser);
  }

  /**
   * Updates user subscription
   */
  async updateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    expiresAt?: Date,
  ): Promise<UserProfile> {
    this.logger.debug(`Updating subscription for user ${userId} to ${plan}`);

    const updatedUser = await this.userRepository.updateSubscription(userId, plan, expiresAt);
    return this.mapUserToProfile(updatedUser);
  }

  /**
   * Bans a user
   */
  async banUser(userId: string, reason?: string, adminUserId?: string): Promise<UserProfile> {
    this.logger.debug(`Banning user ${userId}, reason: ${reason}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot ban admin users');
    }

    const updatedUser = await this.userRepository.banUser(userId, reason);
    
    // Delete all user sessions to force logout
    await this.userRepository.deleteAllUserSessions(userId);
    
    return this.mapUserToProfile(updatedUser);
  }

  /**
   * Unbans a user
   */
  async unbanUser(userId: string, adminUserId?: string): Promise<UserProfile> {
    this.logger.debug(`Unbanning user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.userRepository.unbanUser(userId);
    return this.mapUserToProfile(updatedUser);
  }

  /**
   * Gets paginated list of users (admin only)
   */
  async getUsers(options: FindUsersOptions, adminUserId: string): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    pages: number;
  }> {
    // Verify admin permissions
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can list users');
    }

    const result = await this.userRepository.findMany(options);
    
    return {
      users: result.users.map(user => this.mapUserToProfile(user)),
      total: result.total,
      page: result.page,
      pages: result.pages,
    };
  }

  /**
   * Gets user statistics (admin only)
   */
  async getUserStatistics(adminUserId: string) {
    // Verify admin permissions
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can view user statistics');
    }

    return this.userRepository.getUserStats();
  }

  /**
   * Soft deletes a user account
   */
  async deleteUserAccount(userId: string): Promise<void> {
    this.logger.debug(`Soft deleting user account: ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Delete all user sessions
    await this.userRepository.deleteAllUserSessions(userId);
    
    // Soft delete the user
    await this.userRepository.softDelete(userId);
    
    this.logger.debug(`Successfully deleted user account: ${userId}`);
  }

  /**
   * Validates if user has required permissions
   */
  hasPermission(user: User, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.STUDENT]: 0,
      [UserRole.CREATOR]: 1,
      [UserRole.ADMIN]: 2,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Checks if user subscription is active
   */
  isSubscriptionActive(user: User): boolean {
    if (user.subscriptionPlan === SubscriptionPlan.FREE) {
      return true; // Free plan is always active
    }

    if (!user.subscriptionExpiresAt) {
      return false; // Paid plans must have expiration date
    }

    return user.subscriptionExpiresAt > new Date();
  }

  /**
   * Gets user's effective permissions based on role and subscription
   */
  getUserPermissions(user: User): string[] {
    const basePermissions = ['user:read', 'user:update'];
    
    if (user.role === UserRole.CREATOR || user.role === UserRole.ADMIN) {
      basePermissions.push(
        'course:read',
        'course:create',
        'course:update',
        'course:publish',
      );
    }

    if (user.role === UserRole.ADMIN) {
      basePermissions.push(
        'admin:users',
        'admin:courses',
        'admin:analytics',
        'admin:system',
      );
    }

    // Add subscription-based permissions
    if (this.isSubscriptionActive(user)) {
      if (user.subscriptionPlan === SubscriptionPlan.PROFESSIONAL) {
        basePermissions.push('analytics:advanced', 'support:priority');
      } else if (user.subscriptionPlan === SubscriptionPlan.ENTERPRISE) {
        basePermissions.push(
          'analytics:advanced',
          'analytics:export',
          'support:priority',
          'api:access',
          'whitelabel:enabled',
        );
      }
    }

    return basePermissions;
  }

  /**
   * Counts users by role
   */
  private async countUsersByRole(role: UserRole): Promise<number> {
    const stats = await this.userRepository.getUserStats();
    return stats.usersByRole[role] || 0;
  }

  /**
   * Maps User entity to UserProfile DTO
   */
  private mapUserToProfile(user: User): UserProfile {
    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      email: user.email || undefined,
      phone: user.phone || undefined,
      avatarUrl: user.avatarUrl || undefined,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt || undefined,
      language: user.language,
      timezone: user.timezone,
      lastLoginAt: user.lastLoginAt || undefined,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
