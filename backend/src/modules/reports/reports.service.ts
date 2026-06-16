import { Injectable } from '@nestjs/common';
import { DayStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDayUtc } from '../attendance/attendance.service';
import { Sti161OverlayService, Sti161PdfInput, DocumentType } from './pdf/sti161-overlay.service';

const ABSENT_STATUSES: string[] = [DayStatus.ABSENT, DayStatus.INCOMPLETE];

export interface ReportRow {
  userId: string;
  fullName: string;
  email: string;
  totalWorkedHours: number;
  lateCount: number;
  absentCount: number;
  approvedAbsenceCount: number;
  earliestCheckIn: Date | null;
  latestCheckOut: Date | null;
}

const WORKED_STATUSES: string[] = [
  DayStatus.PRESENT,
  DayStatus.LATE,
  DayStatus.EARLY_LEAVE,
  DayStatus.OVERTIME,
  DayStatus.MANUAL,
  DayStatus.INCOMPLETE,
]

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sti161Overlay: Sti161OverlayService,
  ) {}

  // ─── Build aggregated report ───────────────────────────────────────────────────

  async buildReport(query: {
    from: Date;
    to: Date;
    userId?: string;
  }): Promise<ReportRow[]> {
    const from = startOfDayUtc(query.from);
    const to = startOfDayUtc(query.to);

    const where: any = { date: { gte: from, lte: to } };
    if (query.userId) where.userId = query.userId;

    const [records, users] = await Promise.all([
      this.prisma.attendance.findMany({
        where: where as any,
        select: {
          userId: true,
          workedMinutes: true,
          status: true,
          checkInAt: true,
          checkOutAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null } as any,
        select: { id: true, fullName: true, email: true },
      }),
    ]);

    const userMap = new Map(
      (users as any[]).map((u) => [u.id as string, { fullName: u.fullName as string, email: u.email as string }]),
    );

    // ── Aggregate per userId ─────────────────────────────────────────────────

    type Agg = {
      totalWorkedMinutes: number;
      lateCount: number;
      absentCount: number;
      approvedAbsenceCount: number;
      earliestCheckIn: Date | null;
      latestCheckOut: Date | null;
    };

    const agg = new Map<string, Agg>();

    for (const rec of records as any[]) {
      if (!agg.has(rec.userId)) {
        agg.set(rec.userId, {
          totalWorkedMinutes: 0,
          lateCount: 0,
          absentCount: 0,
          approvedAbsenceCount: 0,
          earliestCheckIn: null,
          latestCheckOut: null,
        });
      }
      const g = agg.get(rec.userId)!;

      g.totalWorkedMinutes += rec.workedMinutes ?? 0;
      if (rec.status === DayStatus.LATE) g.lateCount++;
      if (ABSENT_STATUSES.includes(rec.status)) g.absentCount++;
      if (rec.status === DayStatus.APPROVED_ABSENCE) g.approvedAbsenceCount++;

      if (rec.checkInAt) {
        const ci = new Date(rec.checkInAt);
        if (!g.earliestCheckIn || ci < g.earliestCheckIn) g.earliestCheckIn = ci;
      }
      if (rec.checkOutAt) {
        const co = new Date(rec.checkOutAt);
        if (!g.latestCheckOut || co > g.latestCheckOut) g.latestCheckOut = co;
      }
    }

    // ── Build rows, sort by hours desc ───────────────────────────────────────

    const rows: ReportRow[] = [];
    for (const [userId, g] of agg) {
      const user = userMap.get(userId);
      rows.push({
        userId,
        fullName: user?.fullName ?? userId,
        email: user?.email ?? '',
        totalWorkedHours: Math.round((g.totalWorkedMinutes / 60) * 10) / 10,
        lateCount: g.lateCount,
        absentCount: g.absentCount,
        approvedAbsenceCount: g.approvedAbsenceCount,
        earliestCheckIn: g.earliestCheckIn,
        latestCheckOut: g.latestCheckOut,
      });
    }

    rows.sort((a, b) => b.totalWorkedHours - a.totalWorkedHours);
    return rows;
  }

  // ─── Generate CSV ─────────────────────────────────────────────────────────────

  async buildCsv(query: { from: Date; to: Date; userId?: string }): Promise<string> {
    const rows = await this.buildReport(query);

    const header = 'ФИО,Email,Часы,Опоздания,Пропуски,Пропуски с причиной';
    const lines = rows.map(
      (r) =>
        `"${r.fullName.replace(/"/g, '""')}","${r.email}",${r.totalWorkedHours},${r.lateCount},${r.absentCount},${r.approvedAbsenceCount}`,
    );

    return [header, ...lines].join('\r\n');
  }

  // ─── STI-161 PDF ──────────────────────────────────────────────────────────────

  async buildSti161Pdf(
    companyId: string,
    documentType: DocumentType,
    periodMonth: number,
    periodYear: number,
  ): Promise<Buffer> {
    const from = new Date(periodYear, periodMonth - 1, 1)
    const to = new Date(periodYear, periodMonth, 0)

    const [company, employees, attendanceRecords] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId } }),
      this.prisma.user.findMany({
        where: { companyId, deletedAt: null } as any,
        select: { id: true, fullName: true },
      }),
      this.prisma.attendance.findMany({
        where: {
          companyId,
          date: { gte: from, lte: to },
          status: { in: WORKED_STATUSES },
        } as any,
        select: { userId: true },
      }),
    ])

    const daysWorkedMap = new Map<string, number>()
    for (const rec of attendanceRecords as any[]) {
      daysWorkedMap.set(rec.userId, (daysWorkedMap.get(rec.userId) ?? 0) + 1)
    }

    const input: Sti161PdfInput = {
      documentType,
      companyName: (company as any)?.name ?? '',
      taxId: (company as any)?.taxId ?? null,
      taxAuthorityCode: (company as any)?.taxAuthorityCode ?? null,
      taxAuthorityName: null,
      okpoCode: (company as any)?.okpoCode ?? null,
      socialFundRegNumber: (company as any)?.socialFundRegNumber ?? null,
      highlandCoefficient: (company as any)?.highlandCoefficient
        ? String((company as any).highlandCoefficient)
        : null,
      socialTariffType: null,
      smz: null,
      usmz: null,
      periodMonth,
      periodYear,
      employees: (employees as any[]).map((emp) => ({
        inn: null,
        fullName: emp.fullName ?? '',
        daysWorked: daysWorkedMap.get(emp.id) ?? 0,
        totalIncome: null,
        incomeTax: null,
        socialContributions: null,
      })),
    }

    return this.sti161Overlay.generatePdf(input)
  }
}
