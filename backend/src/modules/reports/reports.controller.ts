import { Controller, Get, Query, Res } from '@nestjs/common';
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

}
