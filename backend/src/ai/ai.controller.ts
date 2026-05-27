import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AutoControlPredictDto } from './dto/auto-control-predict.dto';
import { FaceRecognitionDto } from './dto/face-recognition.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  health() {
    return this.aiService.health();
  }

  @Post('rooms/:roomId/face-recognition')
  recognizeFace(@Param('roomId') roomId: string, @Body() body: FaceRecognitionDto) {
    return this.aiService.recognizeFace(roomId, body.image);
  }

  @Post('auto-control/predict')
  predictAutoControl(@Body() body: AutoControlPredictDto) {
    return this.aiService.predictAutoControl(body as Record<string, unknown>);
  }
}
