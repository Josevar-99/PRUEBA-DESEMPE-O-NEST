import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum.js';

export const ROLES_KEY = 'roles';

/**
 * 💡 [ADAPT FOR THE TEST - ROLE-BASED ACCESS CONTROL (RBAC)]:
 * Use this decorator to restrict access to an endpoint to specific roles.
 * Requires the controller or method to have RolesGuard active (or registered globally).
 *
 * Usage example in a controller:
 *   @Roles(Role.ADMIN)
 *   @Delete(':id')
 *   deleteUser(@Param('id') id: string) { ... }
 *
 * You can pass multiple allowed roles:
 *   @Roles(Role.ADMIN, Role.USER)
 */
export const Roles = (...roles: [Role, ...Role[]]) =>
  SetMetadata(ROLES_KEY, roles);
