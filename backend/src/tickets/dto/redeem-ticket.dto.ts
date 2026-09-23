import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RedeemTicketDto { // untuk redeem ticket nanti butuh tokenId dan walletAddress
  @IsNotEmpty()
  @IsNumber()
  tokenId: number;

  @IsNotEmpty()
  @IsString()
  walletAddress: string;
}
