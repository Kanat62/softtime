import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── GET /settings ────────────────────────────────────────────────────────────
  // Upsert ensures a settings row always exists (schema defaults apply on first create).

  async getSettings() {
    return this.prisma.workSettings.upsert({
      where: {} as any,     // extension injects companyId → { companyId }
      create: {} as any,    // extension injects companyId; DB defaults: 6h, 60min
      update: {},
    });
  }

  // ─── PATCH /settings ──────────────────────────────────────────────────────────

  async updateSettings(
    dto: { minWorkdayHours?: number; defaultCheckoutBuffer?: number },
    actorId: string,
  ) {
    const updated = await this.prisma.workSettings.upsert({
      where: {} as any,
      create: { ...dto } as any,
      update: dto as any,
    });

    await this.audit.log({
      actorId,
      action: 'SETTINGS_UPDATED',
      entityType: 'WorkSettings',
      entityId: (updated as any).id,
      meta: dto as Record<string, unknown>,
    });

    return updated;
  }
}
