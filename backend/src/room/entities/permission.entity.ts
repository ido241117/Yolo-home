import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

@Entity('permissions')
@Unique(['room', 'user'])
export class Permission extends BaseCustomEntity {

  @ManyToOne(() => Room, (room) => room.permissions, { onDelete: 'CASCADE' })
  room: Room;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: false })
  canControlLed: boolean;

  @Column({ default: false })
  canControlFan: boolean;

  @Column({ default: false })
  canControlDoor: boolean;

  @Column({ default: true })
  canViewSensors: boolean;

  @Column({ default: false })
  canManageFaces: boolean;

  @Column({ default: false })
  isRoomAdmin: boolean;
}
