import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('AI_SERVICE_URL', 'http://localhost:8001/ai');
  }

  async health() {
    try {
      const response = await firstValueFrom(this.http.get(`${this.baseUrl}/health`));
      return response.data;
    } catch {
      throw new ServiceUnavailableException('Python AI service is unavailable');
    }
  }

  async recognizeFace(roomId: string, image: string) {
    const response = await firstValueFrom(
      this.http.post(`${this.baseUrl}/face/recognize`, { roomId, image }),
    );
    return response.data;
  }

  async registerFace(roomId: string, label: string, image: string) {
    const response = await firstValueFrom(
      this.http.post(`${this.baseUrl}/face/register`, { roomId, label, image }),
    );
    return response.data;
  }

  async listFaces(roomId: string) {
    const response = await firstValueFrom(
      this.http.get(`${this.baseUrl}/face/labels`, { params: { roomId } }),
    );
    return response.data;
  }

  async deleteFace(roomId: string, label: string) {
    const response = await firstValueFrom(
      this.http.delete(`${this.baseUrl}/face/labels/${encodeURIComponent(label)}`, {
        params: { roomId },
      }),
    );
    return response.data;
  }

  async retrainFaces(roomId: string) {
    const response = await firstValueFrom(this.http.post(`${this.baseUrl}/face/retrain`, { roomId }));
    return response.data;
  }

  async predictAutoControl(payload: Record<string, unknown>) {
    const response = await firstValueFrom(this.http.post(`${this.baseUrl}/auto-control/predict`, payload));
    return response.data;
  }
}
