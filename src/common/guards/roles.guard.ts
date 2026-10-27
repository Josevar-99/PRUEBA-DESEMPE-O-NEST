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
 * 💡 [ADAPTAR PARA LA PRUEBA - GUARD DE CONTROL DE ROLES (RBAC)]:
 * Este Guard compara los roles definidos en `@Roles(...)` con el rol del usuario autenticado (`request.user.role`).
 *
 * 💡 ADAPTACIONES COMUNES EN PRUEBAS:
 * 1. Si tu modelo de usuario tiene múltiples roles (ej: `user.roles: string[]` en vez de un solo rol):
 *    Cambia la comparación a:
 *    `const hasRole = requiredRoles.some((role) => user.roles.includes(role));`
 * 2. Si necesitas verificar permisos granulares (ej: `PERMISOS: ['CREAR_PRODUCTO', 'ELIMINAR_USUARIO']`):
 *    Crea un PermissionGuard similar a este leyendo una metadata de permisos.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no especifica ningún rol, cualquiera autenticado puede entrar
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Acceso denegado: el usuario no posee un rol asignado o no se encuentra autenticado',
      );
    }

    // Comprobar si el rol del usuario coincide con alguno de los roles permitidos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere uno de los siguientes roles [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
