import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

// Konfigurasi Multer untuk penyimpanan lokal background gambar tiket
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `ticket-bg-${uniqueSuffix}${ext}`);
  },
});

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

@Controller('events') // Route prefix: /api/events (karena ada global prefix 'api' di main.ts)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Method: GET /api/events
  // Mengambil seluruh data event yang ada beserta seluruh kategori tiketnya
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  // Method: GET /api/events/:id
  // Mengambil 1 data event spesifik berdasarkan ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
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
