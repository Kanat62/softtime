import { ConflictException } from '@nestjs/common';
import { ErrorCode } from '@softtime/shared';
import { ProviderService } from './provider.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/**
 * Закрытая администратором компания не должна «оживать» ни по кнопке
 * провайдера, ни по запоздавшему платёжному webhook.
 */
describe('закрытая компания не переоткрывается', () => {
  const audit: any = { log: jest.fn() };
  const notifications: any = { sendToProviders: jest.fn(), sendToCompanyAdmins: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('PROVIDER: activateCompany → 409 COMPANY_CLOSED, статус не меняется', async () => {
    const prisma: any = {
      company: { findUnique: jest.fn().mockResolvedValue({ id: 'co-1', status: 'CLOSED', name: 'X' }), update: jest.fn() },
      subscription: { updateMany: jest.fn() },
    };
    const service = new ProviderService(prisma, audit, notifications);

    await expect(service.activateCompany('co-1', 'p-1')).rejects.toMatchObject({
      constructor: ConflictException,
      response: { code: ErrorCode.COMPANY_CLOSED },
    });
    expect(prisma.company.update).not.toHaveBeenCalled();
    expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
  });

  it('PROVIDER: suspendCompany не превращает CLOSED в SUSPENDED (обход через activate)', async () => {
    const prisma: any = {
      company: { findUnique: jest.fn().mockResolvedValue({ id: 'co-1', status: 'CLOSED', name: 'X' }), update: jest.fn() },
      subscription: { updateMany: jest.fn() },
    };
    const service = new ProviderService(prisma, audit, notifications);

    await expect(service.suspendCompany('co-1', 'p-1')).rejects.toMatchObject({
      constructor: ConflictException,
      response: { code: ErrorCode.COMPANY_CLOSED },
    });
    expect(prisma.company.update).not.toHaveBeenCalled();
  });

  it('PROVIDER: обычную (SUSPENDED) компанию по-прежнему можно активировать', async () => {
    const prisma: any = {
      company: {
        findUnique: jest.fn().mockResolvedValue({ id: 'co-1', status: 'SUSPENDED', name: 'X' }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscription: { updateMany: jest.fn().mockResolvedValue({}) },
    };
    const service = new ProviderService(prisma, audit, notifications);

    await expect(service.activateCompany('co-1', 'p-1')).resolves.toEqual({ ok: true });
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'co-1' },
      data: { status: 'ACTIVE' },
    });
  });

  it('webhook оплаты по закрытой компании: ok=false, company_closed, ничего не пишется', async () => {
    const prisma: any = {
      company: { findUnique: jest.fn().mockResolvedValue({ status: 'CLOSED' }), update: jest.fn() },
      subscription: { findUnique: jest.fn(), update: jest.fn() },
      payment: { create: jest.fn() },
    };
    const provider: any = { verifyWebhook: jest.fn().mockReturnValue(true) };
    const service = new SubscriptionsService(prisma, audit, notifications, provider);

    const res = await service.handleWebhook({ companyId: 'co-1', status: 'success' }, 'sig');

    expect(res).toEqual({ ok: false, reason: 'company_closed' });
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.company.update).not.toHaveBeenCalled();
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});
