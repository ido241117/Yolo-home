import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from './room.entity';

export type FeedMapping = Record<string, string>;

@Entity('hardware_configs')
export class HardwareConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
