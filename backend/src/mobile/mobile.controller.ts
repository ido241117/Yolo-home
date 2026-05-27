import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MobileService } from './mobile.service';

@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('my-room')
  getMyRoom(@CurrentUser() user: RequestUser) {
    return this.mobileService.getMyRoom(user.id);
  }

  @Get('my-permissions')
  getMyPermissions(@CurrentUser() user: RequestUser) {
    return this.mobileService.getMyPermissions(user.id);
  }

  @Get('my-devices')
  getMyDevices(@CurrentUser() user: RequestUser) {
    return this.mobileService.getMyDevices(user.id);
  }

  @Get('my-sensors')
  getMySensors(@CurrentUser() user: RequestUser) {
    return this.mobileService.getMySensors(user.id);
  }
}
