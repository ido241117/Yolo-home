import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AdafruitService } from '../adafruit/adafruit.service';
import { GLOBAL_ROOM_NAME } from '../global-devices/global-devices.service';
import { Room, RoomStatus } from '../room/entities/room.entity';
import { User, UserRole } from '../user/entities/user.entity';

const GLOBAL_DEVICE_KEYS = ['led', 'fan'] as const;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly adafruitService: AdafruitService,
  ) {}

  async getSummary() {
    const [totalRooms, occupiedRooms, vacantRooms, maintenanceRooms, totalTenants, humanAlerts, globalDevices] =
      await Promise.all([
        this.countRooms(),
        this.countRooms(RoomStatus.Occupied),
        this.countRooms(RoomStatus.Vacant),
        this.countRooms(RoomStatus.Maintenance),
        this.users.count({ where: { role: UserRole.Tenant, active: true } }),
        this.getAlerts(),
        this.readGlobalDevices(),
      ]);

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      totalTenants,
      humanDetectedRooms: humanAlerts.length,
      globalDevices,
    };
  }

  async getOccupancy() {
    const rooms = await this.rooms.find({
      where: { name: Not(GLOBAL_ROOM_NAME) },
      order: { name: 'ASC' },
    });
    const counts = rooms.reduce(
      (acc, room) => {
        acc[room.status] += 1;
        return acc;
      },
      {
        [RoomStatus.Occupied]: 0,
        [RoomStatus.Vacant]: 0,
        [RoomStatus.Maintenance]: 0,
      },
    );

    return {
      totalRooms: rooms.length,
      occupiedRooms: counts[RoomStatus.Occupied],
      vacantRooms: counts[RoomStatus.Vacant],
      maintenanceRooms: counts[RoomStatus.Maintenance],
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        status: room.status,
      })),
    };
  }

  async getAlerts() {
    const rooms = await this.rooms.find({
      where: { name: Not(GLOBAL_ROOM_NAME) },
      order: { name: 'ASC' },
    });

    const results = await Promise.allSettled(
      rooms.map(async (room) => {
        const human = await this.adafruitService.getLastValue(room.id, 'human');
        return { room, human };
      }),
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{ room: Room; human: { value: string; updatedAt: Date } }> => {
        return result.status === 'fulfilled' && this.isHumanDetected(result.value.human.value);
      })
      .map((result) => ({
        room: {
          id: result.value.room.id,
          name: result.value.room.name,
          status: result.value.room.status,
        },
        sensorKey: 'human',
        value: result.value.human.value,
        updatedAt: result.value.human.updatedAt,
      }));
  }

  private countRooms(status?: RoomStatus) {
    return this.rooms.count({
      where: {
        name: Not(GLOBAL_ROOM_NAME),
        ...(status ? { status } : {}),
      },
    });
  }

  private async readGlobalDevices() {
    const room = await this.rooms.findOne({
      where: { name: GLOBAL_ROOM_NAME },
      relations: { hardwareConfig: true },
    });
    if (!room?.hardwareConfig) return { led: null, fan: null };

    const results = await Promise.allSettled(
      GLOBAL_DEVICE_KEYS.map(async (key) => {
        const { value, updatedAt } = await this.adafruitService.getLastValue(room.id, key);
        return { key, value, updatedAt };
      }),
    );

    const devices: Record<string, { value: string; updatedAt: Date } | null> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        devices[result.value.key] = { value: result.value.value, updatedAt: result.value.updatedAt };
      } else {
        devices[GLOBAL_DEVICE_KEYS[results.indexOf(result)]] = null;
      }
    }
    return devices;
  }

  private isHumanDetected(value: string) {
    return ['1', 'true', 'on', 'yes', 'detected'].includes(String(value).trim().toLowerCase());
  }
}
