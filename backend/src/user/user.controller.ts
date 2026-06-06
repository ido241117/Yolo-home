import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { UserService } from './user.service';
import { AssignUserRoomDto } from './dto/assign-user-room.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.Owner)
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  @Roles(UserRole.Owner)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (currentUser.role !== UserRole.Owner && currentUser.id !== id) {
      throw new ForbiddenException();
    }
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('user.notFound');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  @Patch(':id')
  @Roles(UserRole.Owner)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Post(':id/revoke')
  @Roles(UserRole.Owner)
  async revoke(@Param('id') id: string) {
    await this.userService.revoke(id);
    return { message: 'Tài khoản đã bị thu hồi' };
  }

  @Post(':id/reset-password')
  @Roles(UserRole.Owner)
  async resetPassword(@Param('id') id: string) {
    const newPassword = await this.userService.resetPassword(id);
    return { newPassword };
  }

  @Get(':id/rooms')
  @Roles(UserRole.Owner)
  getRoomAssignments(@Param('id') id: string) {
    return this.userService.getRoomAssignments(id);
  }

  @Post(':id/rooms')
  @Roles(UserRole.Owner)
  assignRoom(@Param('id') id: string, @Body() dto: AssignUserRoomDto) {
    return this.userService.assignRoom(id, dto);
  }

  @Delete(':id/rooms/:roomId')
  @Roles(UserRole.Owner)
  removeRoomAssignment(@Param('id') id: string, @Param('roomId') roomId: string) {
    return this.userService.removeRoomAssignment(id, roomId);
  }
}
