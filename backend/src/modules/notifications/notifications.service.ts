import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus, type Language, type PushMessages } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { initFirebase, getMessaging } from '../../config/firebase';
import { tr, resolveLanguage, type TrParams } from '../../common/i18n';

const FCM_BATCH_SIZE = 500; // FCM multicast limit

/** Имя push-события — ключ namespace `push` в общем словаре. */
export type PushEvent = keyof PushMessages;

/**
 * Параметр, который сам нужно перевести на язык получателя: например тип
 * заявки, подпись которого лежит в namespace `enums`. Строки и числа
 * подставляются как есть, `trRef` — через словарь каждой группы.
 */
export interface TranslatableParam {
  readonly key: string;
}

/** Помечает значение как ключ словаря: trRef(`enums.requestType.${type}`). */
export function trRef(key: string): TranslatableParam {
  return { key };
}

export type PushParams = Record<string, string | number | TranslatableParam>;

function isTrRef(v: unknown): v is TranslatableParam {
  return typeof v === 'object' && v !== null && typeof (v as TranslatableParam).key === 'string';
}

/** Один получатель: кому и на каком языке. */
interface Recipient {
  id: string;
  language: string | null;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    initFirebase(
      this.config.get<string>('FCM_PROJECT_ID'),
      this.config.get<string>('FCM_CLIENT_EMAIL'),
      this.config.get<string>('FCM_PRIVATE_KEY'),
    );
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  //
  // Все методы принимают имя события и параметры, а не готовый текст: язык
  // известен только здесь, после того как получатели прочитаны из БД.

  /** Личный push — на языке самого пользователя (User.language). */
  async sendToUser(
    userId: string,
    event: PushEvent,
    params?: PushParams,
    data?: Record<string, string>,
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { id: userId } as any,
      select: { id: true, language: true },
    });
    await this.dispatch(users as Recipient[], event, params, data);
  }

  /** Рассылка на список пользователей (новость всем сотрудникам). */
  async sendToUsers(
    userIds: string[],
    event: PushEvent,
    params?: PushParams,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!userIds.length) return;
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } } as any,
      select: { id: true, language: true },
    });
    await this.dispatch(users as Recipient[], event, params, data);
  }

  /**
   * Send to all ACTIVE users of a company.
   * Pass role to target only ADMIN or WORKER.
   * Called from cron (no context), @Public routes, or PROVIDER context —
   * where the tenant extension does NOT interfere with the explicit companyId filter.
   */
  async sendToCompany(
    companyId: string,
    role: string | null,
    event: PushEvent,
    params?: PushParams,
    data?: Record<string, string>,
  ): Promise<void> {
    const userWhere: any = {
      companyId,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    };
    if (role) userWhere.role = role;

    const users = await this.prisma.user.findMany({
      where: userWhere as any,
      select: { id: true, language: true },
    });
    await this.dispatch(users as Recipient[], event, params, data);
  }

  async sendToCompanyAdmins(
    companyId: string,
    event: PushEvent,
    params?: PushParams,
    data?: Record<string, string>,
  ): Promise<void> {
    return this.sendToCompany(companyId, 'ADMIN', event, params, data);
  }

  /**
   * Send to all PROVIDER-role users.
   * Uses $queryRaw to bypass the tenant extension — PROVIDER users have
   * companyId=null and would be invisible to any tenant-scoped User query.
   */
  async sendToProviders(
    event: PushEvent,
    params?: PushParams,
    data?: Record<string, string>,
  ): Promise<void> {
    const providers = await this.prisma.$queryRaw<Recipient[]>`
      SELECT id, language FROM "User" WHERE role = 'PROVIDER' AND "deletedAt" IS NULL
    `;
    await this.dispatch(providers, event, params, data);
  }

  // ─── Private: группировка по языку ────────────────────────────────────────────

  /**
   * Делит получателей по User.language и отправляет по одному multicast
   * на группу — со своим заголовком и телом. Язык вне ru/en → ru,
   * так что группа всегда одна из поддерживаемых.
   */
  private async dispatch(
    recipients: Recipient[],
    event: PushEvent,
    params?: PushParams,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!recipients.length) return;

    const byLanguage = new Map<Language, string[]>();
    for (const r of recipients) {
      const lang = resolveLanguage(r.language);
      const group = byLanguage.get(lang);
      if (group) group.push(r.id);
      else byLanguage.set(lang, [r.id]);
    }

    for (const [language, userIds] of byLanguage) {
      const tokens = await this.prisma.deviceToken.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, fcmToken: true },
      });
      if (!tokens.length) continue;

      const resolved = this.resolveParams(language, params);
      await this.multicast(
        tokens as any,
        tr(language, `push.${event}.title`, resolved),
        tr(language, `push.${event}.body`, resolved),
        data,
      );
    }
  }

  /** Переводит trRef-значения внутри params на язык группы. */
  private resolveParams(language: Language, params?: PushParams): TrParams {
    const out: TrParams = {};
    for (const [k, v] of Object.entries(params ?? {})) {
      out[k] = isTrRef(v) ? tr(language, v.key) : v;
    }
    return out;
  }

  // ─── Private: multicast via FCM ───────────────────────────────────────────────

  private async multicast(
    tokens: Array<{ id: string; fcmToken: string }>,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!tokens.length) return;

    const messaging = getMessaging();
    if (!messaging) {
      this.logger.debug(
        `[FCM not configured] "${title}" → ${tokens.length} token(s) (stub)`,
      );
      return;
    }

    const staleIds: string[] = [];

    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const batch = tokens.slice(i, i + FCM_BATCH_SIZE);

      const response = await messaging.sendEachForMulticast({
        tokens: batch.map((t) => t.fcmToken),
        notification: { title, body },
        ...(data && { data }),
      });

      // Collect invalid/expired tokens for cleanup
      response.responses.forEach((res, idx) => {
        if (
          !res.success &&
          (res.error?.code === 'messaging/registration-token-not-registered' ||
            res.error?.code === 'messaging/invalid-registration-token')
        ) {
          staleIds.push(batch[idx].id);
        }
      });

      this.logger.debug(
        `[FCM] "${title}" — sent ${response.successCount}/${batch.length}, failed ${response.failureCount}`,
      );
    }

    if (staleIds.length > 0) {
      await this.prisma.deviceToken.deleteMany({ where: { id: { in: staleIds } } });
      this.logger.debug(`[FCM] Removed ${staleIds.length} stale token(s)`);
    }
  }
}
