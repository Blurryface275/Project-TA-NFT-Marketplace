import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TICKET_CONTRACT_ABI } from './ticket-abi';
import { sepolia } from 'viem/chains';
import { MintTicketDto } from './dto/mint-ticket.dto';
import { EventsService } from '../events/events.service';
import { CreateSnapDto } from './dto/create-snap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Customer } from '..customers/entities/customer.entity';
import * as crypto from 'crypto'; 

@Injectable()
export class TicketsService {
  private publicClient;
  private walletClient;
  private account;
  private contractAddress: `0x${string}`;

  constructor(
    private configService: ConfigService,
    private eventsService: EventsService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,  
  ) {
    // Ambil konfigurasi dari backend/.env via NestJS ConfigService
    const RPC_URL = this.configService.get<string>('SEPOLIA_RPC_URL')!;
    const privateKey = this.configService.get<string>(
      'ADMIN_PRIVATE_KEY',
    ) as `0x${string}`;
    this.contractAddress = this.configService.get<string>(
      'TICKET_CONTRACT_ADDRESS',
    ) as `0x${string}`;

    // Buat dompet admin
    this.account = privateKeyToAccount(privateKey);

    // Buat Public Client untuk memantau jaringan Sepolia
    // Kenapa harus ada ini? Biar bisa baca event yang muncul di blockchain (walaupun transaksi dikirim via Wallet Client)
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    // Buat Wallet Client untuk mengirim transaksi atas nama admin
    // Client ini adalah "tangan" yang akan mentransfer token ke user
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(RPC_URL),
    });
  }

  async mintTicket(dto: MintTicketDto) {
    // Ambil data event dari DB MySQL buat dapetin batas kuota yg ditentuin organizer
    const event = await this.eventsService.findOne(dto.eventId);
    const MAX_PER_WALLET = event?.maxPerWallet || 2; // jika event null maka batas maksimal adalah 2
    const qty = dto.quantity && dto.quantity > 0 ? dto.quantity : 1; 

    try {
      console.log(
        ` [TicketsService] Permintaan minting ${qty} tiket untuk alamat dompet: ${dto.walletAddress}`,
      );

      // Cek riwayat tiket yg sdh dimliki dompet ini khusus untuk event yg bersangkutan
      const userTickets = await this.getUserTickets(dto.walletAddress);
      const currentEventTickets = userTickets.filter(
        (t) => t.eventId === Number(dto.eventId),
      );
      // Cek jumlah tiket yang sudah dimiliki dompet ini di smart contract Sepolia
      // const currentBalance = await this.publicClient.readContract({
      //   address: this.contractAddress,
      //   abi: TICKET_CONTRACT_ABI,
      //   functionName: 'balanceOf',
      //   args: [dto.walletAddress as `0x${string}`],
      // });

      const currentCount = Number(currentEventTickets.length);
      console.log(
        ` [TicketsService] Status kepemilikan saat ini: ${currentCount}/${MAX_PER_WALLET} tiket. Permintaan baru: ${qty} tiket.`,
      );

      // Validasi batas maksimal: jika tiket yang sudah ada + jumlah baru melebihi batas
      if (currentCount + qty > MAX_PER_WALLET) {
        throw new BadRequestException(
          `Batas maksimal pembelian adalah ${MAX_PER_WALLET} tiket per akun. Anda saat ini telah memiliki ${currentCount} tiket.`,
        );
      }

      const txHashes: string[] = [];
      let lastReceipt: any = null;

      // Loop minting sebanyak jumlah tiket yang diminta (1 atau 2)
      for (let i = 0; i < qty; i++) {
        console.log(
          ` [TicketsService] Mengirim transaksi #${i + 1} dari ${qty} ke Sepolia...`,
        );

        // 1. Generate nonce unik untuk mencegah replay attack (waktu + urutan loop)
        const nonce = BigInt(Date.now() * 1000 + i);

        // 2. Tandatangani data terstruktur EIP-712 menggunakan private key backend (systemSigner)
        const signature = await this.account.signTypedData({
          domain: {
            name: 'NFTix',
            version: '1',
            chainId: sepolia.id,
            verifyingContract: this.contractAddress,
          },
          types: {
            MintAuth: [
              { name: 'to', type: 'address' },
              { name: 'eventId', type: 'uint256' },
              { name: 'categoryId', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
            ],
          },
          primaryType: 'MintAuth',
          message: {
            to: dto.walletAddress as `0x${string}`,
            eventId: BigInt(dto.eventId),
            categoryId: BigInt(dto.categoryId),
            nonce: nonce,
          },
        });

        // 3. Panggil fungsi 'mintTicket(to, eventId, categoryId, nonce, signature)' di smart contract Sepolia
        const hash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'mintTicket',
          // BigInt digunakan karena di Solidity tipenya adalah uint256
          args: [
            dto.walletAddress as `0x${string}`,
            BigInt(dto.eventId),
            BigInt(dto.categoryId),
            nonce,
            signature,
          ],
        });

        console.log(
          `Transaksi #${i + 1} dikirim ke Sepolia dengan txHash: ${hash}. Menunggu konfirmasi blok ...`,
        );

        // Menunggu sampai transaksi resmi masuk ke blok sebelum mengirim transaksi berikutnya (mencegah nonce collision)
        const receipt = await this.publicClient.waitForTransactionReceipt({
          hash: hash,
        });

        txHashes.push(hash);
        lastReceipt = receipt;
      }

      return {
        success: true,
        message: `${qty} tiket berhasil dicetak pada jaringan Sepolia Testnet`,
        txHash: txHashes[0],
        txHashes: txHashes,
        blockNumber: Number(lastReceipt?.blockNumber),
      };
    } catch (error: any) {
      console.error('Error minting ticket:', error);
      // NestJS Exception Filter: melempar error HTTP 400 ke frontend
      throw new BadRequestException(
        error?.shortMessage ||
          error?.message ||
          'Gagal mencetak tiket on-chain',
      );
    }
  }

  async redeemTicket(tokenId: number, walletAddress: string) {
    try {
      console.log(
        ' [TicketsService] Redeem tiket dengan ID: ' +
          tokenId +
          ' oleh wallet: ' +
          walletAddress,
      );

      const ticket = await this.getTicket(tokenId)

      // validasi kepemilikan
      if (ticket.owner.toLowerCase() !== walletAddress.toLowerCase()){
        throw new BadRequestException(
          `Validasi gagal: Alamat dompet ini tidak sama dengan pemilik tiket di blockchain`,
        );
      }

      // Cegah transaksi dikirim jika tiket sudah pernah dipakai sebelumnya (pencegahan double spending)
      if (ticket.used === true){
        throw new BadRequestException(
          `Validasi gagal: Tiket ini sudah pernah digunakan`,
        );
      }

      // Eksekusi fungsi markUsed (update status ticket) di smart contract
      // walletClient digunakan untuk mengirim transaksi (write)
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: TICKET_CONTRACT_ABI,
        functionName: 'markUsed',
        args: [BigInt(tokenId)],
      });

      console.log(
        `Transaksi redeem dikirim ke Sepolia dengan txHash: ${hash}. Menunggu konfirmasi blok ...`,
      );

      // Menunggu sampai transaksi resmi masuk ke blok
      // di sini publicClient digunakan utk baca dta (read-only)
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: hash,
      });
      
      return {
        success: true,
        message: 'Tiket berhasil digunakan (Redeemed)!',
        txHash: hash,
        blockNumber: Number(receipt.blockNumber),
      };

    } catch (error: any) {
      console.error('Error redeem ticket:', error);
      // NestJS Exception Filter: melempar error HTTP 400 ke frontend
      throw new BadRequestException(
        error?.shortMessage || error?.message || 'Gagal menukar tiket',
      );
    }
  }
  async getTicket(tokenId: number) {
    try {
      // ambil struct TicketInfo langsung dari Sepolia
      const ticket = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: TICKET_CONTRACT_ABI,
        functionName: 'getTicket',
        args: [BigInt(tokenId)],
      });

      // ambil wallet address pemilik tiket (standar ERC-721)
      const owner = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: TICKET_CONTRACT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      });

      return {
        tokenId,
        eventId: Number(ticket.eventId),
        categoryId: Number(ticket.categoryId),
        originalPrice: Number(ticket.originalPrice),
        used: ticket.used,
        owner,
      };
    } catch (error: any) {
      throw new BadRequestException('Tiket tidak ditemukan di blockchain');
    }
  }

  // Mengambil seluruh tiket milik alamat dompet tertentu dari blockchain
  async getUserTickets(walletAddress: string) {
    const userTickets = [];
    // Pelacak urutan nomor kursi sequential per event dan kategori di blockchain
    const eventCategoryCounters: Record<string, number> = {};

    // loop memeriksa tokenId (misal: dari token #1 sampai token #50)
    for (let i = 1; i <= 50; i++) {
      try {
        const ticket = await this.getTicket(i);

        // Hitung urutan nomor kursi sequential khusus untuk kategori event tersebut
        const key = `${ticket.eventId}-${ticket.categoryId}`;
        eventCategoryCounters[key] = (eventCategoryCounters[key] || 0) + 1;
        const seatIndex = eventCategoryCounters[key];

        // cocokkan apakah pemilik token ini sama dengan walletAddress pengguna yang sedang login
        // perbandingan string ke string harus persis, termasuk case sensitivity atau huruf kecil besar
        if (ticket.owner.toLowerCase() === walletAddress.toLowerCase()) {
          userTickets.push({
            ...ticket,
            seatIndex, // Urutan kursi ke-1, ke-2, dst dalam kategori event bersangkutan
          });
        }
      } catch {
        // Jika error (misalnya tiket belum pernah dibuat/minting) abaikan saja dan hentikan pencarian
        break;
      }
    }

    return userTickets;
  }

  async createSnapTransaction(dto: CreateSnapDto){
    // Ambil data event & kategorinya dari database MySQL
    const event = await this.eventsService.findOne(dto.eventId);
    const category = event.ticketCategories.find(
      (c) => Number(c.id) === Number(dto.categoryId),
    );

    if (!category){
      throw new BadRequestException('Kategori tiket tidak ditemukan');
    }

    const qty = dto.quantity > 0 ? dto.quantity : 1;
    // Rumus admin fee: 5000 + 2.5% dari grossAmount
    const baseFee = 5000;
    const variableFee = Math.round(Number(category.price) * qty * 0.025);
    const totalAdminFee = baseFee + variableFee;
    // Hitung total harga: (harga satuan * jumlah) + admin fee + variable fee
    const totalPrice = Number(category.price) * qty + totalAdminFee;

    // Pembuatan object customer
    const customer = await this.customerRepository.findOne({
      where: { walletAddress: dto.walletAddress }
    });

    if (!customer){
      throw new BadRequestException('Customer dengan alamat dompet tersebut tidak ditemukan.')
    }

    const orderId = crypto.randomUUID();

    // simpan pesanan ke tabel orders dengan status 'pending' dulu
    const newOrder = this.orderRepository.create({
      id: orderId,
      amount: qty,
      totalPrice: totalPrice,
      adminFee: totalAdminFee,
      status: OrderStatus.PENDING,
      customersId: customer.id,
      ticketCategoriesId: String(category.id),
    });

    await this.orderRepository.save(newOrder);

    // Ambil server key dair file di backend/.env
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey){
      throw new Error('Server Key Midtrans belum dikonfigurasi');
    }

    // Basic Auth Midtrans
    const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');

    // URL untuk transaksi Sandbox (default jika Midtrans isProduction = false)
    const midtransUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Buat objek transaksi (body request untuk Midtrans)
    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: totalPrice,
        },
        item_details: [
          {
            id: String(category.id),
            price: Math.round(Number(category.price)),
            quantity: qty,
            name: `${event.eventName} (${category.name})`.slice(0, 50),
          },
        ],
        customer_details: {
          first_name: dto.walletAddress.slice(0, 10),
          email: 'buyer@nftix.id',
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Midtrans Snap Error:', data);
      throw new BadRequestException(
        data.error_messages?.[0] || 'Gagal membuat tagihan pembayaran Midtrans',
      );
    }
    // Mengembalikan Snap Token dan URL Popup kasir ke frontend
    // Expected Output:
    //{
    //  "token": "midtrans-snap-token-example",
    //  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/pay?token=midtrans-snap-token-example",
    //  "orderId": "NFTIX-5-1-1756053929876",
    //  "grossAmount": 200000
    //}
    return {
      token: data.token,
      redirectUrl: data.redirect_url,
      orderId: orderId,
      grossAmount: grossAmount,
    };

  }

    // Method pembaca status untuk polling dari frontend
  async getOrderStatus(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new BadRequestException(`Order #${orderId} tidak ditemukan`);
    }
    return {
      orderId: order.id,
      status: order.status,
      midtransTransactionId: order.midtransTransactionId,
      amount: order.amount,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    };
  }


  // Menangani notifikasi webhook dari Midtrans setelah pembayaran selesai
  async handleMidtransWebhook(payload: any) {
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      throw new Error('Server Key Midtrans belum dikonfigurasi');
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = payload;

    // Verifikasi keaslian notifikasi menggunakan SHA-512 sesuai standar keamanan Midtrans
    const crypto = await import('crypto');
    const signaturePayload = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signaturePayload)
      .digest('hex');

    if (signature_key !== calculatedSignature) {
      throw new BadRequestException('Signature key Midtrans tidak valid');
    }

    // Status pembayaran berhasil (settlement atau capture yang disetujui)
    const isPaymentSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (!isPaymentSuccess) {
      return {
        status: 'ignored',
        message: `Status transaksi: ${transaction_status}, tidak memerlukan tindakan on-chain`,
      };
    }

    return {
      status: 'success',
      message: 'Notifikasi pembayaran Midtrans berhasil diverifikasi',
      orderId: order_id,
    };
  }
}
