import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity('sensor_snapshots')
export class SensorSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.sensorSnapshots, { onDelete: 'CASCADE' })
  room: Room;

  @Column()
  sensorKey: string;

  @Column()
  value: string;

  @CreateDateColumn()
  createdAt: Date;
}
