import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events') // Route prefix: /api/events (karena ada global prefix 'api' di main.ts)
export class EventsController {
    constructor(private readonly eventsService: EventsService){} //eventsService -> menampung semua operasi CRUD untuk tabel event
    
    // Method: GET /api/events
    // Tujuannya: mengambil seluruh data event yang ada
    // Response: Array of objects mengikuti struktur class Event
    // Endpoint: GET http://localhost:3001/api/events
    @Get()
    findAll(){
        return this.eventsService.findAll();
    }

    // Method: GET /api/events/:id
    // Tujuannya: mengambil 1 data event spesifik berdasarkan ID
    // Response: 1 object Event (beserta relasinya: ticketCategories)
    // Endpoint: GET http://localhost:3001/api/events/:id
    // Contoh: GET http://localhost:3001/api/events/1
    // @Param({id: ParseIntPipe}) -> mengubah parameter ID dari string ke integer
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number){
        return this.eventsService.findOne(id);
    }
}
