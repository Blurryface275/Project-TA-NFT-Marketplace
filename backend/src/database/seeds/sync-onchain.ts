import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// Muat konfigurasi dari file .env
dotenv.config();

// ABI lengkap untuk setSystemSigner, createEvent, addCategory, dan mintTicket
const TICKET_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'setSystemSigner',
    inputs: [{ name: '_signer', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'systemSigner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createEvent',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'organizer', type: 'address' },
      { name: 'eventTimestamp', type: 'uint64' },
      { name: 'maxPerWallet', type: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addCategory',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'categoryId', type: 'uint256' },
      { name: 'price', type: 'uint96' },
      { name: 'quota', type: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mintTicket',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'eventId', type: 'uint256' },
      { name: 'categoryId', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const;

async function syncEventsToBlockchain() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.ADMIN_PRIVATE_KEY! as `0x${string}`;
  const contractAddress = process.env.TICKET_CONTRACT_ADDRESS! as `0x${string}`;

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

  // 1. Validasi & Daftarkan systemSigner jika belum di-set
  const currentSigner = await publicClient.readContract({
    address: contractAddress,
    abi: TICKET_CONTRACT_ABI,
    functionName: 'systemSigner',
  });
  console.log(`🔍 Status systemSigner saat ini on-chain: ${currentSigner}`);

  if (currentSigner.toLowerCase() !== adminAccount.address.toLowerCase()) {
    console.log(`⏳ Mendaftarkan admin sebagai systemSigner di Sepolia...`);
    const signerTx = await walletClient.writeContract({
      address: contractAddress,
      abi: TICKET_CONTRACT_ABI,
      functionName: 'setSystemSigner',
      args: [adminAccount.address],
    });
    console.log(`🚀 Transaksi setSystemSigner terkirim: ${signerTx}`);
    await publicClient.waitForTransactionReceipt({ hash: signerTx });
    console.log(`✅ systemSigner resmi aktif di Sepolia!`);
  } else {
    console.log(`✅ systemSigner sudah sesuai.`);
  }

  // 2. Hubungkan ke Database MySQL
  const dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nft-marketplace',
  });
  console.log('📦 Mengambil data events dan categories dari MySQL...');

  try {
    const [eventsRows] = await dbConnection.query('SELECT * FROM events ORDER BY id ASC');
    const events = eventsRows as any[];

    // 3. Daftarkan Event & Kategori ke Sepolia
    for (const evt of events) {
      const onChainEventId = BigInt(evt.on_chain_event_id);
      const eventTimestamp = BigInt(Math.floor(new Date(evt.start_date).getTime() / 1000));
      const maxPerWallet = Number(evt.max_per_wallet || 2);

      console.log(`\n==================================================`);
      console.log(`🎪 Memproses Event #${onChainEventId}: ${evt.event_name}`);

      try {
        console.log(`⏳ Mendaftarkan createEvent #${onChainEventId} ke Sepolia...`);
        const txHash = await walletClient.writeContract({
          address: contractAddress,
          abi: TICKET_CONTRACT_ABI,
          functionName: 'createEvent',
          args: [onChainEventId, adminAccount.address, eventTimestamp, maxPerWallet],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log(`✅ Event #${onChainEventId} terdaftar di Sepolia! (Blok #${receipt.blockNumber})`);
      } catch (err: any) {
        if (err.message?.includes('EventAlreadyExists')) {
          console.log(`ℹ️ Event #${onChainEventId} sudah ada di Sepolia.`);
        } else {
          console.warn(`⚠️ Catatan createEvent #${onChainEventId}:`, err.shortMessage || err.message);
        }
      }

      const [catRows] = await dbConnection.query('SELECT * FROM ticket_categories WHERE events_id = ?', [evt.id]);
      const categories = catRows as any[];

      for (const cat of categories) {
        const categoryId = BigInt(cat.id);
        const price = BigInt(Math.round(Number(cat.price)));
        const quota = Number(cat.quota);

        try {
          console.log(`  ⏳ Menambahkan Kategori #${categoryId} (${cat.name})...`);
          const catTxHash = await walletClient.writeContract({
            address: contractAddress,
            abi: TICKET_CONTRACT_ABI,
            functionName: 'addCategory',
            args: [onChainEventId, categoryId, price, quota],
          });
          const catReceipt = await publicClient.waitForTransactionReceipt({ hash: catTxHash });
          console.log(`  ✅ Kategori #${categoryId} aktif di Sepolia! (Blok #${catReceipt.blockNumber})`);
        } catch (catErr: any) {
          if (catErr.message?.includes('CategoryAlreadyExist') || catErr.shortMessage?.includes('CategoryAlreadyExist')) {
            console.log(`  ℹ️ Kategori #${categoryId} sudah ada di Sepolia.`);
          } else {
            console.warn(`  ⚠️ Catatan addCategory:`, catErr.shortMessage || catErr.message);
          }
        }
      }
    }

    // 4. Cetak Tiket Otomatis untuk Pesanan yang sudah berstatus 'paid'
    console.log(`\n==================================================`);
    console.log(`🎟️ Memeriksa pesanan dengan status 'paid' di database...`);
    const [paidOrdersRows] = await dbConnection.query(`
      SELECT o.id, o.amount, c.wallet_address, o.ticket_categories_id, tc.events_id, e.on_chain_event_id
      FROM orders o
      JOIN customers c ON o.customers_id = c.id
      JOIN ticket_categories tc ON o.ticket_categories_id = tc.id
      JOIN events e ON tc.events_id = e.id
      WHERE o.status = 'paid'
    `);
    const paidOrders = paidOrdersRows as any[];

    console.log(`Ditemukan ${paidOrders.length} pesanan berstatus paid.`);

    for (const order of paidOrders) {
      console.log(`\n🎫 Memproses cetak tiket untuk Order: ${order.id}`);
      console.log(`   Penerima: ${order.wallet_address}`);
      console.log(`   Event #${order.on_chain_event_id}, Kategori #${order.ticket_categories_id}, Jumlah: ${order.amount}`);

      const qty = Number(order.amount) || 1;
      for (let i = 0; i < qty; i++) {
        const nonce = BigInt(Date.now() * 1000 + i);

        // Sign data EIP-712 dengan akun admin
        const signature = await adminAccount.signTypedData({
          domain: {
            name: 'NFTix',
            version: '1',
            chainId: sepolia.id,
            verifyingContract: contractAddress,
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
            to: order.wallet_address as `0x${string}`,
            eventId: BigInt(order.on_chain_event_id),
            categoryId: BigInt(order.ticket_categories_id),
            nonce: nonce,
          },
        });

        console.log(`   ⏳ Mengirim mintTicket ke Sepolia (tiket ${i + 1}/${qty})...`);
        try {
          const mintTxHash = await walletClient.writeContract({
            address: contractAddress,
            abi: TICKET_CONTRACT_ABI,
            functionName: 'mintTicket',
            args: [
              order.wallet_address as `0x${string}`,
              BigInt(order.on_chain_event_id),
              BigInt(order.ticket_categories_id),
              nonce,
              signature,
            ],
          });

          console.log(`   🚀 Transaksi mint terkirim! TxHash: ${mintTxHash}`);
          const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
          console.log(`   ✅ Tiket NFT berhasil dicetak di Sepolia! (Blok #${mintReceipt.blockNumber})`);
        } catch (mintErr: any) {
          if (
            mintErr.message?.includes('0xf560625a') ||
            mintErr.message?.includes('MaxPerWalletExceeded')
          ) {
            console.warn(
              `   ⚠️ Ditolak On-Chain: Pembelian tiket melebihi batas maxPerWallet untuk dompet ini (Anti-Scalping Rule).`,
            );
          } else {
            console.warn(
              `   ⚠️ Catatan mintTicket:`,
              mintErr.shortMessage || mintErr.message,
            );
          }
        }
      }
    }

    console.log('\n🎉 SINKRONISASI & PENCETAKAN TIKET SELESAI!');
  } catch (error: any) {
    console.error('❌ Terjadi kesalahan:', error?.shortMessage || error?.message || error);
  } finally {
    await dbConnection.end();
    console.log('✅ Koneksi MySQL ditutup');
  }
}

syncEventsToBlockchain();
