import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { Room } from './room.entity';

@Entity('sensor_snapshots')
export class SensorSnapshot extends BaseCustomEntity {

  @ManyToOne(() => Room, (room) => room.sensorSnapshots, { onDelete: 'CASCADE' })
  room: Room;

  @Column()
  sensorKey: string;

  @Column()
  value: string;
}
