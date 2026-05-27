/**
 * Test data seed for Rental Smart Room Management.
 *
 * This script resets the public schema and inserts a complete local dataset.
 *
 * Run from backend/:
 *   npm run seed
 *
 * Test accounts:
 *   owner       / owner123    - landlord, full web access
 *   admin01     / admin123    - global admin, web/mobile global devices
 *   manager101  / admin123    - room admin for Room 101 and Room 102
 *   tenant101   / tenant123   - Room 101, led/fan/sensors/faces
 *   tenant102   / tenant123   - Room 101, led/sensors only
 *   tenant201   / tenant123   - Room 102, led/fan/door/sensors
 *   revoked     / test123     - inactive account, login should fail
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { buildEncryptionKey, encrypt } from '../src/common/encryption';
import { GLOBAL_ROOM_NAME } from '../src/global-devices/global-devices.service';
import { EventLog } from '../src/room/entities/event-log.entity';
import { FaceLabel } from '../src/room/entities/face-label.entity';
import { HardwareConfig, FeedMapping } from '../src/room/entities/hardware-config.entity';
import { Permission } from '../src/room/entities/permission.entity';
import { Room, RoomStatus } from '../src/room/entities/room.entity';
import { SensorSnapshot } from '../src/room/entities/sensor-snapshot.entity';
import { User, UserRole } from '../src/user/entities/user.entity';

const DEFAULT_FEED_MAPPING: FeedMapping = {
  led: 'led',
  fan: 'fan',
  door: 'door',
  temp: 'temp',
  humi: 'humi',
  light: 'light',
  human: 'human',
};

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'dadn',
  password: process.env.DB_PASSWORD ?? 'dadn_password',
  database: process.env.DB_DATABASE ?? 'dadn',
  entities: [User, Room, HardwareConfig, Permission, EventLog, SensorSnapshot, FaceLabel],
  synchronize: false,
});

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

async function seed() {
  await ds.initialize();
  console.log('Connected to database');

  console.log('Resetting public schema');
  await ds.query('DROP SCHEMA public CASCADE');
  await ds.query('CREATE SCHEMA public');
  await ds.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await ds.synchronize();

  const encryptionKey = buildEncryptionKey(process.env.ENCRYPTION_KEY ?? 'default_dev_key_change_me');
  const hash = (password: string) => bcrypt.hash(password, 10);

  const users = ds.getRepository(User);
  const rooms = ds.getRepository(Room);
  const hardwareConfigs = ds.getRepository(HardwareConfig);
  const permissions = ds.getRepository(Permission);
  const eventLogs = ds.getRepository(EventLog);
  const sensorSnapshots = ds.getRepository(SensorSnapshot);
  const faceLabels = ds.getRepository(FaceLabel);

  const owner = await users.save(
    users.create({
      name: 'Owner Demo',
      username: 'owner',
      passwordHash: await hash('owner123'),
      role: UserRole.Owner,
      active: true,
      isGlobalAdmin: false,
      phone: '0900000001',
    }),
  );

  const globalAdmin = await users.save(
    users.create({
      name: 'Global Admin Demo',
      username: 'admin01',
      passwordHash: await hash('admin123'),
      role: UserRole.Admin,
      active: true,
      isGlobalAdmin: true,
      phone: '0900000002',
    }),
  );

  const roomAdmin = await users.save(
    users.create({
      name: 'Room Manager Demo',
      username: 'manager101',
      passwordHash: await hash('admin123'),
      role: UserRole.Admin,
      active: true,
      isGlobalAdmin: false,
      phone: '0900000003',
    }),
  );

  const tenant101 = await users.save(
    users.create({
      name: 'Tenant Room 101 A',
      username: 'tenant101',
      passwordHash: await hash('tenant123'),
      role: UserRole.Tenant,
      active: true,
      phone: '0910101101',
    }),
  );

  const tenant102 = await users.save(
    users.create({
      name: 'Tenant Room 101 B',
      username: 'tenant102',
      passwordHash: await hash('tenant123'),
      role: UserRole.Tenant,
      active: true,
      phone: '0910101102',
    }),
  );

  const tenant201 = await users.save(
    users.create({
      name: 'Tenant Room 102',
      username: 'tenant201',
      passwordHash: await hash('tenant123'),
      role: UserRole.Tenant,
      active: true,
      phone: '0910201201',
    }),
  );

  await users.save(
    users.create({
      name: 'Revoked Test Account',
      username: 'revoked',
      passwordHash: await hash('test123'),
      role: UserRole.Tenant,
      active: false,
      phone: '0999999999',
    }),
  );

  const globalRoom = await rooms.save(
    rooms.create({
      name: GLOBAL_ROOM_NAME,
      status: RoomStatus.Maintenance,
      description: 'Hidden room used as source of truth for global led/fan devices',
    }),
  );

  const room101 = await rooms.save(
    rooms.create({
      name: 'Room 101',
      status: RoomStatus.Occupied,
      description: 'Occupied room with two tenants and face management enabled',
    }),
  );

  const room102 = await rooms.save(
    rooms.create({
      name: 'Room 102',
      status: RoomStatus.Occupied,
      description: 'Occupied room with one tenant and full device access',
    }),
  );

  const room201 = await rooms.save(
    rooms.create({
      name: 'Room 201',
      status: RoomStatus.Vacant,
      description: 'Vacant room prepared for onboarding',
    }),
  );

  const room301 = await rooms.save(
    rooms.create({
      name: 'Room 301',
      status: RoomStatus.Maintenance,
      description: 'Maintenance room with sensor alert history',
    }),
  );

  await hardwareConfigs.save([
    hardwareConfigs.create({
      room: globalRoom,
      adafruitUsername: 'demo_global_aio',
      adafruitKeyEncrypted: encrypt('demo_global_key_replace_me', encryptionKey),
      feedMapping: { led: 'global-led', fan: 'global-fan' },
    }),
    hardwareConfigs.create({
      room: room101,
      adafruitUsername: 'demo_room_101_aio',
      adafruitKeyEncrypted: encrypt('demo_room_101_key_replace_me', encryptionKey),
      feedMapping: DEFAULT_FEED_MAPPING,
    }),
    hardwareConfigs.create({
      room: room102,
      adafruitUsername: 'demo_room_102_aio',
      adafruitKeyEncrypted: encrypt('demo_room_102_key_replace_me', encryptionKey),
      feedMapping: DEFAULT_FEED_MAPPING,
    }),
    hardwareConfigs.create({
      room: room201,
      adafruitUsername: 'demo_room_201_aio',
      adafruitKeyEncrypted: encrypt('demo_room_201_key_replace_me', encryptionKey),
      feedMapping: DEFAULT_FEED_MAPPING,
    }),
    hardwareConfigs.create({
      room: room301,
      adafruitUsername: 'demo_room_301_aio',
      adafruitKeyEncrypted: encrypt('demo_room_301_key_replace_me', encryptionKey),
      feedMapping: DEFAULT_FEED_MAPPING,
    }),
  ]);

  await permissions.save([
    permissions.create({
      room: room101,
      user: globalAdmin,
      canControlLed: true,
      canControlFan: true,
      canControlDoor: true,
      canViewSensors: true,
      canManageFaces: true,
      isRoomAdmin: true,
    }),
    permissions.create({
      room: room101,
      user: roomAdmin,
      canControlLed: true,
      canControlFan: true,
      canControlDoor: true,
      canViewSensors: true,
      canManageFaces: true,
      isRoomAdmin: true,
    }),
    permissions.create({
      room: room102,
      user: roomAdmin,
      canControlLed: true,
      canControlFan: true,
      canControlDoor: false,
      canViewSensors: true,
      canManageFaces: false,
      isRoomAdmin: true,
    }),
    permissions.create({
      room: room101,
      user: tenant101,
      canControlLed: true,
      canControlFan: true,
      canControlDoor: false,
      canViewSensors: true,
      canManageFaces: true,
      isRoomAdmin: false,
    }),
    permissions.create({
      room: room101,
      user: tenant102,
      canControlLed: true,
      canControlFan: false,
      canControlDoor: false,
      canViewSensors: true,
      canManageFaces: false,
      isRoomAdmin: false,
    }),
    permissions.create({
      room: room102,
      user: tenant201,
      canControlLed: true,
      canControlFan: true,
      canControlDoor: true,
      canViewSensors: true,
      canManageFaces: true,
      isRoomAdmin: false,
    }),
  ]);

  await faceLabels.save([
    faceLabels.create({ room: room101, label: 'tenant101_primary', displayName: 'Tenant 101 A' }),
    faceLabels.create({ room: room101, label: 'tenant102_primary', displayName: 'Tenant 101 B' }),
    faceLabels.create({ room: room102, label: 'tenant201_primary', displayName: 'Tenant 102' }),
  ]);

  const now = new Date();
  await sensorSnapshots.save([
    sensorSnapshots.create({ room: room101, sensorKey: 'temp', value: '29.4', createdAt: addMinutes(now, -90) }),
    sensorSnapshots.create({ room: room101, sensorKey: 'humi', value: '68', createdAt: addMinutes(now, -80) }),
    sensorSnapshots.create({ room: room101, sensorKey: 'light', value: '210', createdAt: addMinutes(now, -70) }),
    sensorSnapshots.create({ room: room101, sensorKey: 'human', value: '1', createdAt: addMinutes(now, -10) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'temp', value: '27.8', createdAt: addMinutes(now, -60) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'humi', value: '63', createdAt: addMinutes(now, -50) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'human', value: '0', createdAt: addMinutes(now, -40) }),
    sensorSnapshots.create({ room: room301, sensorKey: 'human', value: '1', createdAt: addMinutes(now, -30) }),
  ]);

  await eventLogs.save([
    eventLogs.create({
      room: room101,
      actor: owner,
      type: 'room_created',
      payload: { status: room101.status },
      createdAt: addMinutes(now, -240),
    }),
    eventLogs.create({
      room: room101,
      actor: tenant101,
      type: 'device_command',
      payload: { deviceKey: 'led', value: '1', source: 'mobile' },
      createdAt: addMinutes(now, -120),
    }),
    eventLogs.create({
      room: room101,
      actor: tenant101,
      type: 'face_recognized',
      payload: { label: 'tenant101_primary', confidence: 0.96, doorUnlocked: true },
      createdAt: addMinutes(now, -55),
    }),
    eventLogs.create({
      room: room101,
      type: 'human_detected',
      payload: { sensorKey: 'human', value: '1', outsideHours: true },
      createdAt: addMinutes(now, -10),
    }),
    eventLogs.create({
      room: room102,
      actor: tenant201,
      type: 'device_command',
      payload: { deviceKey: 'fan', value: '1', source: 'mobile' },
      createdAt: addMinutes(now, -45),
    }),
    eventLogs.create({
      room: room301,
      type: 'human_detected',
      payload: { sensorKey: 'human', value: '1', outsideHours: false },
      createdAt: addMinutes(now, -30),
    }),
    eventLogs.create({
      room: globalRoom,
      actor: globalAdmin,
      type: 'device_command',
      payload: { deviceKey: 'led', value: '0', source: 'web', global: true },
      createdAt: addMinutes(now, -25),
    }),
  ]);

  console.log('Seed completed');
  console.table({
    users: await users.count(),
    rooms: await rooms.count(),
    hardwareConfigs: await hardwareConfigs.count(),
    permissions: await permissions.count(),
    faceLabels: await faceLabels.count(),
    sensorSnapshots: await sensorSnapshots.count(),
    eventLogs: await eventLogs.count(),
  });
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (ds.isInitialized) await ds.destroy();
  });
