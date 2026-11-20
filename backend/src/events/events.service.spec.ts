import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TicketCache } from '../tickets/entities/ticket-cache.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { EventsService } from './events.service';

describe('EventsService - Sepolia-first create synchronization', () => {
  let service: EventsService;
  let eventRepository: {
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let ticketCategoryRepository: {
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let ticketCacheRepository: {
    count: jest.Mock;
  };
  let managerSave: jest.Mock;
  let dataSource: {
    query: jest.Mock;
    transaction: jest.Mock;
  };
  let writeContractMock: jest.Mock;
  let waitForTransactionReceiptMock: jest.Mock;
  let configMap: Record<string, string>;
  let configServiceMock: { get: jest.Mock };

  const buildDto = (overrides: Partial<CreateEventDto> = {}): CreateEventDto => ({
    eventName: 'Soundfest Jakarta 2027',
    startDate: new Date(Date.now() + 86_400_000 * 14).toISOString(),
    venueLocation: 'Gelora Bung Karno',
    category: 'konser musik',
    capacity: 100,
    organizersId: 1,
    ticketCategories: JSON.stringify([
      { name: 'VIP', price: 500000, quota: 40 },
      { name: 'Festival', price: 200000, quota: 60 },
    ]),
    ...overrides,
  });

  beforeEach(async () => {
    eventRepository = {
      create: jest.fn((data: Partial<Event>) => ({ ...data })),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: '4' }),
      })),
    };

    ticketCategoryRepository = {
      create: jest.fn((data: Partial<TicketCategory>) => ({ ...data })),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: '9' }),
      })),
    };

    ticketCacheRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    managerSave = jest.fn(async (entity: Record<string, unknown>) => {
      if ('eventName' in entity) {
        return { id: 55, ...entity };
      }
      return entity;
    });

    dataSource = {
      query: jest.fn().mockResolvedValue([{ id: 1 }]),
      transaction: jest.fn(
        async (cb: (manager: { save: jest.Mock }) => Promise<unknown>) =>
          cb({ save: managerSave }),
      ),
    };

    configMap = {
      SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
      ADMIN_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
      TICKET_CONTRACT_ADDRESS: `0x${'2'.repeat(40)}`,
    };
    configServiceMock = {
      get: jest.fn((key: string) => configMap[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: eventRepository,
        },
        {
          provide: getRepositoryToken(TicketCategory),
          useValue: ticketCategoryRepository,
        },
        {
          provide: getRepositoryToken(TicketCache),
          useValue: ticketCacheRepository,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);

    writeContractMock = jest.fn();
    waitForTransactionReceiptMock = jest.fn();

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

  it('persists Event and TicketCategory inside dataSource.transaction strictly AFTER Sepolia createEvent & addCategory succeed, and defaults maxPerWallet to 1', async () => {
    const callOrder: string[] = [];

    writeContractMock.mockImplementation(
      async (params: { functionName: string; args: unknown[] }) => {
        callOrder.push(`write:${params.functionName}`);
        return `0x${params.functionName}` as `0x${string}`;
      },
    );
    waitForTransactionReceiptMock.mockImplementation(
      async (params: { hash: string }) => {
        callOrder.push(`receipt:${params.hash}`);
        return { status: 'success', blockNumber: 12345n };
      },
    );
    dataSource.transaction.mockImplementation(
      async (cb: (manager: { save: jest.Mock }) => Promise<unknown>) => {
        callOrder.push('db:transaction');
        return cb({ save: managerSave });
      },
    );

    const res = await service.create(buildDto());

    expect(res.success).toBe(true);
    expect((res as { warning?: string }).warning).toBeUndefined();
    expect(res.event.maxPerWallet).toBe(1);
    expect(res.categories).toHaveLength(2);
    expect(writeContractMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        functionName: 'createEvent',
        args: [5n, expect.any(String), expect.any(BigInt), 1, expect.any(String)],
      }),
    );
    expect(writeContractMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        functionName: 'addCategory',
        args: [5n, 10n, 500000n, 40],
      }),
    );
    expect(writeContractMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        functionName: 'addCategory',
        args: [5n, 11n, 200000n, 60],
      }),
    );
    expect(callOrder).toEqual([
      'write:createEvent',
      'receipt:0xcreateEvent',
      'write:addCategory',
      'receipt:0xaddCategory',
      'write:addCategory',
      'receipt:0xaddCategory',
      'db:transaction',
    ]);
    expect(managerSave).toHaveBeenCalledTimes(3);
  });

  it('throws InternalServerErrorException and writes nothing to MySQL when Sepolia createEvent writeContract rejects', async () => {
    writeContractMock.mockRejectedValueOnce(new Error('Sepolia RPC timeout'));

    await expect(service.create(buildDto())).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(managerSave).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException and skips addCategory & MySQL when Sepolia createEvent receipt is reverted', async () => {
    writeContractMock.mockResolvedValueOnce('0xcreateHash');
    waitForTransactionReceiptMock.mockResolvedValueOnce({
      status: 'reverted',
      blockNumber: 100n,
    });

    await expect(service.create(buildDto())).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(writeContractMock).toHaveBeenCalledTimes(1);
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(managerSave).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException and writes nothing to MySQL when addCategory reverts after createEvent succeeds', async () => {
    writeContractMock
      .mockResolvedValueOnce('0xcreateHash')
      .mockResolvedValueOnce('0xcat1Hash');
    waitForTransactionReceiptMock
      .mockResolvedValueOnce({ status: 'success', blockNumber: 100n })
      .mockResolvedValueOnce({ status: 'reverted', blockNumber: 101n });

    await expect(service.create(buildDto())).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(managerSave).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException and writes nothing to MySQL when addCategory writeContract rejects after createEvent succeeds', async () => {
    writeContractMock
      .mockResolvedValueOnce('0xcreateHash')
      .mockRejectedValueOnce(new Error('Gas estimation failed'));
    waitForTransactionReceiptMock.mockResolvedValueOnce({
      status: 'success',
      blockNumber: 100n,
    });

    await expect(service.create(buildDto())).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(managerSave).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on category price <= 0 without calling Sepolia or MySQL', async () => {
    const dto = buildDto({
      ticketCategories: JSON.stringify([
        { name: 'Free Pass', price: 0, quota: 10 },
      ]),
    });

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(writeContractMock).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on category quota < 1 without calling Sepolia or MySQL', async () => {
    const dto = buildDto({
      ticketCategories: JSON.stringify([
        { name: 'VIP', price: 100000, quota: 0 },
      ]),
    });

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(writeContractMock).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on past startDate without calling Sepolia or MySQL', async () => {
    const dto = buildDto({
      startDate: new Date(Date.now() - 60_000).toISOString(),
    });

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(writeContractMock).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on invalid or non-array ticketCategories JSON without calling Sepolia or MySQL', async () => {
    await expect(
      service.create(buildDto({ ticketCategories: '{not-valid-json' })),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create(buildDto({ ticketCategories: '{"name":"VIP"}' })),
    ).rejects.toThrow(BadRequestException);

    expect(writeContractMock).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on maxPerWallet > 1 without calling Sepolia or MySQL', async () => {
    await expect(
      service.create(buildDto({ maxPerWallet: 2 })),
    ).rejects.toThrow(
      new BadRequestException('Batas tiket per dompet maksimal 1'),
    );

    expect(writeContractMock).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('uploads poster image to Pinata before Sepolia & MySQL and persists gateway URL in Event.imageIpfsCid', async () => {
    const callOrder: string[] = [];
    const mockFile = {
      originalname: 'poster.png',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-png-bytes'),
      size: 14,
    } as Express.Multer.File;

    const configGetSpy = jest
      .spyOn(configServiceMock, 'get')
      .mockImplementation((key: string) => {
        if (key === 'PINATA_JWT') return 'test-pinata-jwt';
        if (key === 'PINATA_GATEWAY') return 'https://teal-odd-tahr-397.mypinata.cloud/';
        return configMap[key];
      });

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        callOrder.push('pinata:fetch');
        expect(input).toBe('https://uploads.pinata.cloud/v3/files');
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual({
          Authorization: 'Bearer test-pinata-jwt',
        });
        expect(init?.body).toBeInstanceOf(FormData);
        return {
          ok: true,
          json: async () => ({
            data: { cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi' },
          }),
        } as Response;
      });

    writeContractMock.mockImplementation(
      async (params: { functionName: string }) => {
        callOrder.push(`write:${params.functionName}`);
        return `0x${params.functionName}` as `0x${string}`;
      },
    );
    waitForTransactionReceiptMock.mockImplementation(
      async (params: { hash: string }) => {
        callOrder.push(`receipt:${params.hash}`);
        return { status: 'success', blockNumber: 12345n };
      },
    );
    dataSource.transaction.mockImplementation(
      async (cb: (manager: { save: jest.Mock }) => Promise<unknown>) => {
        callOrder.push('db:transaction');
        return cb({ save: managerSave });
      },
    );

    try {
      const res = await service.create(buildDto(), mockFile);

      const expectedUri =
        'https://teal-odd-tahr-397.mypinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      expect(res.success).toBe(true);
      expect(res.event.imageIpfsCid).toBe(expectedUri);
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ imageIpfsCid: expectedUri }),
      );
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(callOrder).toEqual([
        'pinata:fetch',
        'pinata:fetch',
        'write:createEvent',
        'receipt:0xcreateEvent',
        'write:addCategory',
        'receipt:0xaddCategory',
        'write:addCategory',
        'receipt:0xaddCategory',
        'db:transaction',
      ]);
    } finally {
      fetchSpy.mockRestore();
      configGetSpy.mockRestore();
    }
  });

  it('throws InternalServerErrorException without calling Sepolia or MySQL when file is provided and PINATA_JWT or PINATA_GATEWAY is missing', async () => {
    const mockFile = {
      originalname: 'poster.png',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-png-bytes'),
      size: 14,
    } as Express.Multer.File;

    const configGetSpy = jest
      .spyOn(configServiceMock, 'get')
      .mockImplementation((key: string) => {
        if (key === 'PINATA_JWT' || key === 'PINATA_GATEWAY') return undefined;
        return configMap[key];
      });
    const fetchSpy = jest.spyOn(global, 'fetch');

    try {
      await expect(service.create(buildDto(), mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(writeContractMock).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(managerSave).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      configGetSpy.mockRestore();
    }
  });

  it('throws InternalServerErrorException without calling Sepolia or MySQL when Pinata upload returns HTTP error', async () => {
    const mockFile = {
      originalname: 'poster.png',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-png-bytes'),
      size: 14,
    } as Express.Multer.File;

    const configGetSpy = jest
      .spyOn(configServiceMock, 'get')
      .mockImplementation((key: string) => {
        if (key === 'PINATA_JWT') return 'test-pinata-jwt';
        if (key === 'PINATA_GATEWAY') return 'teal-odd-tahr-397.mypinata.cloud';
        return configMap[key];
      });
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Pinata upstream error',
    } as Response);

    try {
      await expect(service.create(buildDto(), mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(writeContractMock).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(managerSave).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      configGetSpy.mockRestore();
    }
  });
});
