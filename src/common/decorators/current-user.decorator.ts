import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - INTERFAZ DE PAYLOAD JWT]:
 * Modifica o agrega propiedades si tu token JWT incluye más datos
 * (ej: tenantId, sucursalId, permisos, nombre, etc.).
 */
export interface JwtPayload {
  sub: string; // ID único del usuario autenticado (UUID)
  email: string; // Correo del usuario
  role: string; // Rol del usuario (ej: ADMIN, USER)
  [key: string]: unknown;
}

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - DECORADOR @CurrentUser]:
 * Permite inyectar los datos del usuario autenticado directamente en los métodos del controlador.
 *
 * Ejemplos de uso en controlador:
 * 1. Obtener el payload completo:
 *    @Get('perfil')
 *    obtenerPerfil(@CurrentUser() user: JwtPayload) { return user; }
 *
 * 2. Obtener solo una propiedad específica (ej: el id/sub):
 *    @Post('crear-orden')
 *    crearOrden(@CurrentUser('sub') userId: string, @Body() dto: CrearOrdenDto) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
