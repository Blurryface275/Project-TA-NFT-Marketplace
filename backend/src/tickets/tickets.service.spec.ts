import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { keccak256, stringToBytes } from 'viem';
import { PasskeyCredential } from '../auth/entities/passkey-credential.entity';
import { Customer } from '../customers/entities/customer.entity';
import { EventsService } from '../events/events.service';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { MailService } from '../auth/mail.service';
import { Order, OrderStatus } from './entities/order.entity';
import { ResaleListing, ResaleStatus } from './entities/resale-listing.entity';
import { TicketCache } from './entities/ticket-cache.entity';
import { TicketsService } from './tickets.service';

describe('TicketsService - Midtrans webhook & idempotency', () => {
  let service: TicketsService;
  let orderRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
  };
  let ticketCacheRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let resaleListingRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let customerRepository: {
    findOne: jest.Mock;
  };
  let passkeyCredentialRepository: {
    find: jest.Mock;
  };
  let mailService: {
    sendTransactionFailedEmail: jest.Mock;
  };

  const serverKey = 'SB-Mid-server-test-key';

  const makeSignature = (orderId: string, statusCode: string, grossAmount: string) =>
    crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

  beforeEach(async () => {
    orderRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };
    ticketCacheRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    resaleListingRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    customerRepository = {
      findOne: jest.fn(),
    };
    passkeyCredentialRepository = {
      find: jest.fn(),
    };
    mailService = {
      sendTransactionFailedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const configMap: Record<string, string> = {
      SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
      ADMIN_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
      TICKET_CONTRACT_ADDRESS: `0x${'2'.repeat(40)}`,
      MARKETPLACE_CONTRACT_ADDRESS: `0x${'3'.repeat(40)}`,
      MIDTRANS_SERVER_KEY: serverKey,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configMap[key]),
          },
        },
        {
          provide: EventsService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(TicketCache),
          useValue: ticketCacheRepository,
        },
        {
          provide: getRepositoryToken(ResaleListing),
          useValue: resaleListingRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
        {
          provide: getRepositoryToken(PasskeyCredential),
          useValue: passkeyCredentialRepository,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws BadRequestException on invalid signature_key', async () => {
    await expect(
      service.handleMidtransWebhook({
        order_id: 'ORDER-123',
        status_code: '200',
        gross_amount: '100000.00',
        signature_key: 'invalid-signature',
        transaction_status: 'settlement',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns ignored_order_not_found when signature_key is valid and order is null', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    orderRepository.findOne.mockResolvedValue(null);

    const payload = {
      order_id: 'ORDER-MISSING-1',
      status_code: '200',
      gross_amount: '100000.00',
      signature_key: makeSignature('ORDER-MISSING-1', '200', '100000.00'),
      transaction_status: 'settlement',
    };

    const result = await service.handleMidtransWebhook(payload);

    expect(result).toEqual({
      status: 'ignored_order_not_found',
      orderId: 'ORDER-MISSING-1',
      message: 'Order tidak ditemukan di database lokal',
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns ignored_resale_order_not_found for RESALE- order_id when signature_key is valid and listing is null', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    resaleListingRepository.findOne.mockResolvedValue(null);

    const orderId = 'RESALE-MISSING-1';
    const payload = {
      order_id: orderId,
      status_code: '200',
      gross_amount: '150000.00',
      signature_key: makeSignature(orderId, '200', '150000.00'),
      transaction_status: 'settlement',
    };

    const result = await service.handleMidtransWebhook(payload);

    expect(result).toEqual({
      status: 'ignored_resale_order_not_found',
      orderId,
      message: 'Resale order tidak ditemukan di database lokal',
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns already_processed and skips mintTicket when orderRepository.update returns affected: 0', async () => {
    const mintSpy = jest.spyOn(service, 'mintTicket').mockResolvedValue({} as any);
    orderRepository.update.mockResolvedValue({ affected: 0 });

    const order = {
      id: 'ORDER-RACE-1',
      status: OrderStatus.PENDING,
      amount: 1,
      midtransTransactionId: null,
    } as Order;

    const result = await service.processPaidOrder(order, 'TRX-123');

    expect(result).toEqual({
      status: 'already_processed',
      message: 'Transaksi sudah diproses atau sedang diproses',
    });
    expect(orderRepository.update).toHaveBeenCalledWith(
      { id: 'ORDER-RACE-1', status: OrderStatus.PENDING },
      { status: OrderStatus.PAID, midtransTransactionId: 'TRX-123' },
    );
    expect(mintSpy).not.toHaveBeenCalled();
  });

  it('rolls back order.status to REFUNDED and sends failed email when mintTicket fails across retries', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((cb: (...args: any[]) => void) => {
        cb();
        return 0 as any;
      });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status_code: '200',
        status_message: 'Success, refund request is approved',
      }),
    } as Response);

    orderRepository.update.mockResolvedValue({ affected: 1 });
    orderRepository.save.mockImplementation(async (o) => o);
    const mintSpy = jest
      .spyOn(service, 'mintTicket')
      .mockRejectedValue(new Error('RPC timeout'));

    const order = {
      id: 'ORDER-FAIL-1',
      status: OrderStatus.PENDING,
      amount: 2,
      totalPrice: 250000,
      midtransTransactionId: null,
      customer: {
        walletAddress: `0x${'a'.repeat(40)}`,
        user: {
          email: 'buyer@example.com',
          name: 'Budi',
        },
      },
      ticketCategory: {
        id: '1',
        eventsId: 'EVT-1',
        price: 120000,
      },
    } as unknown as Order;

    const result = await service.processPaidOrder(order, 'TRX-FAIL-1');

    expect(mintSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.sandbox.midtrans.com/v2/ORDER-FAIL-1/refund',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(orderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ORDER-FAIL-1',
        status: OrderStatus.REFUNDED,
      }),
    );
    expect(mailService.sendTransactionFailedEmail).toHaveBeenCalledWith(
      'buyer@example.com',
      'Budi',
      'ORDER-FAIL-1',
      250000,
      true,
    );
    expect(result).toEqual({
      status: 'refunded',
      orderId: 'ORDER-FAIL-1',
      refunded: true,
      message: 'Transaksi Gagal — Dana Anda telah dikembalikan otomatis.',
      error: 'RPC timeout',
    });
  });
});

describe('TicketsService - verifyDualScanGate WebAuthn verification', () => {
  let service: TicketsService;
  let ticketCacheRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let customerRepository: {
    findOne: jest.Mock;
  };
  let passkeyCredentialRepository: {
    find: jest.Mock;
  };
  let writeContractMock: jest.Mock;
  let waitForTransactionReceiptMock: jest.Mock;
  let queryBuilderExecuteMock: jest.Mock;

  const ownerWallet = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01';
  const validNik = '3578012345670001';
  const validNikHash = keccak256(stringToBytes(validNik));

  function generateP256KeyPair(requireLeadingZeroByte = false) {
    for (let attempt = 0; attempt < 2000; attempt++) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'P-256',
      });
      const jwk = publicKey.export({ format: 'jwk' }) as { x: string; y: string };
      const xBuf = Buffer.from(jwk.x, 'base64url');
      const yBuf = Buffer.from(jwk.y, 'base64url');
      if (!requireLeadingZeroByte || xBuf[0] === 0 || yBuf[0] === 0) {
        return {
          publicKey,
          privateKey,
          pubX: BigInt(`0x${xBuf.toString('hex')}`).toString(),
          pubY: BigInt(`0x${yBuf.toString('hex')}`).toString(),
        };
      }
    }
    throw new Error('Could not generate P-256 keypair matching constraint');
  }

  function createSignedAssertion(params: {
    tokenId: number;
    walletAddress: string;
    nonce: number;
    signedAt: string;
    privateKey: crypto.KeyObject;
    overrideChallenge?: string;
    overrideType?: string;
    upFlag?: boolean;
    authDataLength?: number;
  }) {
    const challengeStr =
      params.overrideChallenge ??
      `NFTIX-AUTH:Token#${params.tokenId}:Owner#${params.walletAddress}:Nonce#${params.nonce}:Time#${params.signedAt}`;
    const challengeB64 = Buffer.from(challengeStr, 'utf8').toString('base64url');
    const clientDataObj = {
      type: params.overrideType ?? 'webauthn.get',
      challenge: challengeB64,
      origin: 'http://localhost:3000',
    };
    const clientDataBuf = Buffer.from(JSON.stringify(clientDataObj), 'utf8');
    const authDataBuf = Buffer.alloc(params.authDataLength ?? 37);
    crypto.createHash('sha256').update('localhost').digest().copy(authDataBuf, 0);
    if (authDataBuf.length >= 33) {
      authDataBuf[32] = params.upFlag === false ? 0x00 : 0x01;
    }

    const clientDataHash = crypto
      .createHash('sha256')
      .update(clientDataBuf)
      .digest();
    const signedPayload = Buffer.concat([authDataBuf, clientDataHash]);
    const derSig = crypto.sign('sha256', signedPayload, params.privateKey);

    return {
      signature: `0x${derSig.toString('hex')}`,
      authenticatorData: authDataBuf.toString('base64url'),
      clientDataJSON: clientDataBuf.toString('base64url'),
    };
  }

  beforeEach(async () => {
    queryBuilderExecuteMock = jest.fn().mockResolvedValue({ affected: 1 });
    ticketCacheRepository = {
      findOne: jest.fn().mockResolvedValue({
        tokenId: 7,
        eventsId: 1,
        used: 0,
      }),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: queryBuilderExecuteMock,
      })),
    };
    customerRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 12,
        walletAddress: ownerWallet,
        nikHash: validNikHash,
      }),
    };
    passkeyCredentialRepository = {
      find: jest.fn(),
    };

    const configMap: Record<string, string> = {
      SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
      ADMIN_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
      TICKET_CONTRACT_ADDRESS: `0x${'2'.repeat(40)}`,
      MARKETPLACE_CONTRACT_ADDRESS: `0x${'3'.repeat(40)}`,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configMap[key]),
          },
        },
        {
          provide: EventsService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { manager: { query: jest.fn() } },
        },
        {
          provide: getRepositoryToken(TicketCache),
          useValue: ticketCacheRepository,
        },
        {
          provide: getRepositoryToken(ResaleListing),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
        {
          provide: getRepositoryToken(PasskeyCredential),
          useValue: passkeyCredentialRepository,
        },
        {
          provide: MailService,
          useValue: { sendTransactionFailedEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);

    jest.spyOn(service, 'getTicket').mockResolvedValue({
      tokenId: 7,
      eventId: 1,
      categoryId: 1,
      originalPrice: 100000,
      used: false,
      owner: ownerWallet,
    });

    writeContractMock = jest.fn().mockResolvedValue('0xmarkusedhash');
    waitForTransactionReceiptMock = jest
      .fn()
      .mockResolvedValue({ status: 'success', blockNumber: 987n });

    const internal = service as unknown as {
      walletClient: { writeContract: jest.Mock };
      publicClient: {
        waitForTransactionReceipt: jest.Mock;
        readContract: jest.Mock;
      };
    };
    internal.walletClient = { writeContract: writeContractMock };
    internal.publicClient = {
      waitForTransactionReceipt: waitForTransactionReceiptMock,
      readContract: jest.fn(),
    };

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts valid P-256 WebAuthn assertion (including leading-zero-byte coordinates) within 60s and marks ticket used', async () => {
    const keypair = generateP256KeyPair(true);
    passkeyCredentialRepository.find.mockResolvedValue([
      {
        id: 1,
        credentialId: 'cred-123',
        publicKeyX: keypair.pubX,
        publicKeyY: keypair.pubY,
        customersId: 12,
      },
    ]);

    const signedAt = new Date().toISOString();
    const nonce = 424242;
    const assertion = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce,
      signedAt,
      privateKey: keypair.privateKey,
    });

    const res = await service.verifyDualScanGate({
      tokenId: 7,
      walletAddress: ownerWallet,
      signedAt,
      nonce,
      credentialId: 'cred-123',
      nik: validNik,
      ...assertion,
    });

    expect(res).toEqual({
      success: true,
      message: 'Verifikasi Berhasil! Pengunjung dipersilakan masuk.',
      tokenId: 7,
      walletAddress: ownerWallet,
      txHash: '0xmarkusedhash',
      blockNumber: 987,
    });
    expect(ticketCacheRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(writeContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'markUsed',
        args: [7n],
      }),
    );
  });

  it('rejects forged random 32-byte signature without marking ticket used or calling markUsed', async () => {
    const keypair = generateP256KeyPair();
    passkeyCredentialRepository.find.mockResolvedValue([
      {
        id: 1,
        credentialId: 'cred-123',
        publicKeyX: keypair.pubX,
        publicKeyY: keypair.pubY,
        customersId: 12,
      },
    ]);

    const signedAt = new Date().toISOString();
    const nonce = 111;
    const validAssertion = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce,
      signedAt,
      privateKey: keypair.privateKey,
    });

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce,
        credentialId: 'cred-123',
        nik: validNik,
        authenticatorData: validAssertion.authenticatorData,
        clientDataJSON: validAssertion.clientDataJSON,
        signature: `0x${crypto.randomBytes(32).toString('hex')}`,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(writeContractMock).not.toHaveBeenCalled();
  });

  it('rejects signature signed by a different P-256 keypair without marking ticket used', async () => {
    const storedKeypair = generateP256KeyPair();
    const attackerKeypair = generateP256KeyPair();
    passkeyCredentialRepository.find.mockResolvedValue([
      {
        id: 1,
        credentialId: 'cred-123',
        publicKeyX: storedKeypair.pubX,
        publicKeyY: storedKeypair.pubY,
        customersId: 12,
      },
    ]);

    const signedAt = new Date().toISOString();
    const nonce = 999;
    const attackerAssertion = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce,
      signedAt,
      privateKey: attackerKeypair.privateKey,
    });

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce,
        credentialId: 'cred-123',
        nik: validNik,
        ...attackerAssertion,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(writeContractMock).not.toHaveBeenCalled();
  });

  it('rejects expired (> 60s), future (< -5s), and invalid signedAt timestamps', async () => {
    const keypair = generateP256KeyPair();
    const expiredAt = new Date(Date.now() - 65_000).toISOString();
    const futureAt = new Date(Date.now() + 15_000).toISOString();

    for (const badTime of [expiredAt, futureAt, 'not-a-date']) {
      const assertion = createSignedAssertion({
        tokenId: 7,
        walletAddress: ownerWallet,
        nonce: 1,
        signedAt: badTime,
        privateKey: keypair.privateKey,
      });
      await expect(
        service.verifyDualScanGate({
          tokenId: 7,
          walletAddress: ownerWallet,
          signedAt: badTime,
          nonce: 1,
          nik: validNik,
          ...assertion,
        }),
      ).rejects.toThrow(BadRequestException);
    }

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects mismatched walletAddress and missing authenticatorData/clientDataJSON', async () => {
    const keypair = generateP256KeyPair();
    const signedAt = new Date().toISOString();
    const otherWallet = `0x${'9'.repeat(40)}`;
    const assertion = createSignedAssertion({
      tokenId: 7,
      walletAddress: otherWallet,
      nonce: 2,
      signedAt,
      privateKey: keypair.privateKey,
    });

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: otherWallet,
        signedAt,
        nonce: 2,
        nik: validNik,
        ...assertion,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        signature: assertion.signature,
        nik: validNik,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('tightens isManualMode: rejects missing walletAddress without 0xmanual and rejects 0xmanual with non-empty walletAddress', async () => {
    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: '',
        signedAt: new Date().toISOString(),
        signature: '0xforged',
        nik: validNik,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt: new Date().toISOString(),
        signature: '0xmanual',
        nik: validNik,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('allows valid 0xmanual mode when walletAddress is empty and NIK matches', async () => {
    const res = await service.verifyDualScanGate({
      tokenId: 7,
      walletAddress: '',
      signedAt: new Date().toISOString(),
      signature: '0xmanual',
      nik: validNik,
    });

    expect(res).toEqual({
      success: true,
      message: 'Verifikasi Berhasil! Pengunjung dipersilakan masuk.',
      tokenId: 7,
      walletAddress: '',
      txHash: '0xmarkusedhash',
      blockNumber: 987,
    });
    expect(passkeyCredentialRepository.find).not.toHaveBeenCalled();
    expect(writeContractMock).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid clientDataJSON type, mismatched challenge nonce, short authData, UP=0, and unknown credentialId; supports fallback when credentialId omitted', async () => {
    const keypair = generateP256KeyPair();
    passkeyCredentialRepository.find.mockResolvedValue([
      {
        id: 1,
        credentialId: 'cred-123',
        publicKeyX: keypair.pubX,
        publicKeyY: keypair.pubY,
        customersId: 12,
      },
    ]);
    const signedAt = new Date().toISOString();

    const wrongType = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce: 10,
      signedAt,
      privateKey: keypair.privateKey,
      overrideType: 'webauthn.create',
    });
    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce: 10,
        nik: validNik,
        ...wrongType,
      }),
    ).rejects.toThrow(BadRequestException);

    const wrongChallenge = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce: 10,
      signedAt,
      privateKey: keypair.privateKey,
      overrideChallenge: 'NFTIX-AUTH:wrong',
    });
    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce: 10,
        nik: validNik,
        ...wrongChallenge,
      }),
    ).rejects.toThrow(BadRequestException);

    const shortAuth = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce: 10,
      signedAt,
      privateKey: keypair.privateKey,
      authDataLength: 20,
    });
    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce: 10,
        nik: validNik,
        ...shortAuth,
      }),
    ).rejects.toThrow(BadRequestException);

    const upZero = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce: 10,
      signedAt,
      privateKey: keypair.privateKey,
      upFlag: false,
    });
    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce: 10,
        nik: validNik,
        ...upZero,
      }),
    ).rejects.toThrow(BadRequestException);

    passkeyCredentialRepository.find.mockResolvedValueOnce([]);
    const validAssertion = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce: 10,
      signedAt,
      privateKey: keypair.privateKey,
    });
    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce: 10,
        credentialId: 'unknown-cred',
        nik: validNik,
        ...validAssertion,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();

    // Fallback without credentialId queries all credentials for customer.id and succeeds
    const fallbackRes = await service.verifyDualScanGate({
      tokenId: 7,
      walletAddress: ownerWallet,
      signedAt,
      nonce: 10,
      nik: validNik,
      ...validAssertion,
    });
    expect(fallbackRes.success).toBe(true);
    expect(passkeyCredentialRepository.find).toHaveBeenLastCalledWith({
      where: { customersId: 12 },
    });
  });

  it('rejects omitted or non-finite nonce in non-manual mode without marking ticket used or calling markUsed', async () => {
    const keypair = generateP256KeyPair();
    passkeyCredentialRepository.find.mockResolvedValue([
      {
        id: 1,
        credentialId: 'cred-123',
        publicKeyX: keypair.pubX,
        publicKeyY: keypair.pubY,
        customersId: 12,
      },
    ]);

    const signedAt = new Date().toISOString();
    const assertion = createSignedAssertion({
      tokenId: 7,
      walletAddress: ownerWallet,
      nonce: 555,
      signedAt,
      privateKey: keypair.privateKey,
    });

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        credentialId: 'cred-123',
        nik: validNik,
        ...assertion,
      }),
    ).rejects.toThrow('Dynamic QR code tidak valid: nonce WebAuthn tidak ditemukan.');

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt,
        nonce: Number.NaN,
        credentialId: 'cred-123',
        nik: validNik,
        ...assertion,
      }),
    ).rejects.toThrow('Dynamic QR code tidak valid: nonce WebAuthn tidak ditemukan.');

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(writeContractMock).not.toHaveBeenCalled();
  });

  it('prevents R2-BYPASS: rejects cross-ticket / stale WebAuthn assertion replayed onto Token #7 with spoofed signedAt', async () => {
    const keypair = generateP256KeyPair();
    passkeyCredentialRepository.find.mockResolvedValue([
      {
        id: 1,
        credentialId: 'cred-123',
        publicKeyX: keypair.pubX,
        publicKeyY: keypair.pubY,
        customersId: 12,
      },
    ]);

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const staleOtherTicketAssertion = createSignedAssertion({
      tokenId: 999,
      walletAddress: ownerWallet,
      nonce: 12345,
      signedAt: twoHoursAgo,
      privateKey: keypair.privateKey,
    });
    const spoofedNow = new Date().toISOString();

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt: spoofedNow,
        credentialId: 'cred-123',
        nik: validNik,
        ...staleOtherTicketAssertion,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.verifyDualScanGate({
        tokenId: 7,
        walletAddress: ownerWallet,
        signedAt: spoofedNow,
        nonce: 12345,
        credentialId: 'cred-123',
        nik: validNik,
        ...staleOtherTicketAssertion,
      }),
    ).rejects.toThrow(
      'Challenge WebAuthn QR Code tidak cocok dengan tiket dan waktu penandatanganan.',
    );

    expect(ticketCacheRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(writeContractMock).not.toHaveBeenCalled();
  });
});

describe('TicketsService - getUserTickets categoryId & relations', () => {
  let service: TicketsService;
  let ticketCacheRepository: { find: jest.Mock };
  let resaleListingRepository: { find: jest.Mock };
  let customerRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    ticketCacheRepository = { find: jest.fn() };
    resaleListingRepository = { find: jest.fn().mockResolvedValue([]) };
    customerRepository = { findOne: jest.fn().mockResolvedValue(null) };

    const configMap: Record<string, string> = {
      SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
      ADMIN_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
      TICKET_CONTRACT_ADDRESS: `0x${'2'.repeat(40)}`,
      MARKETPLACE_CONTRACT_ADDRESS: `0x${'3'.repeat(40)}`,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configMap[key]) },
        },
        { provide: EventsService, useValue: {} },
        { provide: getRepositoryToken(Order), useValue: { manager: { query: jest.fn() } } },
        { provide: getRepositoryToken(TicketCache), useValue: ticketCacheRepository },
        { provide: getRepositoryToken(ResaleListing), useValue: resaleListingRepository },
        { provide: getRepositoryToken(Customer), useValue: customerRepository },
        { provide: getRepositoryToken(PasskeyCredential), useValue: {} },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('loads order and event.ticketCategories relations and returns persisted categoryId instead of hardcoded 1', async () => {
    const wallet = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01';
    ticketCacheRepository.find.mockResolvedValue([
      {
        tokenId: 11,
        eventsId: 10,
        originalPrice: 500000,
        used: 0,
        ownerWallet: wallet.toLowerCase(),
        order: { id: 'ORD-1', ticketCategoriesId: '2' },
        event: { id: 10, ticketCategories: [] },
      },
      {
        tokenId: 12,
        eventsId: 11,
        originalPrice: 750000,
        used: 1,
        ownerWallet: wallet.toLowerCase(),
        order: { id: 'ORD-2', ticketCategoriesId: '5' },
        event: { id: 11, ticketCategories: [] },
      },
      {
        tokenId: 13,
        eventsId: 12,
        originalPrice: 300000,
        used: 0,
        ownerWallet: wallet.toLowerCase(),
        order: null,
        event: {
          id: 12,
          ticketCategories: [
            { id: '3', price: 300000 },
            { id: '4', price: 600000 },
          ],
        },
      },
      {
        tokenId: 14,
        eventsId: 13,
        originalPrice: 100000,
        used: 0,
        ownerWallet: wallet.toLowerCase(),
        order: null,
        event: null,
      },
    ]);

    const res = await service.getUserTickets(wallet);

    expect(ticketCacheRepository.find).toHaveBeenCalledWith({
      where: { ownerWallet: wallet.toLowerCase() },
      relations: { event: { ticketCategories: true }, order: true },
      order: { tokenId: 'ASC' },
    });
    expect(res.map((t) => t.categoryId)).toEqual([2, 5, 3, 1]);
  });
});

describe('TicketsService - primary 1-ticket limit & quota concurrency', () => {
  type InMemoryOrder = {
    id: string;
    amount: number;
    totalPrice: number;
    adminFee: number;
    status: OrderStatus;
    customersId: number;
    ticketCategoriesId: string;
    createdAt: Date;
  };
  type InMemoryTicket = {
    tokenId: number;
    ownerWallet: string;
    eventsId: number;
    ordersId: string;
  };
  type InMemoryResale = {
    id: string;
    buyerWallet: string | null;
    status: ResaleStatus;
    lockedUntil: Date | null;
    ticketCacheTokenId: number;
  };

  let service: TicketsService;
  let eventsService: { findOne: jest.Mock };
  let orderRepository: {
    update: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let customerRepository: { findOne: jest.Mock };
  let categoryState: { id: string; eventsId: number; price: number; quota: number };
  let customersState: Array<{
    id: number;
    walletAddress: string;
    user: { name: string; email: string };
  }>;
  let ordersState: InMemoryOrder[];
  let ticketsState: InMemoryTicket[];
  let resalesState: InMemoryResale[];
  let txMutex: Promise<void>;

  const buyerA = '0x1111111111111111111111111111111111111111';
  const buyerB = '0x2222222222222222222222222222222222222222';

  const runSerialized = async <T>(fn: () => Promise<T>): Promise<T> => {
    const prev = txMutex;
    let release!: () => void;
    txMutex = new Promise<void>((r) => {
      release = r;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  };

  beforeEach(async () => {
    txMutex = Promise.resolve();
    categoryState = { id: '1', eventsId: 100, price: 200000, quota: 1 };
    customersState = [
      { id: 1, walletAddress: buyerA, user: { name: 'Buyer A', email: 'a@test.com' } },
      { id: 2, walletAddress: buyerB, user: { name: 'Buyer B', email: 'b@test.com' } },
    ];
    ordersState = [];
    ticketsState = [];
    resalesState = [];

    eventsService = {
      findOne: jest.fn().mockResolvedValue({
        id: 100,
        eventName: 'Soundfest',
        saleStartTime: null,
        maxPerWallet: 1,
        ticketCategories: [{ id: '1', name: 'VIP', price: 200000, quota: 1, eventsId: 100 }],
      }),
    };

    customerRepository = {
      findOne: jest.fn(async ({ where }: { where: { id: number } }) =>
        customersState.find((c) => c.id === where.id) || null,
      ),
    };

    const createTxManager = () => ({
      createQueryBuilder: jest.fn((entity: unknown) => {
        const params: Record<string, unknown> = {};
        const qb: {
          setLock: jest.Mock;
          innerJoin: jest.Mock;
          leftJoin: jest.Mock;
          where: jest.Mock;
          andWhere: jest.Mock;
          getOne: jest.Mock;
          getCount: jest.Mock;
        } = {
          setLock: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn((_sql: string, p?: Record<string, unknown>) => {
            if (p) Object.assign(params, p);
            return qb;
          }),
          andWhere: jest.fn((_sql: string, p?: Record<string, unknown>) => {
            if (p) Object.assign(params, p);
            return qb;
          }),
          getOne: jest.fn(async () => {
            if (entity === Customer) {
              const walletLower = String(params.walletLower || '').toLowerCase();
              return (
                customersState.find(
                  (c) => c.walletAddress.toLowerCase() === walletLower,
                ) || null
              );
            }
            if (entity === TicketCategory) {
              return String(params.categoryId) === String(categoryState.id)
                ? { ...categoryState }
                : null;
            }
            return null;
          }),
          getCount: jest.fn(async () => {
            if (entity === TicketCache) {
              const walletLower = String(params.walletLower || '').toLowerCase();
              const eventId = Number(params.eventId);
              return ticketsState.filter(
                (t) =>
                  t.ownerWallet.toLowerCase() === walletLower &&
                  t.eventsId === eventId,
              ).length;
            }
            if (entity === Order) {
              const customerId = Number(params.customerId);
              const eventId = Number(params.eventId);
              const tenMinAgo = params.tenMinutesAgo as Date;
              return ordersState.filter((o) => {
                if (o.customersId !== customerId) return false;
                if (Number(categoryState.eventsId) !== eventId) return false;
                const hasTicket = ticketsState.some((t) => t.ordersId === o.id);
                const activePending =
                  o.status === OrderStatus.PENDING && o.createdAt > tenMinAgo;
                const unmintedPaid = o.status === OrderStatus.PAID && !hasTicket;
                return activePending || unmintedPaid;
              }).length;
            }
            if (entity === ResaleListing) {
              const walletLower = String(params.walletLower || '').toLowerCase();
              const eventId = Number(params.eventId);
              const now = params.now as Date;
              return resalesState.filter((r) => {
                if (
                  r.status !== ResaleStatus.LOCKED ||
                  !r.lockedUntil ||
                  r.lockedUntil <= now
                ) {
                  return false;
                }
                if ((r.buyerWallet || '').toLowerCase() !== walletLower) {
                  return false;
                }
                const tc = ticketsState.find(
                  (t) => t.tokenId === r.ticketCacheTokenId,
                );
                return tc ? tc.eventsId === eventId : false;
              }).length;
            }
            return 0;
          }),
        };
        return qb;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === Order) {
          const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
          return ordersState.filter(
            (o) =>
              o.ticketCategoriesId === String(categoryState.id) &&
              (o.status === OrderStatus.PAID ||
                (o.status === OrderStatus.PENDING && o.createdAt > tenMinAgo)),
          );
        }
        return [];
      }),
      create: jest.fn((_entity: unknown, data: Partial<InMemoryOrder>) => ({
        ...data,
        createdAt: new Date(),
      })),
      save: jest.fn(async (order: InMemoryOrder) => {
        await new Promise((r) => setTimeout(r, 15));
        ordersState.push(order);
        return order;
      }),
    });

    orderRepository = {
      update: jest.fn(async (criteria: { id: string; status: OrderStatus }, patch: Partial<InMemoryOrder>) => {
        let affected = 0;
        for (const o of ordersState) {
          if (o.id === criteria.id && o.status === criteria.status) {
            Object.assign(o, patch);
            affected++;
          }
        }
        return { affected };
      }),
      manager: {
        transaction: jest.fn(
          async (cb: (mgr: ReturnType<typeof createTxManager>) => Promise<unknown>) =>
            runSerialized(() => cb(createTxManager())),
        ),
      },
    };

    const configMap: Record<string, string> = {
      SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
      ADMIN_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
      TICKET_CONTRACT_ADDRESS: `0x${'2'.repeat(40)}`,
      MARKETPLACE_CONTRACT_ADDRESS: `0x${'3'.repeat(40)}`,
      MIDTRANS_SERVER_KEY: 'SB-Mid-server-test-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configMap[key]) },
        },
        { provide: EventsService, useValue: eventsService },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(TicketCache), useValue: {} },
        { provide: getRepositoryToken(ResaleListing), useValue: {} },
        { provide: getRepositoryToken(Customer), useValue: customerRepository },
        { provide: getRepositoryToken(PasskeyCredential), useValue: {} },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects quantity > 1 without running transaction or Midtrans', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(
      service.createSnapTransaction({
        eventId: 100,
        categoryId: 1,
        quantity: 2,
        walletAddress: buyerA,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.manager.transaction).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('enforces 1 ticket per wallet per event across ticket_cache, active orders, and LOCKED resale listings, while allowing repurchase after selling via resale', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'snap-tok', redirect_url: 'https://snap.test' }),
    } as Response);
    categoryState.quota = 10;

    // 1. Existing ticket_cache row for same event blocks purchase
    ticketsState.push({ tokenId: 50, ownerWallet: buyerA, eventsId: 100, ordersId: 'OLD-ORD' });
    await expect(
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerA }),
    ).rejects.toThrow(BadRequestException);

    // 2. Repurchase succeeds after buyerA sold token #50 via resale (ticket_cache moved to buyerB while ordersId stays OLD-ORD)
    ordersState.push({
      id: 'OLD-ORD',
      amount: 1,
      totalPrice: 210000,
      adminFee: 10000,
      status: OrderStatus.PAID,
      customersId: 1,
      ticketCategoriesId: '1',
      createdAt: new Date(),
    });
    ticketsState[0].ownerWallet = buyerB;

    const repurchaseRes = await service.createSnapTransaction({
      eventId: 100,
      categoryId: 1,
      quantity: 1,
      walletAddress: buyerA,
    });
    expect(repurchaseRes.token).toBe('snap-tok');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 3. Active PENDING order blocks duplicate purchase for buyerA
    await expect(
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerA }),
    ).rejects.toThrow(BadRequestException);

    // 4. Unminted PAID order blocks purchase
    ordersState[ordersState.length - 1].status = OrderStatus.PAID;
    await expect(
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerA }),
    ).rejects.toThrow(BadRequestException);

    // 5. Active LOCKED resale listing for buyerB on same event blocks primary purchase
    resalesState.push({
      id: 'RESALE-LOCK-1',
      buyerWallet: buyerB,
      status: ResaleStatus.LOCKED,
      lockedUntil: new Date(Date.now() + 300_000),
      ticketCacheTokenId: 50,
    });
    await expect(
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerB }),
    ).rejects.toThrow(BadRequestException);
  });

  it('marks order FAILED and releases quota when Midtrans Snap fails after commit', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error_message: 'Midtrans down' }),
    } as Response);

    await expect(
      service.createSnapTransaction({
        eventId: 100,
        categoryId: 1,
        quantity: 1,
        walletAddress: buyerA,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(ordersState).toHaveLength(1);
    expect(ordersState[0].status).toBe(OrderStatus.FAILED);
  });

  it('prevents concurrent Promise.allSettled primary buyers from exceeding quota = 1', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'snap-race', redirect_url: 'https://snap.test' }),
    } as Response);

    const results = await Promise.allSettled([
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerA }),
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerB }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(ordersState).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('prevents concurrent Promise.allSettled requests from same wallet even when quota = 5', async () => {
    categoryState.quota = 5;
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'snap-same', redirect_url: 'https://snap.test' }),
    } as Response);

    const results = await Promise.allSettled([
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerA }),
      service.createSnapTransaction({ eventId: 100, categoryId: 1, quantity: 1, walletAddress: buyerA }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(ordersState).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('TicketsService - resale sequential ticket-ID lock & concurrency', () => {
  let service: TicketsService;
  let resaleListingRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let ticketCacheRepository: { update: jest.Mock };
  let customerRepository: { findOne: jest.Mock };
  let orderRepository: { manager: { transaction: jest.Mock } };
  let writeContractMock: jest.Mock;
  let waitForTransactionReceiptMock: jest.Mock;

  let listingState: {
    id: string;
    sellerWallet: string;
    lockedPrice: number;
    status: ResaleStatus;
    listedAt: Date;
    ticketCacheTokenId: number;
    buyerWallet: string | null;
    adminFee: number | null;
    buyerMidtransTransactionId: string | null;
    lockedUntil: Date | null;
  };
  let ticketState: {
    tokenId: number;
    eventsId: number;
    ownerWallet: string;
    event: { id: number; eventName: string };
  };
  let customersState: Array<{
    id: number;
    walletAddress: string;
    user: { name: string; email: string };
  }>;
  let ownedByBuyer1: boolean;

  const sellerWallet = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const buyer1 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const buyer2 = '0xcccccccccccccccccccccccccccccccccccccccc';

  beforeEach(async () => {
    ownedByBuyer1 = false;
    listingState = {
      id: 'LISTING-1',
      sellerWallet,
      lockedPrice: 200000,
      status: ResaleStatus.ACTIVE,
      listedAt: new Date(),
      ticketCacheTokenId: 77,
      buyerWallet: null,
      adminFee: null,
      buyerMidtransTransactionId: null,
      lockedUntil: null,
    };
    ticketState = {
      tokenId: 77,
      eventsId: 100,
      ownerWallet: sellerWallet,
      event: { id: 100, eventName: 'Soundfest' },
    };
    customersState = [
      { id: 10, walletAddress: buyer1, user: { name: 'Buyer 1', email: 'b1@test.com' } },
      { id: 11, walletAddress: buyer2, user: { name: 'Buyer 2', email: 'b2@test.com' } },
    ];

    resaleListingRepository = {
      findOne: jest.fn(
        async ({
          where,
        }: {
          where: Record<string, unknown> | Array<Record<string, unknown>>;
        }) => {
          if (Array.isArray(where)) {
            const matched = where.some(
              (clause) =>
                clause.ticketCacheTokenId === listingState.ticketCacheTokenId &&
                clause.status === listingState.status,
            );
            return matched ? { ...listingState } : null;
          }
          if (where.id && where.id === listingState.id) return { ...listingState };
          if (
            where.buyerMidtransTransactionId &&
            where.buyerMidtransTransactionId === listingState.buyerMidtransTransactionId
          ) {
            return { ...listingState };
          }
          return null;
        },
      ),
      save: jest.fn(async (entity: typeof listingState) => {
        listingState = { ...entity };
        return listingState;
      }),
      update: jest.fn(
        async (
          criteria: { id: string; status: ResaleStatus; buyerMidtransTransactionId: string },
          patch: Partial<typeof listingState>,
        ) => {
          if (
            listingState.id === criteria.id &&
            listingState.status === criteria.status &&
            listingState.buyerMidtransTransactionId === criteria.buyerMidtransTransactionId
          ) {
            listingState = { ...listingState, ...patch };
            return { affected: 1 };
          }
          return { affected: 0 };
        },
      ),
    };

    ticketCacheRepository = {
      update: jest.fn(async (_where: { tokenId: number }, patch: { ownerWallet: string }) => {
        ticketState.ownerWallet = patch.ownerWallet;
        return { affected: 1 };
      }),
    };

    customerRepository = {
      findOne: jest.fn(async ({ where }: { where: { id?: number; walletAddress?: string } }) => {
        if (where.id !== undefined) {
          return customersState.find((c) => c.id === where.id) || null;
        }
        if (where.walletAddress) {
          return (
            customersState.find(
              (c) => c.walletAddress.toLowerCase() === where.walletAddress!.toLowerCase(),
            ) || null
          );
        }
        return null;
      }),
    };

    const createTxManager = () => ({
      createQueryBuilder: jest.fn((entity: unknown) => {
        const params: Record<string, unknown> = {};
        const qb: {
          setLock: jest.Mock;
          innerJoin: jest.Mock;
          leftJoin: jest.Mock;
          where: jest.Mock;
          andWhere: jest.Mock;
          getOne: jest.Mock;
          getCount: jest.Mock;
        } = {
          setLock: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn((_sql: string, p?: Record<string, unknown>) => {
            if (p) Object.assign(params, p);
            return qb;
          }),
          andWhere: jest.fn((_sql: string, p?: Record<string, unknown>) => {
            if (p) Object.assign(params, p);
            return qb;
          }),
          getOne: jest.fn(async () => {
            if (entity === Customer) {
              const buyerLower = String(params.buyerLower || '').toLowerCase();
              return (
                customersState.find(
                  (c) => c.walletAddress.toLowerCase() === buyerLower,
                ) || null
              );
            }
            if (entity === ResaleListing) {
              return String(params.listingId) === listingState.id
                ? { ...listingState }
                : null;
            }
            return null;
          }),
          getCount: jest.fn(async () => {
            if (entity === TicketCache && ownedByBuyer1) {
              const walletLower = String(params.walletLower || '').toLowerCase();
              if (walletLower === buyer1.toLowerCase()) return 1;
            }
            return 0;
          }),
        };
        return qb;
      }),
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === TicketCache) return { ...ticketState };
        return null;
      }),
      save: jest.fn(async (entity: typeof listingState) => {
        listingState = { ...entity };
        return listingState;
      }),
    });

    orderRepository = {
      manager: {
        transaction: jest.fn(
          async (cb: (mgr: ReturnType<typeof createTxManager>) => Promise<unknown>) =>
            cb(createTxManager()),
        ),
      },
    };

    const configMap: Record<string, string> = {
      SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
      ADMIN_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
      TICKET_CONTRACT_ADDRESS: `0x${'2'.repeat(40)}`,
      MARKETPLACE_CONTRACT_ADDRESS: `0x${'3'.repeat(40)}`,
      MIDTRANS_SERVER_KEY: 'SB-Mid-server-test-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configMap[key]) },
        },
        { provide: EventsService, useValue: {} },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(TicketCache), useValue: ticketCacheRepository },
        { provide: getRepositoryToken(ResaleListing), useValue: resaleListingRepository },
        { provide: getRepositoryToken(Customer), useValue: customerRepository },
        { provide: getRepositoryToken(PasskeyCredential), useValue: {} },
        { provide: MailService, useValue: { sendTransactionFailedEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);

    writeContractMock = jest.fn();
    waitForTransactionReceiptMock = jest
      .fn()
      .mockResolvedValue({ status: 'success', blockNumber: 555n });
    const internal = service as unknown as {
      walletClient: { writeContract: jest.Mock };
      publicClient: { waitForTransactionReceipt: jest.Mock };
    };
    internal.walletClient = { writeContract: writeContractMock };
    internal.publicClient = {
      waitForTransactionReceipt: waitForTransactionReceiptMock,
    };

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects resale purchase when buyer already holds a ticket for the same event', async () => {
    ownedByBuyer1 = true;

    await expect(
      service.createResaleSnapTransaction('LISTING-1', buyer1),
    ).rejects.toThrow(BadRequestException);
    expect(listingState.status).toBe(ResaleStatus.ACTIVE);
  });

  it('serializes concurrent Promise.allSettled createResaleSnapTransaction on same tokenId so buyer1 locks cleanly and buyer2 never overwrites', async () => {
    const trace: string[] = [];
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      trace.push('fetch:start');
      await new Promise((r) => setTimeout(r, 25));
      trace.push('fetch:end');
      return {
        ok: true,
        json: async () => ({
          token: 'resale-snap-1',
          redirect_url: 'https://snap.resale.test',
        }),
      } as Response;
    });

    const results = await Promise.allSettled([
      service.createResaleSnapTransaction('LISTING-1', buyer1),
      service.createResaleSnapTransaction('LISTING-1', buyer2),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(trace).toEqual(['fetch:start', 'fetch:end']);
    expect(listingState.status).toBe(ResaleStatus.LOCKED);
    expect(listingState.buyerWallet).toBe(buyer1.toLowerCase());
  });

  it('serializes concurrent Promise.allSettled handleResaleWebhook on same tokenId so executeResale runs once and second returns already_processed', async () => {
    listingState.status = ResaleStatus.LOCKED;
    listingState.lockedUntil = new Date(Date.now() + 300_000);
    listingState.buyerWallet = buyer1;
    listingState.adminFee = 10000;
    listingState.buyerMidtransTransactionId = 'RESALE-77-123456-abc123';

    let inFlight = 0;
    let maxConcurrent = 0;
    writeContractMock.mockImplementation(async () => {
      inFlight++;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      await new Promise((r) => setTimeout(r, 25));
      inFlight--;
      return '0xresaletxhash';
    });

    const [r1, r2] = await Promise.all([
      service.handleResaleWebhook(
        'RESALE-77-123456-abc123',
        'settlement',
        'accept',
        'TRX-1',
      ),
      service.handleResaleWebhook(
        'RESALE-77-123456-abc123',
        'settlement',
        'accept',
        'TRX-1',
      ),
    ]);

    expect(maxConcurrent).toBe(1);
    expect(writeContractMock).toHaveBeenCalledTimes(1);
    expect(r1).toMatchObject({ status: 'success', tokenId: 77, newOwner: buyer1.toLowerCase() });
    expect(r2).toMatchObject({ status: 'already_processed' });
    expect(listingState.status).toBe(ResaleStatus.SOLD);
    expect(ticketCacheRepository.update).toHaveBeenCalledTimes(1);
    expect(ticketCacheRepository.update).toHaveBeenCalledWith(
      { tokenId: 77 },
      { ownerWallet: buyer1.toLowerCase(), syncedAt: expect.any(Date) },
    );
  });

  it('rolls resale listing back from LOCKED to ACTIVE and clears lock fields when createResaleSnapTransaction Midtrans Snap fails', async () => {
    let statusDuringFetch: ResaleStatus | undefined;
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      statusDuringFetch = listingState.status;
      return {
        ok: false,
        status: 502,
        json: async () => ({ error_message: 'Midtrans Snap error' }),
      } as Response;
    });

    try {
      await expect(
        service.createResaleSnapTransaction('LISTING-1', buyer1),
      ).rejects.toThrow(BadRequestException);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(statusDuringFetch).toBe(ResaleStatus.LOCKED);
      expect(resaleListingRepository.update).toHaveBeenCalledWith(
        {
          id: 'LISTING-1',
          status: ResaleStatus.LOCKED,
          buyerMidtransTransactionId: expect.any(String),
        },
        {
          status: ResaleStatus.ACTIVE,
          lockedUntil: null,
          buyerWallet: null,
          adminFee: null,
          buyerMidtransTransactionId: null,
        },
      );
      expect(listingState.status).toBe(ResaleStatus.ACTIVE);
      expect(listingState.lockedUntil).toBeNull();
      expect(listingState.buyerWallet).toBeNull();
      expect(listingState.adminFee).toBeNull();
      expect(listingState.buyerMidtransTransactionId).toBeNull();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('rejects cancelResaleListing on an unexpired LOCKED listing and serializes with createResaleSnapTransaction under withTicketLock', async () => {
    // 1. Direct unexpired LOCKED rejection
    listingState.status = ResaleStatus.LOCKED;
    listingState.lockedUntil = new Date(Date.now() + 300_000);
    listingState.buyerWallet = buyer1.toLowerCase();
    listingState.adminFee = 10000;
    listingState.buyerMidtransTransactionId = 'RESALE-77-LOCKED-1';

    await expect(
      service.cancelResaleListing(77, sellerWallet),
    ).rejects.toThrow(BadRequestException);
    expect(writeContractMock).not.toHaveBeenCalled();
    expect(listingState.status).toBe(ResaleStatus.LOCKED);

    // 2. Serialization with concurrent createResaleSnapTransaction under withTicketLock
    listingState.status = ResaleStatus.ACTIVE;
    listingState.lockedUntil = null;
    listingState.buyerWallet = null;
    listingState.adminFee = null;
    listingState.buyerMidtransTransactionId = null;

    const trace: string[] = [];
    const baseFindOne = resaleListingRepository.findOne.getMockImplementation()!;
    const findOneSpy = jest
      .spyOn(resaleListingRepository, 'findOne')
      .mockImplementation(
        async (args: {
          where: Record<string, unknown> | Array<Record<string, unknown>>;
        }) => {
          if (Array.isArray(args.where)) {
            trace.push('cancel:findOne');
          }
          return baseFindOne(args);
        },
      );

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      trace.push('snap:fetch:start');
      await new Promise((r) => setTimeout(r, 30));
      trace.push('snap:fetch:end');
      return {
        ok: true,
        json: async () => ({
          token: 'resale-snap-lock-test',
          redirect_url: 'https://snap.resale.test',
        }),
      } as Response;
    });

    try {
      const snapPromise = service.createResaleSnapTransaction('LISTING-1', buyer1);
      await new Promise((r) => setTimeout(r, 5));
      const cancelPromise = service.cancelResaleListing(77, sellerWallet);

      const [snapRes, cancelRes] = await Promise.allSettled([
        snapPromise,
        cancelPromise,
      ]);

      expect(snapRes.status).toBe('fulfilled');
      expect(cancelRes.status).toBe('rejected');
      if (cancelRes.status === 'rejected') {
        expect(cancelRes.reason).toBeInstanceOf(BadRequestException);
      }
      expect(trace).toEqual([
        'snap:fetch:start',
        'snap:fetch:end',
        'cancel:findOne',
      ]);
      expect(writeContractMock).not.toHaveBeenCalled();
      expect(listingState.status).toBe(ResaleStatus.LOCKED);
    } finally {
      fetchSpy.mockRestore();
      findOneSpy.mockRestore();
    }
  });
});
