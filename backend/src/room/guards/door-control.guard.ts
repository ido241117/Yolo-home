import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../user/entities/user.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class DoorControlGuard implements CanActivate {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    if (user.role === UserRole.Owner) return true;

    const roomId: string | undefined = request.params.roomId ?? request.params.id;
    if (!roomId) return false;

    const perm = await this.permissions.findOne({
      where: { room: { id: roomId }, user: { id: user.id } },
    });

    return !!perm?.canControlDoor;
  }
}
