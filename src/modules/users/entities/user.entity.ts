import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - ENTIDAD DE BASE DE DATOS]:
 * Modifica las columnas o relaciones según el diagrama de base de datos solicitado.
 *
 * 💡 RELACIONES FRECUENTES EN PRUEBAS TÉCNICAS:
 * 1. Un usuario tiene muchas órdenes (OneToMany):
 *    @OneToMany(() => Order, (order) => order.user)
 *    orders: Order[];
 *
 * 2. Un usuario pertenece a una empresa/sucursal (ManyToOne):
 *    @ManyToOne(() => Company, (company) => company.users, { onDelete: 'CASCADE' })
 *    @JoinColumn({ name: 'company_id' })
 *    company: Company;
 *
 * 3. Eliminación lógica (Soft Delete):
 *    @DeleteDateColumn()
 *    deletedAt: Date;
 */
@Entity('users')
export class User {
  // UUID generado automáticamente como clave primaria
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Correo único
  @Column({ unique: true })
  email: string;

  // Contraseña encriptada con bcrypt
  @Column({select: false})
  password: string;

  @Column()
  name: string;

  // 💡 Rol del usuario: vinculado al enum de roles
  @Column({
    type: 'enum',
    enum: Role,
    
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  // 💡 Agrega aquí más campos si el enunciado lo exige:
  // @Column({ nullable: true })
  // phone: string;
  //
  // @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  // balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
