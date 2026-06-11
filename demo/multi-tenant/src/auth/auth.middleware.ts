import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
/**
 * BƯỚC 2 — Authentication (index.md lifecycle)
 *
 * Đọc Authorization: Bearer <JWT>, verify signature / iss / aud / exp
 * Gắn req.authenticatedUser và req.jwtPayload
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    // Public routes (login) — bỏ qua auth
    if (req.path === '/auth/login' || req.path === '/health') {
      return next();
    }

    const authHeader = req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);
    const payload = this.authService.verifyToken(token);

    // Chống token replay sang tenant khác (doc §2.5)
    if (req.resolvedTenant && payload.tslug !== req.resolvedTenant.slug) {
      throw new UnauthorizedException(
        `JWT tenant "${payload.tslug}" does not match request tenant "${req.resolvedTenant.slug}"`,
      );
    }
    if (req.resolvedTenant && payload.tid !== req.resolvedTenant.id) {
      throw new UnauthorizedException('JWT tid does not match resolved tenant');
    }

    req.jwtPayload = payload;
    req.authenticatedUser = this.authService.toAuthenticatedUser(payload);
    next();
  }
}
