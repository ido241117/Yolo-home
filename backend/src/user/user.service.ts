import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../room/entities/permission.entity';
import { Room } from '../room/entities/room.entity';
import { User, UserRole } from './entities/user.entity';
import { RoomStatus } from '../room/entities/room.entity';
import { AssignUserRoomDto } from './dto/assign-user-room.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const DEFAULT_RESET_PASSWORD = '123456';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  private safe({ passwordHash, ...rest }: User) {
    return rest;
  }

  async findAll() {
    const users = await this.users.find({ order: { createdAt: 'DESC' } });
    return users.map((u) => this.safe(u));
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByUsername(username: string): Promise<User | null> {
    // addSelect để lấy refreshTokenHash vốn bị ẩn bởi select:false
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.username = :username', { username })
      .getOne();
  }

  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async updateRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.users.update(id, { refreshTokenHash: hash as any });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.users.update(id, { lastLoginAt: new Date() });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.users.update(id, { passwordHash });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.users.findOne({ where: { username: dto.username } });
    if (exists) throw new ConflictException('user.usernameExists');

    const user = this.users.create({
      name: dto.name,
      username: dto.username,
      passwordHash: await bcrypt.hash(dto.password, 10),
      phone: dto.phone,
      role: dto.role,
    });
    return this.safe(await this.users.save(user));
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('user.notFound');

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;

    return this.safe(await this.users.save(user));
  }

  async revoke(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('user.notFound');
    await this.users.update(id, { active: false, refreshTokenHash: null as any });
  }

  async resetPassword(id: string): Promise<string> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('user.notFound');

    await this.users.update(id, { passwordHash: await bcrypt.hash(DEFAULT_RESET_PASSWORD, 10) });
    return DEFAULT_RESET_PASSWORD;
  }

  async getRoomAssignments(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('user.notFound');

    return this.permissions.find({
      where: { user: { id } },
      relations: { room: true, user: true },
      order: { room: { name: 'ASC' } },
    });
  }

  async assignRoom(id: string, dto: AssignUserRoomDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('user.notFound');

    const room = await this.rooms.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('room.notFound');

    let permission = await this.permissions.findOne({
      where: { user: { id }, room: { id: dto.roomId } },
      relations: { user: true, room: true },
    });

    if (!permission) {
      permission = this.permissions.create({ user, room });
    }

    this.applyRoomPermissions(permission, dto);
    const saved = await this.permissions.save(permission);
    await this.syncRoomOccupancy(dto.roomId);
    return saved;
  }

  async removeRoomAssignment(id: string, roomId: string) {
    const permission = await this.permissions.findOne({
      where: { user: { id }, room: { id: roomId } },
    });
    if (!permission) throw new NotFoundException('user.roomAssignmentNotFound');

    await this.permissions.remove(permission);
    await this.syncRoomOccupancy(roomId);
    return { deleted: true };
  }

  private async syncRoomOccupancy(roomId: string) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room || room.status === RoomStatus.Maintenance) return;

    const tenantCount = await this.permissions.count({
      where: {
        room: { id: roomId },
        user: { role: UserRole.Tenant, active: true },
      },
    });

    const nextStatus = tenantCount > 0 ? RoomStatus.Occupied : RoomStatus.Vacant;
    if (room.status !== nextStatus) {
      await this.rooms.update(roomId, { status: nextStatus });
    }
  }

  private applyRoomPermissions(permission: Permission, dto: AssignUserRoomDto) {
    if (dto.canControlLed !== undefined) permission.canControlLed = dto.canControlLed;
    if (dto.canControlFan !== undefined) permission.canControlFan = dto.canControlFan;
    if (dto.canControlDoor !== undefined) permission.canControlDoor = dto.canControlDoor;
    if (dto.canViewSensors !== undefined) permission.canViewSensors = dto.canViewSensors;
    if (dto.canManageFaces !== undefined) permission.canManageFaces = dto.canManageFaces;
    if (dto.isRoomAdmin !== undefined) permission.isRoomAdmin = dto.isRoomAdmin;
  }
}
