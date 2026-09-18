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

  @Column({ name: 'wallet_address', length: 42 })
  walletAddress: string; // Alamat smart account ERC-4337

  @Column({ name: 'recovery_phrase_hash', length: 255, nullable: true })
  recoveryPhraseHash: string; // Cadangan seed phrase (tahap berikutnya)

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
