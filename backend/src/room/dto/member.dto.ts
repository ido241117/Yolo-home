import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  userId: string;
}

export class UpdateMemberDto {
  @IsBoolean()
  @IsOptional()
  isRoomAdmin?: boolean;
}
