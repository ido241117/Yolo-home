import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

@Entity('event_logs')
export class EventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.eventLogs, { nullable: true, onDelete: 'SET NULL' })
  room?: Room;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  actor?: User;

  @Column()
  type: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
