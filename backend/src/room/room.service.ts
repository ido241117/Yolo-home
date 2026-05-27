import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GLOBAL_ROOM_NAME } from '../global-devices/global-devices.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AdafruitService } from '../adafruit/adafruit.service';
import { AiService } from '../ai/ai.service';
import { buildEncryptionKey, decrypt, encrypt } from '../common/encryption';
import { User } from '../user/entities/user.entity';
import { CommandDeviceDto } from './dto/command-device.dto';
import { RecognizeFaceDto, RegisterFaceDto } from './dto/face.dto';
import { AddMemberDto, UpdateMemberDto } from './dto/member.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpsertHardwareConfigDto } from './dto/hardware-config.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { EventLog } from './entities/event-log.entity';
import { FaceLabel } from './entities/face-label.entity';
import { HardwareConfig } from './entities/hardware-config.entity';
import { Permission } from './entities/permission.entity';
import { Room } from './entities/room.entity';

const VALID_DEVICE_KEYS = ['led', 'fan', 'door'] as const;
const VALID_SENSOR_KEYS = ['temp', 'humi', 'light', 'human'] as const;
const SENSOR_UNITS: Record<string, string | null> = {
  temp: '°C',
  humi: '%',
  light: 'lux',
  human: null,
};

@Injectable()
export class RoomService {
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(HardwareConfig)
    private readonly hardwareConfigs: Repository<HardwareConfig>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(EventLog)
    private readonly eventLogs: Repository<EventLog>,
    @InjectRepository(FaceLabel)
    private readonly faceLabels: Repository<FaceLabel>,
    private readonly adafruitService: AdafruitService,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey = buildEncryptionKey(
      this.config.get<string>('ENCRYPTION_KEY', 'default_dev_key_change_me'),
    );
  }

  findAll() {
    return this.rooms.find({
      where: { name: Not(GLOBAL_ROOM_NAME) },
      order: { createdAt: 'DESC' },
    });
  }

  create(dto: CreateRoomDto) {
    return this.rooms.save(this.rooms.create(dto));
  }

  async findOne(id: string) {
    const room = await this.rooms.findOne({ where: { id }, relations: { hardwareConfig: true } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getSummary(roomId: string) {
    const room = await this.findOne(roomId);
    const [members, devices, sensors, recentEvents] = await Promise.all([
      this.getMembers(roomId),
      this.getDevices(roomId),
      this.getSensors(roomId),
      this.getRoomEvents(roomId, 5),
    ]);

    return {
      room: {
        id: room.id,
        name: room.name,
        status: room.status,
        description: room.description,
      },
      members: members.map((permission) => ({
        userId: permission.user.id,
        name: permission.user.name,
        role: permission.user.role,
        isRoomAdmin: permission.isRoomAdmin,
      })),
      devices,
      sensors,
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        type: event.type,
        payload: event.payload,
        createdAt: event.createdAt,
        actor: event.actor
          ? {
              id: event.actor.id,
              name: event.actor.name,
              role: event.actor.role,
            }
          : null,
      })),
    };
  }

  async update(id: string, dto: UpdateRoomDto) {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.rooms.save(room);
  }

  async remove(id: string) {
    const room = await this.findOne(id);
    await this.rooms.remove(room);
    return { deleted: true };
  }

  // --- Hardware config ---

  async getHardware(roomId: string) {
    const room = await this.findOne(roomId);
    if (!room.hardwareConfig) return null;

    const { adafruitKeyEncrypted, room: _room, ...rest } = room.hardwareConfig as HardwareConfig & { room: Room };
    return {
      ...rest,
      adafruitKeyMasked: this.maskKey(adafruitKeyEncrypted),
    };
  }

  async upsertHardware(roomId: string, dto: UpsertHardwareConfigDto) {
    const room = await this.findOne(roomId);
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

    return this.getHardware(roomId);
  }

  getDecryptedKey(encryptedKey: string): string {
    return decrypt(encryptedKey, this.encryptionKey);
  }

  private maskKey(encryptedKey: string): string {
    try {
      const plain = decrypt(encryptedKey, this.encryptionKey);
      if (plain.length <= 8) return '****';
      return plain.slice(0, 4) + '****' + plain.slice(-4);
    } catch {
      return '****';
    }
  }

  // --- Members ---

  async getMembers(roomId: string) {
    await this.findOne(roomId);
    return this.permissions.find({
      where: { room: { id: roomId } },
      relations: { user: true },
      order: { user: { name: 'ASC' } },
    });
  }

  async addMember(roomId: string, dto: AddMemberDto) {
    const room = await this.findOne(roomId);
    const user = await this.users.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.permissions.findOne({
      where: { room: { id: roomId }, user: { id: dto.userId } },
    });
    if (existing) throw new BadRequestException('User is already a member of this room');

    const perm = this.permissions.create({ room, user });
    return this.permissions.save(perm);
  }

  async updateMember(roomId: string, userId: string, dto: UpdateMemberDto) {
    const perm = await this.requirePermission(roomId, userId);
    if (dto.isRoomAdmin !== undefined) perm.isRoomAdmin = dto.isRoomAdmin;
    return this.permissions.save(perm);
  }

  async removeMember(roomId: string, userId: string) {
    const perm = await this.requirePermission(roomId, userId);
    await this.permissions.remove(perm);
    return { deleted: true };
  }

  // --- Permissions ---

  async getPermission(roomId: string, userId: string) {
    return this.requirePermission(roomId, userId);
  }

  async updatePermission(roomId: string, userId: string, dto: UpdatePermissionDto) {
    const perm = await this.requirePermission(roomId, userId);
    Object.assign(perm, dto);
    return this.permissions.save(perm);
  }

  private async requirePermission(roomId: string, userId: string): Promise<Permission> {
    await this.findOne(roomId);
    const perm = await this.permissions.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
      relations: { user: true },
    });
    if (!perm) throw new NotFoundException('Member not found in this room');
    return perm;
  }

  // --- Devices ---

  async getDevices(roomId: string) {
    await this.findOne(roomId);
    const results = await Promise.allSettled(
      VALID_DEVICE_KEYS.map(async (key) => {
        const { value, updatedAt } = await this.adafruitService.getLastValue(roomId, key);
        return { key, value, updatedAt };
      }),
    );

    const devices: Record<string, { value: string; updatedAt: Date } | null> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') {
        devices[r.value.key] = { value: r.value.value, updatedAt: r.value.updatedAt };
      } else {
        // feed unreachable — return null so caller knows
        const key = VALID_DEVICE_KEYS[results.indexOf(r)];
        devices[key] = null;
      }
    }
    return devices;
  }

  async getDeviceState(roomId: string, deviceKey: string) {
    this.assertValidDeviceKey(deviceKey);
    const { value, updatedAt } = await this.adafruitService.getLastValue(roomId, deviceKey);
    return { deviceKey, value, updatedAt };
  }

  async commandDevice(roomId: string, deviceKey: string, dto: CommandDeviceDto, userId: string) {
    this.assertValidDeviceKey(deviceKey);

    let value: string;
    if (dto.action === 'toggle') {
      const current = await this.adafruitService.readFeed(roomId, deviceKey);
      value = this.toggleValue(current);
    } else if (dto.value !== undefined) {
      value = dto.value;
    } else {
      throw new BadRequestException('Provide either value or action: toggle');
    }

    await this.adafruitService.writeFeed(roomId, deviceKey, value);

    const room = await this.findOne(roomId);
    const actor = await this.users.findOne({ where: { id: userId } });
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: 'device_command',
        payload: { deviceKey, value, source: 'manual' },
      }),
    );

    return { deviceKey, value, updatedAt: new Date() };
  }

  // --- Event logs ---

  async getRoomEvents(roomId: string, limit = 50, from?: string, to?: string) {
    await this.findOne(roomId);
    const qb = this.eventLogs
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.actor', 'actor')
      .where('e.room = :roomId', { roomId })
      .orderBy('e.createdAt', 'DESC')
      .take(limit);

    if (from) qb.andWhere('e.createdAt >= :from', { from });
    if (to) qb.andWhere('e.createdAt <= :to', { to });

    return qb.getMany();
  }

  // --- Faces ---

  async getFaces(roomId: string) {
    await this.findOne(roomId);
    const [storedLabels, aiResult] = await Promise.all([
      this.faceLabels.find({
        where: { room: { id: roomId } },
        order: { createdAt: 'DESC' },
      }),
      this.aiService.listFaces(roomId),
    ]);

    const aiLabels = new Map(
      ((aiResult?.labels ?? []) as Array<Record<string, unknown>>).map((item) => [
        item.label,
        item,
      ]),
    );

    return storedLabels.map((face) => ({
      id: face.id,
      label: face.label,
      displayName: face.displayName,
      createdAt: face.createdAt,
      ai: aiLabels.get(face.label) ?? null,
    }));
  }

  async registerFace(roomId: string, dto: RegisterFaceDto) {
    const room = await this.findOne(roomId);
    const ai = await this.aiService.registerFace(roomId, dto.label, dto.image);
    const label = String(ai?.label ?? dto.label).trim();
    if (!label) throw new BadRequestException('Face label is required');

    let face = await this.faceLabels.findOne({
      where: { room: { id: roomId }, label },
    });
    if (!face) {
      face = await this.faceLabels.save(this.faceLabels.create({ room, label, displayName: dto.label }));
    }

    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        type: 'face_registered',
        payload: { faceId: face.id, label, ai },
      }),
    );

    return {
      id: face.id,
      label: face.label,
      displayName: face.displayName,
      createdAt: face.createdAt,
      ai,
    };
  }

  async deleteFace(roomId: string, faceId: string) {
    const room = await this.findOne(roomId);
    const face = await this.faceLabels.findOne({
      where: { id: faceId, room: { id: roomId } },
    });
    if (!face) throw new NotFoundException('Face label not found');

    const ai = await this.aiService.deleteFace(roomId, face.label);
    await this.faceLabels.remove(face);
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        type: 'face_deleted',
        payload: { faceId, label: face.label, ai },
      }),
    );

    return { deleted: true, label: face.label, ai };
  }

  async retrainFaces(roomId: string) {
    const room = await this.findOne(roomId);
    const ai = await this.aiService.retrainFaces(roomId);
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        type: 'face_retrain',
        payload: { ai },
      }),
    );
    return ai;
  }

  async recognizeFace(roomId: string, dto: RecognizeFaceDto, userId: string) {
    const room = await this.findOne(roomId);
    const actor = await this.users.findOne({ where: { id: userId } });
    const ai = await this.aiService.recognizeFace(roomId, dto.image);
    const confidence = Number(ai?.confidence ?? 0);
    const recognized = Boolean(ai?.recognized);
    const shouldUnlock = recognized && confidence >= this.faceUnlockConfidence();

    if (shouldUnlock) {
      await this.adafruitService.writeFeed(roomId, 'door', 'UNLOCKED');
    }

    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: shouldUnlock ? 'face_recognized' : 'face_recognition_denied',
        payload: {
          recognized,
          label: ai?.label ?? null,
          confidence,
          doorUnlocked: shouldUnlock,
          ai,
        },
      }),
    );

    return {
      ...ai,
      doorUnlocked: shouldUnlock,
    };
  }

  // --- Sensors ---

  async getSensors(roomId: string) {
    await this.findOne(roomId);
    const results = await Promise.allSettled(
      VALID_SENSOR_KEYS.map(async (key) => {
        const { value, updatedAt } = await this.adafruitService.getLastValue(roomId, key);
        return { key, value, unit: SENSOR_UNITS[key] ?? null, updatedAt };
      }),
    );

    const sensors: Record<string, { value: string; unit: string | null; updatedAt: Date } | null> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') {
        sensors[r.value.key] = { value: r.value.value, unit: r.value.unit, updatedAt: r.value.updatedAt };
      } else {
        const key = VALID_SENSOR_KEYS[results.indexOf(r)];
        sensors[key] = null;
      }
    }
    return sensors;
  }

  async getSensorState(roomId: string, sensorKey: string) {
    this.assertValidSensorKey(sensorKey);
    const { value, updatedAt } = await this.adafruitService.getLastValue(roomId, sensorKey);
    return { sensorKey, value, unit: SENSOR_UNITS[sensorKey] ?? null, updatedAt };
  }

  async getSensorHistory(roomId: string, sensorKey: string, limit = 50, from?: string, to?: string) {
    this.assertValidSensorKey(sensorKey);
    const history = await this.adafruitService.getFeedHistory(roomId, sensorKey, limit, from, to);
    return { sensorKey, unit: SENSOR_UNITS[sensorKey] ?? null, history };
  }

  private assertValidSensorKey(key: string) {
    if (!(VALID_SENSOR_KEYS as readonly string[]).includes(key)) {
      throw new BadRequestException(`Invalid sensor key "${key}". Valid: ${VALID_SENSOR_KEYS.join(', ')}`);
    }
  }

  private assertValidDeviceKey(key: string) {
    if (!(VALID_DEVICE_KEYS as readonly string[]).includes(key)) {
      throw new BadRequestException(`Invalid device key "${key}". Valid: ${VALID_DEVICE_KEYS.join(', ')}`);
    }
  }

  private faceUnlockConfidence(): number {
    const raw = this.config.get<string>('FACE_UNLOCK_CONFIDENCE', '0.9');
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0.9;
  }

  // Mirrors toggle logic from today.html
  private toggleValue(current: string): string {
    const s = String(current ?? '').toUpperCase();
    if (s === 'LOCKED')   return 'UNLOCKED';
    if (s === 'UNLOCKED') return 'LOCKED';
    if (s === '1')        return '0';
    if (s === '0')        return '1';
    if (s === 'OFF')      return 'ON';
    return 'OFF'; // ON → OFF, or any unknown → OFF
  }
}
