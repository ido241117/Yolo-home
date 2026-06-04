import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdafruitModule } from '../adafruit/adafruit.module';
import { AiModule } from '../ai/ai.module';
import { User } from '../user/entities/user.entity';
import { AutoControlMode } from './entities/auto-control-mode.entity';
import { AutoControlTrainingLog } from './entities/auto-control-training-log.entity';
import { EventLog } from './entities/event-log.entity';
import { FaceLabel } from './entities/face-label.entity';
import { HardwareConfig } from './entities/hardware-config.entity';
import { Permission } from './entities/permission.entity';
import { Room } from './entities/room.entity';
import { SensorSnapshot } from './entities/sensor-snapshot.entity';
import { DevicePermissionGuard } from './guards/device-permission.guard';
import { DoorControlGuard } from './guards/door-control.guard';
import { FaceManageGuard } from './guards/face-manage.guard';
import { RoomAdminGuard } from './guards/room-admin.guard';
import { RoomMemberGuard } from './guards/room-member.guard';
import { SensorViewGuard } from './guards/sensor-view.guard';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Permission, HardwareConfig, EventLog, SensorSnapshot, FaceLabel, AutoControlTrainingLog, AutoControlMode, User]),
    AdafruitModule,
    AiModule,
  ],
  controllers: [RoomController],
  providers: [
    RoomService,
    RoomAdminGuard,
    RoomMemberGuard,
    DevicePermissionGuard,
    DoorControlGuard,
    FaceManageGuard,
    SensorViewGuard,
  ],
  exports: [
    RoomService,
    RoomAdminGuard,
    RoomMemberGuard,
    DevicePermissionGuard,
    DoorControlGuard,
    FaceManageGuard,
    SensorViewGuard,
  ],
})
export class RoomModule {}
