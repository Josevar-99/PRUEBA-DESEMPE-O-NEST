import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guard para integraciones externas (requisitos 8 y 9). Valida el header
 * x-api-key contra API_KEY del .env. No es global: se aplica con
 * @UseGuards(ApiKeyGuard) solo en los endpoints de integración.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const recibida = request.headers['x-api-key'];
    const esperada = this.configService.get<string>('API_KEY') ?? '';

    // Requisito 10d: llave ausente o incorrecta -> 401
    if (typeof recibida !== 'string' || !this.coincide(recibida, esperada)) {
      throw new UnauthorizedException('API Key inválida o ausente');
    }
    return true;
  }

  /**
   * timingSafeEqual tarda lo mismo sin importar dónde difieran las llaves.
   * Con === un atacante podría medir tiempos y adivinar la llave carácter a carácter.
   * Exige buffers del mismo largo, por eso se compara el largo primero.
   */
  private coincide(recibida: string, esperada: string): boolean {
    const a = Buffer.from(recibida);
    const b = Buffer.from(esperada);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}