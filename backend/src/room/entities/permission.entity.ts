import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

@Entity('permissions')
@Unique(['room', 'user'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
