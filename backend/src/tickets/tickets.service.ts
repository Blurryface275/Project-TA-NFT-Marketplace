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

@Injectable()
export class TicketsService {
  private publicClient;
  private walletClient;
  private account;
  private contractAddress: `0x${string}`;

  constructor(private configService: ConfigService) {
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
    try {
      console.log(' [TicketsService] Minting tiket untuk ' + dto.walletAddress);

      // panggil fungsi 'mintTicket(to, eventId, categoryId)' di smart contract Sepolia untuk memicu produksi tiket NFT
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: TICKET_CONTRACT_ABI,
        functionName: 'mintTicket',
        // BigInt digunakan karena di Solidity tipenya adalah uint256
        args: [
          dto.walletAddress as `0x${string}`,
          BigInt(dto.eventId),
          BigInt(dto.categoryId),
        ],
      });

      console.log(
        `Transaksi dikirim ke Sepolia dengan txHash: ${hash}. Menunggu konfirmasi blok ...`,
      );

      // Menunggu sampai transaksi resmi masuk ke blok
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: hash,
      });
      return {
        success: true,
        message: 'Tiket berhasil dicetak pada jaringan Sepolia Testnet',
        txHash: hash,
        blockNumber: Number(receipt.blockNumber),
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
      console.log(' [TicketsService] Redeem tiket dengan ID: ' + tokenId + ' oleh wallet: ' + walletAddress);

      // di sini publicClient digunakan utk baca dta (read-only)
      // walletClient digunakan utk mengirim transaksi (write)
      
      // panggil fungsi ownerOf di smart contract unutk cek apakah owner wallet sudah sesuai
      const owner = await this.publicClient.readContract({
        address: this.contractAddress, // targetnya smart contract dengan ddress sesuai dengan .env
        abi: TICKET_CONTRACT_ABI, // pakai abi dari ticket-abi.ts
        functionName: 'ownerOf', // nama fungsi yang mau dibaca
        args: [BigInt(tokenId)], // argumen / parameter untuk fungsi ownerOf
      });
      // validasi kecocokan : apakah pemegang tiket yang tercatat di blockchain sudah sama dengan pengirim?
      if(owner.toLowerCase() !== walletAddress.toLowerCase()){
        throw new BadRequestException(`Validasi gagal: Alamat dompet ini tidak sama dengan pemilik tiket di blockchain`,);
      }

      // panggil fungsi 'markUsed' di smart contract Sepolia untuk menukar tiket NFT menjadi pulsa
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

      // ambil wallet address  pemilik tiket (standar ERC-721)
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
  async getUserTickets(walletAddress: string){
    const userTickets = [];

    // loop memeriksa tokenId (misal: dari token #1 sampai token #50)
    for (let i = 1; i <= 50; i++){
      try{
        const ticket = await this.getTicket(i);

        // cocokkan apakah pemilik token ini sama dengan walletAddress pengguna yang sedang login
        // perbandingan string ke string harus persis, termasuk case sensitivity atau huruf kecil besar
        if(ticket.owner.toLowerCase() === walletAddress.toLowerCase()){
          userTickets.push(ticket);
        }
      } catch {
        // Jika error (misalnya tiket belum pernah dibuat/minting) abaikan saja dan hentikan pencarian
        break;
      }
    }

    return userTickets;
  }
}
