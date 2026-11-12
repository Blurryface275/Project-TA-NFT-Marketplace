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
import { CreateSnapDto } from './dto/create-snap.dto';
import { DualScanVerifyDto } from './dto/dual-scan-verify.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}



  // Endpoint untuk menukar tiket NFT di gerbang masuk
  // POST http://localhost:3001/api/tickets/redeem
  @Post('redeem') // pakai post karena kita mau update data
  async redeemTicket(@Body() redeemTicketDto: RedeemTicketDto) {
    return this.ticketsService.redeemTicket(
      redeemTicketDto.tokenId,
      redeemTicketDto.walletAddress,
    );
  }

  // Endpoint Verifikasi Dual-Scan Gerbang Masuk Venue (Dynamic QR + KTP Fisik keccak256)
  // POST http://localhost:3001/api/tickets/verify-dual-scan
  @Post('verify-dual-scan')
  async verifyDualScan(@Body() dto: DualScanVerifyDto) {
    return this.ticketsService.verifyDualScanGate(dto);
  }

  // Endpoint untuk mengambil semua tiket punya alamat dompet tertentu
  // GET http://localhost:3001/api/tickets/my-tickets/:walletAddress
  @Get('my-tickets/:walletAddress')
  async getUserTickets(@Param('walletAddress') walletAddress: string) {
    return this.ticketsService.getUserTickets(walletAddress);
  }

  // Endpoint polling status pembayaran order
  // GET http://localhost:3001/api/tickets/order-status/:orderId
  @Get('order-status/:orderId')
  async getOrderStatus(@Param('orderId') orderId: string) {
    return this.ticketsService.getOrderStatus(orderId);
  }

  // Endpoint untuk mengambil semua daftar tiket yang sedang dijual di pasar sekunder (ACTIVE)
  // GET http://localhost:3001/api/tickets/resale/active
  // Catatan: ditaruh di atas @Get(':tokenId') supaya kata 'resale' ga dikira angka tokenId oleh NestJS
  @Get('resale/active')
  async getActiveResaleListings() {
    return this.ticketsService.getActiveResaleListings();
  }

  // Endpoint untuk mendaftarkan tiket ke pasar sekunder (harga otomatis dikunci = originalPrice)
  // POST http://localhost:3001/api/tickets/resale/list
  @Post('resale/list') // pakai post karena kita mau kirim transaksi & simpan data listing baru
  async listTicketForResale(
    @Body() body: { tokenId: number; sellerWallet: string },
  ) {
    return this.ticketsService.listTicketForResale(
      Number(body.tokenId),
      body.sellerWallet,
    );
  }

  // Endpoint untuk membatalkan penjualan tiket di pasar sekunder
  // POST http://localhost:3001/api/tickets/resale/cancel
  @Post('resale/cancel')
  async cancelResaleListing(
    @Body() body: { tokenId: number; sellerWallet: string },
  ) {
    return this.ticketsService.cancelResaleListing(
      Number(body.tokenId),
      body.sellerWallet,
    );
  }

  // Endpoint untuk membuat transaksi Midtrans Snap saat pembeli baru mau beli tiket resale
  // POST http://localhost:3001/api/tickets/resale/buy
  @Post('resale/buy')
  async buyResaleTicket(
    @Body() body: { listingId: string; buyerWallet: string },
  ) {
    return this.ticketsService.createResaleSnapTransaction(
      body.listingId,
      body.buyerWallet,
    );
  }

  // Endpoint untuk mengecek status dan kepemilikan tiket on-chain (Gratis Gas)
  // GET http://localhost:3001/api/tickets/1
  @Get(':tokenId') // pakai get karena cuma mau baca data
  async getTicket(@Param('tokenId', ParseIntPipe) tokenId: number) {
    return this.ticketsService.getTicket(tokenId);
  }

  // Endpoint Request Snap Token Midtrans
  // POST http://localhost:3001/api/tickets/create-snap
  @Post('create-snap') // pakai post karena kita mau update data
  async createSnap(@Body() createSnapDto: CreateSnapDto) {
    return this.ticketsService.createSnapTransaction(createSnapDto);
  }

  // Endpoint Webhook Notifikasi Midtrans
  // POST http://localhost:3001/api/tickets/midtrans-webhook
  @Post('midtrans-webhook')
  async handleMidtransWebhook(@Body() notificationPayload: any) {
    return this.ticketsService.handleMidtransWebhook(notificationPayload);
  }

   // Endpoint untuk mengambil semua order milik pembeli
  // GET http://localhost:3001/api/tickets/my-orders/:walletAddress
  @Get('my-orders/:walletAddress')
  async getMyOrders(@Param('walletAddress') walletAddress: string) {
    return this.ticketsService.getMyOrders(walletAddress);
  }

}
