import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as crypto from 'crypto';

export interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  loginTime: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

@Injectable()
export class SessionService {
  private readonly sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxSessionsPerUser = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create new session
   */
  async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ sessionId: string; expiresAt: Date }> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.sessionExpiry);

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(userId);

    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(role => role.role),
      permissions,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      ipAddress,
      userAgent,
      isActive: true,
    };

    // Store session in Redis
    await this.redisService.setex(
      `session:${sessionId}`,
      Math.floor(this.sessionExpiry / 1000),
      JSON.stringify(sessionData)
    );

    // Store session in database for audit
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        ipAddress,
        userAgent,
        expiresAt,
        isActive: true,
        createdAt: new Date(),
      },
    });

    // Clean up old sessions for this user
    await this.cleanupOldSessions(userId);

    return { sessionId, expiresAt };
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionData = await this.redisService.get(`session:${sessionId}`);
      
      if (!sessionData) {
        return null;
      }

      const session: SessionData = JSON.parse(sessionData);
      
      // Check if session is still active
      if (!session.isActive) {
        return null;
      }

      // Update last activity
      session.lastActivity = Date.now();
      await this.redisService.setex(
        `session:${sessionId}`,
        Math.floor(this.sessionExpiry / 1000),
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(sessionId: string): Promise<{ expiresAt: Date } | null> {
    const sessionData = await this.validateSession(sessionId);
    
    if (!sessionData) {
      return null;
    }

    const newExpiresAt = new Date(Date.now() + this.sessionExpiry);
    
    // Update session expiry in Redis
    await this.redisService.setex(
      `session:${sessionId}`,
      Math.floor(this.sessionExpiry / 1000),
      JSON.stringify(sessionData)
    );

    // Update session expiry in database
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiresAt },
    });

    return { expiresAt: newExpiresAt };
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<void> {
    // Remove from Redis
    await this.redisService.del(`session:${sessionId}`);

    // Mark as inactive in database
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { 
        isActive: false,
        destroyedAt: new Date(),
      },
    });
  }

  /**
   * Destroy all sessions for user
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    // Get all active sessions for user
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Destroy each session
    for (const session of sessions) {
      await this.destroySession(session.id);
    }
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<any[]> {
    return await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        lastActivity: true,
      },
    });
  }

  /**
   * Check for suspicious session activity
   */
  async checkSuspiciousActivity(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    const recentSessions = await this.prisma.session.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // Check for multiple IP addresses
    const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));
    if (uniqueIPs.size > 3) {
      return {
        isSuspicious: true,
        reason: 'Multiple IP addresses detected',
      };
    }

    // Check for multiple user agents
    const uniqueUserAgents = new Set(recentSessions.map(s => s.userAgent));
    if (uniqueUserAgents.size > 2) {
      return {
        isSuspicious: true,
        reason: 'Multiple user agents detected',
      };
    }

    // Check for rapid session creation
    const recentSessionCount = recentSessions.filter(
      s => s.createdAt > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length;

    if (recentSessionCount > 5) {
      return {
        isSuspicious: true,
        reason: 'Rapid session creation detected',
      };
    }

    return { isSuspicious: false };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions = await this.prisma.session.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
      },
    });

    for (const session of expiredSessions) {
      await this.destroySession(session.id);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    averageSessionsPerUser: number;
  }> {
    const activeSessions = await this.prisma.session.count({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    const uniqueUsers = await this.prisma.session.groupBy({
      by: ['userId'],
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return {
      totalActiveSessions: activeSessions,
      totalUsers: uniqueUsers.length,
      averageSessionsPerUser: uniqueUsers.length > 0 ? activeSessions / uniqueUsers.length : 0,
    };
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    // This would typically call the RBAC service
    // For now, return empty array
    return [];
  }

  private async cleanupOldSessions(userId: string): Promise<void> {
    const userSessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (userSessions.length > this.maxSessionsPerUser) {
      const sessionsToDestroy = userSessions.slice(this.maxSessionsPerUser);
      
      for (const session of sessionsToDestroy) {
        await this.destroySession(session.id);
      }
    }
  }
}
