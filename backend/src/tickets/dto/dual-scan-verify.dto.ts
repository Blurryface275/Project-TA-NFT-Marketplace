import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class DualScanVerifyDto {
  @IsNumber()
  @IsNotEmpty()
  tokenId: number;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signedAt: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  @Length(16, 16, { message: 'NIK wajib 16 digit angka sesuai KTP' })
  nik: string;
}