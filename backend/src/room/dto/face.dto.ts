import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterFaceDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class RecognizeFaceDto {
  @IsString()
  @IsNotEmpty()
  image: string;
}
