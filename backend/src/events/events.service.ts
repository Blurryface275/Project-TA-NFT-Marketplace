import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>, // eventRepository -> menampung semua operasi CRUD untuk tabel event
    ) {}
    
    // method untuk mengambil seluruh event yang ada 
    // di tabel events
    async findAll(){
        return this.eventRepository.find({
            relations: {ticketCategories: true},
            order: {id: 'ASC'},
        });
    }

    // ambil 1 event spesifik berdasarkan ID dan seluruh kategorinya
    // Expected output dari object Event:
    // 
    async findOne(id: number){
        const event = await this.eventRepository.findOne({
            where: {id},
            relations: {ticketCategories: true},
        });
        if (!event){
            throw new NotFoundException(`Event dengan ID ${id} tidak ditemukan`);
        }

        return event;
    }

    
}
