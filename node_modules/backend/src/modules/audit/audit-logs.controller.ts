import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AuditService } from './audit.service';
import { Roles, ApiStandardErrors } from '../../common/decorators';

// ─── DTO ──────────────────────────────────────────────────────────────────────

const auditLogsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

class AuditLogsQueryDto extends createZodDto(auditLogsQuerySchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Audit Logs')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('audit-logs')
@Roles('ADMIN')
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Аудит-лог действий компании (ADMIN), фильтры + пагинация' })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, example: '2024-01-31' })
  @ApiQuery({ name: 'action', required: false, type: String, example: 'QR_REGENERATED' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(@Query() query: AuditLogsQueryDto) {
    return this.auditService.list(query as any);
  }
}
