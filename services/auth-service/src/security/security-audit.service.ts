import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface SecurityEvent {
  type: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY' | '2FA_ENABLED' | '2FA_DISABLED' | 'ROLE_CHANGE' | 'PASSWORD_CHANGE';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
}

@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await this.prisma.securityAuditLog.create({
        data: {
          type: event.type,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: event.details,
          severity: event.severity,
          timestamp: event.timestamp,
        },
      });

      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(event);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get security events for user
   */
  async getUserSecurityEvents(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return await this.prisma.securityAuditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get security events by type
   */
  async getSecurityEventsByType(
    type: string,
    limit: number = 100
  ): Promise<any[]> {
    return await this.prisma.securityAuditLog.findMany({
      where: { type },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get high severity events
   */
  async getHighSeverityEvents(limit: number = 50): Promise<any[]> {
    return await this.prisma.securityAuditLog.findMany({
      where: {
        severity: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get failed login attempts
   */
  async getFailedLoginAttempts(
    ipAddress?: string,
    userId?: string,
    hours: number = 24
  ): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await this.prisma.securityAuditLog.findMany({
      where: {
        type: 'LOGIN_FAILURE',
        ...(ipAddress && { ipAddress }),
        ...(userId && { userId }),
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Check for brute force attacks
   */
  async detectBruteForceAttack(ipAddress: string): Promise<boolean> {
    const recentFailures = await this.getFailedLoginAttempts(ipAddress, undefined, 1);
    return recentFailures.length >= 5; // 5 failed attempts in 1 hour
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(days: number = 7): Promise<{
    totalEvents: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousActivities: number;
    highSeverityEvents: number;
    uniqueIPs: number;
    topIPs: { ip: string; count: number }[];
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      failedLogins,
      successfulLogins,
      suspiciousActivities,
      highSeverityEvents,
      ipStats,
    ] = await Promise.all([
      this.prisma.securityAuditLog.count({
        where: { timestamp: { gte: since } },
      }),
      this.prisma.securityAuditLog.count({
        where: { 
          type: 'LOGIN_FAILURE',
          timestamp: { gte: since },
        },
      }),
      this.prisma.securityAuditLog.count({
        where: { 
          type: 'LOGIN_SUCCESS',
          timestamp: { gte: since },
        },
      }),
      this.prisma.securityAuditLog.count({
        where: { 
          type: 'SUSPICIOUS_ACTIVITY',
          timestamp: { gte: since },
        },
      }),
      this.prisma.securityAuditLog.count({
        where: { 
          severity: { in: ['HIGH', 'CRITICAL'] },
          timestamp: { gte: since },
        },
      }),
      this.prisma.securityAuditLog.groupBy({
        by: ['ipAddress'],
        where: { timestamp: { gte: since } },
        _count: { ipAddress: true },
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      failedLogins,
      successfulLogins,
      suspiciousActivities,
      highSeverityEvents,
      uniqueIPs: ipStats.length,
      topIPs: ipStats.map(stat => ({
        ip: stat.ipAddress,
        count: stat._count.ipAddress,
      })),
    };
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    await this.prisma.securityAuditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  }

  /**
   * Export security logs
   */
  async exportSecurityLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await this.prisma.securityAuditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  private async checkSuspiciousPatterns(event: SecurityEvent): Promise<void> {
    // Check for multiple failed logins from same IP
    if (event.type === 'LOGIN_FAILURE') {
      const isBruteForce = await this.detectBruteForceAttack(event.ipAddress);
      if (isBruteForce) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: {
            reason: 'Brute force attack detected',
            originalEvent: event.type,
          },
          severity: 'HIGH',
          timestamp: new Date(),
        });
      }
    }

    // Check for multiple IPs for same user
    if (event.type === 'LOGIN_SUCCESS' && event.userId) {
      const recentLogins = await this.prisma.securityAuditLog.findMany({
        where: {
          userId: event.userId,
          type: 'LOGIN_SUCCESS',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress));
      if (uniqueIPs.size > 3) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: {
            reason: 'Multiple IP addresses for user',
            ipCount: uniqueIPs.size,
          },
          severity: 'MEDIUM',
          timestamp: new Date(),
        });
      }
    }
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) {
      return '';
    }

    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(log => 
      Object.values(log).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}
