import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { AdafruitService } from '../adafruit/adafruit.service';
import { AiService } from '../ai/ai.service';
import { buildEncryptionKey, decrypt, encrypt } from '../common/encryption';
import { CommandDeviceDto } from '../room/dto/command-device.dto';
import { UpsertHardwareConfigDto } from '../room/dto/hardware-config.dto';
import { AutoControlMode } from '../room/entities/auto-control-mode.entity';
import { AutoControlTrainingLog } from '../room/entities/auto-control-training-log.entity';
import { EventLog } from '../room/entities/event-log.entity';
import { HardwareConfig } from '../room/entities/hardware-config.entity';
import { Room, RoomStatus } from '../room/entities/room.entity';
import { User } from '../user/entities/user.entity';

export const GLOBAL_ROOM_NAME = '__global__';
const VALID_GLOBAL_DEVICE_KEYS = ['led', 'fan'] as const;
const GLOBAL_DASHBOARD_SENSOR_KEYS = ['temp', 'humi'] as const;
const GLOBAL_AUTO_SENSOR_KEYS = ['temp', 'humi', 'light'] as const;

type AutoTrainingContext = {
  temperature: number;
  humidity: number;
  light: number;
  hour: number;
  currentFanState?: number;
  currentLightState?: number;
};

@Injectable()
export class GlobalDevicesService implements OnModuleInit {
  private readonly logger = new Logger(GlobalDevicesService.name);
  private readonly encryptionKey: Buffer;
  private autoControlTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(HardwareConfig)
    private readonly hardwareConfigs: Repository<HardwareConfig>,
    @InjectRepository(EventLog)
    private readonly eventLogs: Repository<EventLog>,
    @InjectRepository(AutoControlTrainingLog)
    private readonly autoControlTrainingLogs: Repository<AutoControlTrainingLog>,
    @InjectRepository(AutoControlMode)
    private readonly autoControlModes: Repository<AutoControlMode>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly adafruitService: AdafruitService,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey = buildEncryptionKey(
      this.config.get<string>('ENCRYPTION_KEY', 'default_dev_key_change_me'),
    );
  }

  onModuleInit() {
    this.autoControlTimer = setInterval(
      () => void this.runEnabledAutoControls().catch((error) => this.logger.error(error)),
      this.autoControlIntervalMs(),
    );
  }

  private async getOrCreateGlobalRoom(): Promise<Room> {
    let room = await this.rooms.findOne({
      where: { name: GLOBAL_ROOM_NAME },
      relations: { hardwareConfig: true },
    });
    if (!room) {
      room = await this.rooms.save(
        this.rooms.create({ name: GLOBAL_ROOM_NAME, code: 'global', status: RoomStatus.Maintenance }),
      );
    }
    return room;
  }

  async getDevices() {
    const room = await this.getOrCreateGlobalRoom();
    if (!room.hardwareConfig) {
      return {
        configured: false,
        devices: {},
        sensors: { temp: null, humi: null },
        history: { temp: [], humi: [] },
        autoModes: await this.getAutoModes(room.id),
      };
    }

    const deviceResults = await Promise.allSettled(
      VALID_GLOBAL_DEVICE_KEYS.map(async (key) => {
        const { value, updatedAt } = await this.adafruitService.getLastValue(room.id, key);
        return { key, value, updatedAt };
      }),
    );
    const sensorResults = await Promise.allSettled(
      GLOBAL_DASHBOARD_SENSOR_KEYS.map(async (key) => {
        const { value, updatedAt } = await this.getGlobalSensorValue(room.id, key);
        return { key, value, updatedAt };
      }),
    );
    const historyResults = await Promise.allSettled(
      GLOBAL_DASHBOARD_SENSOR_KEYS.map(async (key) => ({
        key,
        history: await this.getGlobalSensorHistory(room.id, key, 50),
      })),
    );

    const devices: Record<string, { value: string; updatedAt: Date } | null> = {};
    for (const r of deviceResults) {
      if (r.status === 'fulfilled') {
        devices[r.value.key] = { value: r.value.value, updatedAt: r.value.updatedAt };
      } else {
        const key = VALID_GLOBAL_DEVICE_KEYS[deviceResults.indexOf(r)];
        devices[key] = null;
      }
    }

    const sensors: Record<string, { value: string; updatedAt: Date } | null> = {};
    for (const r of sensorResults) {
      if (r.status === 'fulfilled') {
        sensors[r.value.key] = { value: r.value.value, updatedAt: r.value.updatedAt };
      } else {
        const key = GLOBAL_DASHBOARD_SENSOR_KEYS[sensorResults.indexOf(r)];
        sensors[key] = null;
      }
    }

    const history: Record<string, Array<{ value: string; createdAt: Date }>> = {};
    for (const r of historyResults) {
      if (r.status === 'fulfilled') {
        history[r.value.key] = r.value.history;
      } else {
        const key = GLOBAL_DASHBOARD_SENSOR_KEYS[historyResults.indexOf(r)];
        history[key] = [];
      }
    }

    return { configured: true, devices, sensors, history, autoModes: await this.getAutoModes(room.id) };
  }

  async getHardware() {
    const room = await this.getOrCreateGlobalRoom();
    if (!room.hardwareConfig) return null;

    const { adafruitKeyEncrypted, room: _room, ...rest } = room.hardwareConfig as HardwareConfig & { room: Room };
    return {
      ...rest,
      adafruitKeyMasked: this.maskKey(adafruitKeyEncrypted),
    };
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
    await this.assertManualCommandAllowed(deviceKey);
    return this.commandDeviceWithSource(deviceKey, dto, userId, 'manual');
  }

  async autoControlDevice(deviceKey: string, userId: string) {
    this.assertValidDeviceKey(deviceKey);
    const room = await this.getOrCreateGlobalRoom();
    const mode = await this.getOrCreateAutoMode(room, deviceKey);
    mode.enabled = !mode.enabled;
    await this.autoControlModes.save(mode);

    const actor = await this.users.findOne({ where: { id: userId } });
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: 'auto_control_mode_changed',
        payload: { deviceKey, enabled: mode.enabled, global: true },
      }),
    );

    if (mode.enabled) {
      await this.runAutoControlForGlobalDevice(room, deviceKey);
    }

    return { deviceKey, enabled: mode.enabled, updatedAt: new Date() };
  }

  private async runAutoControlForGlobalDevice(room: Room, deviceKey: string) {
    this.assertValidDeviceKey(deviceKey);
    const [sensorData, devices] = await Promise.all([
      this.getAggregateSensorData(),
      this.getDevices(),
    ]);
    const prediction = await this.aiService.predictAutoControl({
      sensor_data: sensorData,
      device_states: {
        fan: this.isActiveDeviceValue(devices.devices.fan?.value),
        light: this.isActiveDeviceValue(devices.devices.led?.value),
      },
    });
    const action = this.extractPredictedAction(prediction, deviceKey);

    const result = await this.commandDeviceWithSource(
      deviceKey,
      { value: action },
      undefined,
      'auto_mode',
      prediction,
      {
        ...sensorData,
        hour: this.hourFraction(),
        currentFanState: Number(this.isActiveDeviceValue(devices.devices.fan?.value)),
        currentLightState: Number(this.isActiveDeviceValue(devices.devices.led?.value)),
      },
    );
    const mode = await this.autoControlModes.findOne({ where: { room: { id: room.id }, deviceKey } });
    if (mode) {
      mode.lastRunAt = new Date();
      mode.lastResult = { prediction, result };
      await this.autoControlModes.save(mode);
    }
    return result;
  }

  async retrainAutoControl(userId: string) {
    const rows = await this.autoControlTrainingLogs
      .find({
        where: [
          { source: 'manual', desiredFanAction: Not(IsNull()) },
          { source: 'manual', desiredLightAction: Not(IsNull()) },
        ],
        relations: { room: true },
        order: { createdAt: 'DESC' },
        take: 5000,
      });

    const ai = await this.aiService.retrainAutoControl({
      rows: rows.map((row) => ({
        timestamp: row.createdAt,
        room_id: row.room?.id ?? null,
        temperature: row.temperature,
        humidity: row.humidity,
        light: row.light,
        hour: row.hour,
        current_fan_state: row.currentFanState,
        current_light_state: row.currentLightState,
        desired_fan_action: row.desiredFanAction,
        desired_light_action: row.desiredLightAction,
      })),
    });

    const [room, actor] = await Promise.all([
      this.getOrCreateGlobalRoom(),
      this.users.findOne({ where: { id: userId } }),
    ]);
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: 'auto_control_retrain',
        payload: { ai, samples: rows.length },
      }),
    );

    return ai;
  }

  private async commandDeviceWithSource(
    deviceKey: string,
    dto: CommandDeviceDto,
    userId: string | undefined,
    source: 'manual' | 'auto' | 'auto_mode',
    ai?: unknown,
    trainingContext?: AutoTrainingContext,
  ) {
    this.assertValidDeviceKey(deviceKey);
    const room = await this.getOrCreateGlobalRoom();
    const context = trainingContext ?? await this.getGlobalAutoTrainingContext();

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

    const actor = userId ? await this.users.findOne({ where: { id: userId } }) : null;
    await this.eventLogs.save(
      this.eventLogs.create({
        room,
        actor: actor ?? undefined,
        type: 'device_command',
        payload: {
          deviceKey,
          value,
          source,
          global: true,
          ...(ai !== undefined && { ai }),
          sensorData: {
            temperature: context.temperature,
            humidity: context.humidity,
            light: context.light,
          },
        },
      }),
    );

    await this.saveAutoControlTrainingLog(room, actor ?? undefined, deviceKey, value, source, context, ai);

    return { deviceKey, value, updatedAt: new Date() };
  }

  private assertValidDeviceKey(key: string) {
    if (!(VALID_GLOBAL_DEVICE_KEYS as readonly string[]).includes(key)) {
      throw new BadRequestException(
        `Invalid global device key "${key}". Valid: ${VALID_GLOBAL_DEVICE_KEYS.join(', ')}`,
      );
    }
  }

  private maskKey(encryptedKey: string): string {
    try {
      const plain = decrypt(encryptedKey, this.encryptionKey);
      if (plain.length <= 8) return '****';
      return `${plain.slice(0, 4)}****${plain.slice(-4)}`;
    } catch {
      return '****';
    }
  }

  private async getAggregateSensorData() {
    const rooms = await this.rooms.find({
      where: { name: Not(GLOBAL_ROOM_NAME) },
      relations: { hardwareConfig: true },
    });
    const values: Record<(typeof GLOBAL_AUTO_SENSOR_KEYS)[number], number[]> = {
      temp: [],
      humi: [],
      light: [],
    };

    await Promise.allSettled(
      rooms
        .filter((room) => room.hardwareConfig)
        .flatMap((room) =>
          GLOBAL_AUTO_SENSOR_KEYS.map(async (key) => {
            const { value } = await this.getGlobalSensorValue(room.id, key);
            const numeric = Number(value);
            if (Number.isFinite(numeric)) values[key].push(numeric);
          }),
        ),
    );

    return {
      temperature: this.average(values.temp, 25),
      humidity: this.average(values.humi, 50),
      light: this.average(values.light, 400),
    };
  }

  private async getGlobalAutoTrainingContext(): Promise<AutoTrainingContext> {
    const [sensorData, devices] = await Promise.all([
      this.getAggregateSensorData(),
      this.getDevices(),
    ]);

    return {
      ...sensorData,
      hour: this.hourFraction(),
      currentFanState: Number(this.isActiveDeviceValue(devices.devices.fan?.value)),
      currentLightState: Number(this.isActiveDeviceValue(devices.devices.led?.value)),
    };
  }

  private async getGlobalSensorValue(roomId: string, key: string) {
    try {
      return await this.adafruitService.getLastValue(roomId, key);
    } catch (error) {
      if (key === 'humi') return this.adafruitService.getLastValue(roomId, 'humid');
      throw error;
    }
  }

  private async getGlobalSensorHistory(roomId: string, key: string, limit: number) {
    try {
      return await this.adafruitService.getFeedHistory(roomId, key, limit);
    } catch (error) {
      if (key === 'humi') return this.adafruitService.getFeedHistory(roomId, 'humid', limit);
      throw error;
    }
  }

  private async getAutoModes(roomId: string) {
    const modes = await this.autoControlModes.find({ where: { room: { id: roomId } } });
    return {
      led: modes.find((mode) => mode.deviceKey === 'led')?.enabled ?? false,
      fan: modes.find((mode) => mode.deviceKey === 'fan')?.enabled ?? false,
    };
  }

  private async getOrCreateAutoMode(room: Room, deviceKey: string) {
    const existing = await this.autoControlModes.findOne({
      where: { room: { id: room.id }, deviceKey },
      relations: { room: true },
    });
    if (existing) return existing;
    return this.autoControlModes.save(
      this.autoControlModes.create({ room, deviceKey, enabled: false, lastResult: {} }),
    );
  }

  private async assertManualCommandAllowed(deviceKey: string) {
    const room = await this.getOrCreateGlobalRoom();
    const mode = await this.autoControlModes.findOne({
      where: { room: { id: room.id }, deviceKey, enabled: true },
    });
    if (mode) throw new BadRequestException(`Disable ${deviceKey} auto mode before manual control`);
  }

  private async runEnabledAutoControls() {
    const modes = await this.autoControlModes.find({
      where: { enabled: true },
      relations: { room: true },
    });
    await Promise.allSettled(
      modes
        .filter((mode) => mode.room?.name === GLOBAL_ROOM_NAME)
        .map((mode) => this.runAutoControlForGlobalDevice(mode.room, mode.deviceKey)),
    );
  }

  private async saveAutoControlTrainingLog(
    room: Room,
    actor: User | undefined,
    deviceKey: string,
    value: string,
    source: 'manual' | 'auto' | 'auto_mode',
    context: AutoTrainingContext,
    ai?: unknown,
  ) {
    const trainingSource = source === 'manual' ? 'manual' : 'auto';
    const desiredAction = trainingSource === 'manual' ? this.toBinaryAction(value) : undefined;
    await this.autoControlTrainingLogs.save(
      this.autoControlTrainingLogs.create({
        room,
        actor,
        source: trainingSource,
        deviceKey,
        temperature: context.temperature,
        humidity: context.humidity,
        light: context.light,
        hour: context.hour,
        currentFanState: context.currentFanState,
        currentLightState: context.currentLightState,
        desiredFanAction: deviceKey === 'fan' ? desiredAction : undefined,
        desiredLightAction: deviceKey === 'led' ? desiredAction : undefined,
        metadata: { global: true, ...(ai !== undefined && { ai }) },
      }),
    );
  }

  private average(values: number[], fallback: number) {
    if (!values.length) return fallback;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private isActiveDeviceValue(raw: string | undefined) {
    return ['1', 'true', 'on', 'yes', 'detected'].includes(String(raw ?? '').trim().toLowerCase());
  }

  private hourFraction(now = new Date()) {
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  }

  private toBinaryAction(raw: string) {
    return this.isActiveDeviceValue(raw) ? 1 : 0;
  }

  private autoControlIntervalMs() {
    const minutes = Number(this.config.get<string>('AUTO_CONTROL_INTERVAL_MINUTES', '30'));
    return (Number.isFinite(minutes) && minutes > 0 ? minutes : 30) * 60_000;
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

  private toggleValue(current: string): string {
    const s = String(current ?? '').toUpperCase();
    if (s === '1') return '0';
    if (s === '0') return '1';
    if (s === 'OFF') return 'ON';
    return 'OFF';
  }
}
