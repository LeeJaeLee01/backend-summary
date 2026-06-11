import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../common/types/request-context';

export interface JwtPayload {
  sub: string;
  email: string;
  tid: number;
  tslug: string;
  roles: string[];
  iss: string;
  aud: string;
}

interface UserRow {
  id: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly issuer = 'https://auth.taskflow.demo';
  private readonly audience = 'taskflow-api';

  constructor(
    private readonly config: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.secret = this.config.get<string>('JWT_SECRET', 'demo-secret');
  }

  /**
   * Demo login — production dùng OIDC/PKCE (doc §2.2)
   * Issue JWT với tid, tslug, roles theo doc §2.3
   */
  async login(email: string, tenantSlug: string): Promise<{ accessToken: string }> {
    const users = await this.dataSource.query<UserRow[]>(
      `SELECT id, email FROM platform.users WHERE email = $1`,
      [email],
    );
    const user = users[0];
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenants = await this.dataSource.query<{ id: string; slug: string }[]>(
      `SELECT id, slug FROM platform.tenants WHERE slug = $1 AND status = 'active'`,
      [tenantSlug],
    );
    const tenant = tenants[0];
    if (!tenant) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    const memberships = await this.dataSource.query<{ role: string }[]>(
      `SELECT role FROM platform.tenant_memberships
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'active'`,
      [tenant.id, user.id],
    );
    const membership = memberships[0];
    if (!membership) {
      throw new UnauthorizedException('User is not a member of this tenant');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tid: Number(tenant.id),
      tslug: tenant.slug,
      roles: [membership.role],
      iss: this.issuer,
      aud: this.audience,
    };

    const accessToken = jwt.sign(payload, this.secret, { expiresIn: '1h' });
    return { accessToken };
  }

  /**
   * Bước 2 — verify JWT signature, iss, aud, exp
   */
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as JwtPayload;
      return decoded;
    } catch {
      throw new UnauthorizedException('JWT invalid or expired');
    }
  }

  toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email };
  }
}
