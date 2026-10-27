import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';

import { Event } from '../../events/entities/event.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';

// kalo di nestJS, enum harus dibuatin manual dulu
export enum OrderStatus {
  PENDING = 'pending', // Tagihan snap dari Midtrans sudah dibuat, menunggu menerima pemabayran dari pembeli
  PAID = 'paid', // Pembayaran berhasil diterima
  FAILED = 'failed', // Pembayaran gagal atau timeout
  CANCELLED = 'cancelled', // Pesanan dibatalkan oleh sistem (karena timeout) atau user
}

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'amount', type: 'int' })
  amount: number;

  // total harga pakai DECIMAL (12,2) -> total 12 digit, 2 digit desimal (contoh: 100000000.00)
  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({
    name: 'midtrans_transaction_id',
    type: 'varchar',
    unique: true,
    length: 100,
    nullable: true,
  })
  midtransTransactionId: string | null;

  // status order
  @Column({
    name: 'status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date;

  @Column({ name: 'customers_id', type: 'int' })
  customersId: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customers_id' })
  customer: Customer;

  @Column({ name: 'ticket_categories_id', type: 'char', length: 36 })
  ticketCategoriesId: string;

  @ManyToOne(() => TicketCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_categories_id' })
  ticketCategory: TicketCategory;

  @Column({ name: 'admin_fee', type: 'decimal', precision: 12, scale: 2 })
  adminFee: number; //biaya admin 2.5% per transaksi
}
