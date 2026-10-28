import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActiveStatus } from '../../../common/enums/active-status.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('mecanicos')
export class Mechanic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre' })
  name: string;

  // Unique: this is the key used by the seeder to avoid duplicating mechanics
  @Column({ name: 'correo', unique: true })
  email: string;

  @Column({ name: 'especialidad' })
  specialty: string;

  // Requirement 3.6: activated or deactivated, never deleted (3.8: history is preserved)
  @Column({
    name: 'estado',
    type: 'enum',
    enum: ActiveStatus,
    default: ActiveStatus.ACTIVE,
  })
  status: ActiveStatus;

  /**
   * TECHNICIAN user the mechanic logs in with. With this link
   * the technician queries "their" maintenances using the id from their token.
   * OneToOne makes TypeORM create usuario_id with a UNIQUE constraint:
   * one user cannot be two mechanics.
   */
  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}