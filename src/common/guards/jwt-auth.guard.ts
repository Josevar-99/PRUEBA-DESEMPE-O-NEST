import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * 💡 [ADAPT FOR THE TEST - JWT AUTHENTICATION GUARD]:
 * This Guard is registered globally in `app.module.ts`.
 *
 * EXECUTION FLOW:
 * 1. Checks if the route or controller has the `@Public()` decorator. If so, allows direct access.
 * 2. If not public, looks for the `Authorization: Bearer <token>` header.
 * 3. Validates the JWT signature and expiration with `JwtService`.
 * 4. Injects the payload into `request.user` to be available in controllers via `@CurrentUser()`.
 *
 * 💡 IF YOUR TEST REQUIRES AN API KEY INSTEAD OF JWT:
 * You can modify `extractTokenFromHeader` to read `request.headers['x-api-key']`
 * and compare it against the corresponding environment variable.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If it has @Public(), no token is required
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Authentication token not provided in the Authorization header (Bearer <token>)',
      );
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Inject the authenticated user into the request for @CurrentUser()
      (request as Request & { user: unknown }).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
