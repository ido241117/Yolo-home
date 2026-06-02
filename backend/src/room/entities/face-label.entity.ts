import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseCustomEntity } from '../../common/entities/base-custom.entity';
import { Room } from './room.entity';

@Entity('face_labels')
@Unique(['room', 'label'])
export class FaceLabel extends BaseCustomEntity {

  @ManyToOne(() => Room, (room) => room.faceLabels, { onDelete: 'CASCADE' })
  room: Room;

  @Column()
  label: string;

  @Column({ nullable: true })
  displayName?: string;
}
