import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CompanyStatus, PaymentStatus, SubStatus } from '@softtime/shared';
import { ProviderService } from './provider.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── Query DTOs ───────────────────────────────────────────────────────────────

const companiesQuerySchema = z.object({
  status: z.nativeEnum(CompanyStatus).optional(),
  subscriptionStatus: z.nativeEnum(SubStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const paymentsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  companyId: z.string().uuid().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

class CompaniesQueryDto extends createZodDto(companiesQuerySchema) {}
class PaymentsQueryDto extends createZodDto(paymentsQuerySchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Provider')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('provider')
@Roles('PROVIDER')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  // ── GET /provider/dashboard ───────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Метрики платформы: MRR, выручка, компании, регистрации (PROVIDER)' })
  getDashboard() {
    return this.providerService.getDashboard();
  }

  // ── GET /provider/payments ─────────────────────────────────────────────────
  // Declared before /companies/:id to avoid path ambiguity

  @Get('payments')
  @ApiOperation({ summary: 'Все платежи платформы + сводка (PROVIDER)' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listPayments(@Query() query: PaymentsQueryDto) {
    return this.providerService.listPayments(query as any);
  }

  // ── GET /provider/companies ────────────────────────────────────────────────

  @Get('companies')
  @ApiOperation({ summary: 'Все компании платформы с фильтрами (PROVIDER)' })
  @ApiQuery({ name: 'status', required: false, enum: CompanyStatus })
  @ApiQuery({ name: 'subscriptionStatus', required: false, enum: SubStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listCompanies(@Query() query: CompaniesQueryDto) {
    return this.providerService.listCompanies(query as any);
  }

  // ── PATCH /provider/companies/:id/activate ────────────────────────────────

  @Patch('companies/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Активировать компанию + подписку (PROVIDER) + audit' })
  activate(@Param('id') id: string, @CurrentUser() user: TenantPayload) {
    return this.providerService.activateCompany(id, user.userId);
  }

  // ── PATCH /provider/companies/:id/suspend ─────────────────────────────────

  @Patch('companies/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Приостановить компанию (PROVIDER) + push ADMIN + audit' })
  suspend(@Param('id') id: string, @CurrentUser() user: TenantPayload) {
    return this.providerService.suspendCompany(id, user.userId);
  }

  // ── DELETE /provider/companies/:id ────────────────────────────────────────

  @Delete('companies/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Полностью удалить компанию и все её данные из БД (PROVIDER) + audit',
  })
  deleteCompany(@Param('id') id: string, @CurrentUser() user: TenantPayload) {
    return this.providerService.deleteCompany(id, user.userId);
  }

  // ── GET /provider/companies/:id ───────────────────────────────────────────
  // Declared after parameterized PATCH routes to avoid conflicts

  @Get('companies/:id')
  @ApiOperation({ summary: 'Детали компании: сотрудники + история платежей (PROVIDER)' })
  getCompany(@Param('id') id: string) {
    return this.providerService.getCompany(id);
  }
}
