import { 
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { TicketCache } from './ticket-cache.entity';

export enum ResaleStatus {
    ACTIVE = 'ACTIVE', // Terdaftar di pasar sekunder, siap dibeli
    SOLD = 'SOLD', // Pembayran sukses & NFT sudah pindah tangan dan sudah dicatat secara on-chain
    CANCELLED = 'CANCELLED', // Dibatalkan oleh penjual
}

@Entity('resale_listings')
export class ResaleListing{
    @PrimaryColumn({ type: 'char', length: 36})
    id: string;

    @Column({ name: 'seller_wallet', type: 'char', length:42})
    sellerWallet: string;

    @Column({ name: 'locked_price', type: 'decimal', precision: 12, scale: 2})
    lockedPrice: number;

    @Column({
        name: 'status',
        type: 'enum',
        enum: ResaleStatus,
        default: ResaleStatus.ACTIVE,
    })
    status: ResaleStatus;

    @Column({name: 'listed_at', type: 'datetime'})
    listedAt: Date;

    @Column({ name: 'ticket_cache_token_id', type: 'int' })
    ticketCacheTokenId: number;

    @ManyToOne(() => TicketCache, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_cache_token_id', referencedColumnName: 'tokenId' })
    ticketCache: TicketCache;

    @Column({ name: 'buyer_wallet', type: 'char', length: 42, nullable: true })
    buyerWallet: string | null;

    @Column({
        name: 'admin_fee',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    adminFee: number | null;
    
    @Column({
        name: 'buyer_midtrans_transaction_id',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    buyerMidtransTransactionId: string | null;

}