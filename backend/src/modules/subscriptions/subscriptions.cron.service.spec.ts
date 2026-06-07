import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubStatus, CompanyStatus } from '@softtime/shared';
import { SubscriptionsCronService } from './subscriptions.cron.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('SubscriptionsCronService.checkSubscriptions', () => {
  let service: SubscriptionsCronService;

  const mockPrisma = {
    subscription: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    company: { updateMany: jest.fn() },
  };

  const mockNotifications = { sendToCompanyAdmins: jest.fn() };

  const mockConfig = {
    get: jest.fn((key: string, def?: unknown) => {
      if (key === 'GRACE_PERIOD_DAYS') return 7;
      return def;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsCronService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<SubscriptionsCronService>(SubscriptionsCronService);
    jest.clearAllMocks();
  });

  // ── TRIAL/ACTIVE → GRACE ──────────────────────────────────────────────────

  it('moves expired TRIAL subscription to GRACE', async () => {
    const companyId = 'co-1';
    const subId = 'sub-1';

    // Step 1: no overdue GRACE subscriptions
    mockPrisma.subscription.findMany
      .mockResolvedValueOnce([]) // GRACE overdues
      .mockResolvedValueOnce([{ id: subId, companyId }]); // TRIAL/ACTIVE expired

    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    mockNotifications.sendToCompanyAdmins.mockResolvedValue(undefined);

    await service.checkSubscriptions();

    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: SubStatus.GRACE },
      }),
    );
    expect(mockNotifications.sendToCompanyAdmins).toHaveBeenCalledWith(
      companyId,
      'Подписка истекает',
      expect.stringContaining('7'),
    );
    // company should NOT be suspended in this step
    expect(mockPrisma.company.updateMany).not.toHaveBeenCalled();
  });

  // ── GRACE → EXPIRED + company SUSPENDED ──────────────────────────────────

  it('moves overdue GRACE subscription to EXPIRED and suspends company', async () => {
    const companyId = 'co-2';
    const subId = 'sub-2';

    // Step 1: one GRACE subscription past grace period
    mockPrisma.subscription.findMany
      .mockResolvedValueOnce([{ id: subId, companyId }]) // GRACE overdues
      .mockResolvedValueOnce([]); // no TRIAL/ACTIVE expired

    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.company.updateMany.mockResolvedValue({ count: 1 });
    mockNotifications.sendToCompanyAdmins.mockResolvedValue(undefined);

    await service.checkSubscriptions();

    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: SubStatus.EXPIRED },
      }),
    );
    expect(mockPrisma.company.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: CompanyStatus.SUSPENDED },
      }),
    );
    expect(mockNotifications.sendToCompanyAdmins).toHaveBeenCalledWith(
      companyId,
      'Компания приостановлена',
      expect.any(String),
    );
  });

  // ── Both steps run in correct order ──────────────────────────────────────

  it('processes GRACE→EXPIRED before TRIAL→GRACE to prevent double-processing', async () => {
    const callOrder: string[] = [];

    mockPrisma.subscription.findMany
      .mockImplementationOnce(() => {
        callOrder.push('query-grace-overdue');
        return Promise.resolve([]);
      })
      .mockImplementationOnce(() => {
        callOrder.push('query-trial-expired');
        return Promise.resolve([]);
      });

    await service.checkSubscriptions();

    expect(callOrder).toEqual(['query-grace-overdue', 'query-trial-expired']);
  });

  // ── No-op when nothing is due ─────────────────────────────────────────────

  it('does nothing when no subscriptions need transitioning', async () => {
    mockPrisma.subscription.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.checkSubscriptions();

    expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.company.updateMany).not.toHaveBeenCalled();
    expect(mockNotifications.sendToCompanyAdmins).not.toHaveBeenCalled();
  });
});
