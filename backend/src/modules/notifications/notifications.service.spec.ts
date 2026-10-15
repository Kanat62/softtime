import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService, trRef } from './notifications.service';
import * as firebase from '../../config/firebase';

/**
 * Подставной отправитель: вместо FCM собираем, что ушло бы в сеть.
 * Реальных push не отправляется — getMessaging() замокан целиком.
 */
interface SentMessage {
  tokens: string[];
  title: string;
  body: string;
}

describe('NotificationsService — группировка получателей по языку', () => {
  let service: NotificationsService;
  let sent: SentMessage[];

  const mockPrisma = {
    user: { findMany: jest.fn() },
    deviceToken: { findMany: jest.fn(), deleteMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    sent = [];

    jest.spyOn(firebase, 'initFirebase').mockImplementation(() => undefined);
    jest.spyOn(firebase, 'getMessaging').mockReturnValue({
      sendEachForMulticast: jest.fn(async (msg: any) => {
        sent.push({ tokens: msg.tokens, title: msg.notification.title, body: msg.notification.body });
        return {
          successCount: msg.tokens.length,
          failureCount: 0,
          responses: msg.tokens.map(() => ({ success: true })),
        };
      }),
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();

    // Один токен на пользователя: token-<userId>
    mockPrisma.deviceToken.findMany.mockImplementation(async ({ where }: any) =>
      (where.userId.in as string[]).map((id) => ({ id: `dt-${id}`, fcmToken: `token-${id}` })),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('отправляет по одному push на язык, а не на получателя', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u-ru-1', language: 'ru' },
      { id: 'u-en-1', language: 'en' },
      { id: 'u-ru-2', language: 'ru' },
      { id: 'u-en-2', language: 'en' },
    ]);

    await service.sendToCompanyAdmins('co-1', 'companySuspended');

    expect(sent).toHaveLength(2);

    const ru = sent.find((m) => m.title === 'Компания приостановлена')!;
    const en = sent.find((m) => m.title === 'Company suspended')!;
    expect(ru.tokens).toEqual(['token-u-ru-1', 'token-u-ru-2']);
    expect(en.tokens).toEqual(['token-u-en-1', 'token-u-en-2']);
    expect(ru.body).toBe('Ваша компания была приостановлена администратором платформы.');
    expect(en.body).toBe('Your company has been suspended by the platform administrator.');
  });

  it('сводит неизвестный и пустой язык в русскую группу', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u-1', language: 'ru' },
      { id: 'u-2', language: null },
      { id: 'u-3', language: 'kk' },
      { id: 'u-4', language: 'en' },
    ]);

    await service.sendToUsers(['u-1', 'u-2', 'u-3', 'u-4'], 'newsPublished', {
      newsTitle: 'Переезд офиса',
    });

    expect(sent).toHaveLength(2);
    const ru = sent.find((m) => m.title === 'Новая новость')!;
    expect(ru.tokens).toEqual(['token-u-1', 'token-u-2', 'token-u-3']);
    expect(ru.body).toBe('Переезд офиса');
    expect(sent.find((m) => m.title === 'New post')!.tokens).toEqual(['token-u-4']);
  });

  it('переводит trRef-параметры в языке каждой группы', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u-ru', language: 'ru' },
      { id: 'u-en', language: 'en' },
    ]);

    await service.sendToCompanyAdmins('co-1', 'newRequest', {
      requestType: trRef('enums.requestType.VACATION'),
      fullName: 'Иван Иванов',
    });

    expect(sent.find((m) => m.title === 'Новая заявка')!.body).toBe(
      'Заявка подана: Отпуск от Иван Иванов',
    );
    expect(sent.find((m) => m.title === 'New request')!.body).toBe(
      'Request submitted: Vacation from Иван Иванов',
    );
  });

  it('плюрализует тело в языке группы', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u-ru', language: 'ru' },
      { id: 'u-en', language: 'en' },
    ]);

    await service.sendToCompanyAdmins('co-1', 'unclosedShifts', {
      count: 1,
      names: 'Иван Иванов',
    });

    expect(sent.find((m) => m.title === 'Незакрытые смены')!.body).toBe(
      'Сотрудник не закрыл смену: Иван Иванов',
    );
    expect(sent.find((m) => m.title === 'Unclosed shifts')!.body).toBe(
      'An employee did not check out: Иван Иванов',
    );
  });

  it('берёт язык самого пользователя для личного push', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'u-en', language: 'en' }]);

    await service.sendToUser('u-en', 'registrationApproved');

    expect(sent).toEqual([
      {
        tokens: ['token-u-en'],
        title: 'Registration approved',
        body: 'Your registration with the company has been approved',
      },
    ]);
  });

  it('читает язык провайдеров через $queryRaw и группирует так же', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { id: 'p-1', language: 'en' },
      { id: 'p-2', language: 'ru' },
    ]);

    await service.sendToProviders('newCompany', { companyName: 'Acme' });

    expect(sent).toHaveLength(2);
    expect(sent.find((m) => m.title === 'New company')!.body).toBe(
      'Company “Acme” has registered on the platform',
    );
    expect(sent.find((m) => m.title === 'Новая компания')!.body).toBe(
      'Компания «Acme» зарегистрировалась на платформе',
    );
  });

  it('ничего не отправляет, когда получателей нет', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    await service.sendToCompanyAdmins('co-1', 'companySuspended');
    expect(sent).toHaveLength(0);
  });

  it('пропускает языковую группу без устройств', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u-ru', language: 'ru' },
      { id: 'u-en', language: 'en' },
    ]);
    // У en-получателя нет зарегистрированных устройств
    mockPrisma.deviceToken.findMany.mockImplementation(async ({ where }: any) =>
      (where.userId.in as string[])
        .filter((id) => id !== 'u-en')
        .map((id) => ({ id: `dt-${id}`, fcmToken: `token-${id}` })),
    );

    await service.sendToCompanyAdmins('co-1', 'companySuspended');

    expect(sent).toHaveLength(1);
    expect(sent[0].title).toBe('Компания приостановлена');
  });
});
