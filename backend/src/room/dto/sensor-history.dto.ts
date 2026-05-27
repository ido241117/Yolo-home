import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const VALID_SENSOR_KEYS = ['temp', 'humi', 'light', 'human'] as const;

export class SensorHistoryQueryDto {
  @IsIn(VALID_SENSOR_KEYS)
  sensorKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
