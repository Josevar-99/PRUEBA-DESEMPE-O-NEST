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
 * Guard for external integrations (requirements 8 and 9). Validates the
 * x-api-key header against API_KEY from .env. Not global: applied with
 * @UseGuards(ApiKeyGuard) only on integration endpoints.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const received = request.headers['x-api-key'];
    const expected = this.configService.get<string>('API_KEY') ?? '';

    // Requirement 10d: missing or incorrect key -> 401
    if (typeof received !== 'string' || !this.matches(received, expected)) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }
    return true;
  }

  /**
   * timingSafeEqual takes the same time regardless of where the keys differ.
   * With === an attacker could measure timings and guess the key character by character.
   * Requires buffers of the same length, so the length is compared first.
   */
  private matches(received: string, expected: string): boolean {
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
