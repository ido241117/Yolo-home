/**
 * Local seed for DADN without mocking users or Adafruit credentials.
 *
 * This script resets the public schema, lets TypeORM synchronize tables, then
 * inserts demo rooms, sensor/event history, face labels, and auto-control
 * training rows. Users and hardware_configs are intentionally left empty.
 *
 * Run from backend/:
 *   npm run seed
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { GLOBAL_ROOM_NAME } from '../src/global-devices/global-devices.service';
import { AutoControlTrainingLog } from '../src/room/entities/auto-control-training-log.entity';
import { EventLog } from '../src/room/entities/event-log.entity';
import { FaceLabel } from '../src/room/entities/face-label.entity';
import { HardwareConfig } from '../src/room/entities/hardware-config.entity';
import { Permission } from '../src/room/entities/permission.entity';
import { Room, RoomStatus } from '../src/room/entities/room.entity';
import { SensorSnapshot } from '../src/room/entities/sensor-snapshot.entity';
import { User } from '../src/user/entities/user.entity';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'dadn',
  password: process.env.DB_PASSWORD ?? 'dadn_password',
  database: process.env.DB_DATABASE ?? 'dadn',
  entities: [
    User,
    Room,
    HardwareConfig,
    Permission,
    EventLog,
    SensorSnapshot,
    FaceLabel,
    AutoControlTrainingLog,
  ],
  synchronize: false,
});

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function hourFraction(date: Date) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

async function seed() {
  await ds.initialize();
  console.log('Connected to database');

  console.log('Resetting public schema');
  await ds.query('DROP SCHEMA IF EXISTS public CASCADE');
  await ds.query('CREATE SCHEMA public');
  await ds.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await ds.synchronize();

  const rooms = ds.getRepository(Room);
  const eventLogs = ds.getRepository(EventLog);
  const sensorSnapshots = ds.getRepository(SensorSnapshot);
  const faceLabels = ds.getRepository(FaceLabel);
  const autoControlTrainingLogs = ds.getRepository(AutoControlTrainingLog);

  const globalRoom = await rooms.save(
    rooms.create({
      name: GLOBAL_ROOM_NAME,
      code: 'global',
      status: RoomStatus.Maintenance,
      description: 'Hidden room used for global led/fan state and auto-control retrain events.',
    }),
  );

  const room101 = await rooms.save(
    rooms.create({
      name: 'Room 101',
      code: '101',
      status: RoomStatus.Occupied,
      description: 'Occupied demo room with warm daytime behavior.',
    }),
  );

  const room102 = await rooms.save(
    rooms.create({
      name: 'Room 102',
      code: '102',
      status: RoomStatus.Occupied,
      description: 'Occupied demo room with evening light usage.',
    }),
  );

  const room201 = await rooms.save(
    rooms.create({
      name: 'Room 201',
      code: '201',
      status: RoomStatus.Vacant,
      description: 'Vacant room prepared for onboarding.',
    }),
  );

  const room301 = await rooms.save(
    rooms.create({
      name: 'Room 301',
      code: '301',
      status: RoomStatus.Maintenance,
      description: 'Maintenance room with alert history.',
    }),
  );

  await faceLabels.save([
    faceLabels.create({ room: room101, label: 'demo_face_room101_a', displayName: 'Demo Face 101 A' }),
    faceLabels.create({ room: room101, label: 'demo_face_room101_b', displayName: 'Demo Face 101 B' }),
    faceLabels.create({ room: room102, label: 'demo_face_room102_a', displayName: 'Demo Face 102 A' }),
  ]);

  const now = new Date();
  await sensorSnapshots.save([
    sensorSnapshots.create({ room: room101, sensorKey: 'temp', value: '29.4', createdAt: addMinutes(now, -90) }),
    sensorSnapshots.create({ room: room101, sensorKey: 'humi', value: '68', createdAt: addMinutes(now, -85) }),
    sensorSnapshots.create({ room: room101, sensorKey: 'light', value: '210', createdAt: addMinutes(now, -80) }),
    sensorSnapshots.create({ room: room101, sensorKey: 'human', value: '1', createdAt: addMinutes(now, -10) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'temp', value: '27.8', createdAt: addMinutes(now, -70) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'humi', value: '63', createdAt: addMinutes(now, -65) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'light', value: '140', createdAt: addMinutes(now, -60) }),
    sensorSnapshots.create({ room: room102, sensorKey: 'human', value: '0', createdAt: addMinutes(now, -40) }),
    sensorSnapshots.create({ room: room301, sensorKey: 'human', value: '1', createdAt: addMinutes(now, -30) }),
  ]);

  await eventLogs.save([
    eventLogs.create({
      room: room101,
      type: 'room_seeded',
      payload: { status: room101.status },
      createdAt: addMinutes(now, -240),
    }),
    eventLogs.create({
      room: room101,
      type: 'device_command',
      payload: { deviceKey: 'led', value: '1', source: 'manual', seeded: true },
      createdAt: addMinutes(now, -120),
    }),
    eventLogs.create({
      room: room101,
      type: 'face_recognized',
      payload: { label: 'demo_face_room101_a', confidence: 0.96, doorUnlocked: true, seeded: true },
      createdAt: addMinutes(now, -55),
    }),
    eventLogs.create({
      room: room101,
      type: 'human_detected',
      payload: { sensorKey: 'human', value: '1', outsideHours: true, seeded: true },
      createdAt: addMinutes(now, -10),
    }),
    eventLogs.create({
      room: room102,
      type: 'device_command',
      payload: { deviceKey: 'fan', value: '1', source: 'manual', seeded: true },
      createdAt: addMinutes(now, -45),
    }),
    eventLogs.create({
      room: room301,
      type: 'human_detected',
      payload: { sensorKey: 'human', value: '1', outsideHours: false, seeded: true },
      createdAt: addMinutes(now, -30),
    }),
    eventLogs.create({
      room: globalRoom,
      type: 'auto_control_seed_ready',
      payload: { samples: 16, defaultModelsPreserved: true },
      createdAt: addMinutes(now, -25),
    }),
  ]);

  const trainingRows = [
    { room: room101, source: 'manual' as const, deviceKey: 'fan', temperature: 29.1, humidity: 68.2, light: 412, hour: 10.0, currentFanState: 0, currentLightState: 1, desiredFanAction: 1 },
    { room: room101, source: 'manual' as const, deviceKey: 'fan', temperature: 27.4, humidity: 61.0, light: 360, hour: 8.5, currentFanState: 0, currentLightState: 0, desiredFanAction: 0 },
    { room: room102, source: 'manual' as const, deviceKey: 'fan', temperature: 31.2, humidity: 72.0, light: 520, hour: 14.25, currentFanState: 0, currentLightState: 0, desiredFanAction: 1 },
    { room: room102, source: 'manual' as const, deviceKey: 'fan', temperature: 25.8, humidity: 55.5, light: 240, hour: 21.0, currentFanState: 1, currentLightState: 1, desiredFanAction: 0 },
    { room: room201, source: 'manual' as const, deviceKey: 'fan', temperature: 30.3, humidity: 70.4, light: 480, hour: 16.75, currentFanState: 0, currentLightState: 0, desiredFanAction: 1 },
    { room: room201, source: 'manual' as const, deviceKey: 'fan', temperature: 24.9, humidity: 52.8, light: 180, hour: 6.25, currentFanState: 0, currentLightState: 0, desiredFanAction: 0 },
    { room: room101, source: 'manual' as const, deviceKey: 'led', temperature: 28.0, humidity: 64.0, light: 95, hour: 19.5, currentFanState: 0, currentLightState: 0, desiredLightAction: 1 },
    { room: room101, source: 'manual' as const, deviceKey: 'led', temperature: 28.5, humidity: 65.0, light: 460, hour: 13.0, currentFanState: 1, currentLightState: 1, desiredLightAction: 0 },
    { room: room102, source: 'manual' as const, deviceKey: 'led', temperature: 27.2, humidity: 60.0, light: 120, hour: 20.25, currentFanState: 0, currentLightState: 0, desiredLightAction: 1 },
    { room: room102, source: 'manual' as const, deviceKey: 'led', temperature: 26.8, humidity: 58.0, light: 610, hour: 11.75, currentFanState: 0, currentLightState: 1, desiredLightAction: 0 },
    { room: room301, source: 'manual' as const, deviceKey: 'led', temperature: 29.0, humidity: 66.0, light: 80, hour: 5.75, currentFanState: 0, currentLightState: 0, desiredLightAction: 1 },
    { room: room301, source: 'manual' as const, deviceKey: 'led', temperature: 25.0, humidity: 53.0, light: 720, hour: 15.5, currentFanState: 0, currentLightState: 1, desiredLightAction: 0 },
    { room: globalRoom, source: 'auto' as const, deviceKey: 'fan', temperature: 30.8, humidity: 69.5, light: 430, hour: hourFraction(now), currentFanState: 0, currentLightState: 0 },
    { room: globalRoom, source: 'auto' as const, deviceKey: 'led', temperature: 27.0, humidity: 59.0, light: 125, hour: hourFraction(now), currentFanState: 0, currentLightState: 0 },
  ];

  await autoControlTrainingLogs.save(
    trainingRows.map((row, index) =>
      autoControlTrainingLogs.create({
        ...row,
        createdAt: addMinutes(now, -trainingRows.length + index),
        metadata: { seeded: true },
      }),
    ),
  );

  console.log('Seed completed');
  console.table({
    users: await ds.getRepository(User).count(),
    rooms: await rooms.count(),
    hardwareConfigs: await ds.getRepository(HardwareConfig).count(),
    permissions: await ds.getRepository(Permission).count(),
    faceLabels: await faceLabels.count(),
    sensorSnapshots: await sensorSnapshots.count(),
    eventLogs: await eventLogs.count(),
    autoControlTrainingLogs: await autoControlTrainingLogs.count(),
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
