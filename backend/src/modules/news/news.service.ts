import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  // ─── Feed ─────────────────────────────────────────────────────────────────────

  async getFeed(query: { page: number; limit: number }) {
    const skip = (query.page - 1) * query.limit;
    const [total, data] = await Promise.all([
      this.prisma.news.count({ where: {} as any }),
      this.prisma.news.findMany({
        where: {} as any,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      data,
      meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) },
    };
  }

  // ─── Details + auto-mark read ─────────────────────────────────────────────────

  async getNews(id: string, userId: string) {
    const news = await this.prisma.news.findFirst({
      where: { id } as any,
      include: { reads: { where: { userId }, take: 1 } },
    });
    if (!news) throw new NotFoundException('Новость не найдена');

    // Auto-create read record if not already present (upsert — no tenant ext on NewsRead)
    if (!(news as any).reads?.length) {
      await this.prisma.newsRead.upsert({
        where: { newsId_userId: { newsId: id, userId } },
        create: { newsId: id, userId },
        update: {},
      });
    }

    const { reads: _, ...newsData } = news as any;
    return newsData;
  }

  // ─── Explicit mark read ───────────────────────────────────────────────────────

  async markRead(newsId: string, userId: string) {
    const news = await this.prisma.news.findFirst({ where: { id: newsId } as any });
    if (!news) throw new NotFoundException('Новость не найдена');

    await this.prisma.newsRead.upsert({
      where: { newsId_userId: { newsId, userId } },
      create: { newsId, userId },
      update: {},
    });

    return { ok: true };
  }

  // ─── Create news + push all active employees ──────────────────────────────────

  async createNews(
    dto: { title: string; body: string; photoUrl?: string | null },
    adminId: string,
  ) {
    const news = await this.prisma.news.create({
      data: {
        title: dto.title,
        body: dto.body,
        photoUrl: dto.photoUrl ?? null,
        createdBy: adminId,
      } as any,
    });

    // Push to all ACTIVE employees (tenant extension scopes User query to company)
    const activeUsers = await this.prisma.user.findMany({
      where: { status: UserStatus.ACTIVE, deletedAt: null } as any,
      select: { id: true },
    });

    await Promise.all([
      // Fan-out push to all ACTIVE employees
      ...(activeUsers as any[]).map((u) =>
        this.notifications.sendToUser(u.id, 'Новая новость', `${dto.title}`),
      ),
      // Audit log (ТЗ §10.11)
      this.audit.log({
        actorId: adminId,
        action: 'NEWS_CREATED',
        entityType: 'News',
        entityId: (news as any).id,
        meta: { title: dto.title },
      }),
    ]);

    return news;
  }

  // ─── Read stats (ADMIN) ───────────────────────────────────────────────────────

  async getReadStats(newsId: string) {
    const news = await this.prisma.news.findFirst({ where: { id: newsId } as any });
    if (!news) throw new NotFoundException('Новость не найдена');

    // All non-deleted company users + reads in parallel
    const [users, reads] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null } as any,
        select: { id: true, fullName: true, email: true },
      }),
      this.prisma.newsRead.findMany({
        where: { newsId },
        select: { userId: true, readAt: true },
      }),
    ]);

    const readMap = new Map(
      (reads as any[]).map((r) => [r.userId as string, r.readAt as Date]),
    );

    const readList = (users as any[])
      .filter((u) => readMap.has(u.id))
      .map((u) => ({ userId: u.id, fullName: u.fullName, email: u.email, readAt: readMap.get(u.id) }));

    const unreadList = (users as any[])
      .filter((u) => !readMap.has(u.id))
      .map((u) => ({ userId: u.id, fullName: u.fullName, email: u.email }));

    return {
      stats: {
        total: users.length,
        readCount: readList.length,
        unreadCount: unreadList.length,
      },
      read: readList,
      unread: unreadList,
    };
  }
}
