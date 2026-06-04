import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { Room } from './room.entity';

@Entity('auto_control_modes')
@Unique(['room', 'deviceKey'])
export class AutoControlMode extends BaseCustomEntity {
  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  room: Room;

  @Column()
  deviceKey: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ nullable: true })
  lastRunAt?: Date;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  lastResult: Record<string, unknown>;
}
