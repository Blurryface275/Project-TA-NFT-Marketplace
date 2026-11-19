import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { EventsController } from '../events/events.controller';
import { EventsService } from '../events/events.service';
import { TicketsController } from '../tickets/tickets.controller';
import { TicketsService } from '../tickets/tickets.service';
import { IS_PUBLIC_KEY, InternalApiGuard } from './internal-api-guard';

describe('InternalApiGuard', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;

  afterEach(() => {
    if (originalInternalKey === undefined) {
      delete process.env.INTERNAL_API_KEY;
    } else {
      process.env.INTERNAL_API_KEY = originalInternalKey;
    }
    jest.restoreAllMocks();
  });

  describe('canActivate (unit)', () => {
    let guard: InternalApiGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    const createContext = (headers: Record<string, string | undefined> = {}) => {
      const handler = function testHandler() {};
      class TestController {}
      const context = {
        getHandler: () => handler,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => ({ headers }),
        }),
      } as unknown as ExecutionContext;
      return { context, handler, TestController };
    };

    beforeEach(() => {
      reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      guard = new InternalApiGuard(reflector as unknown as Reflector);
    });

    it('allows requests on @Public() routes even when INTERNAL_API_KEY and header are missing', () => {
      delete process.env.INTERNAL_API_KEY;
      reflector.getAllAndOverride.mockReturnValue(true);
      const { context, handler, TestController } = createContext({});

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        handler,
        TestController,
      ]);
    });

    it('throws UnauthorizedException when INTERNAL_API_KEY is not configured', () => {
      delete process.env.INTERNAL_API_KEY;
      const { context } = createContext({ 'x-internal-key': 'any' });

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('INTERNAL_API_KEY belum dikonfigurasi'),
      );

      process.env.INTERNAL_API_KEY = '';
      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('INTERNAL_API_KEY belum dikonfigurasi'),
      );
    });

    it('throws UnauthorizedException when INTERNAL_API_KEY is whitespace-only even if header matches', () => {
      process.env.INTERNAL_API_KEY = '   ';
      const { context } = createContext({ 'x-internal-key': '   ' });

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('INTERNAL_API_KEY belum dikonfigurasi'),
      );
    });

    it('throws UnauthorizedException when x-internal-key header is missing', () => {
      process.env.INTERNAL_API_KEY = 'test-secret';
      const { context } = createContext({});

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Akses internal ditolak'),
      );
    });

    it('throws UnauthorizedException on wrong key (length mismatch and same-length timingSafeEqual)', () => {
      process.env.INTERNAL_API_KEY = 'test-secret';

      const shortCtx = createContext({ 'x-internal-key': 'short' }).context;
      expect(() => guard.canActivate(shortCtx)).toThrow(
        new UnauthorizedException('Akses internal ditolak'),
      );

      const sameLengthCtx = createContext({
        'x-internal-key': 'wrong-secre',
      }).context;
      expect(() => guard.canActivate(sameLengthCtx)).toThrow(
        new UnauthorizedException('Akses internal ditolak'),
      );
    });

    it('returns true when x-internal-key matches INTERNAL_API_KEY', () => {
      process.env.INTERNAL_API_KEY = 'test-secret';
      const { context } = createContext({ 'x-internal-key': 'test-secret' });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Controller metadata & NestJS HTTP pipeline enforcement', () => {
    const mockAuthService = {
      login: jest.fn().mockResolvedValue({ id: 1, email: 'user@example.com' }),
    };
    const mockEventsService = {
      findAll: jest.fn().mockResolvedValue([{ id: 1, eventName: 'Concert' }]),
    };
    const mockTicketsService = {
      createSnapTransaction: jest.fn().mockResolvedValue({ orderId: 'ORD-1' }),
      handleMidtransWebhook: jest.fn().mockResolvedValue({ status: 'ok' }),
    };

    let app: INestApplication;

    beforeEach(async () => {
      jest.clearAllMocks();
      process.env.INTERNAL_API_KEY = 'super-secret-internal-key';

      const moduleRef = await Test.createTestingModule({
        controllers: [AuthController, EventsController, TicketsController],
        providers: [
          Reflector,
          InternalApiGuard,
          { provide: AuthService, useValue: mockAuthService },
          { provide: EventsService, useValue: mockEventsService },
          { provide: TicketsService, useValue: mockTicketsService },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      if (app) {
        await app.close();
      }
    });

    it('attaches InternalApiGuard to AuthController, EventsController, and TicketsController and marks only webhook @Public()', () => {
      expect(Reflect.getMetadata('__guards__', AuthController)).toContain(
        InternalApiGuard,
      );
      expect(Reflect.getMetadata('__guards__', EventsController)).toContain(
        InternalApiGuard,
      );
      expect(Reflect.getMetadata('__guards__', TicketsController)).toContain(
        InternalApiGuard,
      );

      expect(
        Reflect.getMetadata(
          IS_PUBLIC_KEY,
          TicketsController.prototype.handleMidtransWebhook,
        ),
      ).toBe(true);
      expect(
        Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.login),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(IS_PUBLIC_KEY, EventsController.prototype.findAll),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(
          IS_PUBLIC_KEY,
          TicketsController.prototype.createSnap,
        ),
      ).toBeUndefined();
    });

    it('rejects requests without x-internal-key across Auth, Events, and Tickets controllers with 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'password123' })
        .expect(401);

      await request(app.getHttpServer()).get('/events').expect(401);

      await request(app.getHttpServer())
        .post('/tickets/create-snap')
        .send({ eventId: 1, categoryId: 1, quantity: 1 })
        .expect(401);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockEventsService.findAll).not.toHaveBeenCalled();
      expect(mockTicketsService.createSnapTransaction).not.toHaveBeenCalled();
    });

    it('rejects wrong x-internal-key or unconfigured INTERNAL_API_KEY with 401', async () => {
      await request(app.getHttpServer())
        .get('/events')
        .set('x-internal-key', 'wrong-key')
        .expect(401);

      delete process.env.INTERNAL_API_KEY;
      await request(app.getHttpServer())
        .get('/events')
        .set('x-internal-key', 'super-secret-internal-key')
        .expect(401);

      expect(mockEventsService.findAll).not.toHaveBeenCalled();
    });

    it('allows requests with valid x-internal-key', async () => {
      const res = await request(app.getHttpServer())
        .get('/events')
        .set('x-internal-key', 'super-secret-internal-key')
        .expect(200);

      expect(res.body).toEqual([{ id: 1, eventName: 'Concert' }]);
      expect(mockEventsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('bypasses InternalApiGuard on @Public() midtrans-webhook route without x-internal-key', async () => {
      const payload = { order_id: 'ORD-1', transaction_status: 'settlement' };
      const res = await request(app.getHttpServer())
        .post('/tickets/midtrans-webhook')
        .send(payload)
        .expect(200);

      expect(res.body).toEqual({ status: 'ok' });
      expect(mockTicketsService.handleMidtransWebhook).toHaveBeenCalledWith(
        payload,
      );
    });
  });
});
