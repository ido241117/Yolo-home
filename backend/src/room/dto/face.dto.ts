import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFaceDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  image: string;
}

export class RecognizeFaceDto {
  @IsString()
  @IsNotEmpty()
  image: string;
}
