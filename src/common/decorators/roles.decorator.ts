import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum.js';

export const ROLES_KEY = 'roles';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - CONTROL DE ACCESO POR ROLES (RBAC)]:
 * Utiliza este decorador para restringir el acceso a un endpoint a roles específicos.
 * Requiere que el controlador o método tenga activo el RolesGuard (o esté registrado globalmente).
 *
 * Ejemplo de uso en controlador:
 *   @Roles(Role.ADMIN)
 *   @Delete(':id')
 *   eliminarUsuario(@Param('id') id: string) { ... }
 *
 * Puedes pasar múltiples roles permitidos:
 *   @Roles(Role.ADMIN, Role.USER)
 */
export const Roles = (...roles: [Role, ...Role[]]) =>
  SetMetadata(ROLES_KEY, roles);
