import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetupWalletDto } from './dto/setup-wallet.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('setup-wallet')
  async setupWallet(@Body() setupWalletDto: SetupWalletDto) {
    return this.authService.setupWallet(setupWalletDto);
  }

  // POST http://localhost:3001/api/auth/verify-otp
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // POST http://localhost:3001/api/auth/resend-otp
  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: { email: string }) {
    return this.authService.resendOtp(resendOtpDto.email);
  }
}
