import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdafruitService } from '../adafruit/adafruit.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { CommandDeviceDto } from './dto/command-device.dto';
import { RecognizeFaceDto, RegisterFaceDto } from './dto/face.dto';
import { RoomEventsQueryDto } from './dto/room-events-query.dto';
import { SensorHistoryQueryDto } from './dto/sensor-history.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpsertHardwareConfigDto, TestConnectionDto } from './dto/hardware-config.dto';
import { AddMemberDto, UpdateMemberDto } from './dto/member.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { DevicePermissionGuard } from './guards/device-permission.guard';
import { DoorControlGuard } from './guards/door-control.guard';
import { FaceManageGuard } from './guards/face-manage.guard';
import { RoomAdminGuard } from './guards/room-admin.guard';
import { RoomMemberGuard } from './guards/room-member.guard';
import { SensorViewGuard } from './guards/sensor-view.guard';
import { RoomService } from './room.service';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomController {
  constructor(
    private readonly roomsService: RoomService,
    private readonly adafruitService: AdafruitService,
  ) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Post()
  @Roles(UserRole.Owner)
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get(':id/summary')
  @UseGuards(RoomMemberGuard)
  getSummary(@Param('id') id: string) {
    return this.roomsService.getSummary(id);
  }

  // --- Faces ---

  @Get(':roomId/faces')
  @UseGuards(FaceManageGuard)
  getFaces(@Param('roomId') roomId: string) {
    return this.roomsService.getFaces(roomId);
  }

  @Post(':roomId/faces')
  @UseGuards(FaceManageGuard)
  registerFace(@Param('roomId') roomId: string, @Body() dto: RegisterFaceDto) {
    return this.roomsService.registerFace(roomId, dto);
  }

  @Delete(':roomId/faces/:faceId')
  @UseGuards(FaceManageGuard)
  deleteFace(@Param('roomId') roomId: string, @Param('faceId') faceId: string) {
    return this.roomsService.deleteFace(roomId, faceId);
  }

  @Post(':roomId/faces/retrain')
  @UseGuards(FaceManageGuard)
  retrainFaces(@Param('roomId') roomId: string) {
    return this.roomsService.retrainFaces(roomId);
  }

  @Post(':roomId/face-recognition')
  @UseGuards(DoorControlGuard)
  recognizeFace(
    @Param('roomId') roomId: string,
    @Body() dto: RecognizeFaceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.roomsService.recognizeFace(roomId, dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Owner)
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Owner)
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  // --- Hardware config ---

  @Get(':id/hardware')
  getHardware(@Param('id') id: string) {
    return this.roomsService.getHardware(id);
  }

  @Patch(':id/hardware')
  @Roles(UserRole.Owner)
  upsertHardware(@Param('id') id: string, @Body() dto: UpsertHardwareConfigDto) {
    return this.roomsService.upsertHardware(id, dto);
  }

  @Post(':id/hardware/test-connection')
  @Roles(UserRole.Owner)
  async testConnection(@Param('id') id: string, @Body() body: TestConnectionDto) {
    if (body.adafruitUsername && body.adafruitKey) {
      const ok = await this.adafruitService.testConnection(body.adafruitUsername, body.adafruitKey);
      return { ok };
    }
    const ok = await this.adafruitService.testConnectionForRoom(id);
    return { ok };
  }

  // --- Members ---

  @Get(':roomId/members')
  @UseGuards(RoomAdminGuard)
  getMembers(@Param('roomId') roomId: string) {
    return this.roomsService.getMembers(roomId);
  }

  @Post(':roomId/members')
  @UseGuards(RoomAdminGuard)
  addMember(@Param('roomId') roomId: string, @Body() dto: AddMemberDto) {
    return this.roomsService.addMember(roomId, dto);
  }

  @Patch(':roomId/members/:userId')
  @UseGuards(RoomAdminGuard)
  updateMember(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.roomsService.updateMember(roomId, userId, dto);
  }

  @Delete(':roomId/members/:userId')
  @UseGuards(RoomAdminGuard)
  removeMember(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    return this.roomsService.removeMember(roomId, userId);
  }

  // --- Permissions ---

  @Get(':roomId/permissions/:userId')
  @UseGuards(RoomAdminGuard)
  getPermission(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    return this.roomsService.getPermission(roomId, userId);
  }

  @Patch(':roomId/permissions/:userId')
  @UseGuards(RoomAdminGuard)
  updatePermission(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.roomsService.updatePermission(roomId, userId, dto);
  }

  // --- Devices ---

  @Get(':roomId/devices')
  @UseGuards(RoomMemberGuard)
  getDevices(@Param('roomId') roomId: string) {
    return this.roomsService.getDevices(roomId);
  }

  @Get(':roomId/devices/:deviceKey/state')
  @UseGuards(RoomMemberGuard)
  getDeviceState(@Param('roomId') roomId: string, @Param('deviceKey') deviceKey: string) {
    return this.roomsService.getDeviceState(roomId, deviceKey);
  }

  @Post(':roomId/devices/:deviceKey/command')
  @UseGuards(DevicePermissionGuard)
  commandDevice(
    @Param('roomId') roomId: string,
    @Param('deviceKey') deviceKey: string,
    @Body() dto: CommandDeviceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.roomsService.commandDevice(roomId, deviceKey, dto, user.id);
  }

  // --- Event logs ---

  @Get(':roomId/events')
  @UseGuards(RoomMemberGuard)
  getRoomEvents(@Param('roomId') roomId: string, @Query() query: RoomEventsQueryDto) {
    return this.roomsService.getRoomEvents(roomId, query.limit, query.from, query.to);
  }

  // --- Sensors ---

  @Get(':roomId/sensors')
  @UseGuards(SensorViewGuard)
  getSensors(@Param('roomId') roomId: string) {
    return this.roomsService.getSensors(roomId);
  }

  // /history must be registered before /:sensorKey to avoid param capture
  @Get(':roomId/sensors/history')
  @UseGuards(SensorViewGuard)
  getSensorHistory(@Param('roomId') roomId: string, @Query() query: SensorHistoryQueryDto) {
    return this.roomsService.getSensorHistory(roomId, query.sensorKey, query.limit, query.from, query.to);
  }

  @Get(':roomId/sensors/:sensorKey')
  @UseGuards(SensorViewGuard)
  getSensorState(@Param('roomId') roomId: string, @Param('sensorKey') sensorKey: string) {
    return this.roomsService.getSensorState(roomId, sensorKey);
  }
}
