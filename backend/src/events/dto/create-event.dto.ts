import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TicketCategoryDto {
  @IsNotEmpty({ message: 'Nama kategori tiket wajib diisi' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Harga tiket wajib diisi' })
  @IsNumber({}, { message: 'Harga tiket harus berupa angka' })
  @Min(0, { message: 'Harga tiket tidak boleh negatif' })
  @Type(() => Number)
  price: number;

  @IsNotEmpty({ message: 'Kuota tiket wajib diisi' })
  @IsNumber({}, { message: 'Kuota tiket harus berupa angka' })
  @Min(1, { message: 'Kuota tiket minimal 1' })
  @Type(() => Number)
  quota: number;
}

export class CreateEventDto {
  @IsNotEmpty({ message: 'Nama event wajib diisi' })
  @IsString()
  eventName: string;

  @IsNotEmpty({ message: 'Waktu mulai event wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal mulai harus berupa ISO string yang valid' })
  startDate: string;

  @IsNotEmpty({ message: 'Lokasi venue wajib diisi' })
  @IsString()
  venueLocation: string;

  @IsNotEmpty({ message: 'Kategori event wajib diisi' })
  @IsIn(
    [
      'seminar',
      'konser musik',
      'olahraga',
      'festival musik',
      'stand up comedy',
      'pameran berbayar',
    ],
    { message: 'Kategori event tidak valid' },
  )
  category: string;

  @IsNotEmpty({ message: 'Kapasitas penonton wajib diisi' })
  @IsNumber({}, { message: 'Kapasitas harus berupa angka' })
  @Min(1, { message: 'Kapasitas minimal 1' })
  @Type(() => Number)
  capacity: number;

  @IsOptional()
  @IsNumber({}, { message: 'Batas tiket per dompet harus berupa angka' })
  @Min(1, { message: 'Batas tiket per dompet minimal 1' })
  @Type(() => Number)
  maxPerWallet?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizersId?: number;

  @IsOptional()
  @IsString()
  imageIpfsCid?: string;

  @IsOptional()
  ticketCategories?: string | TicketCategoryDto[];
}
