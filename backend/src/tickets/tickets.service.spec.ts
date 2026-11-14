import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Customer } from '../customers/entities/customer.entity';
import { EventsService } from '../events/events.service';
import { Order, OrderStatus } from './entities/order.entity';
import { ResaleListing } from './entities/resale-listing.entity';
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
  };
  let resaleListingRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
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
    };
    resaleListingRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
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
          useValue: {},
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
});
