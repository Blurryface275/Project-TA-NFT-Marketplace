import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Optional,
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
import { EntityManager, Repository, MoreThan } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import * as crypto from 'crypto';
import { parseEventLogs } from 'viem';
import { ResaleListing, ResaleStatus } from './entities/resale-listing.entity';
import { TicketCache } from './entities/ticket-cache.entity';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { MailService } from '../auth/mail.service';
import { PasskeyCredential } from '../auth/entities/passkey-credential.entity';

@Injectable()
export class TicketsService {
  private publicClient;
  private walletClient;
  private account;
  private contractAddress: `0x${string}`;
  private marketplaceAddress: `0x${string}`;
  private readonly ticketLocks = new Map<number, Promise<void>>();
  private failedResaleOrders = new Map<
    string,
    { status: 'refunded' | 'failed'; message: string; amount: number }
  >();

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
    @InjectRepository(PasskeyCredential)
    private passkeyCredentialRepository: Repository<PasskeyCredential>,
    @Optional()
    private readonly mailService?: MailService,
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

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    delayMs = 2000,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  }

  private async refundMidtransTransaction(
    orderId: string,
    amount: number,
    reason: string,
  ): Promise<{ refunded: boolean; detail: string }> {
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      return {
        refunded: false,
        detail: 'MIDTRANS_SERVER_KEY tidak dikonfigurasi',
      };
    }

    try {
      const authString = Buffer.from(`${serverKey}:`).toString('base64');
      const response = await fetch(
        `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/refund`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${authString}`,
          },
          body: JSON.stringify({
            refund_key: `REFUND-${orderId}`,
            amount: Math.round(amount),
            reason,
          }),
        },
      );

      const data = await response.json().catch(() => ({} as any));
      if (
        !response.ok ||
        (data?.status_code && !String(data.status_code).startsWith('2'))
      ) {
        return {
          refunded: false,
          detail: data?.status_message || `Midtrans HTTP ${response.status}`,
        };
      }

      return {
        refunded: true,
        detail: data?.status_message || 'Refund otomatis Midtrans berhasil',
      };
    } catch (err: any) {
      return {
        refunded: false,
        detail: err?.message || 'Gagal menghubungi API refund Midtrans',
      };
    }
  }

  private async withTicketLock<T>(
    tokenId: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const prev = this.ticketLocks.get(tokenId) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = prev.then(() => next);
    this.ticketLocks.set(tokenId, chained);

    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (this.ticketLocks.get(tokenId) === chained) {
        this.ticketLocks.delete(tokenId);
      }
    }
  }

  private async assertWalletEligibleForEvent(
    manager: EntityManager,
    walletLower: string,
    customerId: number,
    eventId: number,
  ): Promise<void> {
    const ownedCount = await manager
      .createQueryBuilder(TicketCache, 'tc')
      .where('LOWER(tc.ownerWallet) = :walletLower', { walletLower })
      .andWhere('tc.eventsId = :eventId', { eventId })
      .getCount();

    if (ownedCount > 0) {
      throw new BadRequestException(
        'Batas tiket anda sudah terpenuhi: 1 dompet maksimal hanya dapat memiliki 1 tiket untuk event ini.',
      );
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeOrderCount = await manager
      .createQueryBuilder(Order, 'o')
      .innerJoin('o.ticketCategory', 'cat')
      .leftJoin(TicketCache, 'tc', 'tc.ordersId = o.id')
      .where('o.customersId = :customerId', { customerId })
      .andWhere('cat.eventsId = :eventId', { eventId })
      .andWhere(
        '((o.status = :pendingStatus AND o.createdAt > :tenMinutesAgo) OR (o.status = :paidStatus AND tc.tokenId IS NULL))',
        {
          pendingStatus: OrderStatus.PENDING,
          tenMinutesAgo,
          paidStatus: OrderStatus.PAID,
        },
      )
      .getCount();

    if (activeOrderCount > 0) {
      throw new BadRequestException(
        'Anda sudah memiliki pesanan aktif atau tiket yang sedang diproses untuk event ini.',
      );
    }

    const now = new Date();
    const activeResaleLockCount = await manager
      .createQueryBuilder(ResaleListing, 'rl')
      .innerJoin('rl.ticketCache', 'tc')
      .where('LOWER(rl.buyerWallet) = :walletLower', { walletLower })
      .andWhere('rl.status = :lockedStatus', {
        lockedStatus: ResaleStatus.LOCKED,
      })
      .andWhere('rl.lockedUntil > :now', { now })
      .andWhere('tc.eventsId = :eventId', { eventId })
      .getCount();

    if (activeResaleLockCount > 0) {
      throw new BadRequestException(
        'Anda sedang memiliki reservasi pembelian resale aktif untuk event ini.',
      );
    }
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
      const walletTrimmed = dto.walletAddress?.trim() || '';
      const isManualMode = dto.signature === '0xmanual' && !walletTrimmed;

      // 1. Validasi masa berlaku Dynamic QR Code (Maksimal 60 detik) & kelengkapan WebAuthn jika bukan mode manual
      if (isManualMode) {
        if (!dto.nik || dto.nik.trim().length !== 16) {
          throw new BadRequestException('Verifikasi KTP Wajib: Masukkan 16 digit NIK fisik pengunjung.');
        }
      } else {
        if (!walletTrimmed) {
          throw new BadRequestException('Dynamic QR code tidak valid: alamat dompet tidak ditemukan.');
        }
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
        if (
          !dto.signature?.trim() ||
          !dto.authenticatorData?.trim() ||
          !dto.clientDataJSON?.trim()
        ) {
          throw new BadRequestException(
            'Dynamic QR code tidak valid: bukti tanda tangan WebAuthn tidak lengkap.',
          );
        }
        if (
          dto.nonce === undefined ||
          dto.nonce === null ||
          typeof dto.nonce !== 'number' ||
          !Number.isFinite(dto.nonce)
        ) {
          throw new BadRequestException(
            'Dynamic QR code tidak valid: nonce WebAuthn tidak ditemukan.',
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

      // Isolasi akses organizer: pastikan tiket milik event dari organizer yang sedang login
      if (dto.organizerUserId !== undefined && dto.organizerUserId !== null) {
        const organizerRows = await this.orderRepository.manager.query(
          'SELECT id FROM organizers WHERE users_id = ? LIMIT 1',
          [dto.organizerUserId],
        );
        const eventRows = cachedTicket?.eventsId
          ? await this.orderRepository.manager.query(
              'SELECT id, organizers_id FROM events WHERE id = ? LIMIT 1',
              [cachedTicket.eventsId],
            )
          : await this.orderRepository.manager.query(
              'SELECT id, organizers_id FROM events WHERE on_chain_event_id = ? LIMIT 1',
              [String(ticket.eventId)],
            );

        if (
          !organizerRows ||
          organizerRows.length === 0 ||
          !eventRows ||
          eventRows.length === 0 ||
          Number(eventRows[0].organizers_id) !== Number(organizerRows[0].id)
        ) {
          throw new ForbiddenException(
            'Akses ditolak: Tiket ini bukan milik event organizer Anda.',
          );
        }
      }

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

      const targetWallet = (walletTrimmed || ticket.owner).toLowerCase();

      if (!isManualMode && ticket.owner.toLowerCase() !== walletTrimmed.toLowerCase()) {
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
      let customer = await this.customerRepository.findOne({
        where: { walletAddress: targetWallet },
      });
      if (!customer && (walletTrimmed || ticket.owner) !== targetWallet) {
        customer = await this.customerRepository.findOne({
          where: { walletAddress: walletTrimmed || ticket.owner },
        });
      }

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

      // 3b. Verifikasi Kriptografis WebAuthn P-256 ECDSA (dilakukan SEBELUM update used = 1)
      if (!isManualMode) {
        if (!customer) {
          throw new BadRequestException(
            'Data pemilik passkey WebAuthn tidak ditemukan untuk dompet ini.',
          );
        }

        const credentialIdFilter = dto.credentialId?.trim();
        const credentials = await this.passkeyCredentialRepository.find({
          where: credentialIdFilter
            ? { customersId: customer.id, credentialId: credentialIdFilter }
            : { customersId: customer.id },
        });

        if (!credentials || credentials.length === 0) {
          throw new BadRequestException(
            'Kredensial passkey WebAuthn tidak ditemukan untuk pemilik tiket ini.',
          );
        }

        const clientDataBuf = Buffer.from(dto.clientDataJSON!.trim(), 'base64url');
        let parsedClientData: { type?: unknown; challenge?: unknown } | null = null;
        try {
          const decoded: unknown = JSON.parse(clientDataBuf.toString('utf8'));
          if (decoded && typeof decoded === 'object') {
            parsedClientData = decoded as { type?: unknown; challenge?: unknown };
          }
        } catch {
          parsedClientData = null;
        }

        if (
          !parsedClientData ||
          parsedClientData.type !== 'webauthn.get' ||
          typeof parsedClientData.challenge !== 'string' ||
          parsedClientData.challenge.length === 0
        ) {
          throw new BadRequestException(
            'Payload clientDataJSON WebAuthn tidak valid.',
          );
        }

        const expectedChallengeStr = `NFTIX-AUTH:Token#${dto.tokenId}:Owner#${walletTrimmed}:Nonce#${dto.nonce}:Time#${dto.signedAt}`;
        const expectedChallenge = Buffer.from(
          expectedChallengeStr,
          'utf8',
        ).toString('base64url');
        if (parsedClientData.challenge !== expectedChallenge) {
          throw new BadRequestException(
            'Challenge WebAuthn QR Code tidak cocok dengan tiket dan waktu penandatanganan.',
          );
        }

        const authDataBuf = Buffer.from(dto.authenticatorData!.trim(), 'base64url');
        if (authDataBuf.length < 37 || (authDataBuf[32] & 0x01) === 0) {
          throw new BadRequestException(
            'Data autentikator WebAuthn tidak valid atau kehadiran pengguna tidak terverifikasi.',
          );
        }

        const sigRaw = dto.signature!.trim();
        let signatureBuf: Buffer;
        if (/^0x/i.test(sigRaw)) {
          const hex = sigRaw.slice(2);
          if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
            throw new BadRequestException('Format hex tanda tangan WebAuthn tidak valid.');
          }
          signatureBuf = Buffer.from(hex, 'hex');
        } else if (/^[0-9a-fA-F]+$/.test(sigRaw) && sigRaw.length % 2 === 0) {
          signatureBuf = Buffer.from(sigRaw, 'hex');
        } else {
          signatureBuf = Buffer.from(sigRaw, 'base64url');
        }

        if (signatureBuf.length === 0) {
          throw new BadRequestException('Tanda tangan WebAuthn kosong atau tidak valid.');
        }

        const clientDataHash = crypto
          .createHash('sha256')
          .update(clientDataBuf)
          .digest();
        const signedPayload = Buffer.concat([authDataBuf, clientDataHash]);

        const isSignatureValid = credentials.some((cred) => {
          try {
            const xBig = BigInt(cred.publicKeyX);
            const yBig = BigInt(cred.publicKeyY);
            if (xBig < 0n || yBig < 0n) {
              return false;
            }
            const xHex = xBig.toString(16);
            const yHex = yBig.toString(16);
            if (xHex.length > 64 || yHex.length > 64) {
              return false;
            }
            const xB64 = Buffer.from(xHex.padStart(64, '0'), 'hex').toString(
              'base64url',
            );
            const yB64 = Buffer.from(yHex.padStart(64, '0'), 'hex').toString(
              'base64url',
            );
            const publicKey = crypto.createPublicKey({
              key: {
                kty: 'EC',
                crv: 'P-256',
                x: xB64,
                y: yB64,
              },
              format: 'jwk',
            });
            return crypto.verify(
              'sha256',
              signedPayload,
              publicKey,
              signatureBuf,
            );
          } catch {
            return false;
          }
        });

        if (!isSignatureValid) {
          throw new BadRequestException(
            'Tanda tangan passkey WebAuthn tidak valid atau QR Code dipalsukan!',
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
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
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
      relations: { event: { ticketCategories: true }, order: true },
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

    return cachedTickets.map((t, index) => {
      const rawOrderCatId =
        t.order?.ticketCategoriesId ?? t.order?.ticketCategory?.id;
      const parsedOrderCatId =
        rawOrderCatId !== undefined &&
        rawOrderCatId !== null &&
        String(rawOrderCatId).trim() !== ''
          ? Number(rawOrderCatId)
          : NaN;
      const matchedByPrice = t.event?.ticketCategories?.find(
        (c) => Number(c.price) === Number(t.originalPrice),
      );
      const parsedFallbackCatId = matchedByPrice
        ? Number(matchedByPrice.id)
        : NaN;
      const categoryId =
        Number.isFinite(parsedOrderCatId) && parsedOrderCatId > 0
          ? parsedOrderCatId
          : Number.isFinite(parsedFallbackCatId) && parsedFallbackCatId > 0
            ? parsedFallbackCatId
            : 1;

      return {
        tokenId: t.tokenId,
        eventId: t.eventsId,
        categoryId,
        originalPrice: Number(t.originalPrice),
        used: Boolean(t.used),
        owner: t.ownerWallet,
        seatIndex: index + 1,
        isListed: listedTokenIds.has(t.tokenId),
      };
    });
  }

  async createSnapTransaction(dto: CreateSnapDto) {
    if (dto.quantity !== undefined && Number(dto.quantity) > 1) {
      throw new BadRequestException(
        'Maksimal pembelian adalah 1 tiket per transaksi',
      );
    }
    const qty = 1;

    // Validasi Cloudflare Turnstile sebelum transaksi database
    const turnstileSecret = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    if (turnstileSecret) {
      if (!dto.turnstileToken) {
        throw new BadRequestException(
          'Token verifikasi Cloudflare Turnstile wajib disertakan',
        );
      }

      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: dto.turnstileToken,
          }),
        },
      );

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        console.error(
          '[TURNSTILE] Verifikasi bot gagal:',
          verifyData['error-codes'],
        );
        throw new BadRequestException(
          'Verifikasi bot (Cloudflare Turnstile) gagal atau kedaluwarsa',
        );
      }
      console.log('[TURNSTILE] Lolos verifikasi manusia:', verifyData.hostname);
    }

    // Ambil data event & kategorinya dari database MySQL
    const event = await this.eventsService.findOne(dto.eventId);

    // Validasi Flash Sale Time Gate: Cek apakah penjualan sudah dibuka
    if (event.saleStartTime) {
      const now = new Date();
      const saleStart = new Date(event.saleStartTime);
      if (now < saleStart) {
        throw new BadRequestException(
          `Flash sale belum dibuka! Penjualan tiket baru dimulai pada: ${saleStart.toLocaleString('id-ID')}`,
        );
      }
    }

    const category = event.ticketCategories.find(
      (c) => Number(c.id) === Number(dto.categoryId),
    );
    if (!category) {
      throw new BadRequestException('Kategori tiket tidak ditemukan');
    }

    const walletLower = dto.walletAddress.trim().toLowerCase();

    // Hitung biaya tiket + biaya admin untuk transaksi di blockchain
    const baseFee = 5000;
    const variableFee = Math.round(Number(category.price) * qty * 0.025);
    const totalAdminFee = baseFee + variableFee;
    const totalPrice = Number(category.price) * qty + totalAdminFee;

    const { savedOrder, lockedCustomer } =
      await this.orderRepository.manager.transaction(async (manager) => {
        // 1. Kunci baris Customer terlebih dahulu (tanpa join) untuk urutan lock deterministik
        const customer = await manager
          .createQueryBuilder(Customer, 'c')
          .setLock('pessimistic_write')
          .where('LOWER(c.walletAddress) = :walletLower', { walletLower })
          .getOne();

        if (!customer) {
          throw new BadRequestException('Customer tidak ditemukan');
        }

        // 2. Kunci baris TicketCategory kedua untuk mencegah race condition kuota
        const lockedCategory = await manager
          .createQueryBuilder(TicketCategory, 'tc')
          .setLock('pessimistic_write')
          .where('tc.id = :categoryId', { categoryId: String(category.id) })
          .getOne();

        if (!lockedCategory) {
          throw new BadRequestException('Kategori tiket tidak ditemukan');
        }

        // 3. Validasi aturan 1 dompet = maksimal 1 tiket per event across ticket_cache, orders, & resale_listings
        await this.assertWalletEligibleForEvent(
          manager,
          walletLower,
          customer.id,
          lockedCategory.eventsId,
        );

        // 4. Hitung kuota aktif (PAID + PENDING < 10 menit) di dalam transaksi terkunci
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const activeOrders = await manager.find(Order, {
          where: [
            { ticketCategoriesId: String(lockedCategory.id), status: OrderStatus.PAID },
            {
              ticketCategoriesId: String(lockedCategory.id),
              status: OrderStatus.PENDING,
              createdAt: MoreThan(tenMinutesAgo),
            },
          ],
        });
        const reservedQuota = activeOrders.reduce(
          (sum, order) => sum + (order.amount || 1),
          0,
        );

        if (lockedCategory.quota - reservedQuota < qty) {
          throw new BadRequestException(
            'Semua kuota tiket saat ini sedang dalam proses pembayaran oleh pembeli lain. Silakan coba beberapa saat lagi jika ada pesanan yang batal/kedaluwarsa.',
          );
        }

        // 5. Buat dan simpan order PENDING di dalam transaksi sebelum commit
        const orderId = crypto.randomUUID();
        const newOrder = manager.create(Order, {
          id: orderId,
          amount: qty,
          totalPrice,
          adminFee: totalAdminFee,
          status: OrderStatus.PENDING,
          customersId: customer.id,
          ticketCategoriesId: String(lockedCategory.id),
        });
        const persistedOrder = await manager.save(newOrder);

        return { savedOrder: persistedOrder, lockedCustomer: customer };
      });

    const customerWithUser = lockedCustomer.user
      ? lockedCustomer
      : await this.customerRepository.findOne({
          where: { id: lockedCustomer.id },
          relations: { user: true },
        });

    try {
      const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY tidak ditemukan di environment');
      }
      const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');
      const midtransUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

      const response = await fetch(midtransUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: savedOrder.id,
            gross_amount: totalPrice,
          },
          item_details: [
            {
              id: String(category.id),
              price: Math.round(Number(category.price)),
              quantity: qty,
              name: `${event.eventName} (${category.name})`.slice(0, 50),
            },
            {
              id: 'FEE-ADMIN',
              price: totalAdminFee,
              quantity: 1,
              name: 'Biaya Layanan & Admin',
            },
          ],
          customer_details: {
            first_name: customerWithUser?.user?.name || 'Pelanggan',
            email: customerWithUser?.user?.email || 'customer@example.com',
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Midtrans Snap Error:', data);
        throw new BadRequestException(
          data.error_message || 'Gagal membuat token Snap Midtrans',
        );
      }

      return {
        token: data.token,
        redirectUrl: data.redirect_url,
        orderId: savedOrder.id,
        grossAmount: totalPrice,
      };
    } catch (snapErr) {
      await this.orderRepository.update(
        { id: savedOrder.id, status: OrderStatus.PENDING },
        { status: OrderStatus.FAILED },
      );
      throw snapErr;
    }
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
        const failedInfo = this.failedResaleOrders.get(orderId);
        if (failedInfo) {
          return {
            orderId,
            status: failedInfo.status,
            refunded: failedInfo.status === 'refunded',
            message: failedInfo.message,
            amount: 1,
            totalPrice: failedInfo.amount,
          };
        }
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

    const isFailedOrRefunded =
      order.status === OrderStatus.REFUNDED || order.status === OrderStatus.FAILED;
    const failureMessage =
      order.status === OrderStatus.REFUNDED
        ? 'Transaksi Gagal — Dana Anda telah dikembalikan otomatis.'
        : order.status === OrderStatus.FAILED
          ? 'Transaksi Gagal — Pengembalian dana sedang diproses manual.'
          : undefined;

    return {
      orderId: order.id,
      status: order.status,
      midtransTransactionId: order.midtransTransactionId,
      txHash: order.txHash,
      amount: order.amount,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      ...(isFailedOrRefunded
        ? {
            refunded: order.status === OrderStatus.REFUNDED,
            message: failureMessage,
          }
        : {}),
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

    // Pastikan relasi customer (beserta user) dan ticketCategory tersedia jika order belum di-load secara lengkap
    if (!order.customer || !order.customer.user || !order.ticketCategory) {
      const fullOrder = await this.orderRepository.findOne({
        where: { id: order.id },
        relations: { customer: { user: true }, ticketCategory: true },
      });
      if (fullOrder) {
        order.customer = fullOrder.customer;
        order.ticketCategory = fullOrder.ticketCategory;
      }
    }

    try {
      console.log(`[TicketsService] Memulai minting on-chain untuk order #${order.id}...`);
      const mintResult = await this.executeWithRetry(
        () =>
          this.mintTicket({
            walletAddress: order.customer.walletAddress!,
            eventId: order.ticketCategory.eventsId,
            categoryId: Number(order.ticketCategory.id),
            quantity: order.amount,
          }),
        2,
        2000,
      );

      if (mintResult?.txHash) {
        order.txHash = mintResult.txHash;
        await this.orderRepository.save(order);
      }

      // Simpan juga ke tabel ticket_cache sesuai ERD supaya query tiket & resale ga perlu looping RPC terus
      if (mintResult.tokenId) {
        await this.ticketCacheRepository.save({
          tokenId: mintResult.tokenId,
          ownerWallet: order.customer.walletAddress!.toLowerCase(),
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
      const refundAmount = Number(order.totalPrice);
      const refundResult = await this.refundMidtransTransaction(
        order.id,
        refundAmount,
        err?.message || 'Minting on-chain gagal',
      );

      order.status = refundResult.refunded
        ? OrderStatus.REFUNDED
        : OrderStatus.FAILED;
      await this.orderRepository.save(order);

      const buyerEmail = order.customer?.user?.email;
      const buyerName = order.customer?.user?.name || 'Pelanggan';
      if (buyerEmail && this.mailService) {
        try {
          await this.mailService.sendTransactionFailedEmail(
            buyerEmail,
            buyerName,
            order.id,
            refundAmount,
            refundResult.refunded,
          );
        } catch (mailErr) {
          console.error(
            '[TicketsService] Gagal mengirim email notifikasi transaksi gagal:',
            mailErr,
          );
        }
      }

      const failureMessage = refundResult.refunded
        ? 'Transaksi Gagal — Dana Anda telah dikembalikan otomatis.'
        : 'Transaksi Gagal — Pengembalian dana sedang diproses manual.';

      return {
        status: refundResult.refunded ? 'refunded' : 'failed',
        orderId: order.id,
        refunded: refundResult.refunded,
        message: failureMessage,
        error: err?.message,
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
    return this.withTicketLock(tokenId, async () => {
      const sellerLower = sellerWallet.trim().toLowerCase();

      // Cek dulu data tiket langsung dari smart contract Sepolia
      const onChainTicket = await this.getTicket(tokenId);

      // Pastikan yang request jual beneran pemilik sah tiket di blockchain
      if (onChainTicket.owner.toLowerCase() !== sellerLower) {
        throw new BadRequestException(
          'Validasi gagal: Anda bukan pemilik sah tiket ini',
        );
      }

      // Tiket yang sudah di-scan masuk venue ga boleh dijual lagi
      if (onChainTicket.used) {
        throw new BadRequestException(
          'Validasi gagal: Tiket sudah pernah digunakan dan tidak bisa dijual',
        );
      }

      // Cegah duplikasi listing untuk tokenId yang sama
      const existingListing = await this.resaleListingRepository.findOne({
        where: [
          { ticketCacheTokenId: tokenId, status: ResaleStatus.ACTIVE },
          { ticketCacheTokenId: tokenId, status: ResaleStatus.LOCKED },
        ],
      });
      if (existingListing) {
        throw new BadRequestException(
          'Tiket ini sudah terdaftar di pasar sekunder.',
        );
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
          throw new BadRequestException(
            'Data order asal untuk ticket_cache belum ditemukan',
          );
        }

        cache = await this.ticketCacheRepository.save({
          tokenId,
          ownerWallet: onChainTicket.owner.toLowerCase(),
          originalPrice: onChainTicket.originalPrice,
          used: onChainTicket.used ? 1 : 0,
          syncedAt: new Date(),
          eventsId: onChainTicket.eventId,
          ordersId: latestOrder.id,
        });
      }

      // Kirim transaksi listTicket(tokenId, seller) ke MarketplaceContract di Sepolia via relayer admin
      console.log(
        `[TicketsService] Mendaftarkan resale tokenId #${tokenId} milik ${sellerLower} ke Sepolia...`,
      );
      const hash = await this.walletClient.writeContract({
        address: this.marketplaceAddress,
        abi: MARKETPLACE_CONTRACT_ABI,
        functionName: 'listTicket',
        args: [BigInt(tokenId), sellerLower as `0x${string}`],
      });

      // Tunggu sampai transaksi masuk ke blok Sepolia
      await this.publicClient.waitForTransactionReceipt({ hash });

      // Simpan ke tabel resale_listings MySQL dengan lockedPrice = originalPrice (Zero-Markup Price Lock)
      const listing = this.resaleListingRepository.create({
        id: crypto.randomUUID(), // generate UUID unik karena 1 tiket bisa dijual berkali-kali
        sellerWallet: sellerLower,
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
    });
  }

  // 2. Batalkan listing tiket yang sedang dijual di Pasar Sekunder
  async cancelResaleListing(tokenId: number, sellerWallet: string) {
    return this.withTicketLock(tokenId, async () => {
      // Cari listing ACTIVE atau LOCKED untuk tokenId tersebut
      const listing = await this.resaleListingRepository.findOne({
        where: [
          { ticketCacheTokenId: tokenId, status: ResaleStatus.ACTIVE },
          { ticketCacheTokenId: tokenId, status: ResaleStatus.LOCKED },
        ],
      });

      if (!listing) {
        throw new BadRequestException(
          'Listing aktif untuk tiket ini tidak ditemukan',
        );
      }

      // Tolak pembatalan jika sedang dalam masa reservasi pembayaran pembeli yang belum kedaluwarsa
      if (
        listing.status === ResaleStatus.LOCKED &&
        listing.lockedUntil &&
        listing.lockedUntil > new Date()
      ) {
        throw new BadRequestException(
          'Listing sedang dalam proses pembayaran oleh pembeli dan tidak dapat dibatalkan saat ini.',
        );
      }

      // Pastikan yang membatalkan adalah penjual aslinya
      if (listing.sellerWallet.toLowerCase() !== sellerWallet.trim().toLowerCase()) {
        throw new BadRequestException(
          'Hanya penjual asli yang dapat membatalkan listing ini',
        );
      }

      // Panggil fungsi cancelListing(tokenId) di MarketplaceContract Sepolia
      console.log(
        `[TicketsService] Membatalkan listing resale tokenId #${tokenId} di Sepolia...`,
      );
      const hash = await this.walletClient.writeContract({
        address: this.marketplaceAddress,
        abi: MARKETPLACE_CONTRACT_ABI,
        functionName: 'cancelListing',
        args: [BigInt(tokenId)],
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      // Update status di MySQL jadi CANCELLED dan bersihkan sisa field lock jika ada
      listing.status = ResaleStatus.CANCELLED;
      listing.lockedUntil = null;
      listing.buyerWallet = null;
      listing.adminFee = null;
      listing.buyerMidtransTransactionId = null;
      await this.resaleListingRepository.save(listing);

      return {
        success: true,
        tokenId,
        status: listing.status,
        txHash: hash,
      };
    });
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
    const preListing = await this.resaleListingRepository.findOne({
      where: { id: listingId },
    });
    if (!preListing) {
      throw new BadRequestException(
        'Tiket resale sudah laku atau tidak tersedia',
      );
    }

    const tokenId = preListing.ticketCacheTokenId;

    return this.withTicketLock(tokenId, async () => {
      const buyerLower = buyerWallet.trim().toLowerCase();

      const {
        buyerCustomer,
        ticketPrice,
        totalAdminFee,
        grossAmount,
        midtransOrderId,
        eventName,
        ticketTokenId,
      } = await this.orderRepository.manager.transaction(async (manager) => {
        // 1. Kunci baris Customer pembeli terlebih dahulu (tanpa join)
        const customer = await manager
          .createQueryBuilder(Customer, 'c')
          .setLock('pessimistic_write')
          .where('LOWER(c.walletAddress) = :buyerLower', { buyerLower })
          .getOne();

        if (!customer) {
          throw new BadRequestException('Customer pembeli tidak ditemukan');
        }

        // 2. Kunci baris ResaleListing kedua (tanpa join)
        const listing = await manager
          .createQueryBuilder(ResaleListing, 'rl')
          .setLock('pessimistic_write')
          .where('rl.id = :listingId', { listingId })
          .getOne();

        if (
          !listing ||
          listing.status === ResaleStatus.SOLD ||
          listing.status === ResaleStatus.CANCELLED
        ) {
          throw new BadRequestException(
            'Tiket resale sudah laku atau tidak tersedia',
          );
        }

        const now = new Date();
        const isLockedByOther =
          listing.status === ResaleStatus.LOCKED &&
          listing.lockedUntil &&
          listing.lockedUntil > now;

        if (isLockedByOther) {
          throw new BadRequestException(
            'Tiket resale sedang dalam proses pembayaran oleh pembeli lain. Silakan coba beberapa saat lagi.',
          );
        }

        if (listing.sellerWallet.toLowerCase() === buyerLower) {
          throw new BadRequestException(
            'Anda tidak dapat membeli tiket yang Anda jual sendiri',
          );
        }

        const ticketCache = await manager.findOne(TicketCache, {
          where: { tokenId: listing.ticketCacheTokenId },
          relations: { event: true },
        });
        if (!ticketCache) {
          throw new BadRequestException('Data tiket resale tidak ditemukan');
        }

        // 3. Validasi 1 dompet maksimal 1 tiket per event across ticket_cache, orders, & resale_listings
        await this.assertWalletEligibleForEvent(
          manager,
          buyerLower,
          customer.id,
          ticketCache.eventsId,
        );

        const lockedTicketPrice = Math.round(Number(listing.lockedPrice));
        const baseFee = 5000;
        const variableFee = Math.round(lockedTicketPrice * 0.025);
        const calcAdminFee = baseFee + variableFee;
        const calcGrossAmount = lockedTicketPrice + calcAdminFee;

        const orderId = `RESALE-${listing.ticketCacheTokenId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

        listing.status = ResaleStatus.LOCKED;
        listing.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        listing.buyerWallet = buyerLower;
        listing.adminFee = calcAdminFee;
        listing.buyerMidtransTransactionId = orderId;
        await manager.save(listing);

        return {
          buyerCustomer: customer,
          ticketPrice: lockedTicketPrice,
          totalAdminFee: calcAdminFee,
          grossAmount: calcGrossAmount,
          midtransOrderId: orderId,
          eventName: ticketCache.event?.eventName || 'Tiket',
          ticketTokenId: listing.ticketCacheTokenId,
        };
      });

      const customerWithUser = buyerCustomer.user
        ? buyerCustomer
        : await this.customerRepository.findOne({
            where: { id: buyerCustomer.id },
            relations: { user: true },
          });

      try {
        const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
        if (!serverKey) {
          throw new Error('MIDTRANS_SERVER_KEY tidak ditemukan di environment');
        }
        const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');
        const midtransUrl =
          'https://app.sandbox.midtrans.com/snap/v1/transactions';

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
                id: `RESALE-TOKEN-${ticketTokenId}`,
                price: ticketPrice,
                quantity: 1,
                name: `Resale ${eventName} (#${ticketTokenId})`.slice(0, 50),
              },
              {
                id: 'FEE-ADMIN-RESALE',
                price: totalAdminFee,
                quantity: 1,
                name: 'Biaya Layanan & Subsidi Gas',
              },
            ],
            customer_details: {
              first_name: customerWithUser?.user?.name || 'Pelanggan',
              email: customerWithUser?.user?.email || 'customer@example.com',
            },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error('Midtrans Resale Snap Error:', data);
          throw new BadRequestException(
            data.error_message ||
              'Gagal membuat token Snap Midtrans untuk resale',
          );
        }

        return {
          token: data.token,
          redirectUrl: data.redirect_url,
          orderId: midtransOrderId,
          grossAmount,
        };
      } catch (snapErr) {
        await this.resaleListingRepository.update(
          {
            id: listingId,
            status: ResaleStatus.LOCKED,
            buyerMidtransTransactionId: midtransOrderId,
          },
          {
            status: ResaleStatus.ACTIVE,
            lockedUntil: null,
            buyerWallet: null,
            adminFee: null,
            buyerMidtransTransactionId: null,
          },
        );
        throw snapErr;
      }
    });
  }

  // 5. Method buat memproses webhook / rekonsiliasi Midtrans khusus transaksi Pasar Sekunder (RESALE-)
  async handleResaleWebhook(
    midtransOrderId: string,
    transactionStatus: string,
    fraudStatus: string,
    transactionId: string | null,
  ) {
    // Pre-read listing untuk resolusi tokenId agar dapat mengunci mutex per-tokenId
    const preListing = await this.resaleListingRepository.findOne({
      where: { buyerMidtransTransactionId: midtransOrderId },
    });

    if (!preListing) {
      console.warn(
        `[TicketsService] Resale webhook diabaikan: Order #${midtransOrderId} tidak ditemukan di database lokal`,
      );
      return {
        status: 'ignored_resale_order_not_found',
        orderId: midtransOrderId,
        message: 'Resale order tidak ditemukan di database lokal',
      };
    }

    return this.withTicketLock(preListing.ticketCacheTokenId, async () => {
      // Re-read listing di dalam lock agar state selalu segar dan bebas race condition
      const listing = await this.resaleListingRepository.findOne({
        where: { buyerMidtransTransactionId: midtransOrderId },
      });

      if (!listing) {
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

      // Guard status: hanya proses listing yang benar-benar sedang LOCKED dengan buyerWallet valid
      if (listing.status !== ResaleStatus.LOCKED || !listing.buyerWallet) {
        return {
          status: 'ignored_resale_invalid_state',
          orderId: midtransOrderId,
          message: `Status listing resale (${listing.status}) tidak valid untuk diproses`,
        };
      }

      const isPaymentSuccess =
        transactionStatus === 'settlement' ||
        (transactionStatus === 'capture' && fraudStatus === 'accept');

      if (isPaymentSuccess) {
        const buyerWalletLower = listing.buyerWallet.toLowerCase();
        try {
          // Eksekusi pemindahan NFT on-chain dari penjual ke pembeli baru via MarketplaceContract.executeResale
          console.log(
            `[TicketsService] Mengeksekusi executeResale untuk tokenId #${listing.ticketCacheTokenId} ke ${buyerWalletLower}...`,
          );
          const hash = await this.executeWithRetry(
            async () => {
              const txHash = await this.walletClient.writeContract({
                address: this.marketplaceAddress,
                abi: MARKETPLACE_CONTRACT_ABI,
                functionName: 'executeResale',
                args: [
                  BigInt(listing.ticketCacheTokenId),
                  buyerWalletLower as `0x${string}`,
                ],
              });
              await this.publicClient.waitForTransactionReceipt({ hash: txHash });
              return txHash;
            },
            2,
            2000,
          );

          // Update status listing jadi SOLD
          listing.status = ResaleStatus.SOLD;
          await this.resaleListingRepository.save(listing);

          // Update juga alamat pemilik baru (ternormalisasi lowercase) di tabel ticket_cache MySQL
          await this.ticketCacheRepository.update(
            { tokenId: listing.ticketCacheTokenId },
            {
              ownerWallet: buyerWalletLower,
              syncedAt: new Date(),
            },
          );

          return {
            status: 'success',
            message:
              'Pembayaran resale sukses dan NFT telah berpindah tangan secara on-chain',
            tokenId: listing.ticketCacheTokenId,
            newOwner: buyerWalletLower,
            txHash: hash,
          };
        } catch (err: any) {
          console.error(
            'Eksekusi executeResale on-chain gagal setelah pembayaran:',
            err,
          );
          const refundAmount =
            Number(listing.lockedPrice) + (Number(listing.adminFee) || 0);
          const refundResult = await this.refundMidtransTransaction(
            midtransOrderId,
            refundAmount,
            err?.message || 'Eksekusi resale on-chain gagal',
          );

          listing.status = ResaleStatus.ACTIVE;
          listing.lockedUntil = null;
          listing.buyerWallet = null;
          listing.adminFee = null;
          listing.buyerMidtransTransactionId = null;
          await this.resaleListingRepository.save(listing);

          const failureStatus = refundResult.refunded ? 'refunded' : 'failed';
          const failureMessage = refundResult.refunded
            ? 'Transaksi Gagal — Dana Anda telah dikembalikan otomatis.'
            : 'Transaksi Gagal — Pengembalian dana sedang diproses manual.';

          this.failedResaleOrders.set(midtransOrderId, {
            status: failureStatus,
            message: failureMessage,
            amount: refundAmount,
          });

          if (buyerWalletLower && this.mailService) {
            try {
              const buyerCustomer = await this.customerRepository.findOne({
                where: { walletAddress: buyerWalletLower },
                relations: { user: true },
              });
              const buyerEmail = buyerCustomer?.user?.email;
              const buyerName = buyerCustomer?.user?.name || 'Pelanggan';
              if (buyerEmail) {
                await this.mailService.sendTransactionFailedEmail(
                  buyerEmail,
                  buyerName,
                  midtransOrderId,
                  refundAmount,
                  refundResult.refunded,
                );
              }
            } catch (mailErr) {
              console.error(
                '[TicketsService] Gagal mengirim email notifikasi transaksi resale gagal:',
                mailErr,
              );
            }
          }

          return {
            status: failureStatus,
            orderId: midtransOrderId,
            refunded: refundResult.refunded,
            message: failureMessage,
            error: err?.message,
          };
        }
      } else if (['cancel', 'expire', 'deny'].includes(transactionStatus)) {
        // Kalau pembayaran batal atau kedaluwarsa, buka kembali lock (status kembali ACTIVE)
        listing.status = ResaleStatus.ACTIVE;
        listing.lockedUntil = null;
        listing.buyerWallet = null;
        listing.adminFee = null;
        listing.buyerMidtransTransactionId = null;
        await this.resaleListingRepository.save(listing);

        return {
          status: 'resale_payment_cancelled',
          orderId: midtransOrderId,
          message:
            'Pembayaran batal/kedaluwarsa, tiket tetap berstatus ACTIVE di katalog resale',
        };
      }

      return {
        status: 'pending',
        orderId: midtransOrderId,
        message: `Transaksi resale berstatus ${transactionStatus}, menunggu pembayaran`,
      };
    });
  }
}
