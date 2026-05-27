import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Permission } from '../../room/entities/permission.entity';

export enum UserRole {
  Owner = 'owner',
  Admin = 'admin',
  Tenant = 'tenant',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  phone?: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true, select: false })
  refreshTokenHash?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Tenant })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isGlobalAdmin: boolean = false;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @OneToMany(() => Permission, (permission) => permission.user)
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
