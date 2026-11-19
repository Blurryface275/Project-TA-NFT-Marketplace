import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { InternalApiGuard } from '../common/internal-api-guard';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  let app: INestApplication;
  let mockTicketsService: {
    getOrderEntity: jest.Mock;
    processPaidOrder: jest.Mock;
    getUserTickets: jest.Mock;
  };

  beforeEach(async () => {
    process.env.INTERNAL_API_KEY = 'test-internal-api-key';
    process.env.NODE_ENV = 'test';

    mockTicketsService = {
      getOrderEntity: jest.fn(),
      processPaidOrder: jest.fn(),
      getUserTickets: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        Reflector,
        InternalApiGuard,
        { provide: TicketsService, useValue: mockTicketsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    if (originalInternalKey === undefined) {
      delete process.env.INTERNAL_API_KEY;
    } else {
      process.env.INTERNAL_API_KEY = originalInternalKey;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (app) {
      await app.close();
    }
    jest.restoreAllMocks();
  });

  describe('POST /api/tickets/simulate-pay/:orderId', () => {
    it('returns 403 Forbidden when NODE_ENV is production even with valid x-internal-key', async () => {
      process.env.NODE_ENV = 'production';

      await request(app.getHttpServer())
        .post('/api/tickets/simulate-pay/ORDER-123')
        .set('x-internal-key', 'test-internal-api-key')
        .expect(403);

      expect(mockTicketsService.getOrderEntity).not.toHaveBeenCalled();
      expect(mockTicketsService.processPaidOrder).not.toHaveBeenCalled();
    });

    it('succeeds when NODE_ENV is not production and x-internal-key is valid', async () => {
      process.env.NODE_ENV = 'development';
      const fakeOrder = { id: 'ORDER-123' };
      mockTicketsService.getOrderEntity.mockResolvedValue(fakeOrder);
      mockTicketsService.processPaidOrder.mockResolvedValue({
        status: 'success',
        orderId: 'ORDER-123',
      });

      const res = await request(app.getHttpServer())
        .post('/api/tickets/simulate-pay/ORDER-123')
        .set('x-internal-key', 'test-internal-api-key')
        .expect(201);

      expect(res.body).toEqual({ status: 'success', orderId: 'ORDER-123' });
      expect(mockTicketsService.getOrderEntity).toHaveBeenCalledWith('ORDER-123');
      expect(mockTicketsService.processPaidOrder).toHaveBeenCalledWith(
        fakeOrder,
        expect.stringMatching(/^SIMULATED-\d+$/),
      );
    });

    it('returns 401 Unauthorized when x-internal-key is missing', async () => {
      process.env.NODE_ENV = 'development';

      await request(app.getHttpServer())
        .post('/api/tickets/simulate-pay/ORDER-123')
        .expect(401);

      expect(mockTicketsService.getOrderEntity).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/tickets/my-tickets/:walletAddress', () => {
    it('returns 200 with persisted categoryId values when x-internal-key is valid', async () => {
      const wallet = '0x1234567890abcdef1234567890abcdef12345678';
      const expected = [
        {
          tokenId: 10,
          eventId: 2,
          categoryId: 4,
          originalPrice: 500000,
          used: false,
          owner: wallet,
          seatIndex: 1,
          isListed: false,
        },
      ];
      mockTicketsService.getUserTickets.mockResolvedValue(expected);

      const res = await request(app.getHttpServer())
        .get(`/api/tickets/my-tickets/${wallet}`)
        .set('x-internal-key', 'test-internal-api-key')
        .expect(200);

      expect(res.body).toEqual(expected);
      expect(mockTicketsService.getUserTickets).toHaveBeenCalledWith(wallet);
    });

    it('returns 401 Unauthorized without x-internal-key', async () => {
      await request(app.getHttpServer())
        .get('/api/tickets/my-tickets/0x1234567890abcdef1234567890abcdef12345678')
        .expect(401);

      expect(mockTicketsService.getUserTickets).not.toHaveBeenCalled();
    });
  });
});
