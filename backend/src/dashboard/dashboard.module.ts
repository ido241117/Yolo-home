import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdafruitModule } from '../adafruit/adafruit.module';
import { Room } from '../room/entities/room.entity';
import { User } from '../user/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User]), AdafruitModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
