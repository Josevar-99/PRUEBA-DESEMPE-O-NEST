import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 💡 [ADAPT FOR THE TEST - JWT PAYLOAD INTERFACE]:
 * Modify or add properties if your JWT token includes more data
 * (e.g.: tenantId, branchId, permissions, name, etc.).
 */
export interface JwtPayload {
  sub: string; // Unique ID of the authenticated user (UUID)
  email: string; // User's email
  role: string; // User's role (e.g.: ADMIN, USER)
  [key: string]: unknown;
}

/**
 * 💡 [ADAPT FOR THE TEST - @CurrentUser DECORATOR]:
 * Allows injecting authenticated user data directly into controller methods.
 *
 * Usage examples in a controller:
 * 1. Get the full payload:
 *    @Get('profile')
 *    getProfile(@CurrentUser() user: JwtPayload) { return user; }
 *
 * 2. Get only a specific property (e.g.: the id/sub):
 *    @Post('create-order')
 *    createOrder(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) { ... }
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
