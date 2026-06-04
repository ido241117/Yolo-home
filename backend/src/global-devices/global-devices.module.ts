import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdafruitModule } from '../adafruit/adafruit.module';
import { AiModule } from '../ai/ai.module';
import { EventLog } from '../room/entities/event-log.entity';
import { HardwareConfig } from '../room/entities/hardware-config.entity';
import { Room } from '../room/entities/room.entity';
import { User } from '../user/entities/user.entity';
import { GlobalAdminGuard } from './guards/global-admin.guard';
import { GlobalDevicesController } from './global-devices.controller';
import { GlobalDevicesService } from './global-devices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, HardwareConfig, EventLog, User]),
    AdafruitModule,
    AiModule,
  ],
  controllers: [GlobalDevicesController],
  providers: [GlobalDevicesService, GlobalAdminGuard],
})
export class GlobalDevicesModule {}
