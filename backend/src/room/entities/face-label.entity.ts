import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Room } from './room.entity';

@Entity('face_labels')
@Unique(['room', 'label'])
export class FaceLabel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.faceLabels, { onDelete: 'CASCADE' })
  room: Room;

  @Column()
  label: string;

  @Column({ nullable: true })
  displayName?: string;

  @CreateDateColumn()
  createdAt: Date;
}
