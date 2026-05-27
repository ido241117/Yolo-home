import { IsObject, IsOptional, IsString } from 'class-validator';
import { FeedMapping } from '../entities/hardware-config.entity';

export class UpsertHardwareConfigDto {
  @IsString()
  adafruitUsername: string;

  @IsString()
  adafruitKey: string;

  @IsOptional()
  @IsObject()
  feedMapping?: FeedMapping;
}

export class TestConnectionDto {
  @IsOptional()
  @IsString()
  adafruitUsername?: string;

  @IsOptional()
  @IsString()
  adafruitKey?: string;
}
