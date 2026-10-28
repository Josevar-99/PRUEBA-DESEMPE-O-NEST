import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum.js';

@Entity('vehiculos')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Requirement 2.4: no two vehicles can share the same license plate
  @Column({ name: 'placa', unique: true, length: 10 })
  plate: string;

  @Column({ name: 'marca' })
  make: string;

  @Column({ name: 'modelo' })
  model: string;

  @Column({ name: 'anio', type: 'int' })
  year: number;

  // Current mileage; updated when each maintenance is completed
  @Column({ name: 'kilometraje', type: 'int' })
  mileage: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}