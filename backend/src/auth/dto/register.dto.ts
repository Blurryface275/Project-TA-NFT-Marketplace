import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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

  // Data Kriptografi Passkey & Smart Account dari Browser
  @IsNotEmpty({ message: 'Public Key X tidak boleh kosong' })
  @IsString()
  pubX: string;

  @IsNotEmpty({ message: 'Public Key Y tidak boleh kosong' })
  @IsString()
  pubY: string;

  @IsNotEmpty({ message: 'Credential ID tidak boleh kosong' })
  @IsString()
  credentialId: string;

  @IsNotEmpty({ message: 'Wallet Address tidak boleh kosong' })
  @IsString()
  walletAddress: string;
} // mengisyaratkan data apa aja yang harus dikirimkan oleh client pada saat register
