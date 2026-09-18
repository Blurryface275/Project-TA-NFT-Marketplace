import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
// Conflict Exception (HTTP 409) digunakan untuk error ketika user sudah terdaftar
// Unauthorized Exception (HTTP 401) digunakan untuk error ketika login gagal
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PasskeyCredential } from './entities/passkey-credential.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) // digunakan untuk memberikan akses ke repository tabel users
    private readonly userRepository: Repository<User>, // hasil tabel users dipetakan ke variabel userRepository
    private readonly dataSource: DataSource, // wajib hukumnya krn dibutuhin buat jalanin DB Transaction saat registrasi (nanti insert ke tabel user, customer, passkey)
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

    // Insert user baru ke 3 table dalam DB
    return await this.dataSource.transaction(async (manager) => {
      // buat dan simpan user baru
      // pakai manager krn lg di dalam transaction
      const user = manager.create(User, {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      });
      const savedUser = await manager.save(user);

      // lanjut insert customer
      const customer = manager.create(Customer, {
        walletAddress: registerDto.walletAddress,
        usersId: savedUser.id,
      });
      const savedCustomer = await manager.save(customer);

      // lanjut insert passkey credential
      const passkeyCredential = manager.create(PasskeyCredential, {
        publicKeyX: registerDto.pubX,
        publicKeyY: registerDto.pubY,
        credentialId: registerDto.credentialId,
        counter: 0,
        customersId: savedCustomer.id,
      });
      await manager.save(passkeyCredential);

      const { password, ...result } = savedUser;
      return {
        ...result,
        walletAddress: savedCustomer.walletAddress,
      };
    });
  }

  async login(loginDto: LoginDto) {
    {
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

      // Hapus password dari hasil response
      const { password, ...result } = user;
      return {
        ...result,
        walletAddress: user.customer?.walletAddress || '',
      };
    }
  }
}
