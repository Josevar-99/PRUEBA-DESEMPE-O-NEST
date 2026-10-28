import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '../enums/audit-action.enum.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * Immutable record of each change: who, what action, on what resource and with what data.
 * Only has a creation date: an audit record is never edited.
 */
@Entity('auditorias')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'accion', type: 'enum', enum: AuditAction })
  action: AuditAction;

  // Affected resource, taken from the controller's path (e.g.: "maintenances")
  @Column({ name: 'entidad' })
  entity: string;

  @Column({ name: 'entidadId', type: 'uuid', nullable: true })
  entityId: string | null;

  // E.g.: "PATCH /api/maintenances/<id>/status"
  @Column({ name: 'ruta' })
  route: string;

  // Sent body, without passwords. jsonb allows storing any shape and querying it later
  @Column({ name: 'detalle', type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'fecha', type: 'timestamptz' })
  date: Date;
}