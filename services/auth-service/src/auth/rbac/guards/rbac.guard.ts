import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService, Permission, Role } from '../rbac.service';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

export const RequirePermissions = (...permissions: Permission[]) =>
  Reflector.createDecorator<Permission[]>(PERMISSIONS_KEY, permissions);

export const RequireRoles = (...roles: Role[]) =>
  Reflector.createDecorator<Role[]>(ROLES_KEY, roles);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly rbacService: RbacService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions && !requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check roles first
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = await this.rbacService.hasAnyRole(user.id, requiredRoles);
      if (!hasRequiredRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = await Promise.all(
        requiredPermissions.map(permission =>
          this.rbacService.hasPermission(user.id, permission)
        )
      );

      if (!hasAllPermissions.every(Boolean)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}

// Permission-based guard for specific actions
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const permission = request.params.permission || request.body.permission;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!permission) {
      throw new ForbiddenException('Permission not specified');
    }

    const hasPermission = await this.rbacService.hasPermission(user.id, permission as Permission);
    
    if (!hasPermission) {
      throw new ForbiddenException(`Permission '${permission}' required`);
    }

    return true;
  }
}

// Resource-based access control
@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id || request.params.userId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Users can always access their own resources
    if (resourceId === user.id) {
      return true;
    }

    // Check if user can manage the target user
    const canManage = await this.rbacService.canManageUser(user.id, resourceId);
    
    if (!canManage) {
      throw new ForbiddenException('Access denied to this resource');
    }

    return true;
  }
}
