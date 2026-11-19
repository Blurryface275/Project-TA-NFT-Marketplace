import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { keccak256, stringToBytes } from 'viem';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { PasskeyCredential } from './entities/passkey-credential.entity';
import { MailService } from './mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
    transaction: jest.Mock;
  };
  let mailService: {
    sendOtpEmail: jest.Mock;
  };

  const validNik = '3578012345670001';
  const expectedNikHash = keccak256(stringToBytes(validNik));

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (u) => u),
    };
    manager = {
      create: jest.fn((_entity, data) => ({ ...data })),
      save: jest.fn(async (entity) => {
        if ('email' in entity && !entity.id) {
          return { id: 10, ...entity };
        }
        if ('nikHash' in entity && !entity.id) {
          return { id: 20, ...entity };
        }
        return { id: 30, ...entity };
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      query: jest.fn(),
      transaction: jest.fn(async (cb: (mgr: typeof manager) => Promise<unknown>) =>
        cb(manager),
      ),
    };
    mailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('registers user and customer without passkey, hashes NIK, sends OTP, and strips password', async () => {
      userRepository.findOne.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([]);

      const res = await service.register({
        name: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'password123',
        nik: validNik,
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        'SELECT id FROM customers WHERE nik_hash = ? LIMIT 1',
        [expectedNikHash],
      );
      expect(manager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          name: 'Budi Santoso',
          email: 'budi@example.com',
          isEmailVerified: false,
          emailVerificationToken: expect.stringMatching(/^\d{6}$/),
        }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        Customer,
        expect.objectContaining({
          walletAddress: null,
          nikHash: expectedNikHash,
          usersId: 10,
        }),
      );
      expect(manager.create).not.toHaveBeenCalledWith(
        PasskeyCredential,
        expect.anything(),
      );
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
        'budi@example.com',
        'Budi Santoso',
        expect.stringMatching(/^\d{6}$/),
      );
      expect(res).not.toHaveProperty('password');
      expect(res.walletAddress).toBeNull();
    });

    it('registers user, customer, and passkey credential when pubX/pubY/credentialId are provided', async () => {
      userRepository.findOne.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([]);

      const res = await service.register({
        name: 'Ani',
        email: 'ani@example.com',
        password: 'password123',
        nik: validNik,
        walletAddress: '0x1111111111111111111111111111111111111111',
        pubX: '12345',
        pubY: '67890',
        credentialId: 'cred-abc',
      });

      expect(manager.create).toHaveBeenCalledWith(
        PasskeyCredential,
        expect.objectContaining({
          publicKeyX: '12345',
          publicKeyY: '67890',
          credentialId: 'cred-abc',
          counter: 0,
          customersId: 20,
        }),
      );
      expect(res.walletAddress).toBe(
        '0x1111111111111111111111111111111111111111',
      );
    });

    it('rejects duplicate email with ConflictException', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1, email: 'dup@example.com' });

      await expect(
        service.register({
          name: 'Dup',
          email: 'dup@example.com',
          password: 'password123',
          nik: validNik,
        }),
      ).rejects.toThrow(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects non-16-digit NIK with BadRequestException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.register({
          name: 'Bad Nik',
          email: 'badnik@example.com',
          password: 'password123',
          nik: '12345abc',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it('enforces 1 NIK = 1 wallet by rejecting duplicate NIK hash with ConflictException', async () => {
      userRepository.findOne.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([{ id: 99 }]);

      await expect(
        service.register({
          name: 'Second Account',
          email: 'second@example.com',
          password: 'password123',
          nik: validNik,
        }),
      ).rejects.toThrow(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('logs in verified CUSTOMER without returning password', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 4);
      userRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Budi',
        email: 'budi@example.com',
        password: hashedPassword,
        isEmailVerified: true,
        customer: { walletAddress: '0xabc' },
      });
      dataSource.query.mockResolvedValue([]);

      const res = await service.login({
        email: 'budi@example.com',
        password: 'secret123',
      });

      expect(res).toMatchObject({
        id: 1,
        email: 'budi@example.com',
        walletAddress: '0xabc',
        role: 'CUSTOMER',
        organizersId: null,
        organizationName: null,
      });
      expect(res).not.toHaveProperty('password');
    });

    it('logs in verified ORGANIZER with organizersId and organizationName', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 4);
      userRepository.findOne.mockResolvedValue({
        id: 5,
        name: 'EO Admin',
        email: 'eo@example.com',
        password: hashedPassword,
        isEmailVerified: true,
        customer: null,
      });
      dataSource.query.mockResolvedValue([
        { id: 3, organization_name: 'Soundfest EO' },
      ]);

      const res = await service.login({
        email: 'eo@example.com',
        password: 'secret123',
      });

      expect(res).toMatchObject({
        id: 5,
        walletAddress: '',
        role: 'ORGANIZER',
        organizersId: 3,
        organizationName: 'Soundfest EO',
      });
    });

    it('rejects unknown email, wrong password, and unverified email with UnauthorizedException', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'missing@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);

      const hashedPassword = await bcrypt.hash('correct', 4);
      userRepository.findOne.mockResolvedValueOnce({
        id: 1,
        email: 'a@example.com',
        password: hashedPassword,
        isEmailVerified: true,
      });
      await expect(
        service.login({ email: 'a@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      userRepository.findOne.mockResolvedValueOnce({
        id: 1,
        email: 'a@example.com',
        password: hashedPassword,
        isEmailVerified: false,
      });
      await expect(
        service.login({ email: 'a@example.com', password: 'correct' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyOtp & resendOtp', () => {
    it('verifies valid non-expired OTP and clears verification fields', async () => {
      const user = {
        id: 1,
        email: 'otp@example.com',
        isEmailVerified: false,
        emailVerificationToken: '654321',
        emailVerificationExpires: new Date(Date.now() + 60_000),
      };
      userRepository.findOne.mockResolvedValue(user);

      const res = await service.verifyOtp({
        email: 'otp@example.com',
        otp: '654321',
      });

      expect(res.success).toBe(true);
      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeNull();
      expect(user.emailVerificationExpires).toBeNull();
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('returns idempotent success if already verified and rejects wrong/expired OTP', async () => {
      userRepository.findOne.mockResolvedValueOnce({
        email: 'ok@example.com',
        isEmailVerified: true,
      });
      await expect(
        service.verifyOtp({ email: 'ok@example.com', otp: '111111' }),
      ).resolves.toMatchObject({ success: true });

      userRepository.findOne.mockResolvedValueOnce({
        email: 'bad@example.com',
        isEmailVerified: false,
        emailVerificationToken: '654321',
        emailVerificationExpires: new Date(Date.now() + 60_000),
      });
      await expect(
        service.verifyOtp({ email: 'bad@example.com', otp: '000000' }),
      ).rejects.toThrow(BadRequestException);

      userRepository.findOne.mockResolvedValueOnce({
        email: 'exp@example.com',
        isEmailVerified: false,
        emailVerificationToken: '654321',
        emailVerificationExpires: new Date(Date.now() - 10_000),
      });
      await expect(
        service.verifyOtp({ email: 'exp@example.com', otp: '654321' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('resends OTP for unverified user and rejects unknown or already-verified users', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.resendOtp('none@example.com')).rejects.toThrow(
        NotFoundException,
      );

      userRepository.findOne.mockResolvedValueOnce({
        email: 'done@example.com',
        isEmailVerified: true,
      });
      await expect(service.resendOtp('done@example.com')).rejects.toThrow(
        BadRequestException,
      );

      const pendingUser = {
        email: 'pending@example.com',
        name: 'Pending User',
        isEmailVerified: false,
        emailVerificationToken: '000000',
        emailVerificationExpires: new Date(),
      };
      userRepository.findOne.mockResolvedValueOnce(pendingUser);

      const res = await service.resendOtp('pending@example.com');
      expect(res.success).toBe(true);
      expect(pendingUser.emailVerificationToken).toMatch(/^\d{6}$/);
      expect(userRepository.save).toHaveBeenCalledWith(pendingUser);
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
        'pending@example.com',
        'Pending User',
        pendingUser.emailVerificationToken,
      );
    });
  });

  describe('setupWallet', () => {
    it('updates customer walletAddress and saves passkey credential inside transaction', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        customer: { id: 22 },
      });

      const res = await service.setupWallet({
        userId: 1,
        walletAddress: '0x2222222222222222222222222222222222222222',
        pubX: '111',
        pubY: '222',
        credentialId: 'cred-xyz',
      });

      expect(manager.update).toHaveBeenCalledWith(
        Customer,
        { id: 22 },
        { walletAddress: '0x2222222222222222222222222222222222222222' },
      );
      expect(manager.create).toHaveBeenCalledWith(PasskeyCredential, {
        publicKeyX: '111',
        publicKeyY: '222',
        credentialId: 'cred-xyz',
        counter: 0,
        customersId: 22,
      });
      expect(manager.save).toHaveBeenCalled();
      expect(res).toEqual({
        success: true,
        message: 'Dompet tiket berhasil diaktifkan.',
        walletAddress: '0x2222222222222222222222222222222222222222',
      });
    });

    it('throws NotFoundException when user or customer is missing', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setupWallet({
          userId: 999,
          walletAddress: '0x3333333333333333333333333333333333333333',
          pubX: '1',
          pubY: '2',
          credentialId: 'cred-0',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
