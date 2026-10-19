import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 255 })
  name: string;
  @Column({ unique: true, length: 191 })
  email: string;
  @Column({ length: 255 })
  password: string; // Hash bcrypt
  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;
  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  emailVerificationToken: string | null; // fungsinya supaya di auth.service.ts nanti bisa dikasih opsi nilai null
  @Column({
    name: 'email_verification_expires',
    type: 'datetime',
    nullable: true,
  })
  emailVerificationExpires: Date | null; // sama kyk atasnya
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  // Relasi 1-to-1 ke Customer
  @OneToOne(() => Customer, (customer: Customer) => customer.user)
  customer: Customer;
}
