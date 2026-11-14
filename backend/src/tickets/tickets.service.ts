import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http, keccak256, toHex, stringToBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TICKET_CONTRACT_ABI } from './ticket-abi';
import { MARKETPLACE_CONTRACT_ABI } from './marketplace-abi';
import { sepolia } from 'viem/chains';
import { MintTicketDto } from './dto/mint-ticket.dto';
import { EventsService } from '../events/events.service';
import { CreateSnapDto } from './dto/create-snap.dto';
import { DualScanVerifyDto } from './dto/dual-scan-verify.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import * as crypto from 'crypto';
import { parseEventLogs } from 'viem';
import { ResaleListing, ResaleStatus } from './entities/resale-listing.entity';
import { TicketCache } from './entities/ticket-cache.entity';

@Injectable()
export class TicketsService {
  private publicClient;
  private walletClient;
  private account;
  private contractAddress: `0x${string}`;
  private marketplaceAddress: `0x${string}`;

  constructor(
    private configService: ConfigService,
    private eventsService: EventsService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(TicketCache)
    private ticketCacheRepository: Repository<TicketCache>,
    @InjectRepository(ResaleListing)
    private resaleListingRepository: Repository<ResaleListing>,
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
    this.marketplaceAddress = this.configService.get<string>(
      'MARKETPLACE_CONTRACT_ADDRESS',
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

    // Tunggu kofirmasi blok & ekstrak tokenId dari event TIcketMinted
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    const logs = parseEventLogs({
      abi: TICKET_CONTRACT_ABI,
      eventName: 'TicketMinted',
      logs: receipt.logs,     
    });
    const mintedTokenId = logs[0]?.args?.tokenId ? Number(logs[0].args.tokenId) : null;

    return {
      success: true,
      tokenId: mintedTokenId,
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

  // Verifikasi Dual-Scan Gerbang Masuk (Venue Gate Access Control):
  // 1. Validasi Dynamic QR Code WebAuthn (anti-screenshot, expiry 60 detik)
  // 2. Validasi KTP Fisik via keccak256(NIK) on-chain (UU PDP Compliance)
  // 3. Eksekusi markUsed(tokenId) di smart contract
  async verifyDualScanGate(dto: DualScanVerifyDto) {
    try {
      const isManualMode = dto.signature === '0xmanual' || !dto.walletAddress;

      // 1. Validasi masa berlaku Dynamic QR Code (Maksimal 60 detik) jika bukan mode manual
      if (isManualMode) {
        if (!dto.nik || dto.nik.trim().length !== 16) {
          throw new BadRequestException('Verifikasi KTP Wajib: Masukkan 16 digit NIK fisik pengunjung.');
        }
      } else {
        if (!dto.signedAt) {
          throw new BadRequestException('Dynamic QR code tidak valid: timestamp penandatanganan tidak ditemukan.');
        }
        const signedTime = new Date(dto.signedAt).getTime();
        const currentTime = Date.now();
        const timeDiffSeconds = Math.floor((currentTime - signedTime) / 1000);

        if (isNaN(signedTime) || timeDiffSeconds > 60 || timeDiffSeconds < -5) {
          throw new BadRequestException(
            'QR Code tiket sudah kedaluwarsa (masa aktif 60 detik). Minta pengunjung merefresh QR Code di HP-nya.',
          );
        }
      }

      // 2. Ambil data tiket dan kunci baris MySQL dengan status used cek idempotensi
      const cachedTicket = await this.ticketCacheRepository.findOne({
        where: { tokenId: dto.tokenId },
      });

      if (cachedTicket && Boolean(cachedTicket.used)) {
        throw new BadRequestException(
          `Tiket #${dto.tokenId} sudah pernah digunakan (ALREADY USED). Akses masuk ditolak!`,
        );
      }

      // Ambil data tiket on-chain untuk cek status pemakaian & kepemilikan dompet
      const ticket = await this.getTicket(dto.tokenId);

      if (ticket.used) {
        // Jika di on-chain sudah used tapi di DB belum, sinkronkan langsung
        await this.ticketCacheRepository.update(
          { tokenId: dto.tokenId },
          { used: 1, syncedAt: new Date() },
        );
        throw new BadRequestException(
          `Tiket #${dto.tokenId} sudah pernah digunakan (ALREADY USED). Akses masuk ditolak!`,
        );
      }

      const targetWallet = (dto.walletAddress || ticket.owner).toLowerCase();

      if (!isManualMode && dto.walletAddress && ticket.owner.toLowerCase() !== dto.walletAddress.toLowerCase()) {
        throw new BadRequestException(
          'Alamat dompet di QR Code tidak cocok dengan pemilik sah tiket di blockchain!',
        );
      }

      // 3. Validasi KTP Fisik: Hitung keccak256(NIK) (Wajib untuk Dual-Scan Gate Admission)
      if (!dto.nik || dto.nik.trim().length !== 16) {
        throw new BadRequestException(
          'Verifikasi KTP Wajib: Masukkan 16 digit NIK fisik pengunjung untuk mencocokkan identitas pemilik tiket!',
        );
      }

      const cleanNik = dto.nik.trim();
      const computedNikHash = keccak256(stringToBytes(cleanNik));

      // Cek dulu kecocokan NIK di tabel customer MySQL (sangat cepat <5ms)
      const customer = await this.customerRepository.findOne({
        where: { walletAddress: targetWallet },
      });

      if (customer && customer.nikHash) {
        if (customer.nikHash.toLowerCase() !== computedNikHash.toLowerCase()) {
          throw new BadRequestException(
            'Verifikasi KTP Gagal: NIK KTP fisik tidak cocok dengan pemilik sah tiket ini!',
          );
        }
      } else {
        // Fallback ke Smart Contract jika customer di MySQL belum memiliki nikHash
        const registeredNikHash = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'getUserIdentity',
          args: [targetWallet as `0x${string}`],
        });

        if (
          !registeredNikHash ||
          registeredNikHash === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
          registeredNikHash.toLowerCase() !== computedNikHash.toLowerCase()
        ) {
          throw new BadRequestException(
            'Verifikasi KTP Gagal: NIK KTP fisik tidak cocok dengan pemilik sah tiket ini di blockchain!',
          );
        }
      }

      // 4. Atomic Pessimistic State Update:
      // Cegah Race Condition (Double-scan serentak dalam milidetik di pintu gerbang yang berbeda)
      // Jalankan update kondisional: Hanya berhasil jika used masih 0
      const updateResult = await this.ticketCacheRepository
        .createQueryBuilder()
        .update()
        .set({ used: 1, syncedAt: new Date() })
        .where('tokenId = :tokenId AND used = 0', { tokenId: dto.tokenId })
        .execute();

      if (updateResult.affected === 0) {
        throw new BadRequestException(
          `Tiket #${dto.tokenId} sedang atau sudah diproses masuk di gerbang lain!`,
        );
      }

      // 5. Eksekusi markUsed(tokenId) on-chain
      let hash: `0x${string}`;
      try {
        hash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'markUsed',
          args: [BigInt(dto.tokenId)],
        });

        const receipt = await this.publicClient.waitForTransactionReceipt({
          hash: hash,
        });

        return {
          success: true,
          message: 'Verifikasi Berhasil! Pengunjung dipersilakan masuk.',
          tokenId: dto.tokenId,
          walletAddress: dto.walletAddress,
          txHash: hash,
          blockNumber: Number(receipt.blockNumber),
        };
      } catch (txError: any) {
        // Rollback state DB lokal jika transaksi smart contract gagal
        await this.ticketCacheRepository.update(
          { tokenId: dto.tokenId },
          { used: 0, syncedAt: new Date() },
        );
        throw txError;
      }
    } catch (error: any) {
      console.error('[Dual-Scan] Verifikasi gagal:', error);
      throw new BadRequestException(
        error?.shortMessage || error?.message || 'Verifikasi tiket di gerbang gagal',
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

  // Mengambil status spesifik 1 tiket untuk auto-polling real-time
  async getTicketStatus(tokenId: number) {
    const cached = await this.ticketCacheRepository.findOne({
      where: { tokenId },
    });
    if (!cached) {
      throw new NotFoundException(`Tiket #${tokenId} tidak ditemukan`);
    }
    return {
      tokenId: cached.tokenId,
      used: Boolean(cached.used),
      syncedAt: cached.syncedAt,
    };
  }

  // Mengambil seluruh tiket milik dompet dari database cache lokal (MySQL)
  async getUserTickets(walletAddress: string) {
    // Sinkronkan order PAID milik user ini yang belum tercatat di ticket_cache (self-healing)
    const customer = await this.customerRepository.findOne({
      where: { walletAddress },
    });
    if (customer) {
      const paidOrders = await this.orderRepository.find({
        where: { customersId: customer.id, status: OrderStatus.PAID },
        relations: { ticketCategory: true, customer: true },
      });
      for (const po of paidOrders) {
        const hasTicket = await this.ticketCacheRepository.findOne({
          where: { ordersId: po.id },
        });
        if (!hasTicket) {
          try {
            await this.processPaidOrder(po);
          } catch (e) {
            console.error(`Gagal mint tiket tertunda untuk order ${po.id}:`, e);
          }
        }
      }
    }

    // Sinkronkan transaksi resale yang masih berstatus LOCKED milik wallet ini jika sudah settlement di Midtrans
    const pendingResales = await this.resaleListingRepository.find({
      where: {
        buyerWallet: walletAddress,
        status: ResaleStatus.LOCKED,
      },
    });

    for (const r of pendingResales) {
      await this.reconcileMidtransResale(r);
    }

    const cachedTickets = await this.ticketCacheRepository.find({
      where: { ownerWallet: walletAddress.toLowerCase() },
      relations: { event: true },
      order: { tokenId: 'ASC' },
    });

    // Ambil daftar token yang saat ini sedang aktif di pasar resale
    const activeResales = await this.resaleListingRepository.find({
      where: [
        { status: ResaleStatus.ACTIVE },
        { status: ResaleStatus.LOCKED },
      ],
    });
    const listedTokenIds = new Set(activeResales.map((r) => r.ticketCacheTokenId));

    return cachedTickets.map((t, index) => ({
      tokenId: t.tokenId,
      eventId: t.eventsId,
      categoryId: 1,
      originalPrice: Number(t.originalPrice),
      used: Boolean(t.used),
      owner: t.ownerWallet,
      seatIndex: index + 1,
      isListed: listedTokenIds.has(t.tokenId),
    }));
  }

  async createSnapTransaction(dto: CreateSnapDto) {
    // Validasi Cloudflare Turnstile
    const turnstileSecret = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    if(turnstileSecret){
      if(!dto.turnstileToken){
        throw new BadRequestException('Token verifikasi Cloudflare Turnstile wajib disertakan');
      }

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: dto.turnstileToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if(!verifyData.success){
        console.error('[TURNSTILE] Verifikasi bot gagal:', verifyData['error-codes']);
        throw new BadRequestException('Verifikasi bot (Cloudflare Turnstile) gagal atau kedaluwarsa');     
      }
        console.log('[TURNSTILE] Lolos verifikasi manusia:', verifyData.hostname);
    }
    // Ambil data event & kategorinya dri database MySQL
    const event = await this.eventsService.findOne(dto.eventId);

        // Validasi Flash Sale Time Gate: Cek apakah penjualan sudah dibuka
    if (event.saleStartTime) {
      const now = new Date();
      const saleStart = new Date(event.saleStartTime);
      if (now < saleStart) {
        throw new BadRequestException(
          `Flash sale belum dibuka! Penjualan tiket baru dimulai pada: ${saleStart.toLocaleString('id-ID')}`
        );
      }
    }
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

    // Soft-Locking / Reservation Window 10 Menit (Anti-Overbooking / First-Principles)
    // Hitung tiket yang sudah PAID + tiket PENDING yang masih aktif (< 10 menit)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeOrders = await this.orderRepository.find({
      where: [
        { ticketCategoriesId: String(category.id), status: OrderStatus.PAID },
        { ticketCategoriesId: String(category.id), status: OrderStatus.PENDING, createdAt: MoreThan(tenMinutesAgo) },
      ],
    });
    const reservedQuota = activeOrders.reduce((sum, order) => sum + (order.amount || 1), 0);
    const availableQuota = category.quota - reservedQuota;

    if (availableQuota < qty) {
      throw new BadRequestException(
        'Semua kuota tiket saat ini sedang dalam proses pembayaran oleh pembeli lain. Silakan coba beberapa saat lagi jika ada pesanan yang batal/kedaluwarsa.'
      );
    }
    
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
  

  /**
   * Helper rekonsiliasi status pesanan langsung dengan API Midtrans.
   * Digunakan saat polling atau sinkronisasi jika webhook Midtrans belum/tidak menjangkau localhost.
   */
  async reconcileMidtransOrder(order: Order): Promise<void> {
    if (order.status !== OrderStatus.PENDING) {
      return;
    }

    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      return;
    }

    try {
      const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');
      const response = await fetch(`https://api.sandbox.midtrans.com/v2/${order.id}/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const midtransData = await response.json();
      const isPaymentSuccess =
        midtransData.transaction_status === 'settlement' ||
        (midtransData.transaction_status === 'capture' && midtransData.fraud_status === 'accept');

      if (isPaymentSuccess) {
        await this.processPaidOrder(order, midtransData.transaction_id);
      } else if (['cancel', 'expire', 'deny'].includes(midtransData.transaction_status)) {
        order.status =
          midtransData.transaction_status === 'cancel'
            ? OrderStatus.CANCELLED
            : OrderStatus.FAILED;
        order.midtransTransactionId =
          midtransData.transaction_id || order.midtransTransactionId || null;
        await this.orderRepository.save(order);
      }
    } catch (error) {
      console.error(`[Midtrans Reconciliation] Gagal merekonsiliasi order ${order.id}:`, error);
    }
  }

  /**
   * Helper rekonsiliasi status resale langsung dengan API Midtrans (saat webhook belum sampai di localhost)
   */
  async reconcileMidtransResale(listing: ResaleListing): Promise<void> {
    if (!listing.buyerMidtransTransactionId) return;

    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey) return;

    try {
      const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');
      const response = await fetch(
        `https://api.sandbox.midtrans.com/v2/${listing.buyerMidtransTransactionId}/status`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        },
      );

      if (!response.ok) return;

      const midtransData = await response.json();
      await this.handleResaleWebhook(
        listing.buyerMidtransTransactionId,
        midtransData.transaction_status,
        midtransData.fraud_status,
        midtransData.transaction_id || null,
      );

      // Refresh status listing terbaru
      const updated = await this.resaleListingRepository.findOne({
        where: { id: listing.id },
      });
      if (updated) {
        listing.status = updated.status;
      }
    } catch (error) {
      console.error(
        `[Midtrans Resale Reconciliation] Gagal rekonsiliasi resale order ${listing.buyerMidtransTransactionId}:`,
        error,
      );
    }
  }

  // Helper ambil entity order lengkap
  async getOrderEntity(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        ticketCategory: true,
      },
    });
    if (!order) {
      throw new BadRequestException(`Order #${orderId} tidak ditemukan`);
    }
    return order;
  }

  // Method pembaca status untuk polling dari frontend dengan rekonsiliasi Midtrans
  async getOrderStatus(orderId: string) {
    // Cabang khusus untuk order pasar sekunder (RESALE-...)
    if (typeof orderId === 'string' && orderId.startsWith('RESALE-')) {
      const listing = await this.resaleListingRepository.findOne({
        where: { buyerMidtransTransactionId: orderId },
        relations: { ticketCache: { event: true } },
      });

      if (!listing) {
        throw new BadRequestException(`Order resale #${orderId} tidak ditemukan`);
      }

      if (listing.status === ResaleStatus.LOCKED) {
        await this.reconcileMidtransResale(listing);
      }

      return {
        orderId,
        status: listing.status === ResaleStatus.SOLD ? OrderStatus.PAID : listing.status.toLowerCase(),
        midtransTransactionId: listing.buyerMidtransTransactionId,
        amount: 1,
        totalPrice: Number(listing.lockedPrice) + (Number(listing.adminFee) || 0),
        createdAt: listing.listedAt,
      };
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        ticketCategory: true,
      },
    });
    if (!order) {
      throw new BadRequestException(`Order #${orderId} tidak ditemukan`);
    }

    if (order.status === OrderStatus.PENDING) {
      await this.reconcileMidtransOrder(order);
      // Reload order dari DB untuk memastikan status terbaru (PAID / CANCELLED / FAILED)
      const updatedOrder = await this.orderRepository.findOne({
        where: { id: orderId },
      });
      if (updatedOrder) {
        order.status = updatedOrder.status;
        order.midtransTransactionId = updatedOrder.midtransTransactionId;
      }
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

  /**
   * Helper pemrosesan pesanan yang sudah lunas (PAID).
   * Bertanggung jawab untuk update database, minting NFT tiket di blockchain Sepolia,
   * dan mencatatnya ke tabel ticket_cache.
   */
  async processPaidOrder(order: Order, transactionId?: string | null) {
    if (order.status === OrderStatus.PAID) {
      const existingTicket = await this.ticketCacheRepository.findOne({
        where: { ordersId: order.id },
      });
      if (existingTicket) {
        return {
          status: 'already_processed',
          message: 'Transaksi sudah diproses sebelumnya',
        };
      }
    }

    const claimResult = await this.orderRepository.update(
      { id: order.id, status: OrderStatus.PENDING },
      {
        status: OrderStatus.PAID,
        midtransTransactionId: transactionId || order.midtransTransactionId || null,
      },
    );
    if (!claimResult.affected) {
      return {
        status: 'already_processed',
        message: 'Transaksi sudah diproses atau sedang diproses',
      };
    }
    order.status = OrderStatus.PAID;
    order.midtransTransactionId = transactionId || order.midtransTransactionId || null;

    // Pastikan relasi customer dan ticketCategory tersedia jika order belum di-load secara lengkap
    if (!order.customer || !order.ticketCategory) {
      const fullOrder = await this.orderRepository.findOne({
        where: { id: order.id },
        relations: { customer: true, ticketCategory: true },
      });
      if (fullOrder) {
        order.customer = fullOrder.customer;
        order.ticketCategory = fullOrder.ticketCategory;
      }
    }

    try {
      console.log(`[TicketsService] Memulai minting on-chain untuk order #${order.id}...`);
      const mintResult = await this.mintTicket({
        walletAddress: order.customer.walletAddress!,
        eventId: order.ticketCategory.eventsId,
        categoryId: Number(order.ticketCategory.id),
        quantity: order.amount,
      });

      // Simpan juga ke tabel ticket_cache sesuai ERD supaya query tiket & resale ga perlu looping RPC terus
      if (mintResult.tokenId) {
        await this.ticketCacheRepository.save({
          tokenId: mintResult.tokenId,
          ownerWallet: order.customer.walletAddress!,
          originalPrice: Number(order.ticketCategory.price),
          used: 0,
          syncedAt: new Date(),
          eventsId: order.ticketCategory.eventsId,
          ordersId: order.id,
        });
        console.log(`[TicketsService] Berhasil minting tiket #${mintResult.tokenId} untuk order #${order.id}`);
      }

      return {
        status: 'success',
        message: 'Pembayaran sukses dan tiket telah dicetak dan dapat dilihat secara on-chain',
        orderId: order.id,
        mintResult,
      };
    } catch (err: any) {
      console.error('Minting on-chain gagal setelah pembayaran karena ', err);
      return {
        status: 'paid_minting_failed',
        orderId: order.id,
        error: err.message,
      };
    }
  }

  async handleMidtransWebhook(payload: any) {
    // buat serverKey dulu sesuai dokumentasi Midtrans
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
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

    // Verifikasi keaslian webhook menggunakan SHA-512
    const crypto = await import('crypto'); // buat secure hash
    const signaturePayload = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signaturePayload)
      .digest('hex');

    if (signature_key !== calculatedSignature) {
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

    // Cabang khusus kalau yg dibayar adalah tiket Pasar Sekunder (order_id diawali 'RESALE-')
    if (typeof order_id === 'string' && order_id.startsWith('RESALE-')) {
      return this.handleResaleWebhook(
        order_id,
        transaction_status,
        fraud_status,
        payload.transaction_id || null,
      );
    }

    // Ambil data order dari Database beserta relasinya
    const order = await this.orderRepository.findOne({
      where: {
        id: order_id,
      },
      relations: {
        customer: true,
        ticketCategory: true,
      },
    });

    if (!order) {
      console.warn(`[TicketsService] Webhook diabaikan: Order #${order_id} tidak ditemukan di database lokal`);
      return {
        status: 'ignored_order_not_found',
        orderId: order_id,
        message: 'Order tidak ditemukan di database lokal',
      };
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
    const isPaymentSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isPaymentSuccess) {
      return this.processPaidOrder(order, payload.transaction_id || null);
    } else if (['cancel', 'expire', 'deny'].includes(transaction_status)) {
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

    const orders = await this.orderRepository.find({
      where: { customersId: customer.id },
      relations: {
        customer: true,
        ticketCategory: {
          event: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    for (const order of orders) {
      if (order.status === OrderStatus.PENDING) {
        await this.reconcileMidtransOrder(order);
      }
    }

    return orders;
  }

  // ===========================================================================
  // FITUR PASAR SEKUNDER (RESALE MARKETPLACE - ANTI SCALPING)
  // ===========================================================================

  // 1. Daftarkan tiket ke Pasar Sekunder (harga jual otomatis dikunci = originalPrice)
  async listTicketForResale(tokenId: number, sellerWallet: string) {
    // Cek dulu data tiket langsung dari smart contract Sepolia
    const onChainTicket = await this.getTicket(tokenId);

    // Pastikan yang request jual beneran pemilik sah tiket di blockchain
    if (onChainTicket.owner.toLowerCase() !== sellerWallet.toLowerCase()) {
      throw new BadRequestException('Validasi gagal: Anda bukan pemilik sah tiket ini');
    }

    // Tiket yang sudah di-scan masuk venue ga boleh dijual lagi
    if (onChainTicket.used) {
      throw new BadRequestException('Validasi gagal: Tiket sudah pernah digunakan dan tidak bisa dijual');
    }

    // Pastikan data tiket sudah ada di tabel ticket_cache MySQL (karena resale_listings punya FK ke ticket_cache)
    let cache = await this.ticketCacheRepository.findOne({
      where: { tokenId },
    });

    if (!cache) {
      // Kalau tiket lama belum sempat masuk ticket_cache, kita sinkronkan dulu dari order terakhir yang paid
      const latestOrder = await this.orderRepository.findOne({
        where: { status: OrderStatus.PAID },
        order: { createdAt: 'DESC' },
      });
      if (!latestOrder) {
        throw new BadRequestException('Data order asal untuk ticket_cache belum ditemukan');
      }

      cache = await this.ticketCacheRepository.save({
        tokenId,
        ownerWallet: onChainTicket.owner,
        originalPrice: onChainTicket.originalPrice,
        used: onChainTicket.used ? 1 : 0,
        syncedAt: new Date(),
        eventsId: onChainTicket.eventId,
        ordersId: latestOrder.id,
      });
    }

    // Kirim transaksi listTicket(tokenId, seller) ke MarketplaceContract di Sepolia via relayer admin
    console.log(`[TicketsService] Mendaftarkan resale tokenId #${tokenId} milik ${sellerWallet} ke Sepolia...`);
    const hash = await this.walletClient.writeContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_CONTRACT_ABI,
      functionName: 'listTicket',
      args: [BigInt(tokenId), sellerWallet as `0x${string}`],
    });

    // Tunggu sampai transaksi masuk ke blok Sepolia
    await this.publicClient.waitForTransactionReceipt({ hash });

    // Simpan ke tabel resale_listings MySQL dengan lockedPrice = originalPrice (Zero-Markup Price Lock)
    const listing = this.resaleListingRepository.create({
      id: crypto.randomUUID(), // generate UUID unik karena 1 tiket bisa dijual berkali-kali
      sellerWallet,
      lockedPrice: onChainTicket.originalPrice,
      status: ResaleStatus.ACTIVE,
      listedAt: new Date(),
      ticketCacheTokenId: tokenId,
      buyerWallet: null,
      adminFee: null,
      buyerMidtransTransactionId: null,
    });

    await this.resaleListingRepository.save(listing);

    return {
      success: true,
      listingId: listing.id,
      tokenId,
      lockedPrice: listing.lockedPrice,
      txHash: hash,
    };
  }

  // 2. Batalkan listing tiket yang sedang dijual di Pasar Sekunder
  async cancelResaleListing(tokenId: number, sellerWallet: string) {
    // Cari listing yang masih ACTIVE untuk tokenId tersebut
    const listing = await this.resaleListingRepository.findOne({
      where: {
        ticketCacheTokenId: tokenId,
        status: ResaleStatus.ACTIVE,
      },
    });

    if (!listing) {
      throw new BadRequestException('Listing aktif untuk tiket ini tidak ditemukan');
    }

    // Pastikan yang membatalkan adalah penjual aslinya
    if (listing.sellerWallet.toLowerCase() !== sellerWallet.toLowerCase()) {
      throw new BadRequestException('Hanya penjual asli yang dapat membatalkan listing ini');
    }

    // Panggil fungsi cancelListing(tokenId) di MarketplaceContract Sepolia
    console.log(`[TicketsService] Membatalkan listing resale tokenId #${tokenId} di Sepolia...`);
    const hash = await this.walletClient.writeContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_CONTRACT_ABI,
      functionName: 'cancelListing',
      args: [BigInt(tokenId)],
    });

    await this.publicClient.waitForTransactionReceipt({ hash });

    // Update status di MySQL jadi CANCELLED
    listing.status = ResaleStatus.CANCELLED;
    await this.resaleListingRepository.save(listing);

    return {
      success: true,
      tokenId,
      status: listing.status,
      txHash: hash,
    };
  }

  // 3. Ambil seluruh daftar tiket resale yang sedang ACTIVE untuk halaman katalog /dashboard/resale
  async getActiveResaleListings() {
    const now = new Date();
    // Tampilkan yang ACTIVE, atau yang LOCKED tapi batas waktu reservasi (lockedUntil) sudah kedaluwarsa
    return this.resaleListingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.ticketCache', 'ticketCache')
      .leftJoinAndSelect('ticketCache.event', 'event')
      .where('listing.status = :active', { active: ResaleStatus.ACTIVE })
      .orWhere('(listing.status = :locked AND listing.lockedUntil < :now)', {
        locked: ResaleStatus.LOCKED,
        now,
      })
      .orderBy('listing.listedAt', 'DESC')
      .getMany();
  }

  // 3b. Ambil detail 1 tiket resale berdasarkan listingId
  async getResaleListingDetail(listingId: string) {
    const listing = await this.resaleListingRepository.findOne({
      where: { id: listingId },
      relations: {
        ticketCache: {
          event: true,
        },
      },
    });
    if (!listing) {
      throw new NotFoundException('Tiket resale tidak ditemukan atau sudah tidak aktif.');
    }
    return listing;
  }

  // 4. Buat transaksi Midtrans Snap saat pembeli baru klik "Beli Tiket Resale"
  async createResaleSnapTransaction(listingId: string, buyerWallet: string) {
    // Ambil data listing beserta relasi ticket_cache dan event-nya
    const listing = await this.resaleListingRepository.findOne({
      where: { id: listingId },
      relations: {
        ticketCache: {
          event: true,
        },
      },
    });

    if (!listing || listing.status === ResaleStatus.SOLD || listing.status === ResaleStatus.CANCELLED) {
      throw new BadRequestException('Tiket resale sudah laku atau tidak tersedia');
    }

    // Cek apakah tiket sedang di-lock oleh pembeli lain yang belum kedaluwarsa (< 10 menit)
    const now = new Date();
    const isLockedByOther =
      listing.status === ResaleStatus.LOCKED &&
      listing.lockedUntil &&
      listing.lockedUntil > now;

    if (isLockedByOther) {
      throw new BadRequestException('Tiket resale sedang dalam proses pembayaran oleh pembeli lain. Silakan coba beberapa saat lagi.');
    }

    // Penjual ga boleh beli tiketnya sendiri
    if (listing.sellerWallet.toLowerCase() === buyerWallet.toLowerCase()) {
      throw new BadRequestException('Anda tidak dapat membeli tiket yang Anda jual sendiri');
    }

    // Pastikan pembeli sudah punya akun customer & wallet terdaftar
    const buyerCustomer = await this.customerRepository.findOne({
      where: { walletAddress: buyerWallet },
      relations: { user: true },
    });

    if (!buyerCustomer) {
      throw new BadRequestException('Customer pembeli tidak ditemukan');
    }

    // Hitung harga tiket (terkunci sesuai harga asli) + biaya admin subsidi gas blockchain
    const ticketPrice = Math.round(Number(listing.lockedPrice));
    const baseFee = 5000;
    const variableFee = Math.round(ticketPrice * 0.025);
    const totalAdminFee = baseFee + variableFee;
    const grossAmount = ticketPrice + totalAdminFee;

    // Buat order_id khusus dengan awalan 'RESALE-' supaya webhook Midtrans tahu ini transaksi pasar sekunder
    const midtransOrderId = `RESALE-${listing.ticketCacheTokenId}-${Date.now()}`;

    // Kunci tiket dengan status LOCKED selama 10 menit
    listing.status = ResaleStatus.LOCKED;
    listing.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    listing.buyerWallet = buyerWallet;
    listing.adminFee = totalAdminFee;
    listing.buyerMidtransTransactionId = midtransOrderId;
    await this.resaleListingRepository.save(listing);

    // Siapkan Basic Auth Midtrans
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY tidak ditemukan di environment');
    }
    const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');
    const midtransUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Request Snap Token ke Midtrans
    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: grossAmount,
        },
        item_details: [
          {
            id: `RESALE-TOKEN-${listing.ticketCacheTokenId}`,
            price: ticketPrice,
            quantity: 1,
            name: `Resale ${listing.ticketCache?.event?.eventName || 'Tiket'} (#${listing.ticketCacheTokenId})`.slice(0, 50),
          },
          {
            id: 'FEE-ADMIN-RESALE',
            price: totalAdminFee,
            quantity: 1,
            name: 'Biaya Layanan & Subsidi Gas',
          },
        ],
        customer_details: {
          first_name: buyerCustomer.user.name,
          email: buyerCustomer.user.email,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      // Kalau gagal bikin Snap Token di Midtrans, bersihkan kembali status lock
      listing.status = ResaleStatus.ACTIVE;
      listing.lockedUntil = null;
      listing.buyerWallet = null;
      listing.buyerMidtransTransactionId = null;
      await this.resaleListingRepository.save(listing);

      console.error('Midtrans Resale Snap Error:', data);
      throw new BadRequestException(
        data.error_message || 'Gagal membuat token Snap Midtrans untuk resale',
      );
    }

    return {
      token: data.token,
      redirectUrl: data.redirect_url,
      orderId: midtransOrderId,
      grossAmount,
    };
  }

  // 5. Method buat memproses webhook / rekonsiliasi Midtrans khusus transaksi Pasar Sekunder (RESALE-)
  async handleResaleWebhook(
    midtransOrderId: string,
    transactionStatus: string,
    fraudStatus: string,
    transactionId: string | null,
  ) {
    // Cari data listing berdasarkan ID transaksi Midtrans pembeli
    const listing = await this.resaleListingRepository.findOne({
      where: { buyerMidtransTransactionId: midtransOrderId },
    });

    if (!listing) {
      console.warn(`[TicketsService] Resale webhook diabaikan: Order #${midtransOrderId} tidak ditemukan di database lokal`);
      return {
        status: 'ignored_resale_order_not_found',
        orderId: midtransOrderId,
        message: 'Resale order tidak ditemukan di database lokal',
      };
    }

    // Proteksi idempotensi: kalau sudah SOLD jangan dieksekusi 2x
    if (listing.status === ResaleStatus.SOLD) {
      return {
        status: 'already_processed',
        message: 'Transaksi resale sudah diproses sebelumnya',
      };
    }

    const isPaymentSuccess =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept');

    if (isPaymentSuccess) {
      try {
        // Eksekusi pemindahan NFT on-chain dari penjual ke pembeli baru via MarketplaceContract.executeResale
        console.log(`[TicketsService] Mengeksekusi executeResale untuk tokenId #${listing.ticketCacheTokenId} ke ${listing.buyerWallet}...`);
        const hash = await this.walletClient.writeContract({
          address: this.marketplaceAddress,
          abi: MARKETPLACE_CONTRACT_ABI,
          functionName: 'executeResale',
          args: [
            BigInt(listing.ticketCacheTokenId),
            listing.buyerWallet! as `0x${string}`,
          ],
        });

        await this.publicClient.waitForTransactionReceipt({ hash });

        // Update status listing dari ACTIVE langsung jadi SOLD
        listing.status = ResaleStatus.SOLD;
        await this.resaleListingRepository.save(listing);

        // Update juga alamat pemilik baru di tabel ticket_cache MySQL
        await this.ticketCacheRepository.update(
          { tokenId: listing.ticketCacheTokenId },
          {
            ownerWallet: listing.buyerWallet!,
            syncedAt: new Date(),
          },
        );

        return {
          status: 'success',
          message: 'Pembayaran resale sukses dan NFT telah berpindah tangan secara on-chain',
          tokenId: listing.ticketCacheTokenId,
          newOwner: listing.buyerWallet,
          txHash: hash,
        };
      } catch (err: any) {
        console.error('Eksekusi executeResale on-chain gagal setelah pembayaran:', err);
        return {
          status: 'paid_resale_execution_failed',
          orderId: midtransOrderId,
          error: err.message,
        };
      }
    } else if (['cancel', 'expire', 'deny'].includes(transactionStatus)) {
      // Kalau pembayaran batal atau kedaluwarsa, buka kembali lock (status kembali ACTIVE)
      listing.status = ResaleStatus.ACTIVE;
      listing.lockedUntil = null;
      listing.buyerWallet = null;
      listing.buyerMidtransTransactionId = null;
      await this.resaleListingRepository.save(listing);

      return {
        status: 'resale_payment_cancelled',
        orderId: midtransOrderId,
        message: 'Pembayaran batal/kedaluwarsa, tiket tetap berstatus ACTIVE di katalog resale',
      };
    }

    return {
      status: 'pending',
      orderId: midtransOrderId,
      message: `Transaksi resale berstatus ${transactionStatus}, menunggu pembayaran`,
    };
  }
}
