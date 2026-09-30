import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Dto adalah Data Transfer Object yang mendeskripsikan bagaimana object itu hrs dikirimkan dalam jaringan
export class RegisterDto {
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  // Data Kriptografi Passkey & Smart Account (Opsional pada Tahap 1 Progressive Onboarding)
  @IsOptional()
  @IsString()
  pubX?: string;

  @IsOptional()
  @IsString()
  pubY?: string;

  @IsOptional()
  @IsString()
  credentialId?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;
} // mengisyaratkan data apa aja yang harus dikirimkan oleh client pada saat register
