import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DualScanVerifyDto {
  @IsNumber()
  @IsNotEmpty()
  tokenId: number;

  @IsString()
  @IsOptional()
  walletAddress?: string;

  @IsString()
  @IsOptional()
  signedAt?: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  nik?: string;
}