import { IsNotEmpty, IsNumber } from 'class-validator';

export class RedeemTicketDto {
  @IsNotEmpty()
  @IsNumber()
  tokenId: number;
}
