import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MaintenanceType } from '../../../common/enums/maintenance-type.enum.js';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';

/**
 * Business rule: only one active maintenance per vehicle. The index is unique
 * only for rows SCHEDULED or IN_PROGRESS, so COMPLETED and CANCELLED records
 * in history do not count. If two simultaneous requests pass the service validation,
 * the DB rejects the second and the global filter translates it to 409 (code 23505).
 */
@Index('UQ_mantenimiento_activo_por_vehiculo', ['vehicle'], {
  unique: true,
  where: `"estado" IN ('SCHEDULED', 'IN_PROGRESS')`,
})
// Business rule: a technician cannot have two IN_PROGRESS maintenances at the same time.
// Only IN_PROGRESS counts: multiple SCHEDULED with no overlapping schedule are allowed (3.10 case d)
@Index('UQ_mantenimiento_en_proceso_por_mecanico', ['mechanic'], {
  unique: true,
  where: `"estado" = 'IN_PROGRESS'`,
})
@Entity('mantenimientos')
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tipo', type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ name: 'descripcion', type: 'text' })
  description: string;

  // Mileage at which the vehicle is brought in
  @Column({ name: 'kilometraje', type: 'int' })
  mileage: number;

  // timestamptz: stores the timezone so that 7:30 in Bogotá does not change depending on the server
  @Column({ name: 'fechaProgramada', type: 'timestamptz' })
  scheduledAt: Date;

  // Not required by requirement 5.3, but without an end time the schedule overlap rule (3.10) cannot be applied
  @Column({ name: 'fechaFinEstimada', type: 'timestamptz' })
  estimatedEndAt: Date;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  // Closing fields (requirement 5.9): null until the maintenance is completed
  @Column({ name: 'trabajoRealizado', type: 'text', nullable: true })
  workPerformed: string | null;

  @Column({
    name: 'costoFinal',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    // PostgreSQL returns decimal as string to avoid losing precision; the API responds with number
    transformer: {
      to: (value?: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  finalCost: number | null;

  @Column({ name: 'fechaFinalizacion', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'kilometrajeFinal', type: 'int', nullable: true })
  finalMileage: number | null;

  // Required relations (requirement 5.2). Unidirectional to avoid circular imports in ESM
  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehiculo_id' })
  vehicle: Vehicle;

  @ManyToOne(() => Mechanic, { nullable: false })
  @JoinColumn({ name: 'mecanico_id' })
  mechanic: Mechanic;

  @ManyToOne(() => Workshop, { nullable: false })
  @JoinColumn({ name: 'taller_id' })
  workshop: Workshop;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}