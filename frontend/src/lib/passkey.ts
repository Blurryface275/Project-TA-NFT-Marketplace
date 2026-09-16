import { Buffer } from "buffer"; // buffer ini kotak penyimpanan bawaan next js di server

// Polyfill Buffer untuk environment browser Next.js
if (typeof window !== "undefined") {
  // ini cek kalau misal kodenya jalan di brwoser user baru jalanin code bawahnya
  window.Buffer = Buffer; // karena browser aslinya gapunya buffer, kita tempelkan buffer ke sini
}

import { createPublicClient, http } from "viem"; // viem ini didapat dari npm insatll viem
import { sepolia } from "viem/chains";
import {
  toWebAuthnKey,
  WebAuthnMode,
  toPasskeyValidator,
  PasskeyValidatorContractVersion,
} from "@zerodev/passkey-validator";
import { createKernelAccount } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";

export const entryPoint = getEntryPoint("0.7");
export const kernelVersion = KERNEL_V3_3;

// Client koneksi ke jaringan Sepolia Testnet via RPC ZeroDev
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC),
});

// function untuk daftarin biometrik Passkey baru bagi user -> nanti dikirim ke frontend (formData)
export async function registerPasskey(email: string) {
  // Trigger prompt biometirk di browser (minta sidik jari / face id / pin hp / windwos hello)
  const webAuthnKey = await toWebAuthnKey({
    passkeyName: email, // email user
    passkeyServerUrl: process.env.NEXT_PUBLIC_PASSKEY_SERVER_URL!, // link ke API Passkey
    mode: WebAuthnMode.Register, // mode register artinya kita mau daftarin biometrik baru buat akun
    passkeyServerHeaders: {}, // ini bisa kosong karena session sudah ada
  });

  // Bikin passkey validator plugin
  const passkeyValidator = await toPasskeyValidator(publicClient, {
    webAuthnKey,
    entryPoint,
    kernelVersion: KERNEL_V3_3,
    validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED,
  });

  // Menurunkan alamat Smart Account secara deterministik dari email dan privateKey
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: passkeyValidator,
    },
    entryPoint,
    kernelVersion: KERNEL_V3_3,
  });

  // Kembalikan data kriptografi milik user ini
  return {
    pubX: webAuthnKey.pubX.toString(), // public key (x part)
    pubY: webAuthnKey.pubY.toString(), // public key (y part)
    credentialId: webAuthnKey.authenticatorId, // ID unik yang di-generate oleh OS
    walletAddress: await account.getAddress(), // alamat wallet user (dihasilkan dari pubX + pubY + passkey)
  };
  
  


}
