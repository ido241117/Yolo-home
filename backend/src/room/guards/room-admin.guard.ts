import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../user/entities/user.entity';
import { Permission } from '../entities/permission.entity';
import { RoomService } from '../room.service';
import { resolveRoomIdFromRequest } from './resolve-room-ref';

@Injectable()
export class RoomAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    private readonly roomService: RoomService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    if (user.role === UserRole.Owner) return true;

    const roomId = await resolveRoomIdFromRequest(this.roomService, request.params);
    if (!roomId) return false;

    const perm = await this.permissions.findOne({
      where: { room: { id: roomId }, user: { id: user.id } },
    });

    return !!perm?.isRoomAdmin;
  }
}
