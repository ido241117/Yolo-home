import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AssignUserRoomDto {
  @IsUUID()
  roomId: string;

  @IsBoolean()
  @IsOptional()
  canControlLed?: boolean;

  @IsBoolean()
  @IsOptional()
  canControlFan?: boolean;

  @IsBoolean()
  @IsOptional()
  canControlDoor?: boolean;

  @IsBoolean()
  @IsOptional()
  canViewSensors?: boolean;

  @IsBoolean()
  @IsOptional()
  canManageFaces?: boolean;

  @IsBoolean()
  @IsOptional()
  isRoomAdmin?: boolean;
}
