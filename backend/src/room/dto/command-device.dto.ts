import { IsIn, IsOptional, IsString } from 'class-validator';

export class CommandDeviceDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsIn(['toggle'])
  @IsOptional()
  action?: 'toggle';
}
