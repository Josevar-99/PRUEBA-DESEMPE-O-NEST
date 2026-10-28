import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActiveStatus } from '../../../common/enums/active-status.enum.js';

@Entity('talleres')
export class Workshop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique: this is the key used by the seeder to avoid duplicating workshops
  @Column({ name: 'nombre', unique: true })
  name: string;

  @Column({ name: 'direccion' })
  address: string;

  // Every workshop is born active; it only changes through the activate/deactivate endpoints
  @Column({
    name: 'estado',
    type: 'enum',
    enum: ActiveStatus,
    default: ActiveStatus.ACTIVE,
  })
  status: ActiveStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}