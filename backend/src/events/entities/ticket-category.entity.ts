import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import {Event} from './event.entity';

@Entity('ticket_categories') // menyesuaikan nama table di database
export class TicketCategory {
    @PrimaryColumn({type: 'char', length: 36})
    id: string;

    @Column({length:100})
    name: string;

    @Column({type:'decimal', precision:12, scale:2})
    price: number;

    @Column({ type: 'int'})
    quota: number;

    @Column({name: 'events_id', type: 'int'})
    eventsId: number;

    // Relasi Many-to-One: Banyak aktegori tiket dimiliki oleh 1 Event
    @ManyToOne(() => Event, (event) => event.ticketCategories, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'events_id'})
    event: Event;

}