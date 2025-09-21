import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Course permissions
  COURSE_READ = 'course:read',
  COURSE_WRITE = 'course:write',
  COURSE_DELETE = 'course:delete',
  COURSE_PUBLISH = 'course:publish',
  
  // Bot permissions
  BOT_READ = 'bot:read',
  BOT_WRITE = 'bot:write',
  BOT_DELETE = 'bot:delete',
  BOT_MANAGE = 'bot:manage',
  
  // Payment permissions
  PAYMENT_READ = 'payment:read',
  PAYMENT_WRITE = 'payment:write',
  PAYMENT_REFUND = 'payment:refund',
  
  // Analytics permissions
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Admin permissions
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',
  ADMIN_SYSTEM = 'admin:system',
}

export enum Role {
  STUDENT = 'STUDENT',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface RolePermissions {
  [Role.STUDENT]: Permission[];
  [Role.CREATOR]: Permission[];
  [Role.ADMIN]: Permission[];
  [Role.SUPER_ADMIN]: Permission[];
}

@Injectable()
export class RbacService {
  private readonly rolePermissions: RolePermissions = {
    [Role.STUDENT]: [
      Permission.USER_READ,
      Permission.COURSE_READ,
      Permission.BOT_READ,
    ],
    [Role.CREATOR]: [
      Permission.USER_READ,
      Permission.USER_WRITE,
      Permission.COURSE_READ,
      Permission.COURSE_WRITE,
      Permission.COURSE_PUBLISH,
      Permission.BOT_READ,
      Permission.BOT_WRITE,
      Permission.BOT_MANAGE,
      Permission.PAYMENT_READ,
      Permission.ANALYTICS_READ,
    ],
    [Role.ADMIN]: [
      Permission.USER_READ,
      Permission.USER_WRITE,
      Permission.USER_DELETE,
      Permission.COURSE_READ,
      Permission.COURSE_WRITE,
      Permission.COURSE_DELETE,
      Permission.COURSE_PUBLISH,
      Permission.BOT_READ,
      Permission.BOT_WRITE,
      Permission.BOT_DELETE,
      Permission.BOT_MANAGE,
      Permission.PAYMENT_READ,
      Permission.PAYMENT_WRITE,
      Permission.PAYMENT_REFUND,
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_EXPORT,
      Permission.ADMIN_READ,
      Permission.ADMIN_WRITE,
    ],
    [Role.SUPER_ADMIN]: Object.values(Permission),
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    if (!user) {
      return false;
    }

    // Check if user has the permission through any of their roles
    for (const userRole of user.roles) {
      const rolePermissions = this.rolePermissions[userRole.role as Role];
      if (rolePermissions && rolePermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(userId: string, role: Role): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    if (!user) {
      return false;
    }

    return user.roles.some(userRole => userRole.role === role);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roles: Role[]): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    if (!user) {
      return false;
    }

    return user.roles.some(userRole => roles.includes(userRole.role as Role));
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: Role, assignedBy: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user already has this role
    const existingRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role,
      },
    });

    if (existingRole) {
      throw new BadRequestException('User already has this role');
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        role,
        assignedBy,
        assignedAt: new Date(),
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, role: Role, removedBy: string): Promise<void> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role,
      },
    });

    if (!userRole) {
      throw new BadRequestException('User does not have this role');
    }

    await this.prisma.userRole.update({
      where: { id: userRole.id },
      data: {
        removedBy,
        removedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Get all roles for user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.getUserWithRoles(userId);
    if (!user) {
      return [];
    }

    return user.roles
      .filter(userRole => userRole.isActive)
      .map(userRole => userRole.role as Role);
  }

  /**
   * Get all permissions for user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);
    const permissions = new Set<Permission>();

    for (const role of roles) {
      const rolePermissions = this.rolePermissions[role];
      if (rolePermissions) {
        rolePermissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Create custom role with specific permissions
   */
  async createCustomRole(
    name: string,
    permissions: Permission[],
    createdBy: string
  ): Promise<void> {
    // Check if role already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new BadRequestException('Role already exists');
    }

    await this.prisma.role.create({
      data: {
        name,
        permissions: permissions.join(','),
        createdBy,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleName: string,
    permissions: Permission[],
    updatedBy: string
  ): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    await this.prisma.role.update({
      where: { name: roleName },
      data: {
        permissions: permissions.join(','),
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<any[]> {
    return await this.prisma.role.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get role hierarchy
   */
  getRoleHierarchy(): { [key in Role]: number } {
    return {
      [Role.STUDENT]: 1,
      [Role.CREATOR]: 2,
      [Role.ADMIN]: 3,
      [Role.SUPER_ADMIN]: 4,
    };
  }

  /**
   * Check if user can manage another user
   */
  async canManageUser(managerId: string, targetUserId: string): Promise<boolean> {
    const managerRoles = await this.getUserRoles(managerId);
    const targetRoles = await this.getUserRoles(targetUserId);

    const hierarchy = this.getRoleHierarchy();
    const managerLevel = Math.max(...managerRoles.map(role => hierarchy[role]));
    const targetLevel = Math.max(...targetRoles.map(role => hierarchy[role]));

    return managerLevel > targetLevel;
  }

  /**
   * Audit role changes
   */
  async auditRoleChange(
    userId: string,
    action: 'ASSIGN' | 'REMOVE',
    role: Role,
    performedBy: string,
    reason?: string
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `ROLE_${action}`,
        details: {
          role,
          performedBy,
          reason,
        },
        timestamp: new Date(),
      },
    });
  }

  private async getUserWithRoles(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { isActive: true },
        },
      },
    });
  }
}
