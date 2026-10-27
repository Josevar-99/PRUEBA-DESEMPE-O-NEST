import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccionAuditoria } from '../enums/accion-auditoria.enum.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * Registro inmutable de cada cambio: quién, qué acción, sobre qué recurso y con qué datos.
 * Solo tiene fecha de creación: una auditoría nunca se edita.
 */
@Entity('auditorias')
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ type: 'enum', enum: AccionAuditoria })
  accion: AccionAuditoria;

  // Recurso afectado, tomado del path del controller (ej: "mantenimientos")
  @Column()
  entidad: string;

  @Column({ type: 'uuid', nullable: true })
  entidadId: string | null;

  // Ej: "PATCH /api/mantenimientos/<id>/estado"
  @Column()
  ruta: string;

  // Body enviado, sin contraseñas. jsonb permite guardar cualquier forma y consultarla después
  @Column({ type: 'jsonb', nullable: true })
  detalle: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}