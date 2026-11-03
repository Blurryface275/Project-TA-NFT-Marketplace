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
import { Customer } from '../customers/entities/customer.entity';
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
    const qty = 1; // pembatasan 1 tiket untuk 1 wallet

    console.log(`[TicketsService] Memproses pencetakan ${qty} tiket untuk dompet: ${dto.walletAddress}`,);

    // Nonce anti-replay 
    const nonce = BigInt(Date.now() * 1000);

    // Domain separator EIP-712
    const domain = {
      name: 'NFTix',
      version: '1',
      chainId: 11155111,
      verifyingContract: this.contractAddress
    } as const;

    // Tipe struktur data EIP-712 
    const types = {
      MintAuth: [
        { name: 'to', type: 'address' },
        { name: 'eventId', type: 'uint256' },
        { name: 'categoryId', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ],
    } as const;

    // Message EIP-712 
    const message = {
      to: dto.walletAddress as `0x${string}`,
      eventId: BigInt(dto.eventId),
      categoryId: BigInt(dto.categoryId),
      nonce: nonce,
    } as const;

    // Pembuatan signature untuk EIP-712 
    const signature = await this.account.signTypedData({
      domain,
      types,
      primaryType: 'MintAuth',
      message,
    });

    // Panggil fungsi MintTicket pada Smart Contract
    // Smart contract akan melakukan verifikasi: address signature valid, nonce belum pernah dipakai
    console.log(`[TicketsService] Mengirim transaksi mintTicket ke Sepolia...`);
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: TICKET_CONTRACT_ABI,
      functionName: 'mintTicket',
      args: [
        dto.walletAddress as `0x${string}`,
        BigInt(dto.eventId),
        BigInt(dto.categoryId),
        nonce,
        signature,
      ],
    });

    // Tunggu kofirmasi blok
    await this.publicClient.waitForTransactionReceipt({ hash });
    return {
      success: true,
      recipient: dto.walletAddress,
      txHash: hash,
    };
  }

  async redeemTicket(tokenId: number, walletAddress: string) {
    try {
      console.log(
        ' [TicketsService] Redeem tiket dengan ID: ' +
          tokenId +
          ' oleh wallet: ' +
          walletAddress,
      );

      const ticket = await this.getTicket(tokenId);

      // validasi kepemilikan
      if (ticket.owner.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException(
          `Validasi gagal: Alamat dompet ini tidak sama dengan pemilik tiket di blockchain`,
        );
      }

      // Cegah transaksi dikirim jika tiket sudah pernah dipakai sebelumnya (pencegahan double spending)
      if (ticket.used === true) {
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

  async createSnapTransaction(dto: CreateSnapDto) {
    // Ambil data event & kategorinya dri database MySQL
    const event = await this.eventsService.findOne(dto.eventId);
    // output event ini nanti bentuknya : {id: 1, name: 'Jazz Festival', ticketCategories: [
    //   {id: 1, name: 'VIP', price: 1000000},
    //   {id: 2, name: 'Festival', price: 500000},
    // ]} --> mengikuti sesuai dto CreateSnapDto

    // Ambil data kategori berdasarkan dto.categoryId
    const category = event.ticketCategories.find(
      (c) => Number(c.id) === Number(dto.categoryId),
    ); 
    // contoh output : {id: 1, name: 'VIP', price: 1000000}

    if (!category) {
      throw new BadRequestException("Kategori tiket tidak ditemukan")
    }

    // jika dto.quantity < 1 maka qty = 1, kalau >1 maka qty = dto.quantity
    const qty = dto.quantity > 0 ? dto.quantity : 1; 
    
    // Validasi batas kuota per wallet mencegah calo memborong tiket
    const maxAllowed = event.maxPerWallet || 1;
    const existingTickets = await this.getUserTickets(dto.walletAddress);
    const ownedCountForCurrentEvent = existingTickets.filter(
      (t) => t.eventId === dto.eventId, //difilter dengan cara membandingkan eventId satu persatu
    ).length;
    
    if(ownedCountForCurrentEvent + qty > maxAllowed) {
      throw new BadRequestException(`Batas tiket anda sudah terpenuhi`);
    }

    // Hitung biaya tiket + biaya admin untuk transaksi di blockchain
    const baseFee = 5000; // Fee transaksi untuk biaya gas di blockchain
    const variableFee = Math.round(Number(category.price) * qty * 0.025);
    const totalAdminFee = baseFee + variableFee;
    const totalPrice = Number(category.price) * qty + totalAdminFee;

    // make sure customer sudah memiliki wallet dan passkey terdaftar
    let customer = await this.customerRepository.findOne({
      where: { walletAddress: dto.walletAddress },
      relations: { user: true },
    });
    
    if (!customer) {
      // jika belum punya wallet, buat wallet baru untuk customer ini
      // note : user akan otomatis terdaftar saat pertama kali register passkey
      throw new BadRequestException("Customer tidak ditemukan");
    }

    // buat ID pesanan unik (UUIDv4) dan simpan order dengan status PENDING
    const orderId = crypto.randomUUID(); // pake algoritma CSPRNG

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
    
    // Siapkan authentication Midtrans  (Basic Auth: Base64 dari ServerKey:)
    const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
    if(!serverKey){
      throw new Error ('MIDTRANS_SERVER_KEY tidak ditemukan di environment')
    }
    const basicAuth = Buffer.from(`${serverKey}:`).toString('base64'); // contoh output : srv-pk-c19448fa0fa3d9e2b8131037f541ab72:
    const midtransUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Request Snap Token ke Midtrans 
    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
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
            name: `${event.eventName} (${category.name})`.slice(0,50), // dibatasi 50 karakter
          },
          {
            id: 'FEE-ADMIN',
            price: totalAdminFee,
            quantity: 1,
            name: 'Biaya Layanan & Admin',
          }, 
        ],
        customer_details: {
          first_name: customer.user.name,
          email: customer.user.email,
          
        },
      }),
    });

    const data = await response.json();
    if(!response.ok){
      console.error('Midtrans Snap Error:', data);
      throw new BadRequestException( 
        data.error_message || `Gagal membuat token Snap Midtrans`,
      );
    }

    // Return hasil snap token dari Mditrans ke Frontend
    return {
      token: data.token,
      redirectUrl: data.redirect_url,
      orderId: orderId,
      grossAmount: totalPrice,
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

  async handleMidtransWebhook(payload: any) {
    // buat serverKey dulu sesuai dokumentasi Midtrans
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
      if(!serverKey){
        throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi di file .env');
      }

    // Susun parameter menjadi sebuah payload
    const {
      order_id, 
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = payload;

    // Verfiikasi keaslian webhook menggunakan SHA-512
    const crypto = await import('crypto'); // buat secure hash
    const signaturePayload = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signaturePayload)
      .digest('hex');

    if (signature_key !== calculatedSignature){
      throw new BadRequestException('Signature key Midtrans tidak valid');
    }

    // Handle tombol 'Test Notificiation URL' buat dashboard simulator biar ga error
     if (
      order_id &&
      typeof order_id === 'string' &&
      order_id.startsWith('payment_notif_test_')
    ) {
      return {
        status: 'test_success',
        message: 'Midtrans test notification verified',
      };
    }

    // Ambil data order dari Database beserta relasinya
    const order = await this.orderRepository.findOne({
      where: {
        id: order_id
      },
      relations: {
        customer: true,
        ticketCategory: true  
      },
    });

     if (!order) {
      throw new BadRequestException(`Order #${order_id} tidak ditemukan`);
    }

    // Proteksi idempotensi : biar ga ada double minting jika webhook terkirim 2x
    if (order.status === OrderStatus.PAID) {
      return {
        status: 'already_processed',
        message: 'Transaksi sudah diproses sebelumnya',
      };
    }

    // Re-check status pembayaran dari Midtrans
    // 'settlement' digunakan untuk QRIS / VA / E-Wallet 
    // 'capture' dan 'fraud_status === 'accept' digunakan untuk Kartu Kredit / Debit
    const isPaymentSuccess = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');

    if (isPaymentSuccess){
      order.status = OrderStatus.PAID;
      order.midtransTransactionId = payload.transaction_id || null;
      await this.orderRepository.save(order);

      try {
        const mintResult = await this.mintTicket({
          walletAddress: order.customer.walletAddress!,
          eventId: order.ticketCategory.eventsId,
          categoryId: Number(order.ticketCategory.id),
          quantity: order.amount,
        });

        return {
          status: 'success',
          message: 'Pembayaran sukses dan tiket telah dicetak dan dapat dilihat secara on-chain',
          orderId: order_id, mintResult,
        };
      }
      catch (err:any){
        console.error('Minting on-chain gagal setelah pembayaran karena ', err);
        return{
          status: 'paid_minting_failed',
          orderId: order_id,
          error: err.message,
        };
      }
    } else if (['cancel','expire','deny'].includes(transaction_status)){
      order.status = transaction_status === 'cancel' ? OrderStatus.CANCELLED : OrderStatus.FAILED;
      order.midtransTransactionId = payload.transaction_id || null;
      await this.orderRepository.save(order);

      return {
        status: 'cancelled_or_failed',
        orderId: order_id,
        message: `Transaksi berstatus ${order.status}`,
      };
    }

     return {
      status: 'pending',
      orderId: order_id,
      message: `Transaksi berstatus ${transaction_status}, menunggu pembayaran`,
    };  
    

  }

  // Mengambil seluruh order transaksi milik pembeli berdasarkan alamat dompet
  async getMyOrders(walletAddress: string) {
    const customer = await this.customerRepository.findOne({
      where: { walletAddress },
    });

    if (!customer) {
      return [];
    }

    return this.orderRepository.find({
      where: { customersId: customer.id },
      relations: {
        ticketCategory: {
          event: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }
}
