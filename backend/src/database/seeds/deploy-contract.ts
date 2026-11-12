import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

dotenv.config();

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL!;
  const privateKey = process.env.ADMIN_PRIVATE_KEY! as `0x${string}`;

  const adminAccount = privateKeyToAccount(privateKey);
  console.log(`🔑 Deployer Account: ${adminAccount.address}`);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account: adminAccount,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Baca compiled artifact dari contracts/out/TicketContract.sol/TicketContract.json
  const artifactPath = path.resolve(
    __dirname,
    '../../../../contracts/out/TicketContract.sol/TicketContract.json',
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact tidak ditemukan di: ${artifactPath}. Jalankan forge build terlebih dahulu.`,
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode.object as `0x${string}`;

   console.log('⏳ Mengirim transaksi deployment TicketContract ke Sepolia...');
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    gas: 22_000_000n, // Naikkan batas gas agar tidak Out of Gas (aktual ~18.04M)
  });

  console.log(`🚀 Transaksi Deploy terkirim! TxHash: ${hash}`);
  console.log('⏳ Menunggu konfirmasi blok Sepolia (sekitar 15-30 detik)...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') {
    throw new Error('Deployment reverted on-chain (Out of Gas)!');
  }
  const newContractAddress = receipt.contractAddress;

  if (!newContractAddress) {
    throw new Error('Gagal mendapatkan alamat kontrak baru.');
  }

  console.log(`\n🎉 SUKSES! Smart Contract Baru Ter-deploy!`);
  console.log(`📍 Alamat Kontrak Baru: ${newContractAddress}`);
  console.log(`📦 Blok: #${receipt.blockNumber}`);

    // 1. Set systemSigner langsung ke alamat admin relayer
  console.log(`\n⏳ Mengatur systemSigner ke ${adminAccount.address}...`);
  const setSignerTx = await walletClient.writeContract({
    address: newContractAddress,
    abi,
    functionName: 'setSystemSigner',
    args: [adminAccount.address],
  });
  await publicClient.waitForTransactionReceipt({ hash: setSignerTx });
  console.log(`✅ systemSigner berhasil aktif di TicketContract!`);

  // 2. Deploy MarketplaceContract
  const marketplaceArtifactPath = path.resolve(
    __dirname,
    '../../../../contracts/out/MarketplaceContract.sol/MarketplaceContract.json',
  );
  if (!fs.existsSync(marketplaceArtifactPath)) {
    throw new Error(`Artifact MarketplaceContract tidak ditemukan di: ${marketplaceArtifactPath}`);
  }

  const marketplaceArtifact = JSON.parse(fs.readFileSync(marketplaceArtifactPath, 'utf8'));
   console.log('\n⏳ Mengirim transaksi deployment MarketplaceContract ke Sepolia...');
  const marketHash = await walletClient.deployContract({
    abi: marketplaceArtifact.abi,
    bytecode: marketplaceArtifact.bytecode.object as `0x${string}`,
    args: [newContractAddress, adminAccount.address],
    gas: 8_000_000n, // Naikkan batas gas (aktual ~5.59M)
  });

  const marketReceipt = await publicClient.waitForTransactionReceipt({ hash: marketHash });
  if (marketReceipt.status === 'reverted') {
    throw new Error('Marketplace deployment reverted on-chain!');
  }
  const marketplaceAddress = marketReceipt.contractAddress!;
  console.log(`🎉 MarketplaceContract Ter-deploy: ${marketplaceAddress}`);

  // 3. Otorisasi MarketplaceContract di TicketContract (setMarketplace)
  console.log(`\n⏳ Menghubungkan Marketplace ke TicketContract...`);
  const setMarketplaceTx = await walletClient.writeContract({
    address: newContractAddress,
    abi,
    functionName: 'setMarketplace',
    args: [marketplaceAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: setMarketplaceTx });
  console.log(`✅ MarketplaceContract resmi terotorisasi di TicketContract!`);

  console.log(`\n===============================================================`);
  console.log(`👉 Salin dan perbarui konfigurasi file .env kamu:`);
  console.log(`backend/.env:`);
  console.log(`TICKET_CONTRACT_ADDRESS=${newContractAddress}`);
  console.log(`MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
  console.log(`\nfrontend/.env.local:`);
  console.log(`NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS=${newContractAddress}`);
  console.log(`===============================================================`);
}

main().catch((err) => {
  console.error(
    '❌ Deployment gagal:',
    err?.shortMessage || err?.message || err,
  );
});
