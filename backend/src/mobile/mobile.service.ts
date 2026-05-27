import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GLOBAL_ROOM_NAME } from '../global-devices/global-devices.service';
import { Permission } from '../room/entities/permission.entity';
import { RoomService } from '../room/room.service';

@Injectable()
export class MobileService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    private readonly roomService: RoomService,
  ) {}

  async getMyRoom(userId: string) {
    const permission = await this.getPrimaryPermission(userId);
    return {
      id: permission.room.id,
      name: permission.room.name,
      status: permission.room.status,
      description: permission.room.description,
    };
  }

  async getMyPermissions(userId: string) {
    const permission = await this.getPrimaryPermission(userId);
    return this.formatPermission(permission);
  }

  async getMyDevices(userId: string) {
    const permission = await this.getPrimaryPermission(userId);
    return {
      room: {
        id: permission.room.id,
        name: permission.room.name,
      },
      devices: await this.roomService.getDevices(permission.room.id),
    };
  }

  async getMySensors(userId: string) {
    const permission = await this.getPrimaryPermission(userId);
    return {
      room: {
        id: permission.room.id,
        name: permission.room.name,
      },
      sensors: await this.roomService.getSensors(permission.room.id),
    };
  }

  private async getPrimaryPermission(userId: string) {
    const permission = await this.permissions
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.room', 'room')
      .leftJoin('permission.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('room.name != :globalRoomName', { globalRoomName: GLOBAL_ROOM_NAME })
      .orderBy('room.name', 'ASC')
      .getOne();

    if (!permission) throw new NotFoundException('No room assigned to current user');
    return permission;
  }

  private formatPermission(permission: Permission) {
    return {
      roomId: permission.room.id,
      canControlLed: permission.canControlLed,
      canControlFan: permission.canControlFan,
      canControlDoor: permission.canControlDoor,
      canViewSensors: permission.canViewSensors,
      canManageFaces: permission.canManageFaces,
      isRoomAdmin: permission.isRoomAdmin,
    };
  }
}
