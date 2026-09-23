"use server" // fungsinya untuk memberi tahu next.js bahwa file ini akan berjalan di server

import { getSession } from "@/lib/session";

export type BuyTicketState = { // ini adalah data yang akan dikirimkan nanti
    success?: boolean;
    message?: string;
    txHash?: string;
    txHashes?: string[];
    blockNumber?: number;
};

export async function buyTicketAction(
    eventId: number,
    categoryId: number,
    quantity: number = 1
): Promise<BuyTicketState>{
    // ambil data session pengguna yang sedang login
    const session = await getSession();

    if (!session?.walletAddress){
        return {
            success: false,
            message: "Alamat dompet tidak ditemukan. Silakan login ulang.",
        };
    }

    const userId = session.userId;
    const userWalletAddress = session.walletAddress;
    const eventIdNumber = Number(eventId);
    const categoryIdNumber = Number(categoryId);
    const qtyNumber = Number(quantity) || 1;

   try{
    console.log(`[BUY ACTION] User ${userId} (wallet: ${userWalletAddress}) is buying ${qtyNumber} ticket(s) for event ${eventIdNumber} and category ${categoryIdNumber}`);

    // Panggil API Backend Relayer
    const response = await fetch(`${process.env.BACKEND_URL}/api/tickets/mint`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            walletAddress: session.walletAddress,
            eventId: eventId,
            categoryId: categoryId,
            quantity: qtyNumber,
        }),
    });

    const resData = await response.json();

    
    if (!response.ok) {
      return {
        success: false,
        message: resData.message || "Gagal mencetak tiket on-chain",
      };
    }

    return {
        success: true, 
        message: resData.message,
        txHash: resData.txHash,
        txHashes: resData.txHashes,
        blockNumber: resData.blockNumber,
    };
   }
   catch (error) {
    console.error(`[BUY ACTION] Error saat mencetak tiket:`, error);
    const errorMessage = error instanceof Error ? error.message : "Error tidak diketahui"; // memastikan benar benar error dan bukan string metnah
    
    return {
        success: false,
        message: `Gagal mencetak tiket: ${errorMessage}`,
    };
   }
    

    
}