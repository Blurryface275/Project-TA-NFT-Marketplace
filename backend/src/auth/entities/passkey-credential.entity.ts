import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('passkey_credentials')
export class PasskeyCredential {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'credential_id', unique: true, length: 255 })
  credentialId: string; // ID unik WebAuthn dari OS/Browser

  @Column({ name: 'public_key_x', type: 'text' })
  publicKeyX: string; // Kunci publik koordinat X (string BigInt)

  @Column({ name: 'public_key_y', type: 'text' })
  publicKeyY: string; // Kunci publik koordinat Y (string BigInt)

  @Column({ type: 'bigint', default: 0 })
  counter: number; // Counter WebAuthn anti-replay

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'customers_id' })
  customersId: number;

  // Relasi ke Customer
  @ManyToOne(() => Customer, (customer) => customer.passkeyCredentials, {
    onDelete: 'CASCADE', // cascade artinya jika data customer dihapus maka data passkey credential ikut terhapus
  })
  @JoinColumn({ name: 'customers_id' })
  customer: Customer;
}
