import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActivo } from '../../../common/enums/estado-activo.enum.js';

@Entity('talleres')
export class Taller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Único: es la clave que usa el seeder para no duplicar talleres
  @Column({ unique: true })
  nombre: string;

  @Column()
  direccion: string;

  // Todo taller nace activo; solo cambia por los endpoints de activar e inactivar
  @Column({ type: 'enum', enum: EstadoActivo, default: EstadoActivo.ACTIVE })
  estado: EstadoActivo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}