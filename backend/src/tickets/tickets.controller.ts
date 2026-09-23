import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { MintTicketDto } from './dto/mint-ticket.dto';
import { RedeemTicketDto } from './dto/redeem-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Endpoint untuk mencetak tiket NFT baru ke dompet user
  // POST http://localhost:3001/api/tickets/mint
  @Post('mint') // pakai post karena kita mau update data
  async mintTicket(@Body() mintTicketDto: MintTicketDto) {
    return this.ticketsService.mintTicket(mintTicketDto);
  }

  // Endpoint untuk menukar tiket NFT di gerbang masuk
  // POST http://localhost:3001/api/tickets/redeem
  @Post('redeem') // pakai post karena kita mau update data
  async redeemTicket(@Body() redeemTicketDto: RedeemTicketDto) {
    return this.ticketsService.redeemTicket(
      redeemTicketDto.tokenId,
      redeemTicketDto.walletAddress,
    );
  }

  // Endpoint untuk mengambil semua tiket punya alamat dompet tertentu
  // GET http://localhost:3001/api/tickets/my-tickets/:walletAddress
  @Get('my-tickets/:walletAddress')
  async getUserTickets(@Param('walletAddress') walletAddress: string) {
    return this.ticketsService.getUserTickets(walletAddress);
  }
  // Endpoint untuk mengecek status dan kepemilikan tiket on-chain (Gratis Gas)
  // GET http://localhost:3001/api/tickets/1
  @Get(':tokenId') // pakai get karena cuma mau baca data
  async getTicket(@Param('tokenId', ParseIntPipe) tokenId: number) {
    return this.ticketsService.getTicket(tokenId);
  }
}
