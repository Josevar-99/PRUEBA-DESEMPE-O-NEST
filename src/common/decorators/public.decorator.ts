import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - RUTAS PÚBLICAS]:
 * Al tener el JwtAuthGuard configurado de forma GLOBAL en app.module.ts,
 * TODAS las rutas son privadas por defecto.
 *
 * Utiliza este decorador `@Public()` encima del método o controlador que deba ser accesible
 * sin token Bearer (por ejemplo: login, register, catálogo público de productos, health check).
 *
 * Ejemplo de uso en controlador:
 *   @Public()
 *   @Get('catalogo')
 *   getCatalogo() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
