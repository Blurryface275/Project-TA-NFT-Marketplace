import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// muat konfigurasi dari file .env
dotenv.config();

// ABI minimal untuk memanggil fungsi createEvent dan addCategory
const TICKET_CONTRACT_ABI = [
{
    type: 'function',
    name: 'createEvent',
    inputs:[
        {name:'eventId', type: 'uint256'},
        {name:'organizer', type: 'address'},
        {name: 'eventTimestamp', type: 'uint64'},
        {name: 'maxPerWallet', type: 'uint32'}
    ],
    outputs:[],
},
{
    type: 'function',
    name: 'addCategory',
    inputs:[
        {name:'eventId', type: 'uint256'},
        {name:'categoryId', type: 'uint256'},
        {name:'price', type: 'uint96'},
        {name:'quota', type: 'uint32'},
    ],
    outputs:[],
},
] as const;

async function syncEventsToBlockchain(){
    // Baca Environment Variables
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.ADMIN_PRIVATE_KEY! as `0x${string}`;
    const contractAddress = process.env.TICKET_CONTRACT_ADDRESS! as `0x${string}`;

    // Siapkan akun & client Viem
    // Expected Output dari privateKeyToAccount:
  // Objek Akun dengan alamat: 0x8C2CF82F28567478eE12d2fDE1bF6E7304D1e0DA (Deployer / Owner Kontrak)
  const adminAccount = privateKeyToAccount(privateKey);
  console.log(`🔑 Menggunakan Akun Admin: ${adminAccount.address}`);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account: adminAccount,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Buka koneksi ke MySQL
  const dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nft-marketplace',
  });
  console.log('📦 Mengambil data events dan categories dari MySQL...');

  try{
    // Ambil semua eent dari database
    const [eventsRows] = await dbConnection.query('SELECT * FROM events ORDER BY id ASC');
    const events = eventsRows as any[];

    for (const evt of events){
        const onChainEventId = BigInt(evt.on_chain_event_id);

        // Perhitungan unix timestamp dari tanggal konser di database
        // Expected Input: '2026-12-10 19:00:00'
        // Expected Calculation: getTime() menghasilkan milidetik -> dibagi 1000 -> dibulatkan -> dibungkus BigInt
        // Expected Output: 1796904000n (uint64)
        const eventTimestamp = BigInt(Math.floor(new Date(evt.start_date).getTime() / 1000));

        // Ambil limit tiket per wallet dari kolom MySQL (Default 2 jika null)
        // Expected output: 2 -> sesuaiin sm file backend/src/event/entities/event.entity.ts (maxPerWallet)
        const maxPerWallet = BigInt(evt.max_per_wallet || 2);

        // Tampilkan log info
        console.log(`\n==================================================`);
        console.log(`🎪 Memproses Event #${onChainEventId}: ${evt.event_name}`);
        console.log(`🎟️ Limit Tiket per Dompet: ${maxPerWallet} tiket`);
        console.log(`⏱️ Waktu Event (Unix Timestamp): ${eventTimestamp}`);
        
        // Eksekusi fungsi createEvent ke Smart Contract Sepolia
        try{
          console.log(`⏳ Mengirim createEvent ke smart contract...`);

          // Expected Output writeContract:
          // Hash transaksi Sepolia 66 char : 0x....
          const txHash = await walletClient.writeContract({
            address: contractAddress, // tentukan address contract mana yang mau diubah
            abi: TICKET_CONTRACT_ABI,
            functionName: 'createEvent',
            args:[onChainEventId, adminAccount.address, eventTimestamp, maxPerWallet],
          });

        console.log(`🚀 Transaksi createEvent terkirim! TxHash: ${txHash}`);

        // Expected Output waitForTransactionReceipt:
        // Objeck receipt yang menandakan transaksi sudah permanen masuk ke blok (biasanya butuh ~30-60 detik di sepolia)
        const receipt = await publicClient.waitForTransactionReceipt({hash: txHash});
        console.log(`✅ Event #${onChainEventId} sukses terdaftar di Sepolia! (Blok #${receipt.blockNumber})`);
        }
    catch (err: any) {
        if (err.message?.includes('EventAlreadyExists')) { // ini menyesuaikan nama error dari smart contract
            console.log(`⚠️ Event #${onChainEventId} sudah pernah terdaftar di Sepolia. Lanjut ke kategori.`);
        } else {
            console.warn(`⚠️ Gagal mendaftarkan event #${onChainEventId}:`, err.message);
        }
    }

    // Query seluruh kategori tiket untuk event ini dari MySQL
    const [catRows] = await dbConnection.query('SELECT * FROM ticket_categories WHERE events_id = ?', [evt.id]);
    const categories = catRows as any[];

    // Iterasi setiap kategori dan panggil addCategory
    for (const cat of categories) {
      // Ambil ID kategori dari MySQL (string char(36) dikonversi ke BigInt uint256 untuk Solidity)
      // Expected Input: '1', '2', '3', dst.
      // Expected Output: 1n, 2n, dst.
      const categoryId = BigInt(cat.id);

      // Ambil harga tiket dan bulatkan ke BigInt (uint96 rupiah)
      // Expected Input: '150000.00'
      // Expected Output: 150000n
      const price = BigInt(Math.round(Number(cat.price)));

      // Kuota jumlah tiket kategori
      // Expected Output: 50, 100, dst. (uint32)
      const quota = Number(cat.quota);

      try {
        console.log(`  ⏳ Menambahkan Kategori #${categoryId} (${cat.name} - Rp ${Number(cat.price).toLocaleString('id-ID')})...`);

        // Panggil fungsi addCategory di smart contract Sepolia
        // Expected Output: Hash transaksi untuk pendaftaran kategori (0x...)
        const catTxHash = await walletClient.writeContract({
          address: contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'addCategory',
          args: [onChainEventId, categoryId, price, quota],
        });

        // Tunggu blok konfirmasi transaksi kategori
        const catReceipt = await publicClient.waitForTransactionReceipt({ hash: catTxHash });
        console.log(`  ✅ Kategori #${categoryId} aktif di Sepolia! (Blok #${catReceipt.blockNumber})`);
      } catch (catErr: any) {
        // Guard Clause jika kategori sudah pernah didaftarkan sebelumnya di smart contract
        if (catErr.message?.includes('CategoryAlreadyExist') || catErr.shortMessage?.includes('CategoryAlreadyExist')) {
          console.log(`  ℹ️ Kategori #${categoryId} sudah ada di blockchain Sepolia`);
        } else {
          console.warn(`  ⚠️ Catatan addCategory:`, catErr.shortMessage || catErr.message);
        }
      }
    }
  }

  console.log('\n🎉 SINKRONISASI SELESAI: Seluruh Event & Kategori kini aktif di Sepolia!');
  } catch (error: any) {
    // Tangkap error jika terjadi gangguan koneksi database atau RPC Sepolia
    console.error('❌ Terjadi kesalahan saat sinkronisasi on-chain:', error?.shortMessage || error?.message || error);
  } finally {
    // Pastikan koneksi database MySQL selalu ditutup agar proses terminal selesai
    await dbConnection.end();
    console.log('✅ Koneksi database MySQL ditutup');
  }
}

// Panggil fungsi sinkronisasi utama
syncEventsToBlockchain();