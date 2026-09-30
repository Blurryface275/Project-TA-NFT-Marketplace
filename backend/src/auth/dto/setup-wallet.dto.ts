import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SetupWalletDto {
  @IsNotEmpty({ message: 'User ID tidak boleh kosong' })
  @IsNumber({}, { message: 'User ID harus berupa angka' })
  userId: number;

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
}
