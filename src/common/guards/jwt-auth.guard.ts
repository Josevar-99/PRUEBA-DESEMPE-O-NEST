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
 * 💡 [ADAPTAR PARA LA PRUEBA - GUARD DE AUTENTICACIÓN JWT]:
 * Este Guard está registrado de forma global en `app.module.ts`.
 *
 * FLUJO DE EJECUCIÓN:
 * 1. Verifica si la ruta o controlador tiene el decorador `@Public()`. Si lo tiene, permite el paso directo.
 * 2. Si no es pública, busca el encabezado `Authorization: Bearer <token>`.
 * 3. Valida la firma y expiración del JWT con `JwtService`.
 * 4. Inyecta el payload en `request.user` para que esté disponible en los controladores con `@CurrentUser()`.
 *
 * 💡 SI TU PRUEBA REQUIERE API KEY EN VEZ DE JWT:
 * Puedes modificar `extractTokenFromHeader` para leer `request.headers['x-api-key']`
 * y comparar contra la variable de entorno correspondiente.
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

    // Si tiene @Public(), no requiere token
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado en la cabecera Authorization (Bearer <token>)',
      );
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Inyectar el usuario autenticado en la petición para @CurrentUser()
      (request as Request & { user: unknown }).user = payload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
