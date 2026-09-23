import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class MintTicketDto{
    @IsNotEmpty()
    @IsString()
    walletAddress: string;

    @IsNotEmpty()
    @IsNumber()
    eventId: number;

    @IsNotEmpty()
    @IsNumber()
    categoryId: number;

    // Jumlah tiket yang ingin dibeli (opsional, default 1, maksimal 2 per akun)
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Jumlah pembelian minimal 1 tiket' })
    @Max(2, { message: 'Jumlah pembelian maksimal 2 tiket per akun' })
    quantity?: number;
}