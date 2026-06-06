import * as crypto from 'crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('auth.invalidCredentials');
    if (!user.active) throw new UnauthorizedException('auth.accountRevoked');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('auth.invalidCredentials');

    const accessToken = this.signAccessToken(user.id, user.username, user.role, user.isGlobalAdmin);
    const { token: refreshToken, hash } = this.buildRefreshToken(user.id);

    await this.userService.updateRefreshTokenHash(user.id, hash);
    await this.userService.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isGlobalAdmin: user.isGlobalAdmin,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userService.updateRefreshTokenHash(userId, null);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh_change_me'),
      }) as { sub: string; type: string };
    } catch {
      throw new UnauthorizedException('auth.invalidRefreshToken');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedException();

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await this.userService.findByIdWithRefreshToken(payload.sub);

    if (!user || !user.active || user.refreshTokenHash !== hash) {
      throw new UnauthorizedException('auth.revokedRefreshToken');
    }

    return { accessToken: this.signAccessToken(user.id, user.username, user.role, user.isGlobalAdmin) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userService.findByUsername(
      (await this.userService.findById(userId))!.username,
    );
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('auth.invalidCurrentPassword');

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.userService.updatePassword(userId, newHash);
    await this.userService.updateRefreshTokenHash(userId, null);
  }

  async getMe(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isGlobalAdmin: user.isGlobalAdmin,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private signAccessToken(userId: string, username: string, role: UserRole, isGlobalAdmin: boolean): string {
    return this.jwtService.sign(
      { sub: userId, username, role, isGlobalAdmin },
      { expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m') as any },
    );
  }

  private buildRefreshToken(userId: string) {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh_change_me'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      },
    );
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }
}
