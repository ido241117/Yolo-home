import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../../user/entities/user.entity';

@Injectable()
export class GlobalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user) return false;
    return user.role === UserRole.Owner || user.isGlobalAdmin === true;
  }
}
