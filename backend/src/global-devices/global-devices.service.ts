import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdafruitService } from '../adafruit/adafruit.service';
import { buildEncryptionKey, encrypt } from '../common/encryption';
import { CommandDeviceDto } from '../room/dto/command-device.dto';
import { UpsertHardwareConfigDto } from '../room/dto/hardware-config.dto';
import { EventLog } from '../room/entities/event-log.entity';
import { HardwareConfig } from '../room/entities/hardware-config.entity';
import { Room, RoomStatus } from '../room/entities/room.entity';
import { User } from '../user/entities/user.entity';

export const GLOBAL_ROOM_NAME = '__global__';
const VALID_GLOBAL_DEVICE_KEYS = ['led', 'fan'] as const;

@Injectable()
export class GlobalDevicesService {
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(HardwareConfig)
    private readonly hardwareConfigs: Repository<HardwareConfig>,
    @InjectRepository(EventLog)
    private readonly eventLogs: Repository<EventLog>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly adafruitService: AdafruitService,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey = buildEncryptionKey(
      this.config.get<string>('ENCRYPTION_KEY', 'default_dev_key_change_me'),
    );
  }

  private async getOrCreateGlobalRoom(): Promise<Room> {
    let room = await this.rooms.findOne({
      where: { name: GLOBAL_ROOM_NAME },
      relations: { hardwareConfig: true },
    });
    if (!room) {
      room = await this.rooms.save(
        this.rooms.create({ name: GLOBAL_ROOM_NAME, status: RoomStatus.Maintenance }),
      );
    }
    return room;
  }

  async getDevices() {
    const room = await this.getOrCreateGlobalRoom();
    if (!room.hardwareConfig) return { configured: false, devices: {} };

    const results = await Promise.allSettled(
      VALID_GLOBAL_DEVICE_KEYS.map(async (key) => {
        const { value, updatedAt } = await this.adafruitService.getLastValue(room.id, key);
        return { key, value, updatedAt };
      }),
    );

    const devices: Record<string, { value: string; updatedAt: Date } | null> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') {
        devices[r.value.key] = { value: r.value.value, updatedAt: r.value.updatedAt };
      } else {
        const key = VALID_GLOBAL_DEVICE_KEYS[results.indexOf(r)];
        devices[key] = null;
      }
    }
    return { configured: true, devices };
  }

  async getDeviceState(deviceKey: string) {
    this.assertValidDeviceKey(deviceKey);
    const room = await this.getOrCreateGlobalRoom();
    const { value, updatedAt } = await this.adafruitService.getLastValue(room.id, deviceKey);
    return { deviceKey, value, updatedAt };
  }

  async upsertHardware(dto: UpsertHardwareConfigDto) {
    const room = await this.getOrCreateGlobalRoom();
    const encrypted = encrypt(dto.adafruitKey, this.encryptionKey);

    if (room.hardwareConfig) {
      await this.hardwareConfigs.update(room.hardwareConfig.id, {
        adafruitUsername: dto.adafruitUsername,
        adafruitKeyEncrypted: encrypted,
        ...(dto.feedMapping !== undefined && { feedMapping: dto.feedMapping }),
      });
    } else {
      await this.hardwareConfigs.save(
        this.hardwareConfigs.create({
          room,
          adafruitUsername: dto.adafruitUsername,
          adafruitKeyEncrypted: encrypted,
          feedMapping: dto.feedMapping ?? {},
        }),
      );
    }
    return { ok: true };
  }

  async commandDevice(deviceKey: string, dto: CommandDeviceDto, userId: string) {
    this.assertValidDeviceKey(deviceKey);
    const room = await this.getOrCreateGlobalRoom();

    let value: string;
    if (dto.action === 'toggle') {
      const current = await this.adafruitService.readFeed(room.id, deviceKey);
      value = this.toggleValue(current);
    } else if (dto.value !== undefined) {
      value = dto.value;
    } else {
      throw new BadRequestException('Provide either value or action: toggle');
    }

    await this.adafruitService.writeFeed(room.id, deviceKey, value);

    const actor = await this.users.findOne({ where: { id: userId } });
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: 'device_command',
        payload: { deviceKey, value, source: 'manual', global: true },
      }),
    );

    return { deviceKey, value, updatedAt: new Date() };
  }

  private assertValidDeviceKey(key: string) {
    if (!(VALID_GLOBAL_DEVICE_KEYS as readonly string[]).includes(key)) {
      throw new BadRequestException(
        `Invalid global device key "${key}". Valid: ${VALID_GLOBAL_DEVICE_KEYS.join(', ')}`,
      );
    }
  }

  private toggleValue(current: string): string {
    const s = String(current ?? '').toUpperCase();
    if (s === '1') return '0';
    if (s === '0') return '1';
    if (s === 'OFF') return 'ON';
    return 'OFF';
  }
}
