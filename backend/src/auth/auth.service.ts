import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
// Conflict Exception (HTTP 409) digunakan untuk error ketika user sudah terdaftar
// Unauthorized Exception (HTTP 401) digunakan untuk error ketika login gagal
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PasskeyCredential } from './entities/passkey-credential.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetupWalletDto } from './dto/setup-wallet.dto';

import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import crypto from 'crypto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) // digunakan untuk memberikan akses ke repository tabel users
    private readonly userRepository: Repository<User>, // hasil tabel users dipetakan ke variabel userRepository
    private readonly dataSource: DataSource, // wajib hukumnya krn dibutuhin buat jalanin DB Transaction saat registrasi (nanti insert ke tabel user, customer, passkey)
    private readonly mailService: MailService,
  ) {}
  async register(registerDto: RegisterDto) {
    // cek dulu apakah email udh dipake apa blom
    // di sini querynya lg nyari data di tabel user, berdasarkan email yg dikirim
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    // jika udh ada -> throw error 409 Conflict
    if (existingUser) {
      throw new ConflictException(
        'Anda sudah terdaftar menggunakan email ini. Silahkan login.',
      );
    } // kalau gaada lanjut step berikutnya

    // hash password + salt
    const salt = await bcrypt.genSalt(10); // ini salt dihasilkan pakai algoritma CSPRNG
    const hashedPassword = await bcrypt.hash(registerDto.password, salt); // password di enkripsi pakai bcrypt

    // Generate kode OTP 6 digit menggunakan CSPRNG (crypto.randomInt) yang aman secara kriptografi
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit dari sekarang

    // Insert user baru ke table dalam DB
    return await this.dataSource.transaction(async (manager) => {
      // buat dan simpan user baru
      // pakai manager krn lg di dalam transaction
      const user = manager.create(User, {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationToken: otp,
        emailVerificationExpires: otpExpires,
      });
      const savedUser = await manager.save(user);

      console.log(
        `📧 [OTP Register] Kode verifikasi untuk ${registerDto.email}: ${otp} (Masa berlaku 10 menit)`,
      );

      // Kirim email OTP via Mailtrap
      await this.mailService.sendOtpEmail(
        registerDto.email,
        registerDto.name,
        otp,
      );

      // lanjut insert customer (walletAddress bisa null pada Tahap 1)
      const customer = manager.create(Customer, {
        walletAddress: registerDto.walletAddress || null,
        usersId: savedUser.id,
      });
      const savedCustomer = await manager.save(customer);

      // lanjut insert passkey credential jika disertakan
      if (registerDto.pubX && registerDto.pubY && registerDto.credentialId) {
        const passkeyCredential = manager.create(PasskeyCredential, {
          publicKeyX: registerDto.pubX,
          publicKeyY: registerDto.pubY,
          credentialId: registerDto.credentialId,
          counter: 0,
          customersId: savedCustomer.id,
        });
        await manager.save(passkeyCredential);
      }

      const { password, ...result } = savedUser;
      return {
        ...result,
        walletAddress: savedCustomer.walletAddress,
      };
    });
  }

  async login(loginDto: LoginDto) {
    // Cari user dari email dan sertakan relasi customernya
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: { customer: true },
    });

    // Kalau user ga ditemukan -> throw error 401
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // bandingkan passowrd input dengan hashedPassowrd pada DB
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah!');
    }
    // pengecekan tambahan setelah password -> email terverifikasi
    if (user.isEmailVerified === false){
      throw new UnauthorizedException('Email belum terverifikasi. Silahkan cek email dan masukkan kode OTP verifikasi anda');
    }

    // Check role : User yg lagi login ini cutomer ato organizer? tujuannya buat hide/show menu buy event dan wallet di frontend
    const organizer = await this.dataSource.query(
      'SELECT id, organization_name FROM organizers WHERE users_id = ? LIMIT 1',
      [user.id],
    );
    const isOrganizer = organizer && organizer.length > 0; // syarat unutk isORganizer bernilai true adlaah organizer ditemukan dan panjang array > 0
    const role = isOrganizer ? 'ORGANIZER' : 'CUSTOMER';
    // Hapus password dari hasil response
    const { password, ...result } = user;
    return {
      ...result,
      walletAddress: user.customer?.walletAddress || '',
      role,
      organizersId: isOrganizer ? organizer[0].id : null,
    };
  }

  async setupWallet(setupWalletDto: SetupWalletDto) {
    const user = await this.userRepository.findOne({
      where: { id: setupWalletDto.userId },
      relations: { customer: true },
    });

    if (!user || !user.customer) {
      throw new NotFoundException('Customer tidak ditemukan untuk akun ini.');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Update alamat dompet pada tabel customers
      await manager.update(
        Customer,
        { id: user.customer.id },
        { walletAddress: setupWalletDto.walletAddress },
      );

      // 2. Simpan kredensial passkey ke tabel passkey_credentials
      const passkeyCredential = manager.create(PasskeyCredential, {
        publicKeyX: setupWalletDto.pubX,
        publicKeyY: setupWalletDto.pubY,
        credentialId: setupWalletDto.credentialId,
        counter: 0,
        customersId: user.customer.id,
      });
      await manager.save(passkeyCredential);

      return {
        success: true,
        message: 'Dompet tiket berhasil diaktifkan.',
        walletAddress: setupWalletDto.walletAddress,
      };
    });
  }

  // Method untuk verifikasi kode OTP dari input user
  async verifyOtp(dto: VerifyOtpDto){
    const user = await this.userRepository.findOne({
      where: { 
        email: dto.email
      },
    });

    if (!user){
      throw new NotFoundException('Pengguna dengan email ini tidak ditemukan.');
    }

    if (user.isEmailVerified){
      return{
        success: true,
        message: 'Email sudah terverifikasi. Silahkan login.',
      };
    }

    // Pnegecekan apakah kode OTP sdh sesuai
    if (user.emailVerificationToken !== dto.otp){
      throw new BadRequestException('Kode OTP salah atau tidak valid.');
    }

    // Pengecekan apakah kode OTP sdh kadaluarsa
    if(
      user.emailVerificationExpires &&
      new Date() > user.emailVerificationExpires
    ){
      throw new BadRequestException(
        'Kode OTP kadaluarsa. Silahkan request kode OTP baru.'
      );
    }
    
     // Tandai email sudah terverifikasi dan hapus token sementara
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);
    console.log(`✅ [AuthService] Email ${user.email} berhasil diverifikasi!`);
    return {
      success: true,
      message: 'Email berhasil diverifikasi! Silakan login ke akun Anda.',
    }  
  }

  // Method untuk kirim ulang kode OTP baru
  async resendOtp(email: string){
    const user = await this.userRepository.findOne({ where : {
      email
    }});

    if (!user){
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (user.isEmailVerified){
      throw new BadRequestException('Email Anda sudah terverifikasi.');
    }

    // Perhitungan OTP baru (6 digit) dengan CSPRNG crypto
    const newOtp = crypto.randomInt(100000, 1000000).toString();
    user.emailVerificationToken = newOtp;
    // Perhitungan expired OTP (10 menit dari sekarang)
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // Simpan kembali perubahan data user
    await this.userRepository.save(user);

    console.log(`✅ [AuthService] OTP baru untuk ${email}: ${newOtp} (Masa berlaku 10 menit)`);

    // Pemanggilan pengiriman email di method resendOtp()
    await this.mailService.sendOtpEmail(email, user.name, newOtp);

    return {
      success: true,
      message: 'Kode OTP baru berhasil dikirim ke email Anda.',
    }

  }

  
}
