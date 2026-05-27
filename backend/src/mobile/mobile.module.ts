import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../room/entities/permission.entity';
import { RoomModule } from '../room/room.module';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), RoomModule],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}
