import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActivo } from '../../../common/enums/estado-activo.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('mecanicos')
export class Mecanico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  // Único: es la clave que usa el seeder para no duplicar mecánicos
  @Column({ unique: true })
  correo: string;

  @Column()
  especialidad: string;

  // Requisito 3.6: se activa o inactiva, nunca se borra (3.8: conserva su historial)
  @Column({ type: 'enum', enum: EstadoActivo, default: EstadoActivo.ACTIVE })
  estado: EstadoActivo;

  /**
   * Usuario TECHNICIAN con el que el mecánico inicia sesión. Con este vínculo
   * el técnico consulta "sus" mantenimientos usando el id de su token.
   * OneToOne hace que TypeORM cree usuario_id con restricción UNIQUE:
   * un usuario no puede ser dos mecánicos.
   */
  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}