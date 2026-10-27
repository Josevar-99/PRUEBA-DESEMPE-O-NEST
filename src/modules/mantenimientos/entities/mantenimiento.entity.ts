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
import { TipoMantenimiento } from '../../../common/enums/tipo-mantenimiento.enum.js';
import { EstadoMantenimiento } from '../../../common/enums/estado-mantenimiento.enum.js';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity.js';
import { Mecanico } from '../../mecanicos/entities/mecanico.entity.js';
import { Taller } from '../../talleres/entities/taller.entity.js';

@Index('UQ_mantenimiento_activo_por_vehiculo', ['vehiculo'], {
  unique: true,
  where: `"estado" IN ('SCHEDULED', 'IN_PROGRESS')`,
})
@Entity('mantenimientos')
export class Mantenimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoMantenimiento })
  tipo: TipoMantenimiento;

  @Column({ type: 'text' })
  descripcion: string;

  // Kilometraje con el que el vehículo ingresa
  @Column({ type: 'int' })
  kilometraje: number;

  // timestamptz: guarda la zona horaria para que 7:30 en Bogotá no cambie según el servidor
  @Column({ type: 'timestamptz' })
  fechaProgramada: Date;

  // No lo pide el requisito 5.3, pero sin hora de fin no se puede aplicar la regla de cruce de horarios (3.10)
  @Column({ type: 'timestamptz' })
  fechaFinEstimada: Date;

  @Column({
    type: 'enum',
    enum: EstadoMantenimiento,
    default: EstadoMantenimiento.SCHEDULED,
  })
  estado: EstadoMantenimiento;

  // Campos de cierre (requisito 5.9): nulos hasta que el mantenimiento se completa
  @Column({ type: 'text', nullable: true })
  trabajoRealizado: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    // PostgreSQL devuelve decimal como string para no perder precisión; la API responde number
    transformer: {
      to: (value?: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  costoFinal: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  fechaFinalizacion: Date | null;

  @Column({ type: 'int', nullable: true })
  kilometrajeFinal: number | null;

  // Relaciones obligatorias (requisito 5.2). Unidireccionales para evitar imports circulares en ESM
  @ManyToOne(() => Vehiculo, { nullable: false })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => Mecanico, { nullable: false })
  @JoinColumn({ name: 'mecanico_id' })
  mecanico: Mecanico;

  @ManyToOne(() => Taller, { nullable: false })
  @JoinColumn({ name: 'taller_id' })
  taller: Taller;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}