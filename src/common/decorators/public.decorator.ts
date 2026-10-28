import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 💡 [ADAPT FOR THE TEST - PUBLIC ROUTES]:
 * Since JwtAuthGuard is configured GLOBALLY in app.module.ts,
 * ALL routes are private by default.
 *
 * Use this `@Public()` decorator above the method or controller that should be accessible
 * without a Bearer token (e.g.: login, register, public product catalog, health check).
 *
 * Usage example in a controller:
 *   @Public()
 *   @Get('catalog')
 *   getCatalog() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
