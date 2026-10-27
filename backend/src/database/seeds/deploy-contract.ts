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
    gas: 17_000_000n, // Alokasi 6.5M gas cukup untuk code storage Sepolia
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

  // Set systemSigner langsung ke alamat admin
  console.log(`\n⏳ Mengatur systemSigner ke ${adminAccount.address}...`);
  const setSignerTx = await walletClient.writeContract({
    address: newContractAddress,
    abi,
    functionName: 'setSystemSigner',
    args: [adminAccount.address],
  });
  await publicClient.waitForTransactionReceipt({ hash: setSignerTx });
  console.log(`✅ systemSigner berhasil aktif di kontrak baru!`);

  console.log(
    `\n===============================================================`,
  );
  console.log(`👉 Silakan perbarui file backend/.env kamu:`);
  console.log(`TICKET_CONTRACT_ADDRESS=${newContractAddress}`);
  console.log(
    `===============================================================`,
  );
}

main().catch((err) => {
  console.error(
    '❌ Deployment gagal:',
    err?.shortMessage || err?.message || err,
  );
});
