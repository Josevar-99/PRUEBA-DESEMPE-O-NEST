import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoVehiculo } from '../../../common/enums/estado-vehiculo.enum.js';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Requisito 2.4: no puede haber dos vehículos con la misma placa
  @Column({ unique: true, length: 10 })
  placa: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  // Kilometraje actual; se actualiza al completar cada mantenimiento
  @Column({ type: 'int' })
  kilometraje: number;

  @Column({
    type: 'enum',
    enum: EstadoVehiculo,
    default: EstadoVehiculo.AVAILABLE,
  })
  estado: EstadoVehiculo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}