import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { Role } from '../enums/role.enum.js';

/**
 * 💡 [ADAPT FOR THE TEST - ROLE-BASED ACCESS CONTROL (RBAC) GUARD]:
 * This Guard compares the roles defined in `@Roles(...)` with the authenticated user's role (`request.user.role`).
 *
 * 💡 COMMON ADAPTATIONS IN TESTS:
 * 1. If your user model has multiple roles (e.g.: `user.roles: string[]` instead of a single role):
 *    Change the comparison to:
 *    `const hasRole = requiredRoles.some((role) => user.roles.includes(role));`
 * 2. If you need to check granular permissions (e.g.: `PERMISSIONS: ['CREATE_PRODUCT', 'DELETE_USER']`):
 *    Create a PermissionGuard similar to this one reading a permissions metadata.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the endpoint specifies no roles, any authenticated user can access it
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Access denied: the user does not have an assigned role or is not authenticated',
      );
    }

    // Check if the user's role matches any of the allowed roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: one of the following roles is required [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
