import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { TicketCache } from '../tickets/entities/ticket-cache.entity';
import { CreateEventDto, TicketCategoryDto } from './dto/create-event.dto';
import { TICKET_CONTRACT_ABI } from '../tickets/ticket-abi';

@Injectable()
export class EventsService {
  private publicClient;
  private walletClient;
  private account;
  private contractAddress: `0x${string}`;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(TicketCategory)
    private readonly ticketCategoryRepository: Repository<TicketCategory>,
    @InjectRepository(TicketCache)
    private readonly ticketCacheRepository: Repository<TicketCache>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    const RPC_URL = this.configService.get<string>('SEPOLIA_RPC_URL')!;
    const privateKey = this.configService.get<string>(
      'ADMIN_PRIVATE_KEY',
    ) as `0x${string}`;
    this.contractAddress = this.configService.get<string>(
      'TICKET_CONTRACT_ADDRESS',
    ) as `0x${string}`;

    this.account = privateKeyToAccount(privateKey);
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });
       this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(RPC_URL),
    });
  }

  private async uploadFileToPinata(
    blob: Blob,
    fileName: string,
  ): Promise<{ id: string | null; cid: string; uri: string }> {
    const pinataJwt = this.configService.get<string>('PINATA_JWT');
    if (!pinataJwt) {
      throw new InternalServerErrorException(
        'PINATA_JWT belum dikonfigurasi di backend/.env',
      );
    }

    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('network', 'public');
    formData.append('name', fileName);

    const res = await fetch('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new InternalServerErrorException(
        `Gagal upload ke Pinata (${res.status}): ${errBody}`,
      );
    }

    const json = (await res.json()) as { data?: { id?: string; cid?: string } };
    const cid = json?.data?.cid;
    if (!cid) {
      throw new InternalServerErrorException('Response Pinata tidak menyertakan CID');
    }

    const pinataGateway = this.configService.get<string>('PINATA_GATEWAY');
    const cleanGateway = (pinataGateway || 'gateway.pinata.cloud')
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    return {
      id: json?.data?.id ?? null,
      cid,
      uri: `https://${cleanGateway}/ipfs/${cid}`,
    };
  }

  private async unpinFromPinata(fileId: string | null): Promise<void> {
    const pinataJwt = this.configService.get<string>('PINATA_JWT');
    if (!fileId || !pinataJwt) return;

    await fetch(`https://api.pinata.cloud/v3/files/public/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
    }).catch((err) => {
      console.warn(`[Pinata] Gagal unpin file ${fileId}:`, err);
    });
  }

  // Ambil seluruh event milik organizer tertentu beserta analitik kuota & check-in
  async findByOrganizer(organizersId: number) {
    const events = await this.eventRepository.find({
      where: { organizersId },
      relations: { ticketCategories: true },
      order: { startDate: 'ASC' },
    });

    const enrichedEvents = await Promise.all(
      events.map(async (evt) => {
        const totalQuota = (evt.ticketCategories || []).reduce(
          (sum, c) => sum + (Number(c.quota) || 0),
          0,
        );
        const soldTickets = await this.ticketCacheRepository.count({
          where: { eventsId: evt.id },
        });
        const usedTickets = await this.ticketCacheRepository.count({
          where: { eventsId: evt.id, used: 1 },
        });

        return {
          ...evt,
          totalQuota: totalQuota || evt.capacity || 0,
          soldTickets,
          usedTickets,
          checkInRate: soldTickets > 0 ? Math.round((usedTickets / soldTickets) * 100) : 0,
        };
      }),
    );

    return enrichedEvents;
  }

  // Ambil seluruh event milik organizer berdasarkan users_id akun yang sedang login
  async findByUserId(userId: number) {
    const organizer = await this.dataSource.query(
      'SELECT id, organization_name FROM organizers WHERE users_id = ? LIMIT 1',
      [userId],
    );
    if (!organizer || organizer.length === 0) {
      return { organizer: null, events: [] };
    }
    const events = await this.findByOrganizer(organizer[0].id);
    return {
      organizer: {
        id: organizer[0].id,
        organizationName: organizer[0].organization_name,
      },
      events,
    };
  }

  // Method untuk mengambil seluruh event yang ada di tabel events
  async findAll() {
    return this.eventRepository.find({
      relations: { ticketCategories: true },
      order: { id: 'ASC' },
    });
  }

  // Ambil 1 event spesifik berdasarkan ID dan seluruh kategorinya
  async findOne(id: number, userId?: number) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { ticketCategories: true },
    });
    if (!event) {
      throw new NotFoundException(`Event dengan ID ${id} tidak ditemukan`);
    }

    if (userId !== undefined && !Number.isNaN(userId)) {
      const organizer = await this.dataSource.query(
        'SELECT id FROM organizers WHERE users_id = ? LIMIT 1',
        [userId],
      );
      if (!organizer || organizer.length === 0 || Number(event.organizersId) !== Number(organizer[0].id)) {
        throw new ForbiddenException('Anda tidak memiliki akses ke event ini');
      }
    }

    const totalQuota = (event.ticketCategories || []).reduce(
      (sum, c) => sum + (Number(c.quota) || 0),
      0,
    );
    const soldTickets = await this.ticketCacheRepository.count({
      where: { eventsId: event.id },
    });
    const usedTickets = await this.ticketCacheRepository.count({
      where: { eventsId: event.id, used: 1 },
    });

    return {
      ...event,
      totalQuota: totalQuota || event.capacity || 0,
      soldTickets,
      usedTickets,
      checkInRate: soldTickets > 0 ? Math.round((usedTickets / soldTickets) * 100) : 0,
    };
  }

  // Method untuk membuat event baru dan mendaftarkannya ke database serta smart contract Sepolia
  async create(dto: CreateEventDto, file?: Express.Multer.File) {
    console.log('🎪 [EventsService] Memulai pembuatan event baru:', dto.eventName);

    const orgId = Number(dto.organizersId);
    if (!orgId || Number.isNaN(orgId)) {
      throw new BadRequestException('organizersId wajib diisi');
    }
    const organizerRows = await this.dataSource.query(
      'SELECT id FROM organizers WHERE id = ? LIMIT 1',
      [orgId],
    );
    if (!organizerRows || organizerRows.length === 0) {
      throw new BadRequestException(`Organizer dengan ID ${orgId} tidak ditemukan`);
    }

    // 1. Upload gambar background & metadata JSON ERC-721 ke IPFS Pinata
    const pinIdsToCleanup: string[] = [];
    let imageIpfsCid = dto.imageIpfsCid || null;
    if (file) {
      const imgPin = await this.uploadFileToPinata(
        new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
        `ticket-bg-${Date.now()}-${file.originalname}`,
      );
      imageIpfsCid = imgPin.uri;
      if (imgPin.id) pinIdsToCleanup.push(imgPin.id);
      console.log('📸 [EventsService] Banner terunggah ke IPFS Pinata:', imageIpfsCid);
    } else if (!imageIpfsCid) {
      imageIpfsCid =
        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80';
    }

    let eventMetadataUri = imageIpfsCid;
    if (file || this.configService.get<string>('PINATA_JWT')) {
      const metadataBlob = new Blob(
        [
          JSON.stringify({
            name: dto.eventName,
            description: `${dto.eventName} - ${dto.venueLocation}`,
            image: imageIpfsCid,
            attributes: [
              { trait_type: 'Category', value: dto.category },
              { trait_type: 'Venue', value: dto.venueLocation },
              { trait_type: 'Date', value: dto.startDate },
            ],
          }),
        ],
        { type: 'application/json' },
      );
      const metaPin = await this.uploadFileToPinata(
        metadataBlob,
        `event-meta-${Date.now()}.json`,
      );
      eventMetadataUri = metaPin.uri;
      if (metaPin.id) pinIdsToCleanup.push(metaPin.id);
    }

    // 2. Parsing & validasi kategori tiket sebelum transaksi on-chain / DB
    let parsedCategories: TicketCategoryDto[] = [];
    if (typeof dto.ticketCategories === 'string') {
      try {
        const decoded: unknown = JSON.parse(dto.ticketCategories);
        if (!Array.isArray(decoded)) {
          throw new BadRequestException('Format ticketCategories JSON harus berupa array');
        }
        parsedCategories = decoded as TicketCategoryDto[];
      } catch (err: unknown) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        throw new BadRequestException('Format ticketCategories JSON tidak valid');
      }
    } else if (Array.isArray(dto.ticketCategories)) {
      parsedCategories = dto.ticketCategories;
    } else if (dto.ticketCategories !== undefined && dto.ticketCategories !== null) {
      throw new BadRequestException('Format ticketCategories harus berupa array atau JSON string array');
    }

    if (parsedCategories.length === 0) {
      // Kategori standar jika user tidak mendefinisikan kategori khusus
      parsedCategories = [
        {
          name: 'General Admission',
          price: 100000,
          quota: Number(dto.capacity),
        },
      ];
    }

    for (const cat of parsedCategories) {
      const catName = typeof cat?.name === 'string' ? cat.name.trim() : '';
      const catPrice = Number(cat?.price);
      const catQuota = Number(cat?.quota);
      if (!catName) {
        throw new BadRequestException('Nama kategori tiket wajib diisi');
      }
      if (!Number.isFinite(catPrice) || Math.round(catPrice) < 1) {
        throw new BadRequestException(`Harga tiket kategori "${catName}" minimal 1`);
      }
      if (!Number.isInteger(catQuota) || catQuota < 1) {
        throw new BadRequestException(`Kuota tiket kategori "${catName}" minimal 1`);
      }
    }

    // 3. Validasi waktu event (wajib di masa depan sesuai guard smart contract TicketContract.sol)
    const startTimeMs = new Date(dto.startDate).getTime();
    if (Number.isNaN(startTimeMs)) {
      throw new BadRequestException('Format startDate tidak valid');
    }
    const eventTimestamp = BigInt(Math.floor(startTimeMs / 1000));
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    if (eventTimestamp <= currentTimestamp) {
      throw new BadRequestException(
        'Waktu mulai event harus berada di masa depan agar memenuhi aturan konsistensi on-chain.',
      );
    }

    const rawMaxPerWallet = dto.maxPerWallet as unknown;
    const maxPerWallet =
      rawMaxPerWallet !== undefined &&
      rawMaxPerWallet !== null &&
      rawMaxPerWallet !== ''
        ? Number(rawMaxPerWallet)
        : 1;
    if (!Number.isInteger(maxPerWallet) || maxPerWallet < 1) {
      throw new BadRequestException('Batas tiket per dompet minimal 1');
    }
    if (maxPerWallet > 1) {
      throw new BadRequestException('Batas tiket per dompet maksimal 1');
    }

    // 4. Alokasi on_chain_event_id & category id di memori (read-only) sebelum menulis ke DB
    const maxOnChainQuery = await this.eventRepository
      .createQueryBuilder('e')
      .select('MAX(CAST(e.onChainEventId AS UNSIGNED))', 'max')
      .getRawOne();
    const nextOnChainEventId = (Number(maxOnChainQuery?.max) || 0) + 1;
    console.log(`🔢 [EventsService] on_chain_event_id baru yang dialokasikan: #${nextOnChainEventId}`);

    const maxCatQuery = await this.ticketCategoryRepository
      .createQueryBuilder('c')
      .select('MAX(CAST(c.id AS UNSIGNED))', 'max')
      .getRawOne();
    let nextCatId = (Number(maxCatQuery?.max) || 0) + 1;

    const preparedCategories = parsedCategories.map((cat) => ({
      id: String(nextCatId++),
      name: cat.name.trim(),
      price: Number(cat.price),
      quota: Number(cat.quota),
    }));

    // 5. Daftarkan Event & Kategori ke Smart Contract Sepolia TERLEBIH DAHULU
    let createEventTxHash: `0x${string}` | null = null;
    let createBlockNumber: string | null = null;
    const categoryTxResults: {
      categoryId: string;
      name: string;
      txHash: string;
      blockNumber: string;
    }[] = [];

    try {
      console.log(`⛓️ [EventsService] Mengirim createEvent ke Sepolia (${this.contractAddress})...`);
      createEventTxHash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: TICKET_CONTRACT_ABI,
        functionName: 'createEvent',
        args: [
          BigInt(nextOnChainEventId),
          this.account.address,
          eventTimestamp,
          maxPerWallet,
          eventMetadataUri,
        ],
      });
      console.log(`🚀 [EventsService] Transaksi createEvent terkirim: ${createEventTxHash}`);

      const createReceipt = await this.publicClient.waitForTransactionReceipt({
        hash: createEventTxHash,
      });
      if (createReceipt.status !== 'success') {
        throw new Error(`Transaksi createEvent reverted di Sepolia (tx: ${createEventTxHash})`);
      }
      createBlockNumber = createReceipt.blockNumber.toString();
      console.log(
        `✅ [EventsService] Event #${nextOnChainEventId} terverifikasi on-chain di Sepolia (Blok #${createBlockNumber})`,
      );

      // Pendaftaran masing-masing kategori tiket ke smart contract
      for (const cat of preparedCategories) {
        console.log(`⏳ [EventsService] Menambahkan kategori on-chain #${cat.id} (${cat.name})...`);
        const catTxHash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'addCategory',
          args: [
            BigInt(nextOnChainEventId),
            BigInt(cat.id),
            BigInt(Math.round(cat.price)),
            cat.quota,
          ],
        });

        const catReceipt = await this.publicClient.waitForTransactionReceipt({
          hash: catTxHash,
        });
        if (catReceipt.status !== 'success') {
          throw new Error(
            `Transaksi addCategory #${cat.id} (${cat.name}) reverted di Sepolia (tx: ${catTxHash})`,
          );
        }
        categoryTxResults.push({
          categoryId: cat.id,
          name: cat.name,
          txHash: catTxHash,
          blockNumber: catReceipt.blockNumber.toString(),
        });
        console.log(
          `✅ [EventsService] Kategori #${cat.id} aktif on-chain (Blok #${catReceipt.blockNumber})`,
        );
      }
    } catch (chainErr: unknown) {
      await Promise.all(pinIdsToCleanup.map((id) => this.unpinFromPinata(id)));
      const errMsg =
        (chainErr as { shortMessage?: string; message?: string })?.shortMessage ||
        (chainErr instanceof Error ? chainErr.message : String(chainErr));
      console.error('❌ [EventsService] Transaksi blockchain Sepolia gagal:', errMsg);
      throw new InternalServerErrorException(
        `Gagal mendaftarkan event ke blockchain Sepolia: ${errMsg}`,
      );
    }

    // 6. Simpan data Event & TicketCategory secara atomik ke MySQL hanya setelah Sepolia terkonfirmasi
    const { savedEvent, savedCategories } = await this.dataSource.transaction(
      async (manager) => {
        const newEvent = this.eventRepository.create({
          onChainEventId: String(nextOnChainEventId),
          eventName: dto.eventName,
          startDate: new Date(dto.startDate),
          venueLocation: dto.venueLocation,
          category: dto.category,
          capacity: Number(dto.capacity),
          imageIpfsCid: imageIpfsCid,
          maxPerWallet,
          organizersId: orgId,
          saleStartTime: dto.saleStartTime ? new Date(dto.saleStartTime) : null,
          saleEndTime: dto.saleEndTime ? new Date(dto.saleEndTime) : null,
        });

        const persistedEvent = await manager.save(newEvent);
        console.log(`💾 [EventsService] Event tersimpan di MySQL ID #${persistedEvent.id}`);

        const persistedCategories: TicketCategory[] = [];
        for (const cat of preparedCategories) {
          const categoryRecord = this.ticketCategoryRepository.create({
            id: cat.id,
            name: cat.name,
            price: cat.price,
            quota: cat.quota,
            eventsId: persistedEvent.id,
          });
          const savedCat = await manager.save(categoryRecord);
          persistedCategories.push(savedCat);
        }
        console.log(
          `💾 [EventsService] ${persistedCategories.length} kategori tiket tersimpan di MySQL`,
        );

        return {
          savedEvent: persistedEvent,
          savedCategories: persistedCategories,
        };
      },
    );

    return {
      success: true,
      message: 'Event dan seluruh kategori berhasil terdaftar di database MySQL dan blockchain Sepolia!',
      event: savedEvent,
      categories: savedCategories,
      blockchain: {
        onChainEventId: nextOnChainEventId,
        contractAddress: this.contractAddress,
        createEventTx: createEventTxHash,
        createBlockNumber: createBlockNumber,
        categoriesTx: categoryTxResults,
      },
    };
  }
}
