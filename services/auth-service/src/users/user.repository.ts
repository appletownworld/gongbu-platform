import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, User, UserSession, UserRole, UserStatus, SubscriptionPlan, Prisma } from '@prisma/client';

export interface CreateUserData {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: UserRole;
  language?: string;
  timezone?: string;
}

export interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: UserRole;
  status?: UserStatus;
  isVerified?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: Date | null;
  language?: string;
  timezone?: string;
  notificationPrefs?: any;
  lastLoginAt?: Date;
}

export interface CreateSessionData {
  userId: string;
  refreshToken: string;
  deviceInfo?: any;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface FindUsersOptions {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  subscriptionPlan?: SubscriptionPlan;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new user
   */
  async create(data: CreateUserData): Promise<User> {
    this.logger.debug(`Creating user with Telegram ID: ${data.telegramId}`);

    try {
      const user = await this.prisma.user.create({
        data: {
          telegramId: BigInt(data.telegramId),
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          role: data.role || UserRole.STUDENT,
          language: data.language || 'ru',
          timezone: data.timezone || 'UTC',
          loginCount: 1,
          lastLoginAt: new Date(),
        },
      });

      this.logger.debug(`Created user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          throw new Error(`User with this ${field?.[0] || 'field'} already exists`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Finds user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds user by Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { 
        telegramId: BigInt(telegramId),
        deletedAt: null,
      },
    });
  }

  /**
   * Finds user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { 
        email,
        deletedAt: null,
      },
    });
  }

  /**
   * Updates user data
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    this.logger.debug(`Updating user: ${id}`);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft deletes a user
   */
  async softDelete(id: string): Promise<User> {
    this.logger.debug(`Soft deleting user: ${id}`);

    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });
  }

  /**
   * Updates user login information
   */
  async updateLoginInfo(id: string, ipAddress?: string, userAgent?: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Finds users with pagination and filters
   */
  async findMany(options: FindUsersOptions = {}): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      subscriptionPlan,
    } = options;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status }),
      ...(subscriptionPlan && { subscriptionPlan }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Creates a user session
   */
  async createSession(data: CreateSessionData): Promise<UserSession> {
    this.logger.debug(`Creating session for user: ${data.userId}`);

    // First, clean up expired sessions for this user
    await this.cleanupExpiredSessions(data.userId);

    // Check session limit (max 5 active sessions per user)
    const activeSessions = await this.prisma.userSession.count({
      where: {
        userId: data.userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= 5) {
      // Remove oldest session
      const oldestSession = await this.prisma.userSession.findFirst({
        where: {
          userId: data.userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldestSession) {
        await this.prisma.userSession.delete({
          where: { id: oldestSession.id },
        });
      }
    }

    return this.prisma.userSession.create({
      data,
    });
  }

  /**
   * Finds session by refresh token
   */
  async findSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    return this.prisma.userSession.findUnique({
      where: { refreshToken },
    });
  }

  /**
   * Updates session last used time
   */
  async updateSessionLastUsed(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Deletes a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Deletes all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    this.logger.debug(`Deleting all sessions for user: ${userId}`);

    await this.prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  /**
   * Cleans up expired sessions
   */
  async cleanupExpiredSessions(userId?: string): Promise<number> {
    const where: Prisma.UserSessionWhereInput = {
      expiresAt: { lt: new Date() },
      ...(userId && { userId }),
    };

    const result = await this.prisma.userSession.deleteMany({ where });
    
    if (result.count > 0) {
      this.logger.debug(`Cleaned up ${result.count} expired sessions`);
    }

    return result.count;
  }

  /**
   * Gets user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    usersByRole: Record<UserRole, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers, 
      newUsersToday,
      usersByRole,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: today },
        },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const roleStats = Object.values(UserRole).reduce((acc, role) => {
      acc[role] = usersByRole.find(r => r.role === role)?._count.id || 0;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      usersByRole: roleStats,
    };
  }

  /**
   * Updates user subscription
   */
  async updateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    expiresAt?: Date,
  ): Promise<User> {
    this.logger.debug(`Updating subscription for user ${userId} to ${plan}`);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Bans a user
   */
  async banUser(userId: string, reason?: string): Promise<User> {
    this.logger.debug(`Banning user: ${userId}, reason: ${reason}`);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.BANNED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Unbans a user
   */
  async unbanUser(userId: string): Promise<User> {
    this.logger.debug(`Unbanning user: ${userId}`);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });
  }
}
