import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FastifyReply } from 'fastify';
import { ReportsService } from './reports.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── DTO ──────────────────────────────────────────────────────────────────────

const reportQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  userId: z.string().uuid().optional(),
});

class ReportQueryDto extends createZodDto(reportQuerySchema) {}

const sti161PdfBodySchema = z.object({
  documentType: z.enum(['INITIAL', 'REVISED', 'LIQUIDATION']).default('INITIAL'),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
});

class Sti161PdfBodyDto extends createZodDto(sti161PdfBodySchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Reports')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('reports')
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ── GET /reports/attendance/export ─────────────────────────────────────────
  // Declared before /attendance to avoid route shadowing

  @Get('attendance/export')
  @ApiOperation({ summary: 'Экспорт отчёта посещаемости в CSV (ADMIN)' })
  @ApiQuery({ name: 'from', required: true, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'to', required: true, type: String, example: '2024-01-31' })
  @ApiQuery({ name: 'userId', required: false })
  async exportCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() _user: TenantPayload,
    @Res() res: FastifyReply,
  ) {
    const csv = await this.reportsService.buildCsv(query as any);
    const from = (query.from as unknown as Date).toISOString().slice(0, 10);
    const to = (query.to as unknown as Date).toISOString().slice(0, 10);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header(
      'Content-Disposition',
      `attachment; filename="attendance-${from}_${to}.csv"`,
    );
    return res.send(csv);
  }

  // ── GET /reports/attendance ────────────────────────────────────────────────

  @Get('attendance')
  @ApiOperation({ summary: 'Отчёт посещаемости по сотрудникам (ADMIN)' })
  @ApiQuery({ name: 'from', required: true, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'to', required: true, type: String, example: '2024-01-31' })
  @ApiQuery({ name: 'userId', required: false })
  getAttendanceReport(@Query() query: ReportQueryDto) {
    return this.reportsService.buildReport(query as any);
  }

  // ── POST /reports/sti161/pdf ───────────────────────────────────────────────

  @Post('sti161/pdf')
  @ApiOperation({ summary: 'Скачать бланк СТИ-161 в PDF (ADMIN)' })
  async downloadSti161Pdf(
    @Body() body: Sti161PdfBodyDto,
    @CurrentUser() user: TenantPayload,
    @Res() res: FastifyReply,
  ) {
    const buffer = await this.reportsService.buildSti161Pdf(
      user.companyId!,
      body.documentType as any,
      body.periodMonth,
      body.periodYear,
    );

    const mm = String(body.periodMonth).padStart(2, '0');
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="STI-161_${body.periodYear}_${mm}.pdf"`);
    res.header('Content-Length', String(buffer.length));
    return res.send(buffer);
  }
}
