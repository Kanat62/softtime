import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Get active QR ────────────────────────────────────────────────────────────

  async getActive() {
    const qr = await this.prisma.qrToken.findFirst({
      where: { isActive: true } as any,
    });
    if (!qr) throw new NotFoundException('Активный QR не найден. Используйте /qr/regenerate.');
    return qr;
  }

  // ─── Regenerate ───────────────────────────────────────────────────────────────

  async regenerate(dto: { officeNetworkId?: string | null }, actorId: string) {
    // Physically delete all existing tokens for this company (ТЗ §5.2)
    await this.prisma.qrToken.deleteMany({
      where: {} as any,
    });

    // Create new token
    const token = crypto.randomBytes(32).toString('hex');
    const qr = await this.prisma.qrToken.create({
      data: {
        token,
        isActive: true,
        officeNetworkId: dto.officeNetworkId ?? null,
      } as any,
    });

    await this.audit.log({
      actorId,
      action: 'QR_REGENERATED',
      entityType: 'QrToken',
      entityId: (qr as any).id,
      meta: { officeNetworkId: dto.officeNetworkId ?? null },
    });

    return qr;
  }
}
