import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    meta?: Record<string, unknown>;
    // Explicit companyId for PROVIDER actions (tenant extension is bypassed for PROVIDER).
    // For ADMIN actions, leave unset — the extension auto-injects it from context.
    companyId?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        meta: (params.meta as any) ?? undefined,
        ...(params.companyId !== undefined && { companyId: params.companyId }),
      },
    });
  }

  async list(query: {
    from?: Date;
    to?: Date;
    action?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }
    if (query.action) where.action = query.action;

    const skip = (query.page - 1) * query.limit;
    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where: where as any }),
      this.prisma.auditLog.findMany({
        where: where as any,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}
