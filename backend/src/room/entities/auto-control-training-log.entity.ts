import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

export type AutoControlLogSource = 'manual' | 'auto';

@Entity('auto_control_training_logs')
export class AutoControlTrainingLog extends BaseCustomEntity {
  @ManyToOne(() => Room, { nullable: true, onDelete: 'SET NULL' })
  room?: Room;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  actor?: User;

  @Column()
  source: AutoControlLogSource;

  @Column({ nullable: true })
  deviceKey?: string;

  @Column({ type: 'double precision' })
  temperature: number;

  @Column({ type: 'double precision' })
  humidity: number;

  @Column({ type: 'double precision' })
  light: number;

  @Column({ type: 'double precision' })
  hour: number;

  @Column({ type: 'int', nullable: true })
  currentFanState?: number;

  @Column({ type: 'int', nullable: true })
  currentLightState?: number;

  @Column({ type: 'int', nullable: true })
  desiredFanAction?: number;

  @Column({ type: 'int', nullable: true })
  desiredLightAction?: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;
}
