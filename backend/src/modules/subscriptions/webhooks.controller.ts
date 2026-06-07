import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SubscriptionsService } from './subscriptions.service';
import { Public, ApiStandardErrors } from '../../common/decorators';

// ─── DTO ──────────────────────────────────────────────────────────────────────

const webhookPayloadSchema = z.object({
  companyId: z.string().uuid(),
  status: z.enum(['success', 'failed']),
  providerRef: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
});

class WebhookPayloadDto extends createZodDto(webhookPayloadSchema) {}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Webhooks')
@ApiStandardErrors()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── POST /webhooks/payments ───────────────────────────────────────────────

  @Post('payments')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook от платёжного провайдера (@Public, проверка подписи)',
  })
  handlePaymentWebhook(
    @Body() dto: WebhookPayloadDto,
    @Headers('x-webhook-signature') signature: string,
  ) {
    return this.subscriptionsService.handleWebhook(dto as any, signature ?? '');
  }
}
