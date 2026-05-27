import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CommandDeviceDto } from '../room/dto/command-device.dto';
import { UpsertHardwareConfigDto } from '../room/dto/hardware-config.dto';
import { GlobalAdminGuard } from './guards/global-admin.guard';
import { GlobalDevicesService } from './global-devices.service';

@Controller('global-devices')
@UseGuards(JwtAuthGuard, RolesGuard, GlobalAdminGuard)
export class GlobalDevicesController {
  constructor(private readonly globalDevicesService: GlobalDevicesService) {}

  @Get()
  getDevices() {
    return this.globalDevicesService.getDevices();
  }

  // /hardware must be registered before /:deviceKey to avoid param capture
  @Patch('hardware')
  upsertHardware(@Body() dto: UpsertHardwareConfigDto) {
    return this.globalDevicesService.upsertHardware(dto);
  }

  @Get(':deviceKey/state')
  getDeviceState(@Param('deviceKey') deviceKey: string) {
    return this.globalDevicesService.getDeviceState(deviceKey);
  }

  @Post(':deviceKey/command')
  commandDevice(
    @Param('deviceKey') deviceKey: string,
    @Body() dto: CommandDeviceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.globalDevicesService.commandDevice(deviceKey, dto, user.id);
  }
}
