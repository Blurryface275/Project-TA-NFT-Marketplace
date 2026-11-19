import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSnapDto{
    @IsNumber()
    @IsNotEmpty()
    eventId: number;

    @IsNumber()
    @IsNotEmpty()
    categoryId: number;

    @IsNumber()
    @Min(1)
    @Max(1, { message: 'Maksimal pembelian adalah 1 tiket per transaksi' })
    quantity: number;

    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @IsString()
    @IsOptional()
    turnstileToken?: string; // Token verifikasi CLoudflare Turnstile dari frontend

}