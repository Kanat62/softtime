import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { initFirebase, getMessaging } from '../../config/firebase';

const FCM_BATCH_SIZE = 500; // FCM multicast limit

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

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { id: true, fcmToken: true },
    });
    if (!tokens.length) return;
    await this.multicast(tokens as any, title, body, data);
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
    title: string,
    body: string,
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
      select: { id: true },
    });
    if (!users.length) return;

    const userIds = (users as any[]).map((u) => u.id as string);
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, fcmToken: true },
    });
    await this.multicast(tokens as any, title, body, data);
  }

  async sendToCompanyAdmins(
    companyId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    return this.sendToCompany(companyId, 'ADMIN', title, body, data);
  }

  /**
   * Send to all PROVIDER-role users.
   * Uses $queryRaw to bypass the tenant extension — PROVIDER users have
   * companyId=null and would be invisible to any tenant-scoped User query.
   */
  async sendToProviders(
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const providers = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User" WHERE role = 'PROVIDER' AND "deletedAt" IS NULL
    `;
    if (!providers.length) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: { in: providers.map((p) => p.id) } },
      select: { id: true, fcmToken: true },
    });
    await this.multicast(tokens as any, title, body, data);
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
