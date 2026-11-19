import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { InternalApiGuard } from '../common/internal-api-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

// Simpan buffer file di RAM untuk langsung di-upload ke IPFS Pinata
const storage = memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Format gambar tidak didukung! Harap unggah format JPG, PNG, atau WEBP.',
      ),
      false,
    );
  }
};

@UseGuards(InternalApiGuard)
@Controller('events') // Route prefix: /api/events (karena ada global prefix 'api' di main.ts)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Method: GET /api/events
  // Mengambil seluruh data event yang ada beserta seluruh kategori tiketnya
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  // Method: GET /api/events/organizer/:organizersId
  // Mengambil seluruh event yang dibuat oleh organizer tertentu beserta analitik penjualan
  @Get('organizer/:organizersId')
  findByOrganizer(@Param('organizersId', ParseIntPipe) organizersId: number) {
    return this.eventsService.findByOrganizer(organizersId);
  }

  // Method: GET /api/events/user/:userId
  // Mengambil seluruh event milik organizer berdasarkan users_id akun yang sedang login
  @Get('user/:userId')
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.eventsService.findByUserId(userId);
  }

  // Method: GET /api/events/:id
  // Mengambil 1 data event spesifik berdasarkan ID
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId?: string,
  ) {
    return this.eventsService.findOne(id, userId ? Number(userId) : undefined);
  }

  // Method: POST /api/events
  // Mendaftarkan event baru dari segi Admin / Penyelenggara ke Database & Blockchain Sepolia
  // Mendukung multipart/form-data untuk upload gambar background tiket
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // batas maksimal 5 MB
      fileFilter,
    }),
  )
  async create(
    @Body() dto: CreateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.create(dto, file);
  }
}
