import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SubscriptionsService } from './subscriptions.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

// ─── Query DTOs ───────────────────────────────────────────────────────────────

const paymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

class PaymentsQueryDto extends createZodDto(paymentsQuerySchema) {}

// ─── Subscriptions ────────────────────────────────────────────────────────────

@ApiTags('Subscriptions')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('subscriptions')
@Roles('ADMIN')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── GET /subscriptions/me ─────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Текущая подписка компании + дней осталось (ADMIN)' })
  getMySubscription(@CurrentUser() user: TenantPayload) {
    return this.subscriptionsService.getMySubscription(user.companyId!);
  }

  // ── POST /subscriptions/pay ───────────────────────────────────────────────

  @Post('pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Инициировать оплату $30 → вернуть ссылку (ADMIN)' })
  initiatePayment(@CurrentUser() user: TenantPayload) {
    return this.subscriptionsService.initiatePayment(user.companyId!);
  }

  // ── POST /subscriptions/cancel ────────────────────────────────────────────

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отменить подписку → Company SUSPENDED (ADMIN) + audit' })
  cancel(@CurrentUser() user: TenantPayload) {
    return this.subscriptionsService.cancelSubscription(user.companyId!, user.userId);
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────

@ApiTags('Payments')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('payments')
@Roles('ADMIN')
export class PaymentsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── GET /payments ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'История платежей компании, пагинация (ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPayments(@Query() query: PaymentsQueryDto, @CurrentUser() user: TenantPayload) {
    return this.subscriptionsService.getPayments(user.companyId!, query);
  }
}
