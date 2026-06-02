import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { Room } from './room.entity';

export type FeedMapping = Record<string, string>;

@Entity('hardware_configs')
export class HardwareConfig extends BaseCustomEntity {

  @OneToOne(() => Room, (room) => room.hardwareConfig, { onDelete: 'CASCADE' })
  @JoinColumn()
  room: Room;

  @Column()
  adafruitUsername: string;

  @Column()
  adafruitKeyEncrypted: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  feedMapping: FeedMapping;
}
