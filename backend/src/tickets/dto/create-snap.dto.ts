import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSnapDto{
    @IsNumber()
    @IsNotEmpty()
    eventId: number;

    @IsNumber()
    @IsNotEmpty()
    categoryId: number;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @IsString()
    @IsOptional()
    turnstileToken?: string; // Token verifikasi CLoudflare Turnstile dari frontend

}