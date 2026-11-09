import {Entity, PrimaryColumn, Column, ManyToOne, JoinColumn,} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Order } from './order.entity';

@Entity('ticket_cache')
export class TicketCache{
    @PrimaryColumn({name: 'token_id', type: 'int'})
    tokenId: number;

    @Column({ name: 'owner_wallet', type: 'varchar', length:42 })
    ownerWallet: string;

    @Column({ name: 'original_price', type: 'decimal', precision: 12, scale: 2})
    originalPrice: number;

    @Column({ name: 'used', type: 'tinyint', default: 0})
    used: number;

    @Column({ name: 'synced_at', type: 'datetime' })
    syncedAt: Date;

    @Column({ name: 'events_id', type: 'int' })
    eventsId: number;
    
    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'events_id' })
    event: Event;

    @Column({ name: 'orders_id', type: 'char', length: 36 })
    ordersId: string;
    
    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orders_id' })
    order: Order;
}