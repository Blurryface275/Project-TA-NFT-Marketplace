import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { TicketCache } from '../tickets/entities/ticket-cache.entity';

@Module({
  imports: [
    //registrasi entity ke TypeOrmModule
    TypeOrmModule.forFeature([Event, TicketCategory, TicketCache]),
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService], // biar bisa diakses module lain (misal: TicketsModule)
})
export class EventsModule {}
