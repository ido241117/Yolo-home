import { IsNotEmpty, IsString } from 'class-validator';

export class FaceRecognitionDto {
  @IsString()
  @IsNotEmpty()
  image: string;
}
