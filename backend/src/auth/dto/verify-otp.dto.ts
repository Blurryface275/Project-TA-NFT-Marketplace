import {IsEmail, IsNotEmpty, Length} from 'class-validator';

export class VerifyOtpDto{
    @IsEmail(
        {},
        {
            message: 'Format email tidak valid'
        }
    )
    email:string;

    @IsNotEmpty({ message: 'Kode OTP wajib diisi'})
    @Length(
        6,
        6,
        { 
            message: 'Kode OTP harus 6 digit'
        }
    )
    otp:string;
    
    
}