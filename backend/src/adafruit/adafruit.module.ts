import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HardwareConfig } from '../room/entities/hardware-config.entity';
import { AdafruitService } from './adafruit.service';

@Module({
  imports: [TypeOrmModule.forFeature([HardwareConfig])],
  providers: [AdafruitService],
  exports: [AdafruitService],
})
export class AdafruitModule {}
