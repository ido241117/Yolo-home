import { IsObject, IsOptional } from 'class-validator';

export class AutoControlPredictDto {
  @IsObject()
  @IsOptional()
  sensor_data?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  sensorData?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  device_states?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  deviceStates?: Record<string, unknown>;
}
