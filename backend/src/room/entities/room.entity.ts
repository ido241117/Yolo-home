import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { EventLog } from './event-log.entity';
import { FaceLabel } from './face-label.entity';
import { HardwareConfig } from './hardware-config.entity';
import { Permission } from './permission.entity';
import { SensorSnapshot } from './sensor-snapshot.entity';

export enum RoomStatus {
  Occupied = 'occupied',
  Vacant = 'vacant',
  Maintenance = 'maintenance',
}

@Entity('rooms')
export class Room extends BaseCustomEntity {

  @Column()
  name: string;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.Vacant })
  status: RoomStatus;

  @Column({ nullable: true })
  description?: string;

  @OneToOne(() => HardwareConfig, (hardwareConfig) => hardwareConfig.room, { cascade: true })
  hardwareConfig: HardwareConfig;

  @OneToMany(() => Permission, (permission) => permission.room)
  permissions: Permission[];

  @OneToMany(() => EventLog, (eventLog) => eventLog.room)
  eventLogs: EventLog[];

  @OneToMany(() => SensorSnapshot, (snapshot) => snapshot.room)
  sensorSnapshots: SensorSnapshot[];

  @OneToMany(() => FaceLabel, (faceLabel) => faceLabel.room)
  faceLabels: FaceLabel[];
}
