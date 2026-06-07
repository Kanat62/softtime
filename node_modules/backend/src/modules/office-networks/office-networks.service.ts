import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OfficeNetworksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── List ─────────────────────────────────────────────────────────────────────

  async list() {
    return this.prisma.officeNetwork.findMany({
      where: {} as any,
      orderBy: { label: 'asc' },
    });
  }

  // ─── Create ───────────────────────────────────────────────────────────────────

  async create(dto: { label: string; cidr: string }, actorId: string) {
    const network = await this.prisma.officeNetwork.create({
      data: { label: dto.label, cidr: dto.cidr } as any,
    });

    await this.audit.log({
      actorId,
      action: 'OFFICE_NETWORK_CREATED',
      entityType: 'OfficeNetwork',
      entityId: (network as any).id,
      meta: { label: dto.label, cidr: dto.cidr },
    });

    return network;
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, dto: { label?: string; cidr?: string }, actorId: string) {
    const existing = await this.prisma.officeNetwork.findFirst({
      where: { id } as any,
    });
    if (!existing) throw new NotFoundException('Сеть не найдена');

    const updated = await this.prisma.officeNetwork.update({
      where: { id } as any,
      data: dto as any,
    });

    await this.audit.log({
      actorId,
      action: 'OFFICE_NETWORK_UPDATED',
      entityType: 'OfficeNetwork',
      entityId: id,
      meta: dto as Record<string, unknown>,
    });

    return updated;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  async remove(id: string, actorId: string) {
    const existing = await this.prisma.officeNetwork.findFirst({
      where: { id } as any,
    });
    if (!existing) throw new NotFoundException('Сеть не найдена');

    // Physical delete (no soft-delete for OfficeNetwork per ТЗ)
    await this.prisma.officeNetwork.delete({ where: { id } as any });

    await this.audit.log({
      actorId,
      action: 'OFFICE_NETWORK_DELETED',
      entityType: 'OfficeNetwork',
      entityId: id,
      meta: { label: (existing as any).label, cidr: (existing as any).cidr },
    });

    return { ok: true };
  }
}
