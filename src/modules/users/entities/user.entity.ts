import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum.js';

/**
 * 💡 [ADAPT FOR THE TEST - DATABASE ENTITY]:
 * Modify the columns or relations according to the requested database diagram.
 *
 * 💡 COMMON RELATIONS IN TECHNICAL TESTS:
 * 1. A user has many orders (OneToMany):
 *    @OneToMany(() => Order, (order) => order.user)
 *    orders: Order[];
 *
 * 2. A user belongs to a company/branch (ManyToOne):
 *    @ManyToOne(() => Company, (company) => company.users, { onDelete: 'CASCADE' })
 *    @JoinColumn({ name: 'company_id' })
 *    company: Company;
 *
 * 3. Logical deletion (Soft Delete):
 *    @DeleteDateColumn()
 *    deletedAt: Date;
 */
@Entity('users')
export class User {
  // UUID automatically generated as primary key
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique email
  @Column({ unique: true })
  email: string;

  // Password encrypted with bcrypt
  @Column({select: false})
  password: string;

  @Column()
  name: string;

  // 💡 User role: linked to the roles enum
  @Column({
    type: 'enum',
    enum: Role,
    
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  // 💡 Add more fields here if the specification requires it:
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