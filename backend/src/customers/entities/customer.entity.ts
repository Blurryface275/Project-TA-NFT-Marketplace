import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PasskeyCredential } from '../../auth/entities/passkey-credential.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', name: 'wallet_address', length: 42, nullable: true })
  walletAddress: string | null; // Alamat smart account ERC-4337 (bisa null sebelum aktivasi)

  @Column({ type: 'varchar', name: 'nik_hash', length: 66, nullable: true })
  nikHash: string | null; // Hash keccak256 NIK KTP (UU PDP Compliance, tanpa simpan NIK mentah)

  @Column({ name: 'users_id' })
  usersId: number;

  // Relasi ke User
  @OneToOne(() => User, (user) => user.customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: User;

  // Relasi 1 customer bisa punya passkey credential
  @OneToMany(
    () => PasskeyCredential,
    (credential: PasskeyCredential) => credential.customer,
  )
  passkeyCredentials: PasskeyCredential[];
}
