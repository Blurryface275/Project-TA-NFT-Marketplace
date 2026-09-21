import { IsNotEmpty, IsNumber, IsString } from "class-validator";

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
}