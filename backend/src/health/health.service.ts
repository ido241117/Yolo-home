import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'dadn-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
