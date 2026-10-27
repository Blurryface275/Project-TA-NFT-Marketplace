import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { EventsModule } from '../events/events.module';
import { Order } from './entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { EventsService } from '../events/events.service';
import { ConfigService } from '@nestjs/config';


@Module({
  // Impor EventsModule spy TicketsService bisa baca data kuota event dari database
  imports: [
    TypeOrmModule.forFeature([Order, Customer]), // daftarin entity
    EventsModule, // harus di import spy service bisa akses data event/kuota
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {

}
