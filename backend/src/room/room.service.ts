import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GLOBAL_ROOM_NAME } from '../global-devices/global-devices.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
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
import { AutoControlTrainingLog } from './entities/auto-control-training-log.entity';
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

type AutoTrainingContext = {
  temperature: number;
  humidity: number;
  light: number;
  hour: number;
  currentFanState?: number;
  currentLightState?: number;
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
    @InjectRepository(AutoControlTrainingLog)
    private readonly autoControlTrainingLogs: Repository<AutoControlTrainingLog>,
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

  async findAll() {
    const rooms = await this.rooms.find({
      where: { name: Not(GLOBAL_ROOM_NAME) },
      relations: { hardwareConfig: true },
      order: { createdAt: 'DESC' },
    });

    return rooms.map((room) => ({
      id: room.id,
      code: room.code,
      name: room.name,
      status: room.status,
      description: room.description,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      adafruitUsername: room.hardwareConfig?.adafruitUsername ?? null,
    }));
  }

  create(dto: CreateRoomDto) {
    return this.createRoom(dto);
  }

  async createRoom(dto: CreateRoomDto) {
    const code = dto.code?.trim() || (await this.generateRoomCode(dto.name));
    const existing = await this.rooms.findOne({ where: { code } });
    if (existing) throw new BadRequestException(`Room code "${code}" already exists`);
    return this.rooms.save(this.rooms.create({ ...dto, code }));
  }

  async findOne(ref: string) {
    const room = await this.findByRef(ref, { hardwareConfig: true });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async resolveRoomId(ref: string): Promise<string | null> {
    const room = await this.findByRef(ref);
    return room?.id ?? null;
  }

  private async findByRef(ref: string, relations?: { hardwareConfig?: boolean }) {
    const where = this.isUuid(ref) ? { id: ref } : { code: ref };
    return this.rooms.findOne({ where, relations });
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async generateRoomCode(name: string) {
    const fromName = name.match(/\d+/)?.[0];
    if (fromName && !(await this.rooms.findOne({ where: { code: fromName } }))) {
      return fromName;
    }

    const existing = await this.rooms.find({ select: ['code'] });
    let max = 0;
    for (const room of existing) {
      const parsed = Number.parseInt(room.code, 10);
      if (Number.isFinite(parsed) && parsed > max) max = parsed;
    }
    return String(max + 1);
  }

  private async roomIdFromRef(ref: string) {
    return (await this.findOne(ref)).id;
  }

  async getSummary(ref: string) {
    const room = await this.findOne(ref);
    const roomId = room.id;
    const [members, devices, sensors, recentEvents] = await Promise.all([
      this.getMembers(roomId),
      this.getDevices(roomId),
      this.getSensors(roomId),
      this.getRoomEvents(roomId, 5),
    ]);

    return {
      room: {
        id: room.id,
        code: room.code,
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

  async getMembers(ref: string) {
    const roomId = await this.roomIdFromRef(ref);
    return this.permissions.find({
      where: { room: { id: roomId } },
      relations: { user: true },
      order: { user: { name: 'ASC' } },
    });
  }

  async addMember(ref: string, dto: AddMemberDto) {
    const room = await this.findOne(ref);
    const roomId = room.id;
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

  private async requirePermission(ref: string, userId: string): Promise<Permission> {
    const roomId = await this.roomIdFromRef(ref);
    const perm = await this.permissions.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
      relations: { user: true },
    });
    if (!perm) throw new NotFoundException('Member not found in this room');
    return perm;
  }

  // --- Devices ---

  async getDevices(ref: string) {
    const roomId = await this.roomIdFromRef(ref);
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

  async getDeviceState(ref: string, deviceKey: string) {
    this.assertValidDeviceKey(deviceKey);
    const roomId = await this.roomIdFromRef(ref);
    const { value, updatedAt } = await this.adafruitService.getLastValue(roomId, deviceKey);
    return { deviceKey, value, updatedAt };
  }

  async commandDevice(ref: string, deviceKey: string, dto: CommandDeviceDto, userId: string) {
    return this.commandDeviceWithSource(ref, deviceKey, dto, userId, 'manual');
  }

  async autoControlDevice(ref: string, deviceKey: string, userId: string) {
    this.assertValidDeviceKey(deviceKey);
    if (deviceKey === 'door') throw new BadRequestException('Auto control only supports led and fan');

    const [sensors, devices] = await Promise.all([
      this.getSensors(ref),
      this.getDevices(ref),
    ]);
    const sensorData = {
      temperature: this.readNumericSensor(sensors.temp?.value, 25),
      humidity: this.readNumericSensor(sensors.humi?.value, 50),
      light: this.readNumericSensor(sensors.light?.value, 400),
    };
    const deviceStates = {
      fan: this.isActiveDeviceValue(devices.fan?.value),
      light: this.isActiveDeviceValue(devices.led?.value),
    };
    const prediction = await this.aiService.predictAutoControl({
      sensor_data: sensorData,
      device_states: {
        fan: deviceStates.fan,
        light: deviceStates.light,
      },
    });
    const action = this.extractPredictedAction(prediction, deviceKey);
    return this.commandDeviceWithSource(
      ref,
      deviceKey,
      { value: action },
      userId,
      'auto',
      prediction,
      {
        ...sensorData,
        hour: this.hourFraction(),
        currentFanState: Number(deviceStates.fan),
        currentLightState: Number(deviceStates.light),
      },
    );
  }

  private async commandDeviceWithSource(
    ref: string,
    deviceKey: string,
    dto: CommandDeviceDto,
    userId: string,
    source: 'manual' | 'auto',
    ai?: unknown,
    trainingContext?: AutoTrainingContext,
  ) {
    this.assertValidDeviceKey(deviceKey);
    const roomId = await this.roomIdFromRef(ref);
    const shouldLogTraining = deviceKey === 'led' || deviceKey === 'fan';
    const context = shouldLogTraining
      ? trainingContext ?? await this.getAutoTrainingContext(ref)
      : undefined;
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

    const room = await this.findOne(ref);
    const actor = await this.users.findOne({ where: { id: userId } });
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: 'device_command',
        payload: { deviceKey, value, source, ...(ai !== undefined && { ai }) },
      }),
    );

    if (shouldLogTraining && context) {
      await this.saveAutoControlTrainingLog(room, actor ?? undefined, deviceKey, value, source, context, ai);
    }

    return { deviceKey, value, updatedAt: new Date() };
  }

  private async getAutoTrainingContext(ref: string): Promise<AutoTrainingContext> {
    const [sensors, devices] = await Promise.all([
      this.getSensors(ref),
      this.getDevices(ref),
    ]);

    return {
      temperature: this.readNumericSensor(sensors.temp?.value, 25),
      humidity: this.readNumericSensor(sensors.humi?.value, 50),
      light: this.readNumericSensor(sensors.light?.value, 400),
      hour: this.hourFraction(),
      currentFanState: Number(this.isActiveDeviceValue(devices.fan?.value)),
      currentLightState: Number(this.isActiveDeviceValue(devices.led?.value)),
    };
  }

  private async saveAutoControlTrainingLog(
    room: Room,
    actor: User | undefined,
    deviceKey: string,
    value: string,
    source: 'manual' | 'auto',
    context: AutoTrainingContext,
    ai?: unknown,
  ) {
    const desiredAction = source === 'manual' ? this.toBinaryAction(value) : undefined;
    await this.autoControlTrainingLogs.save(
      this.autoControlTrainingLogs.create({
        room,
        actor,
        source,
        deviceKey,
        temperature: context.temperature,
        humidity: context.humidity,
        light: context.light,
        hour: context.hour,
        currentFanState: context.currentFanState,
        currentLightState: context.currentLightState,
        desiredFanAction: deviceKey === 'fan' ? desiredAction : undefined,
        desiredLightAction: deviceKey === 'led' ? desiredAction : undefined,
        metadata: { ...(ai !== undefined && { ai }) },
      }),
    );
  }

  // --- Event logs ---

  async getRoomEvents(ref: string, limit = 50, from?: string, to?: string) {
    const roomId = await this.roomIdFromRef(ref);
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

  async getFaces(ref: string) {
    const roomId = await this.roomIdFromRef(ref);
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
      previewImage: face.previewImage ?? null,
      createdAt: face.createdAt,
      ai: aiLabels.get(face.label) ?? null,
    }));
  }

  async registerFace(ref: string, dto: RegisterFaceDto) {
    const room = await this.findOne(ref);
    const roomId = room.id;
    const samples = dto.images?.length ? dto.images : dto.image ? [dto.image] : [];
    if (samples.length === 0) throw new BadRequestException('Face image is required');
    const label = `face_${randomUUID()}`;
    const ai = await this.aiService.registerFace(roomId, label, dto.images?.length ? dto.images : dto.image!);

    let face = await this.faceLabels.findOne({
      where: { room: { id: roomId }, label },
    });
    if (!face) {
      const faceIndex = await this.faceLabels.count({ where: { room: { id: roomId } } });
      face = await this.faceLabels.save(
        this.faceLabels.create({
          room,
          label,
          displayName: `Face ${faceIndex + 1}`,
          previewImage: samples[0],
        }),
      );
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
      previewImage: face.previewImage ?? null,
      createdAt: face.createdAt,
      ai,
    };
  }

  async deleteFace(ref: string, faceId: string) {
    const room = await this.findOne(ref);
    const roomId = room.id;
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

  async retrainFaces(ref: string) {
    const room = await this.findOne(ref);
    const roomId = room.id;
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

  async recognizeFace(ref: string, dto: RecognizeFaceDto, userId: string) {
    const room = await this.findOne(ref);
    const roomId = room.id;
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

  async getSensors(ref: string) {
    const roomId = await this.roomIdFromRef(ref);
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

  async getSensorState(ref: string, sensorKey: string) {
    this.assertValidSensorKey(sensorKey);
    const roomId = await this.roomIdFromRef(ref);
    const { value, updatedAt } = await this.adafruitService.getLastValue(roomId, sensorKey);
    return { sensorKey, value, unit: SENSOR_UNITS[sensorKey] ?? null, updatedAt };
  }

  async getSensorHistory(ref: string, sensorKey: string, limit = 50, from?: string, to?: string) {
    this.assertValidSensorKey(sensorKey);
    const roomId = await this.roomIdFromRef(ref);
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

  private readNumericSensor(raw: string | undefined, fallback: number) {
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  private hourFraction(now = new Date()) {
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  }

  private toBinaryAction(raw: string) {
    return this.isActiveDeviceValue(raw) ? 1 : 0;
  }

  private isActiveDeviceValue(raw: string | undefined) {
    return ['1', 'true', 'on', 'yes', 'detected'].includes(String(raw ?? '').trim().toLowerCase());
  }

  private extractPredictedAction(prediction: unknown, deviceKey: string) {
    const key = deviceKey === 'fan' ? 'fan' : 'light';
    const devicePrediction = (prediction as Record<string, Record<string, unknown> | undefined>)?.[key];
    const action = devicePrediction?.action;
    if (action !== 'ON' && action !== 'OFF') {
      throw new BadRequestException(`AI did not return a valid ${deviceKey} action`);
    }
    return action;
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
