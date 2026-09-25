import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TicketCategory } from './ticket-category.entity';

@Entity('events')
export class Event{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name:'on_chain_event_id', type: 'bigint', nullable: true})
    onChainEventId: string; // ID event di smart contract Sepolia (misal: 1)

    @Column({name: 'event_name', length: 255})
    eventName: string;

    @Column({ name: 'start_date', type: 'datetime'})
    startDate: Date;

    @Column({ name: 'venue_location', length: 255})
    venueLocation: string;

    @Column({
        type: 'enum',
        enum: [
            'seminar',
            'konser musik',
            'olahraga',
            'festival musik',
            'stand up comedy',
            'pameran berbayar'
        ],
    })
    category: string;

    @Column({ type: 'int'})
    capacity: number;

    @Column({ name: 'image_ipfs_cid', length: 255, nullable:true})
    imageIpfsCid: string; // URL / CID Gambar Banner Konser

    @Column({ name: 'organizers_id', type: 'int'})
    organizersId: number;

    // Relasi One-to-Many: 1 Event memiliki banyak kategori tiket
  @OneToMany(() => TicketCategory, (cat) => cat.event)
  ticketCategories: TicketCategory[];
}