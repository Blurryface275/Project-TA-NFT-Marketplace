import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
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
    private readonly configService: ConfigService,
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

  // Method untuk mengambil seluruh event yang ada di tabel events
  async findAll() {
    return this.eventRepository.find({
      relations: { ticketCategories: true },
      order: { id: 'ASC' },
    });
  }

  // Ambil 1 event spesifik berdasarkan ID dan seluruh kategorinya
  async findOne(id: number) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { ticketCategories: true },
    });
    if (!event) {
      throw new NotFoundException(`Event dengan ID ${id} tidak ditemukan`);
    }

    return event;
  }

  // Method untuk membuat event baru dan mendaftarkannya ke database serta smart contract Sepolia
  async create(dto: CreateEventDto, file?: Express.Multer.File) {
    console.log('🎪 [EventsService] Memulai pembuatan event baru:', dto.eventName);

    // 1. Tentukan URL / path gambar background tiket
    let imageIpfsCid = dto.imageIpfsCid || null;
    if (file) {
      // File berhasil diunggah via Multer ke folder uploads/
      imageIpfsCid = `http://localhost:3001/uploads/${file.filename}`;
      console.log('📸 [EventsService] Gambar background tiket tersimpan di:', imageIpfsCid);
    } else if (!imageIpfsCid) {
      // Default background concert jika tidak ada file yang diunggah
      imageIpfsCid =
        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80';
    }

    // 2. Parsing kategori tiket
    let parsedCategories: TicketCategoryDto[] = [];
    if (typeof dto.ticketCategories === 'string') {
      try {
        parsedCategories = JSON.parse(dto.ticketCategories);
      } catch (e) {
        throw new BadRequestException('Format ticketCategories JSON tidak valid');
      }
    } else if (Array.isArray(dto.ticketCategories)) {
      parsedCategories = dto.ticketCategories;
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

    // 3. Validasi waktu event (wajib di masa depan sesuai guard smart contract TicketContract.sol)
    const eventTimestamp = BigInt(
      Math.floor(new Date(dto.startDate).getTime() / 1000),
    );
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    if (eventTimestamp <= currentTimestamp) {
      throw new BadRequestException(
        'Waktu mulai event harus berada di masa depan agar memenuhi aturan konsistensi on-chain.',
      );
    }

    // 4. Hitung on_chain_event_id berikutnya dari database
    const maxOnChainQuery = await this.eventRepository
      .createQueryBuilder('e')
      .select('MAX(CAST(e.onChainEventId AS UNSIGNED))', 'max')
      .getRawOne();
    const nextOnChainEventId = (Number(maxOnChainQuery?.max) || 0) + 1;
    console.log(`🔢 [EventsService] on_chain_event_id baru yang dialokasikan: #${nextOnChainEventId}`);

    // 5. Simpan data Event ke MySQL
    const newEvent = this.eventRepository.create({
      onChainEventId: String(nextOnChainEventId),
      eventName: dto.eventName,
      startDate: new Date(dto.startDate),
      venueLocation: dto.venueLocation,
      category: dto.category,
      capacity: Number(dto.capacity),
      imageIpfsCid: imageIpfsCid,
      maxPerWallet: Number(dto.maxPerWallet || 2),
      organizersId: Number(dto.organizersId || 1),
    });

    const savedEvent = await this.eventRepository.save(newEvent);
    console.log(`💾 [EventsService] Event tersimpan di MySQL ID #${savedEvent.id}`);

    // 6. Hitung category id berikutnya dan simpan ke MySQL
    const maxCatQuery = await this.ticketCategoryRepository
      .createQueryBuilder('c')
      .select('MAX(CAST(c.id AS UNSIGNED))', 'max')
      .getRawOne();
    let nextCatId = (Number(maxCatQuery?.max) || 0) + 1;

    const savedCategories: TicketCategory[] = [];
    for (const cat of parsedCategories) {
      const categoryRecord = this.ticketCategoryRepository.create({
        id: String(nextCatId++),
        name: cat.name,
        price: Number(cat.price),
        quota: Number(cat.quota),
        eventsId: savedEvent.id,
      });
      const savedCat = await this.ticketCategoryRepository.save(categoryRecord);
      savedCategories.push(savedCat);
    }
    console.log(`💾 [EventsService] ${savedCategories.length} kategori tiket tersimpan di MySQL`);

    // 7. Daftarkan Event & Kategori ke Smart Contract Sepolia
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
          Number(dto.maxPerWallet || 2),
        ],
      });
      console.log(`🚀 [EventsService] Transaksi createEvent terkirim: ${createEventTxHash}`);

      const createReceipt = await this.publicClient.waitForTransactionReceipt({
        hash: createEventTxHash,
      });
      createBlockNumber = createReceipt.blockNumber.toString();
      console.log(
        `✅ [EventsService] Event #${nextOnChainEventId} terverifikasi on-chain di Sepolia (Blok #${createBlockNumber})`,
      );

      // Pendaftaran masing-masing kategori tiket ke smart contract
      for (const cat of savedCategories) {
        console.log(`⏳ [EventsService] Menambahkan kategori on-chain #${cat.id} (${cat.name})...`);
        const catTxHash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'addCategory',
          args: [
            BigInt(nextOnChainEventId),
            BigInt(cat.id),
            BigInt(Math.round(Number(cat.price))),
            Number(cat.quota),
          ],
        });

        const catReceipt = await this.publicClient.waitForTransactionReceipt({
          hash: catTxHash,
        });
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
    } catch (chainErr: any) {
      console.warn(
        '⚠️ [EventsService] Transaksi blockchain mengalami kendala jaringan Sepolia:',
        chainErr?.shortMessage || chainErr?.message || chainErr,
      );

      return {
        success: true,
        warning: `Event berhasil disimpan ke database MySQL, namun proses blockchain Sepolia mengalami keterlambatan: ${chainErr?.shortMessage || chainErr?.message}`,
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
